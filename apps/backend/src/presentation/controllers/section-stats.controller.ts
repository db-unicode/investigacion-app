import { z } from 'zod';
import { createRoute, type OpenAPIHono } from '@hono/zod-openapi';
import { sectionStatsByTermSchema } from '@app/contracts';
import { createGetSectionStatsUseCase } from '../../application/use-cases/get-section-stats.use-case';
import { sectionStatsRepository } from '../../infrastructure/repositories/section-stats-repository';

const COURSE_CODE_PATTERN = /^[A-Z]{4}-\d{4}$/;

const sectionStatsRoute = createRoute({
  method: 'get',
  path: '/api/courses/{courseCode}/sections',
  request: {
    params: z.object({
      courseCode: z.string().regex(COURSE_CODE_PATTERN, {
        message: 'courseCode must match pattern XXXX-DDDD.',
      }),
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
      description: 'Section statistics for the requested course and terms',
      content: {
        'application/json': {
          schema: sectionStatsByTermSchema,
        },
      },
    },
    400: {
      description: 'Invalid request parameters',
    },
  },
  tags: ['Courses', 'Sections'],
});

export const registerSectionStatsRoute = (app: OpenAPIHono): void => {
  const useCase = createGetSectionStatsUseCase(sectionStatsRepository);

  app.openapi(sectionStatsRoute, async c => {
    const { courseCode } = c.req.valid('param');
    const { term, terms } = c.req.valid('query');

    // Build terms array (prefer terms over single term)
    const termsArray = terms ?? (term !== undefined ? [term] : []);

    try {
      const result = await useCase.execute({
        courseCode,
        terms: termsArray,
      });

      return c.json(result, 200);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown error occurred';

      return c.json({ error: { code: 'INTERNAL_ERROR', message } }, 500);
    }
  });
};
