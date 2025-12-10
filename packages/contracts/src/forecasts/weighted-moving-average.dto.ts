import { z } from 'zod';

/**
 * Term type classification
 */
export const termTypeSchema = z.enum(['main-semester', 'intersession']);

export type TermTypeDto = z.infer<typeof termTypeSchema>;

/**
 * Forecast confidence level based on data availability
 */
export const forecastConfidenceSchema = z.enum([
  'high',
  'medium',
  'low',
  'insufficient',
]);

export type ForecastConfidenceDto = z.infer<typeof forecastConfidenceSchema>;

/**
 * WMA weight configuration for 3-term Weighted Moving Average
 */
export const wmaWeightConfigSchema = z.object({
  t1Weight: z.number().min(0).max(1).describe('Weight for most recent term'),
  t2Weight: z.number().min(0).max(1).describe('Weight for second most recent term'),
  t3Weight: z.number().min(0).max(1).describe('Weight for third most recent term'),
});

export type WMAWeightConfigDto = z.infer<typeof wmaWeightConfigSchema>;

/**
 * Term enrollment data point with weight information
 */
export const termEnrollmentSchema = z.object({
  academicTerm: z.number().int().describe('Academic term (e.g., 202410)'),
  enrollment: z.number().int().nonnegative().describe('Actual enrollment count'),
  weightApplied: z.number().min(0).max(1).describe('WMA weight applied to this term'),
  weightedValue: z.number().nonnegative().describe('Enrollment × weight'),
});

export type TermEnrollmentDto = z.infer<typeof termEnrollmentSchema>;

/**
 * Adjusted weights when fewer than 3 terms available
 */
export const adjustedWeightsSchema = z.object({
  t1Weight: z.number().min(0).max(1),
  t2Weight: z.number().min(0).max(1).optional(),
});

export type AdjustedWeightsDto = z.infer<typeof adjustedWeightsSchema>;

/**
 * WMA forecast details
 */
export const wmaForecastDetailsSchema = z.object({
  /** Historical enrollment data used in WMA calculation */
  historicalTerms: z.array(termEnrollmentSchema),

  /** Original WMA weights configuration (0.50, 0.30, 0.20) */
  weightsApplied: wmaWeightConfigSchema,

  /** Adjusted weights if fewer than 3 terms available */
  adjustedWeights: adjustedWeightsSchema.optional(),

  /** Confidence level based on data availability */
  confidence: forecastConfidenceSchema,

  /** Number of historical terms used in WMA (0-3) */
  termsUsed: z.number().int().min(0).max(3),

  /** Type of terms used */
  termType: termTypeSchema,

  /** Fallback reason if data unavailable */
  fallbackReason: z.string().optional(),
});

export type WMAForecastDetailsDto = z.infer<typeof wmaForecastDetailsSchema>;
