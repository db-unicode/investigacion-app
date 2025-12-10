import type { ConversionRateConfidence } from './conversion-rate';

/**
 * Historical rate entry for a single term
 */
export interface HistoricalRateEntry {
  readonly term: number;
  readonly rate: number;
}

/**
 * Detailed information about the pass-rate adjusted forecast
 */
export interface PassRateAdjustedDetails {
  /** Raw forecast from base forecaster (upper bound) */
  readonly baseForecast: number;

  /** Applied conversion rate */
  readonly conversionRate: number;

  /** Confidence in the conversion rate */
  readonly conversionRateConfidence: ConversionRateConfidence;

  /** Number of historical data points used */
  readonly historicalDataPoints: number;

  /** Whether adjustment was applied (false if insufficient data) */
  readonly adjustmentApplied: boolean;

  /** Reason if adjustment was not applied */
  readonly fallbackReason?: string;

  /** Historical conversion rates per term */
  readonly historicalRates?: readonly HistoricalRateEntry[];

  /** Details from the base forecaster */
  readonly baseForecasterDetails: unknown;
}

/**
 * Extended result type for pass-rate adjusted forecasts
 */
export interface PassRateAdjustedResult {
  readonly courseCode: string;
  readonly academicTerm: number;
  readonly forecastedEnrollment: number;
  readonly methodId: string;
  readonly methodLabel: string;
  readonly details: PassRateAdjustedDetails;
}
