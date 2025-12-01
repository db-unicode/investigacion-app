import { z } from 'zod';
import { createRoute, type OpenAPIHono } from '@hono/zod-openapi';
import type { CourseDemandForecastResultDto } from '@app/contracts';

const COURSE_CODE_PATTERN = /^[A-Z]{4}-\d{4}$/;

/**
 * Result type for multi-term handlers
 */
export interface MultiTermHandlerResult {
  readonly results: CourseDemandForecastResultDto[];
  readonly errors: Array<{
    readonly term: number;
    readonly message: string;
  }>;
}

/**
 * Configuration for creating a forecast route with multi-term support
 */
export interface ForecastRouteConfig {
  /** Route path with courseCode param (e.g., '/api/courses/{courseCode}/forecasts/my-method') */
  readonly path: string;

  /** OpenAPI operation summary */
  readonly summary: string;

  /** OpenAPI operation description */
  readonly description: string;

  /** OpenAPI tags */
  readonly tags?: readonly string[];

  /** Zod schema for single result */
  readonly resultSchema: z.ZodSchema<CourseDemandForecastResultDto>;

  /** Handler for single-term requests */
  readonly singleTermHandler: (
    courseCode: string,
    term: number,
  ) => Promise<CourseDemandForecastResultDto>;

  /** Handler for multi-term requests */
  readonly multiTermHandler: (
    courseCode: string,
    terms: readonly number[],
  ) => Promise<MultiTermHandlerResult>;
}

/**
 * Query schema supporting both single and multi-term requests
 */
const forecastQuerySchema = z.object({
  term: z
    .string()
    .regex(/^\d+$/, { message: 'term must be a positive integer' })
    .transform(val => parseInt(val, 10))
    .optional(),
  terms: z
    .string()
    .regex(/^\d+(,\d+)*$/, { message: 'terms must be comma-separated integers' })
    .transform(val => val.split(',').map(t => parseInt(t, 10)))
    .optional(),
}).refine(
  data => data.term !== undefined || data.terms !== undefined,
  { message: 'Either term or terms query parameter is required' },
);

/**
 * Multi-term response schema
 */
const multiTermResponseSchema = z.object({
  courseCode: z.string(),
  method: z.object({
    id: z.string(),
    label: z.string(),
  }),
  forecasts: z.array(z.object({
    academicTerm: z.number(),
    forecastedEnrollment: z.number(),
    details: z.unknown().optional(),
  })),
  metadata: z.object({
    requestedTerms: z.array(z.number()),
    processedAt: z.string(),
    totalForecasted: z.number(),
    errors: z.array(z.object({
      term: z.number(),
      code: z.string(),
      message: z.string(),
    })).optional(),
  }),
});

/**
 * Creates a forecast route with automatic multi-term support.
 *
 * This factory generates routes that accept either:
 * - `?term=202410` - Single term (returns single object)
 * - `?terms=202410,202420,202510` - Multiple terms (returns array)
 *
 * @example
 * ```typescript
 * createForecastRoute(app, {
 *   path: '/api/courses/{courseCode}/forecasts/potential-students',
 *   summary: 'Forecast potential students',
 *   description: 'Forecasts based on prerequisite completion',
 *   resultSchema: courseDemandForecastResultSchema,
 *   singleTermHandler: async (courseCode, term) => {
 *     return useCase.execute({ courseCode, academicTerm: term });
 *   },
 *   multiTermHandler: async (courseCode, terms) => {
 *     return useCase.executeMultiple({ courseCode }, terms);
 *   },
 * });
 * ```
 */
export function createForecastRoute(
  app: OpenAPIHono,
  config: ForecastRouteConfig,
): void {
  const route = createRoute({
    method: 'get',
    path: config.path,
    request: {
      params: z.object({
        courseCode: z
          .string()
          .regex(COURSE_CODE_PATTERN, {
            message: 'courseCode must match pattern XXXX-DDDD.',
          }),
      }),
      query: forecastQuerySchema,
    },
    responses: {
      200: {
        description: config.description,
        content: {
          'application/json': {
            schema: z.union([
              config.resultSchema,
              multiTermResponseSchema,
            ]),
          },
        },
      },
      400: {
        description: 'Invalid request parameters',
      },
      404: {
        description: 'Course or prerequisites not found',
      },
    },
    tags: config.tags ? [...config.tags] : ['Forecasts'],
    summary: config.summary,
  });

  app.openapi(route, async (c) => {
    const { courseCode } = c.req.valid('param');
    const { term, terms } = c.req.valid('query');

    // Single term request
    if (term !== undefined && terms === undefined) {
      const result = await config.singleTermHandler(courseCode, term);
      return c.json(result, 200);
    }

    // Multi-term request
    const termsArray = terms ?? [term!];
    const { results, errors } = await config.multiTermHandler(courseCode, termsArray);

    // Build multi-term response
    const methodId = results[0]?.methodId ?? 'unknown';
    const methodLabel = results[0]?.methodLabel ?? 'Unknown method';

    const response = {
      courseCode,
      method: {
        id: methodId,
        label: methodLabel,
      },
      forecasts: results.map(r => ({
        academicTerm: r.academicTerm,
        forecastedEnrollment: r.forecastedEnrollment,
        details: r.details,
      })),
      metadata: {
        requestedTerms: termsArray,
        processedAt: new Date().toISOString(),
        totalForecasted: results.reduce(
          (sum, r) => sum + r.forecastedEnrollment,
          0,
        ),
        ...(errors.length > 0 && {
          errors: errors.map(e => ({
            term: e.term,
            code: 'FORECAST_FAILED',
            message: e.message,
          })),
        }),
      },
    };

    return c.json(response, 200);
  });
}
