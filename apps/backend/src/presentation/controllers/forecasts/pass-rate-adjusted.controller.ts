import type { OpenAPIHono } from '@hono/zod-openapi';
import { courseDemandForecastResultSchema } from '@app/contracts';
import {
  PotentialStudentsByPrerequisitesForecaster,
} from '../../../domain/forecasts/potential-students-by-prerequisites-forecaster';
import {
  PassRateAdjustedForecaster,
} from '../../../domain/forecasts/pass-rate-adjusted-forecaster';
import {
  DefaultConversionRateCalculator,
} from '../../../domain/forecasts/default-conversion-rate-calculator';
import {
  DatabaseHistoricalConversionProvider,
} from '../../../infrastructure/providers/database-historical-conversion-provider';
import {
  CourseHistoryActualProvider,
} from '../../../infrastructure/providers/course-history-actual-provider';
import {
  enrollmentForecastRepository,
} from '../../../infrastructure/repositories/enrollment-forecast-repository';
import {
  prerequisitesRepository,
} from '../../../infrastructure/repositories/prerequisites-repository';
import {
  enrollmentRepository,
} from '../../../infrastructure/repositories/enrollment-repository';
import {
  createCourseHistoryService,
} from '../../../domain/services/course-history-service';
import {
  PassRateAdjustedUseCase,
} from '../../../application/use-cases/forecasts/pass-rate-adjusted.use-case';
import { createForecastRoute } from '../../factories/forecast-route.factory';

export const registerPassRateAdjustedForecastRoute = (
  app: OpenAPIHono,
): void => {
  // Create the base forecaster (potential students by prerequisites)
  const baseForecaster = new PotentialStudentsByPrerequisitesForecaster({
    prerequisitesProvider: prerequisitesRepository,
    enrollmentHistoryProvider: enrollmentForecastRepository,
  });

  // Create actual enrollment provider for historical data
  const courseHistoryService = createCourseHistoryService();
  const actualEnrollmentProvider = new CourseHistoryActualProvider({
    enrollmentRepository,
    courseHistoryService,
  });

  // Create conversion rate calculator
  const conversionRateCalculator = new DefaultConversionRateCalculator({
    decayFactor: 0.7,
    highConfidenceThreshold: 3,
    capRateAtOne: false,
  });

  // Create historical conversion provider
  const historicalConversionProvider = new DatabaseHistoricalConversionProvider({
    baseForecaster,
    actualEnrollmentProvider,
  });

  // Create the pass rate adjusted forecaster
  const forecaster = new PassRateAdjustedForecaster(
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

  // Create use case
  const useCase = new PassRateAdjustedUseCase({
    forecaster,
  });

  // Register the route
  createForecastRoute(app, {
    path: '/api/courses/{courseCode}/forecasts/pass-rate-adjusted',
    summary: 'Forecast enrollment with pass rate adjustment',
    description:
      'Forecasts enrollment by adjusting prerequisite-based predictions using historical conversion rates for more accurate estimates. The conversion rate is calculated from historical actual/potential ratios with term-type-aware lookback.',
    tags: ['Forecasts'],
    resultSchema: courseDemandForecastResultSchema,

    singleTermHandler: async (courseCode, term) => {
      return useCase.execute({
        courseCode,
        academicTerm: term,
      });
    },

    multiTermHandler: async (courseCode, terms) => {
      return useCase.executeMultiple({ courseCode }, terms);
    },
  });
};
