import { z } from 'zod';
import { createRoute, type OpenAPIHono } from '@hono/zod-openapi';
import { forecastAccuracyResultSchema } from '@app/contracts';
import { ForecastAccuracyUseCase } from '../../../application/use-cases/forecasts/forecast-accuracy.use-case';
import { PotentialStudentsByPrerequisitesForecaster } from '../../../domain/forecasts/potential-students-by-prerequisites-forecaster';
import { PassRateAdjustedForecaster } from '../../../domain/forecasts/pass-rate-adjusted-forecaster';
import { WeightedMovingAverageForecaster } from '../../../domain/forecasts/weighted-moving-average-forecaster';
import { DefaultConversionRateCalculator } from '../../../domain/forecasts/default-conversion-rate-calculator';
import { BacktestingService } from '../../../domain/backtesting/backtesting-service';
import { DefaultAccuracyCalculator } from '../../../domain/backtesting/default-accuracy-calculator';
import { CourseHistoryActualProvider } from '../../../infrastructure/providers/course-history-actual-provider';
import { DatabaseHistoricalConversionProvider } from '../../../infrastructure/providers/database-historical-conversion-provider';
import { DefaultTermLookbackProvider } from '../../../infrastructure/providers/default-term-lookback-provider';
import { enrollmentRepository } from '../../../infrastructure/repositories/enrollment-repository';
import { enrollmentForecastRepository } from '../../../infrastructure/repositories/enrollment-forecast-repository';
import { prerequisitesRepository } from '../../../infrastructure/repositories/prerequisites-repository';
import { createCourseHistoryService } from '../../../domain/services/course-history-service';
import type { CourseDemandForecaster } from '../../../domain/forecasts/course-demand-forecaster';

const COURSE_CODE_PATTERN = /^[A-Z]{4}-\d{4}$/;

const forecastAccuracyRoute = createRoute({
  method: 'get',
  path: '/api/courses/{courseCode}/forecasts/{methodId}/accuracy',
  request: {
    params: z.object({
      courseCode: z.string().regex(COURSE_CODE_PATTERN, {
        message: 'courseCode must match pattern XXXX-DDDD.',
      }),
      methodId: z.string().min(1),
    }),
    query: z
      .object({
        term: z
          .string()
          .regex(/^\d+$/)
          .transform(val => parseInt(val, 10))
          .optional(),
        terms: z
          .string()
          .regex(/^\d+(,\d+)*$/)
          .transform(val => val.split(',').map(t => parseInt(t, 10)))
          .optional(),
      })
      .refine(data => data.term !== undefined || data.terms !== undefined, {
        message: 'Either term or terms query parameter is required',
      }),
  },
  responses: {
    200: {
      description: 'Forecast accuracy comparison with actual enrollments',
      content: {
        'application/json': {
          schema: forecastAccuracyResultSchema,
        },
      },
    },
    400: {
      description: 'Invalid request parameters',
    },
    404: {
      description: 'Course or method not found',
    },
  },
  tags: ['Forecasts', 'Backtesting'],
});

const SUPPORTED_METHOD_IDS = [
  'potential-students-by-prerequisites',
  'pass-rate-adjusted',
  'weighted-moving-average',
] as const;

type SupportedMethodId = typeof SUPPORTED_METHOD_IDS[number];

const isSupportedMethodId = (id: string): id is SupportedMethodId =>
  SUPPORTED_METHOD_IDS.includes(id as SupportedMethodId);

export const registerForecastAccuracyRoute = (app: OpenAPIHono): void => {
  // Initialize dependencies
  const courseHistoryService = createCourseHistoryService();

  const actualProvider = new CourseHistoryActualProvider({
    enrollmentRepository,
    courseHistoryService,
  });

  const accuracyCalculator = new DefaultAccuracyCalculator();

  const backtestingService = new BacktestingService({
    actualEnrollmentProvider: actualProvider,
    accuracyCalculator,
  });

  // Create base forecaster (used by both methods)
  const baseForecaster = new PotentialStudentsByPrerequisitesForecaster({
    prerequisitesProvider: prerequisitesRepository,
    enrollmentHistoryProvider: enrollmentForecastRepository,
  });

  // Create pass-rate-adjusted forecaster
  const conversionRateCalculator = new DefaultConversionRateCalculator({
    decayFactor: 0.7,
    highConfidenceThreshold: 3,
    capRateAtOne: false,
  });

  const historicalConversionProvider = new DatabaseHistoricalConversionProvider({
    baseForecaster,
    actualEnrollmentProvider: actualProvider,
  });

  const passRateAdjustedForecaster = new PassRateAdjustedForecaster(
    {
      baseForecaster,
      conversionRateCalculator,
      historicalConversionProvider,
    },
    {
      lookbackTerms: 3,
      minimumConfidence: 'low',
    },
  );

  // Create weighted-moving-average forecaster
  const termLookbackProvider = new DefaultTermLookbackProvider({
    minYear: 2018,
  });

  const weightedMovingAverageForecaster = new WeightedMovingAverageForecaster(
    {
      termLookbackProvider,
      actualEnrollmentProvider: actualProvider,
    },
    {
      lookbackTerms: 3,
    },
  );

  // Map method ID to forecaster
  const forecasterMap: Record<SupportedMethodId, CourseDemandForecaster> = {
    'potential-students-by-prerequisites': baseForecaster,
    'pass-rate-adjusted': passRateAdjustedForecaster,
    'weighted-moving-average': weightedMovingAverageForecaster,
  };

  app.openapi(forecastAccuracyRoute, async c => {
    const { courseCode, methodId } = c.req.valid('param');
    const { term, terms } = c.req.valid('query');

    // Validate method ID
    if (!isSupportedMethodId(methodId)) {
      return c.json(
        { error: { code: 'INVALID_METHOD_ID', message: `Unknown method ID: ${methodId}. Supported: ${SUPPORTED_METHOD_IDS.join(', ')}` } },
        400,
      );
    }

    // Get the appropriate forecaster
    const forecaster = forecasterMap[methodId];
    const useCase = new ForecastAccuracyUseCase({
      forecaster,
      backtestingService,
    });

    // Build terms array
    const termsArray = terms ?? (term !== undefined ? [term] : []);

    try {
      const result = await useCase.execute({
        courseCode,
        methodId,
        terms: termsArray,
      });

      return c.json(result, 200);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown error occurred';

      // Check for specific error types
      if (message.includes('All forecasts failed')) {
        return c.json(
          { error: { code: 'FORECAST_FAILED', message } },
          400,
        );
      }

      return c.json(
        { error: { code: 'INTERNAL_ERROR', message } },
        500,
      );
    }
  });
};
