import { z } from 'zod';

/**
 * Accuracy metrics for a single forecast comparison
 */
export const accuracyMetricsSchema = z.object({
  accuracyPercentage: z.number().min(0).max(100),
  absoluteError: z.number().int(),
  errorDirection: z.enum(['over', 'under', 'exact']),
  studentsOff: z.number().int().nonnegative(),
  errorPercentage: z.number().nonnegative(),
});

export type AccuracyMetricsDto = z.infer<typeof accuracyMetricsSchema>;

/**
 * Single comparison between forecast and actual
 */
export const comparisonItemSchema = z.object({
  academicTerm: z.number().int(),
  forecast: z.object({
    predictedEnrollment: z.number().int().nonnegative(),
    generatedAt: z.string().datetime().optional(),
  }),
  actual: z.object({
    realEnrollment: z.number().int().nonnegative(),
    dataSource: z.enum(['enrollments', 'external']),
  }),
  metrics: accuracyMetricsSchema,
});

export type ComparisonItemDto = z.infer<typeof comparisonItemSchema>;

/**
 * Summary metrics across all comparisons
 */
export const summaryMetricsSchema = z.object({
  averageAccuracy: z.number().min(0).max(100),
  totalPredicted: z.number().int().nonnegative(),
  totalActual: z.number().int().nonnegative(),
  overallError: z.number().int(),
  mape: z.number().nonnegative(),
  rmse: z.number().nonnegative(),
  overPredictions: z.number().int().nonnegative(),
  underPredictions: z.number().int().nonnegative(),
  exactPredictions: z.number().int().nonnegative(),
});

export type SummaryMetricsDto = z.infer<typeof summaryMetricsSchema>;

/**
 * Complete forecast accuracy result
 */
export const forecastAccuracyResultSchema = z.object({
  courseCode: z.string().regex(/^[A-Z]{4}-\d{4}$/, {
    message: 'courseCode must match pattern XXXX-DDDD.',
  }),

  method: z.object({
    id: z.string(),
    label: z.string(),
  }),

  comparisons: z.array(comparisonItemSchema),

  summary: summaryMetricsSchema,

  metadata: z.object({
    requestedTerms: z.array(z.number().int()),
    processedAt: z.string().datetime(),
    termsWithData: z.number().int().nonnegative(),
    termsWithoutData: z.array(z.number().int()).optional(),
  }),
});

export type ForecastAccuracyResultDto = z.infer<
  typeof forecastAccuracyResultSchema
>;

/**
 * Input for accuracy request
 */
export const forecastAccuracyInputSchema = z.object({
  courseCode: z.string().regex(/^[A-Z]{4}-\d{4}$/, {
    message: 'courseCode must match pattern XXXX-DDDD.',
  }),
  methodId: z.string().min(1),
  terms: z
    .array(z.number().int().nonnegative())
    .min(1, { message: 'At least one term is required' })
    .max(10, { message: 'Maximum 10 terms allowed per request' }),
});

export type ForecastAccuracyInputDto = z.infer<
  typeof forecastAccuracyInputSchema
>;
