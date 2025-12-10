import { z } from 'zod';
import { termTypeSchema, forecastConfidenceSchema } from './weighted-moving-average.dto.js';

/**
 * Term weight data for exponential smoothing.
 * Shows how each historical term contributes to the forecast.
 */
export const esTermWeightSchema = z.object({
  academicTerm: z.number().int().describe('Academic term (e.g., 202410)'),
  enrollment: z
    .number()
    .int()
    .nonnegative()
    .describe('Actual enrollment count'),
  weight: z
    .number()
    .min(0)
    .max(1)
    .describe('Exponential weight: α × (1-α)^k'),
  weightedValue: z.number().nonnegative().describe('enrollment × weight'),
});

export type ESTermWeightDto = z.infer<typeof esTermWeightSchema>;

/**
 * Exponential Smoothing forecast details.
 * Provides full transparency into the calculation.
 */
export const esForecastDetailsSchema = z.object({
  /** Smoothing parameter α used (0 < α < 1) */
  alpha: z
    .number()
    .min(0.01)
    .max(0.99)
    .describe('Smoothing parameter controlling weight decay rate'),

  /** Historical terms with their exponential weights */
  historicalTerms: z
    .array(esTermWeightSchema)
    .describe('Historical enrollment data with applied weights'),

  /** Initial smoothed value (S₀) - typically oldest term */
  initialValue: z
    .number()
    .int()
    .nonnegative()
    .describe('Initial value used to start ES recursion'),

  /** Weight applied to initial value: (1-α)^n */
  initialValueWeight: z
    .number()
    .min(0)
    .max(1)
    .describe('Residual weight for initial value'),

  /** Number of historical terms used */
  termsUsed: z
    .number()
    .int()
    .nonnegative()
    .describe('Count of historical terms in calculation'),

  /** Type of terms used */
  termType: termTypeSchema.describe(
    'Whether main-semester or intersession terms were used',
  ),

  /** Confidence level based on data availability */
  confidence: forecastConfidenceSchema.describe(
    'Forecast confidence based on available data',
  ),

  /** Fallback reason if insufficient data */
  fallbackReason: z
    .string()
    .optional()
    .describe('Explanation if forecast could not be computed'),

  /** Sum of all weights (should ≈ 1.0) */
  totalWeight: z
    .number()
    .min(0)
    .max(1.01)
    .describe('Sum of all weights including initial value weight'),
});

export type ESForecastDetailsDto = z.infer<typeof esForecastDetailsSchema>;
