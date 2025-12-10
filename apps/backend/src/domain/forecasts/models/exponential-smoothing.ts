import type { TermType, ForecastConfidence } from './weighted-moving-average';

/**
 * Configuration for Exponential Smoothing forecaster.
 *
 * The smoothing parameter α controls the rate of decay:
 * - Higher α (0.7-0.9): More weight on recent data, responsive to changes
 * - Lower α (0.1-0.3): Smoother forecasts, more stable
 *
 * Formula: S_t = α × Y_{t-1} + (1-α) × S_{t-1}
 */
export interface ExponentialSmoothingConfig {
  /**
   * Smoothing parameter (0 < α < 1)
   *
   * Weight for most recent observation. Higher values make the
   * forecast more responsive to recent changes.
   *
   * @default 0.3
   */
  readonly alpha: number;

  /**
   * Maximum number of past terms to consider.
   * Set to a reasonable limit to bound computation and
   * ensure S₀ influence is negligible.
   *
   * @default 10
   */
  readonly maxLookbackTerms: number;

  /**
   * Earliest year to consider for lookback.
   * @default 2018
   */
  readonly minYear: number;
}

/**
 * Default configuration: α = 0.3 (conservative, stable forecasts)
 *
 * With α = 0.3:
 * - T₁ (most recent): 30% weight
 * - T₂: 21% weight
 * - T₃: 14.7% weight
 * - ...exponentially decaying
 */
export const DEFAULT_ES_CONFIG: Readonly<ExponentialSmoothingConfig> = {
  alpha: 0.3,
  maxLookbackTerms: 10,
  minYear: 2018,
} as const;

/**
 * Valid range for alpha parameter
 */
export const ALPHA_RANGE = {
  min: 0.01,
  max: 0.99,
} as const;

/**
 * Preset configurations for different scenarios
 */
export const ES_PRESETS = {
  /** Conservative: Very stable forecasts, slow to react */
  conservative: { alpha: 0.2, maxLookbackTerms: 15, minYear: 2018 },

  /** Standard: Balanced responsiveness (DEFAULT) */
  standard: { alpha: 0.3, maxLookbackTerms: 10, minYear: 2018 },

  /** Responsive: Adapts quickly to recent changes */
  responsive: { alpha: 0.5, maxLookbackTerms: 8, minYear: 2018 },

  /** Volatile: For courses with rapidly changing demand */
  volatile: { alpha: 0.7, maxLookbackTerms: 6, minYear: 2018 },
} as const;

/**
 * Historical term data with exponential weight information
 */
export interface ESTermWeight {
  /** Academic term number */
  readonly academicTerm: number;

  /** Actual enrollment for this term */
  readonly enrollment: number;

  /**
   * Exponential weight applied: α × (1-α)^k
   * where k is the position (0 = most recent)
   */
  readonly weight: number;

  /** enrollment × weight */
  readonly weightedValue: number;
}

/**
 * Detailed information about the Exponential Smoothing forecast
 */
export interface ESForecastDetails {
  /** Smoothing parameter used */
  readonly alpha: number;

  /** Historical enrollment data with exponential weights */
  readonly historicalTerms: readonly ESTermWeight[];

  /**
   * Initial smoothed value (S₀).
   * Used as the base for exponential smoothing recursion.
   * Typically set to the oldest available term's enrollment.
   */
  readonly initialValue: number;

  /**
   * Weight applied to initial value: (1-α)^n
   * Represents the residual influence of S₀ on the forecast.
   */
  readonly initialValueWeight: number;

  /** Number of historical terms used in calculation */
  readonly termsUsed: number;

  /** Type of terms used (main-semester or intersession) */
  readonly termType: TermType;

  /** Confidence level based on data availability */
  readonly confidence: ForecastConfidence;

  /** Fallback reason if insufficient data */
  readonly fallbackReason?: string;

  /**
   * Sum of all weights (data + initial).
   * Should equal approximately 1.0.
   */
  readonly totalWeight: number;
}

/**
 * Extended result type for Exponential Smoothing forecasts
 */
export interface ESForecastResult {
  readonly courseCode: string;
  readonly academicTerm: number;
  readonly forecastedEnrollment: number;
  readonly methodId: string;
  readonly methodLabel: string;
  readonly details: ESForecastDetails;
}
