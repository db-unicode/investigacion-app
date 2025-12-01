import { z } from 'zod';

/**
 * Method capabilities schema
 */
export const methodCapabilitiesSchema = z.object({
  supportsMultiTerm: z.boolean(),
  supportsBacktesting: z.boolean(),
  requiresPrerequisites: z.boolean(),
  requiresHistoricalData: z.boolean(),
});

export type MethodCapabilitiesDto = z.infer<typeof methodCapabilitiesSchema>;

/**
 * Method category enumeration
 */
export const methodCategorySchema = z.enum([
  'prerequisite-based',
  'historical-trend',
  'machine-learning',
]);

export type MethodCategoryDto = z.infer<typeof methodCategorySchema>;

/**
 * Method status enumeration
 */
export const methodStatusSchema = z.enum(['active', 'beta', 'deprecated']);

export type MethodStatusDto = z.infer<typeof methodStatusSchema>;

/**
 * Single forecast method schema
 */
export const forecastMethodDtoSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  description: z.string(),
  shortDescription: z.string(),
  category: methodCategorySchema,
  status: methodStatusSchema,
  capabilities: methodCapabilitiesSchema,
  icon: z.string().optional(),
});

export type ForecastMethodDto = z.infer<typeof forecastMethodDtoSchema>;

/**
 * Forecast methods list response schema
 */
export const forecastMethodListSchema = z.object({
  methods: z.array(forecastMethodDtoSchema),
  metadata: z.object({
    totalCount: z.number().int().nonnegative(),
    activeCount: z.number().int().nonnegative(),
  }),
});

export type ForecastMethodListDto = z.infer<typeof forecastMethodListSchema>;

/**
 * Query parameters for filtering methods
 */
export const forecastMethodQuerySchema = z.object({
  category: methodCategorySchema.optional(),
  status: methodStatusSchema.optional(),
  backtesting: z
    .string()
    .transform(val => val === 'true')
    .optional(),
});

export type ForecastMethodQueryDto = z.infer<typeof forecastMethodQuerySchema>;
