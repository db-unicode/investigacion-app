import type {
  CourseDemandForecaster,
  CourseDemandForecasterInput,
} from './course-demand-forecaster';
import type { TermLookbackProvider } from './term-lookback-provider';
import type { ActualEnrollmentProvider } from '../backtesting/actual-enrollment-provider';
import type {
  ESForecastResult,
  ESTermWeight,
  ExponentialSmoothingConfig,
} from './models/exponential-smoothing';
import type { TermType, ForecastConfidence } from './models/weighted-moving-average';
import { DEFAULT_ES_CONFIG, ALPHA_RANGE } from './models/exponential-smoothing';

const METHOD_ID = 'exponential-smoothing';
const METHOD_LABEL = 'Exponential Smoothing';

export interface ESForecasterDeps {
  readonly termLookbackProvider: TermLookbackProvider;
  readonly actualEnrollmentProvider: ActualEnrollmentProvider;
}

export interface ESForecasterOptions {
  /** Smoothing parameter α (0 < α < 1). Default: 0.3 */
  alpha?: number;
  /** Maximum lookback terms. Default: 10 */
  maxLookbackTerms?: number;
  /** Minimum year for lookback. Default: 2018 */
  minYear?: number;
}

/**
 * Forecaster that predicts enrollment using Simple Exponential Smoothing (SES).
 *
 * Formula: S_t = α × Y_{t-1} + (1 - α) × S_{t-1}
 *
 * Where:
 * - S_t: Smoothed value (forecast) at time t
 * - Y_{t-1}: Actual enrollment from most recent term
 * - S_{t-1}: Previous smoothed value
 * - α: Smoothing parameter (0 < α < 1)
 *
 * Features:
 * - Exponentially decaying weights (recent data weighted more)
 * - Configurable smoothing parameter α
 * - Uses all available historical data (up to maxLookbackTerms)
 * - Term-type-aware lookback (main semesters vs intersessions)
 * - Graceful degradation with limited data
 *
 * @see WeightedMovingAverageForecaster for fixed-weight alternative
 */
export class ExponentialSmoothingForecaster implements CourseDemandForecaster {
  public readonly methodId: string = METHOD_ID;
  public readonly methodLabel: string;

  private readonly termLookbackProvider: TermLookbackProvider;
  private readonly actualEnrollmentProvider: ActualEnrollmentProvider;
  private readonly config: ExponentialSmoothingConfig;

  constructor(deps: ESForecasterDeps, options: ESForecasterOptions = {}) {
    this.termLookbackProvider = deps.termLookbackProvider;
    this.actualEnrollmentProvider = deps.actualEnrollmentProvider;

    // Validate and apply alpha
    const alpha = this.validateAlpha(options.alpha ?? DEFAULT_ES_CONFIG.alpha);

    this.config = {
      alpha,
      maxLookbackTerms:
        options.maxLookbackTerms ?? DEFAULT_ES_CONFIG.maxLookbackTerms,
      minYear: options.minYear ?? DEFAULT_ES_CONFIG.minYear,
    };

    // Include alpha in method label for clarity
    this.methodLabel = `${METHOD_LABEL} (α=${this.config.alpha})`;
  }

  /**
   * Validates and clamps alpha to valid range [0.01, 0.99]
   */
  private validateAlpha(alpha: number): number {
    if (alpha <= ALPHA_RANGE.min) {
      console.warn(
        `Alpha ${alpha} is too low, clamping to ${ALPHA_RANGE.min}`,
      );
      return ALPHA_RANGE.min;
    }
    if (alpha >= ALPHA_RANGE.max) {
      console.warn(
        `Alpha ${alpha} is too high, clamping to ${ALPHA_RANGE.max}`,
      );
      return ALPHA_RANGE.max;
    }
    return alpha;
  }

