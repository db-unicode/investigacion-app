import type { OpenAPIHono } from '@hono/zod-openapi';
import { courseDemandForecastResultSchema } from '@app/contracts';
import {
  PotentialStudentsByPrerequisitesForecaster,
} from '../../../domain/forecasts/potential-students-by-prerequisites-forecaster';
import {
  enrollmentForecastRepository,
} from '../../../infrastructure/repositories/enrollment-forecast-repository';
import {
  prerequisitesRepository,
} from '../../../infrastructure/repositories/prerequisites-repository';
import {
  PotentialStudentsByPrerequisitesUseCase,
} from '../../../application/use-cases/forecasts/potential-students-by-prerequisites.use-case.forecaster';
import { createForecastRoute } from '../../factories/forecast-route.factory';

export const registerPotentialStudentsForecastRoute = (
  app: OpenAPIHono,
): void => {
  const forecaster = new PotentialStudentsByPrerequisitesForecaster({
    prerequisitesProvider: prerequisitesRepository,
    enrollmentHistoryProvider: enrollmentForecastRepository,
  });

  const useCase = new PotentialStudentsByPrerequisitesUseCase({
    forecaster,
  });

  createForecastRoute(app, {
    path: '/api/courses/{courseCode}/forecasts/potential-students',
    summary: 'Forecast potential student enrollment',
    description: 'Forecasts potential enrollment based on prerequisite completion for a given course and academic term(s).',
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
