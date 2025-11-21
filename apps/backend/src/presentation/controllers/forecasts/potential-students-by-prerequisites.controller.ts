import { z } from 'zod';
import { createRoute, OpenAPIHono } from '@hono/zod-openapi';
import {
  courseDemandForecastResultSchema,
} from '@app/contracts';
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

const COURSE_CODE_PATTERN = /^[A-Z]{4}-\d{4}$/;

const potentialStudentsRoute = createRoute({
  method: 'get',
  path: '/api/courses/{courseCode}/forecasts/potential-students',
  request: {
    params: z.object({
      courseCode: z
        .string()
        .regex(COURSE_CODE_PATTERN, {
          message: 'courseCode must match pattern XXXX-DDDD.',
        }),
    }),
    query: z.object({
      term: z
        .coerce
        .number()
        .int()
        .nonnegative(),
    }),
  },
  responses: {
    200: {
      description:
        'Potential enrollment based on prerequisite completion.',
      content: {
        'application/json': {
          schema: courseDemandForecastResultSchema,
        },
      },
    },
  },
});

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

  app.openapi(potentialStudentsRoute, async (c) => {
    const { courseCode } = c.req.valid('param');
    const { term } = c.req.valid('query');

    const result = await useCase.execute({
      courseCode,
      academicTerm: term,
    });

    return c.json(result, 200);
  });
};
