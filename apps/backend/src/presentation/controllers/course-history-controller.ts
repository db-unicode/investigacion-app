import { z } from '@hono/zod-openapi';
import {
  createRoute,
  OpenAPIHono,
} from '@hono/zod-openapi';
import { courseHistoryByTermSchema } from '../../application/dtos/course-history-dto';
import type {
  CourseHistoryByTermDto,
} from '../../application/dtos/course-history-dto';
import type {
  GetCourseHistoryUseCase,
} from '../../application/use-cases/get-course-history.use-case';

const COURSE_CODE_PATTERN = /^[A-Z]{4}-\d{4}$/;

/**
 * Creates a Hono router for course history endpoints.
 */
export const createCourseHistoryController = (
  getCourseHistoryUseCase: GetCourseHistoryUseCase,
): OpenAPIHono => {
  const app = new OpenAPIHono();

  const getCourseHistoryRoute = createRoute({
    method: 'get',
    path: '/api/courses/{courseCode}/history',
    request: {
      params: z.object({
        courseCode: z
          .string()
          .regex(COURSE_CODE_PATTERN, {
            message:
              'courseCode must match pattern XXXX-DDDD (A–Z letters and digits)',
          }),
      }),
      query: z.object({}),
    },
    responses: {
      200: {
        description: 'Course history grouped by academic term',
        content: {
          'application/json': {
            schema: courseHistoryByTermSchema,
          },
        },
      },
      404: {
        description: 'Course not found',
      },
    },
  });

  app.openapi(getCourseHistoryRoute, async (context) => {
    const { courseCode } = context.req.valid('param');

    const result: CourseHistoryByTermDto =
      await getCourseHistoryUseCase.execute({
        courseCode,
      });

    if (Object.keys(result).length === 0) {
      return context.json({ message: 'Course not found' }, 404);
    }

    return context.json(result, 200);
  });

  return app;
};
