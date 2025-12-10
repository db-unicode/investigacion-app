/**
 * Type of academic term based on semester code.
 *
 * - `main-semester`: Spring (10) or Fall (20) terms
 * - `intersession`: Summer/intensive terms (11-19)
 */
export type TermType = 'main-semester' | 'intersession';

/**
 * Confidence level for the WMA forecast based on data availability.
 *
 * - `high`: 3+ historical terms available
 * - `medium`: 2 historical terms available
 * - `low`: 1 historical term available
 * - `insufficient`: No historical data available
 */
export type ForecastConfidence = 'high' | 'medium' | 'low' | 'insufficient';

/**
 * Weight configuration for the 3-term Weighted Moving Average.
 *
 * WMA Formula: Forecast = Σ(wᵢ × Eᵢ) where Σwᵢ = 1.0
 *
 * Default weights prioritize recent demand:
 * - T1 (most recent): 50%
 * - T2 (previous): 30%
 * - T3 (third recent): 20%
 */
export interface WMAWeightConfig {
  /** Weight for most recent term (default: 0.50) */
  readonly t1Weight: number;
  /** Weight for second most recent term (default: 0.30) */
  readonly t2Weight: number;
  /** Weight for third most recent term (default: 0.20) */
  readonly t3Weight: number;
}

/**
 * Default WMA weights: 50%, 30%, 20%
 */
export const DEFAULT_WMA_WEIGHTS: Readonly<WMAWeightConfig> = {
  t1Weight: 0.50,
  t2Weight: 0.30,
  t3Weight: 0.20,
} as const;

/**
 * Historical enrollment data point with weight information
 */
export interface TermEnrollment {
  readonly academicTerm: number;
  readonly enrollment: number;
  readonly weightApplied: number;
  readonly weightedValue: number;
}

/**
 * Adjusted weights when fewer than 3 terms are available
 */
export interface AdjustedWeights {
  readonly t1Weight: number;
  readonly t2Weight?: number;
}

/**
 * Detailed information about the Weighted Moving Average forecast
 */
export interface WMAForecastDetails {
  /** Historical enrollment data used in WMA calculation */
  readonly historicalTerms: readonly TermEnrollment[];

  /** Original WMA weights configuration */
  readonly weightsApplied: WMAWeightConfig;

  /** Adjusted weights if fewer than 3 terms available */
  readonly adjustedWeights?: AdjustedWeights;

  /** Confidence level based on data availability */
  readonly confidence: ForecastConfidence;

  /** Number of historical terms used in WMA */
  readonly termsUsed: number;

  /** Type of terms used (main-semester or intersession) */
  readonly termType: TermType;

  /** Fallback reason if data unavailable */
  readonly fallbackReason?: string;
}

/**
 * Extended result type for Weighted Moving Average forecasts
 */
export interface WMAForecastResult {
  readonly courseCode: string;
  readonly academicTerm: number;
  readonly forecastedEnrollment: number;
  readonly methodId: string;
  readonly methodLabel: string;
  readonly details: WMAForecastDetails;
}
