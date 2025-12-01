import { z } from 'zod';

const COURSE_CODE_PATTERN = /^[A-Z]{4}-\d{4}$/;

/**
 * Schema for individual forecast within a multi-term response
 */
export const termForecastItemSchema = z.object({
  academicTerm: z
    .number()
    .int()
    .nonnegative(),
  forecastedEnrollment: z
    .number()
    .int()
    .nonnegative(),
  details: z.unknown().optional(),
});

export type TermForecastItem = z.infer<typeof termForecastItemSchema>;

/**
 * Schema for error entries in partial failure responses
 */
export const forecastErrorSchema = z.object({
  term: z.number().int().nonnegative(),
  code: z.string(),
  message: z.string(),
});

export type ForecastError = z.infer<typeof forecastErrorSchema>;

/**
 * Schema for multi-term forecast response metadata
 */
export const forecastMetadataSchema = z.object({
  requestedTerms: z.array(z.number().int().nonnegative()),
  processedAt: z.string().datetime(),
  totalForecasted: z.number().int().nonnegative(),
  errors: z.array(forecastErrorSchema).optional(),
});

export type ForecastMetadata = z.infer<typeof forecastMetadataSchema>;

/**
 * Schema for the forecast method info
 */
export const forecastMethodSchema = z.object({
  id: z.string(),
  label: z.string(),
});

export type ForecastMethod = z.infer<typeof forecastMethodSchema>;

/**
 * Schema for multi-term forecast result
 */
export const multiTermForecastResultSchema = z.object({
  courseCode: z
    .string()
    .regex(COURSE_CODE_PATTERN, {
      message: 'courseCode must match pattern XXXX-DDDD.',
    }),

  method: forecastMethodSchema,

  forecasts: z.array(termForecastItemSchema),

  metadata: forecastMetadataSchema,
});

export type MultiTermForecastResultDto = z.infer<
  typeof multiTermForecastResultSchema
>;

/**
 * Input schema for multi-term forecast request
 */
export const multiTermForecastInputSchema = z.object({
  courseCode: z
    .string()
    .regex(COURSE_CODE_PATTERN, {
      message: 'courseCode must match pattern XXXX-DDDD.',
    }),
  terms: z
    .array(z.number().int().nonnegative())
    .min(1, { message: 'At least one term is required' })
    .max(10, { message: 'Maximum 10 terms allowed per request' }),
});

export type MultiTermForecastInputDto = z.infer<
  typeof multiTermForecastInputSchema
>;
