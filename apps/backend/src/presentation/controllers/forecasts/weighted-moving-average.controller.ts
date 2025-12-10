import type { OpenAPIHono } from '@hono/zod-openapi';
import { courseDemandForecastResultSchema } from '@app/contracts';
import {
  WeightedMovingAverageForecaster,
} from '../../../domain/forecasts/weighted-moving-average-forecaster';
import {
  DefaultTermLookbackProvider,
} from '../../../infrastructure/providers/default-term-lookback-provider';
import {
  CourseHistoryActualProvider,
} from '../../../infrastructure/providers/course-history-actual-provider';
import {
  enrollmentRepository,
} from '../../../infrastructure/repositories/enrollment-repository';
import {
  createCourseHistoryService,
} from '../../../domain/services/course-history-service';
import {
  WeightedMovingAverageUseCase,
} from '../../../application/use-cases/forecasts/weighted-moving-average.use-case';
import { createForecastRoute } from '../../factories/forecast-route.factory';

export const registerWeightedMovingAverageForecastRoute = (
  app: OpenAPIHono,
): void => {
  // Create the term lookback provider for term-type-aware lookback
  const termLookbackProvider = new DefaultTermLookbackProvider({
    minYear: 2018,
  });

  // Create actual enrollment provider for historical data
  const courseHistoryService = createCourseHistoryService();
  const actualEnrollmentProvider = new CourseHistoryActualProvider({
    enrollmentRepository,
    courseHistoryService,
  });

  // Create the WMA forecaster with fixed weights: 0.50, 0.30, 0.20
  const forecaster = new WeightedMovingAverageForecaster(
    {
      termLookbackProvider,
      actualEnrollmentProvider,
    },
    {
      lookbackTerms: 3,
      // Using default WMA weights: 0.50, 0.30, 0.20
    },
  );

  // Create use case
  const useCase = new WeightedMovingAverageUseCase({
    forecaster,
  });

  // Register the route
  createForecastRoute(app, {
    path: '/api/courses/{courseCode}/forecasts/weighted-moving-average',
    summary: 'Forecast enrollment using Weighted Moving Average',
    description:
      'Forecasts enrollment using a 3-term Weighted Moving Average (WMA). ' +
      'Fixed weights: 50% (most recent), 30% (previous), 20% (third recent). ' +
      'Uses term-type-aware lookback: main semesters (10, 20) are compared ' +
      'with other main semesters, while intersessions (11-19) are compared ' +
      'with the same intersession type from previous years.',
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
