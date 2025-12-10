import type {
  CourseDemandForecaster,
  CourseDemandForecasterInput,
} from './course-demand-forecaster';
import type { TermLookbackProvider } from './term-lookback-provider';
import type { ActualEnrollmentProvider } from '../backtesting/actual-enrollment-provider';
import type {
  WMAForecastResult,
  WMAWeightConfig,
  TermEnrollment,
  ForecastConfidence,
  TermType,
  AdjustedWeights,
} from './models/weighted-moving-average';
import { DEFAULT_WMA_WEIGHTS } from './models/weighted-moving-average';

const METHOD_ID = 'weighted-moving-average';
const METHOD_LABEL = 'Weighted Moving Average (3-term WMA)';

export interface WMAForecasterOptions {
  /** Number of past terms to consider (default: 3) */
  lookbackTerms?: number;

  /** Custom WMA weight configuration */
  weights?: Partial<WMAWeightConfig>;
}

const DEFAULT_OPTIONS: Required<Omit<WMAForecasterOptions, 'weights'>> = {
  lookbackTerms: 3,
};

export interface WMAForecasterDeps {
  readonly termLookbackProvider: TermLookbackProvider;
  readonly actualEnrollmentProvider: ActualEnrollmentProvider;
}

/**
 * Forecaster that predicts enrollment using a 3-term Weighted Moving Average.
 *
 * WMA Formula: Forecast = Σ(wᵢ × Eᵢ) where Σwᵢ = 1.0
 *
 * Default weights:
 * - T₁ (most recent): 0.50 (50%)
 * - T₂ (previous): 0.30 (30%)
 * - T₃ (third recent): 0.20 (20%)
 *
 * Features:
 * - Term-type-aware lookback (main semesters vs intersessions)
 * - Graceful degradation when fewer than 3 terms available
 * - Transparent weight adjustments in edge cases
 *
 * @see ExponentialSmoothingForecaster for an alternative time-series approach (future)
 */
export class WeightedMovingAverageForecaster implements CourseDemandForecaster {
  public readonly methodId: string = METHOD_ID;
  public readonly methodLabel: string = METHOD_LABEL;

  private readonly termLookbackProvider: TermLookbackProvider;
  private readonly actualEnrollmentProvider: ActualEnrollmentProvider;
  private readonly lookbackTerms: number;
  private readonly weights: WMAWeightConfig;

  constructor(
    deps: WMAForecasterDeps,
    options: WMAForecasterOptions = {},
  ) {
    this.termLookbackProvider = deps.termLookbackProvider;
    this.actualEnrollmentProvider = deps.actualEnrollmentProvider;
    this.lookbackTerms = options.lookbackTerms ?? DEFAULT_OPTIONS.lookbackTerms;
    this.weights = {
      ...DEFAULT_WMA_WEIGHTS,
      ...options.weights,
    };
  }

  async forecast(
    input: CourseDemandForecasterInput,
  ): Promise<WMAForecastResult> {
    const { courseCode, academicTerm } = input;

    // Step 1: Determine term type and get past terms
    const termType = this.termLookbackProvider.getTermType(academicTerm);
    const pastTerms = this.termLookbackProvider.getPastTerms(
      academicTerm,
      this.lookbackTerms,
    );

    // Step 2: Get actual enrollments for past terms
    const enrollmentMap = await this.actualEnrollmentProvider.getActualEnrollments(
      courseCode,
      pastTerms,
    );

    // Step 3: Build enrollment data array (preserving order)
    const enrollmentData = pastTerms.map(term => ({
      term,
      enrollment: enrollmentMap.get(term) ?? null,
    }));

    // Step 4: Filter to valid enrollments (non-null)
    const validData = enrollmentData.filter(
      (d): d is { term: number; enrollment: number } => d.enrollment !== null,
    );

    // Step 5: Handle no data case
    if (validData.length === 0) {
      return this.buildNoDataResult(courseCode, academicTerm, termType);
    }

    // Step 6: Calculate Weighted Moving Average based on available data
    const { forecast, termDetails, adjustedWeights, confidence } =
      this.calculateWMA(validData);

    // Step 7: Build result
    return {
      courseCode,
      academicTerm,
      forecastedEnrollment: forecast,
      methodId: this.methodId,
      methodLabel: this.methodLabel,
      details: {
        historicalTerms: termDetails,
        weightsApplied: this.weights,
        adjustedWeights,
        confidence,
        termsUsed: validData.length,
        termType,
      },
    };
  }

  /**
   * Calculates the Weighted Moving Average forecast.
   *
   * Weight adjustment strategy:
   * - 3+ terms: Use full WMA weights (0.50, 0.30, 0.20)
   * - 2 terms: Normalize to (0.625, 0.375)
   * - 1 term: Use direct value (1.00)
   */
  private calculateWMA(
    validData: Array<{ term: number; enrollment: number }>,
  ): {
    forecast: number;
    termDetails: TermEnrollment[];
    adjustedWeights?: AdjustedWeights;
    confidence: ForecastConfidence;
  } {
    const n = validData.length;

    let weights: number[];
    let adjustedWeights: AdjustedWeights | undefined;
    let confidence: ForecastConfidence;

    if (n >= 3) {
      // Full 3-term Weighted Moving Average
      weights = [this.weights.t1Weight, this.weights.t2Weight, this.weights.t3Weight];
      confidence = 'high';
    } else if (n === 2) {
      // 2-term normalized WMA
      // Original: 0.50 + 0.30 = 0.80
      // Normalized: 0.50/0.80 = 0.625, 0.30/0.80 = 0.375
      const totalOriginal = this.weights.t1Weight + this.weights.t2Weight;
      const w1 = this.weights.t1Weight / totalOriginal;
      const w2 = this.weights.t2Weight / totalOriginal;
      weights = [w1, w2];
      adjustedWeights = {
        t1Weight: this.round(w1, 3),
        t2Weight: this.round(w2, 3),
      };
      confidence = 'medium';
    } else {
      // Single term - direct value (degenerate WMA)
      weights = [1.0];
      adjustedWeights = { t1Weight: 1.0 };
      confidence = 'low';
    }

    // Calculate weighted sum: WMA = Σ(wᵢ × Eᵢ)
    const termDetails: TermEnrollment[] = validData
      .slice(0, weights.length)
      .map((d, i) => ({
        academicTerm: d.term,
        enrollment: d.enrollment,
        weightApplied: this.round(weights[i], 3),
        weightedValue: this.round(d.enrollment * weights[i], 2),
      }));

    const forecast = Math.round(
      termDetails.reduce((sum, t) => sum + t.weightedValue, 0),
    );

    return { forecast, termDetails, adjustedWeights, confidence };
  }

  /**
   * Builds a result for when no historical data is available.
   */
  private buildNoDataResult(
    courseCode: string,
    academicTerm: number,
    termType: TermType,
  ): WMAForecastResult {
    return {
      courseCode,
      academicTerm,
      forecastedEnrollment: 0,
      methodId: this.methodId,
      methodLabel: this.methodLabel,
      details: {
        historicalTerms: [],
        weightsApplied: this.weights,
        confidence: 'insufficient',
        termsUsed: 0,
        termType,
        fallbackReason: 'NO_HISTORICAL_DATA',
      },
    };
  }

  private round(value: number, decimals: number): number {
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
  }
}