  async forecast(input: CourseDemandForecasterInput): Promise<ESForecastResult> {
    const { courseCode, academicTerm } = input;

    // Step 1: Determine term type and get past terms
    const termType = this.termLookbackProvider.getTermType(academicTerm);
    const pastTerms = this.termLookbackProvider.getPastTerms(
      academicTerm,
      this.config.maxLookbackTerms,
    );

    // Step 2: Get actual enrollments for past terms
    const enrollmentMap =
      await this.actualEnrollmentProvider.getActualEnrollments(
        courseCode,
        pastTerms,
      );

    // Step 3: Build enrollment data array (preserving order, most recent first)
    // Filter out terms with no data
    const enrollmentData = pastTerms
      .map(term => ({
        term,
        enrollment: enrollmentMap.get(term) ?? null,
      }))
      .filter(
        (d): d is { term: number; enrollment: number } => d.enrollment !== null,
      );

    // Step 4: Handle no data case
    if (enrollmentData.length === 0) {
      return this.buildNoDataResult(courseCode, academicTerm, termType);
    }

    // Step 5: Calculate Exponential Smoothing
    const {
      forecast,
      termDetails,
      initialValue,
      initialValueWeight,
      totalWeight,
      confidence,
    } = this.calculateES(enrollmentData);

    // Step 6: Build result
    return {
      courseCode,
      academicTerm,
      forecastedEnrollment: forecast,
      methodId: this.methodId,
      methodLabel: this.methodLabel,
      details: {
        alpha: this.config.alpha,
        historicalTerms: termDetails,
        initialValue,
        initialValueWeight,
        termsUsed: enrollmentData.length,
        termType,
        confidence,
        totalWeight,
      },
    };
  }

  /**
   * Calculates the Exponential Smoothing forecast.
   *
   * Uses the expanded form of SES:
   * S_t = α×Y₁ + α(1-α)×Y₂ + α(1-α)²×Y₃ + ... + (1-α)^n×S₀
   *
   * Where Y₁ is the most recent term and S₀ is the initial value
   * (set to the oldest available term's enrollment).
   */
  private calculateES(data: Array<{ term: number; enrollment: number }>): {
    forecast: number;
    termDetails: ESTermWeight[];
    initialValue: number;
    initialValueWeight: number;
    totalWeight: number;
    confidence: ForecastConfidence;
  } {
    const α = this.config.alpha;
    const n = data.length;

    // Initial value S₀: use oldest available term
    const initialValue = data[n - 1].enrollment;

    // Calculate weights for each term
    // Weight for term k positions ago: α × (1-α)^k
    const termDetails: ESTermWeight[] = [];
    let weightedSum = 0;
    let cumulativeWeight = 0;

    for (let k = 0; k < n; k++) {
      const weight = α * Math.pow(1 - α, k);
      const weightedValue = data[k].enrollment * weight;

      termDetails.push({
        academicTerm: data[k].term,
        enrollment: data[k].enrollment,
        weight: this.round(weight, 4),
        weightedValue: this.round(weightedValue, 2),
      });

      weightedSum += weightedValue;
      cumulativeWeight += weight;
    }

    // Residual weight for initial value: (1-α)^n
    // This represents the "memory" of the initial state
    const initialValueWeight = Math.pow(1 - α, n);
    const initialContribution = initialValue * initialValueWeight;

    weightedSum += initialContribution;
    const totalWeight = cumulativeWeight + initialValueWeight;

    // Round to nearest integer for final forecast
    const forecast = Math.round(weightedSum);

    // Assess confidence based on data availability
    const confidence = this.assessConfidence(n);

    return {
      forecast,
      termDetails,
      initialValue,
      initialValueWeight: this.round(initialValueWeight, 4),
      totalWeight: this.round(totalWeight, 4),
      confidence,
    };
  }

  /**
   * Assesses forecast confidence based on available historical data.
   *
   * More data = higher confidence because:
   * - S₀ influence diminishes exponentially
   * - More terms provide better trend estimation
   */
  private assessConfidence(termsUsed: number): ForecastConfidence {
    if (termsUsed >= 5) return 'high';
    if (termsUsed >= 3) return 'medium';
    if (termsUsed >= 1) return 'low';
    return 'insufficient';
  }

  /**
   * Builds a result for when no historical data is available.
   */
  private buildNoDataResult(
    courseCode: string,
    academicTerm: number,
    termType: TermType,
  ): ESForecastResult {
    return {
      courseCode,
      academicTerm,
      forecastedEnrollment: 0,
      methodId: this.methodId,
      methodLabel: this.methodLabel,
      details: {
        alpha: this.config.alpha,
        historicalTerms: [],
        initialValue: 0,
        initialValueWeight: 0,
        termsUsed: 0,
        termType,
        confidence: 'insufficient',
        fallbackReason: 'NO_HISTORICAL_DATA',
        totalWeight: 0,
      },
    };
  }

  /**
   * Rounds a number to specified decimal places.
   */
  private round(value: number, decimals: number): number {
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
  }
}
