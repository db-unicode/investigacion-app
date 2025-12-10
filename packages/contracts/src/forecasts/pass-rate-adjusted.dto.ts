import { z } from 'zod';

/**
 * Confidence level for conversion rate
 */
export const conversionRateConfidenceSchema = z.enum([
  'high',
  'medium',
  'low',
  'insufficient',
]);

export type ConversionRateConfidenceDto = z.infer<
  typeof conversionRateConfidenceSchema
>;

/**
 * Historical rate data point
 */
export const historicalRateSchema = z.object({
  term: z.number().int(),
  rate: z.number().nonnegative(),
});

export type HistoricalRateDto = z.infer<typeof historicalRateSchema>;

/**
 * Pass rate adjusted forecast details
 */
export const passRateAdjustedDetailsSchema = z.object({
  /** Raw forecast from base forecaster */
  baseForecast: z.number().int().nonnegative(),

  /** Applied conversion rate (0-1+) */
  conversionRate: z.number().nonnegative(),

  /** Confidence in the conversion rate */
  conversionRateConfidence: conversionRateConfidenceSchema,

  /** Number of historical terms used for calculation */
  historicalDataPoints: z.number().int().nonnegative(),

  /** Whether the adjustment was applied */
  adjustmentApplied: z.boolean(),

  /** Reason if adjustment was not applied */
  fallbackReason: z.string().optional(),

  /** Historical conversion rates per term */
  historicalRates: z.array(historicalRateSchema).optional(),

  /** Details from the underlying base forecaster */
  baseForecasterDetails: z.unknown(),
});

export type PassRateAdjustedDetailsDto = z.infer<
  typeof passRateAdjustedDetailsSchema
>;
