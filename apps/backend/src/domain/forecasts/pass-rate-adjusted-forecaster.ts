import type {
  CourseDemandForecaster,
  CourseDemandForecasterInput,
} from './course-demand-forecaster';
import type { ConversionRateCalculator } from './conversion-rate-calculator';
import type { HistoricalConversionProvider } from './historical-conversion-provider';
import type {
  PassRateAdjustedResult,
  PassRateAdjustedDetails,
} from './models/pass-rate-adjusted';
import type { ConversionRateConfidence } from './models/conversion-rate';

const METHOD_ID = 'pass-rate-adjusted';
const METHOD_LABEL = 'Pass Rate Adjusted';

export interface PassRateAdjustedForecasterOptions {
  /**
   * Number of past terms to consider for conversion rate.
   * Uses term-type-aware lookback (main semesters or intersession).
   */
  lookbackTerms?: number;

  /** Minimum confidence level to apply adjustment */
  minimumConfidence?: ConversionRateConfidence;
}

const DEFAULT_OPTIONS: Required<PassRateAdjustedForecasterOptions> = {
  lookbackTerms: 3,
  minimumConfidence: 'low',
};

export interface PassRateAdjustedForecasterDeps {
  readonly baseForecaster: CourseDemandForecaster;
  readonly conversionRateCalculator: ConversionRateCalculator;
  readonly historicalConversionProvider: HistoricalConversionProvider;
}

/**
 * Forecaster that adjusts prerequisite-based predictions using
 * historical enrollment conversion rates.
 *
 * Formula: Adjusted Forecast = Base Forecast × Conversion Rate
 *
 * The conversion rate is calculated as a weighted average of
 * historical (actual_enrollment / potential_students) ratios.
 *
 * This provides more accurate predictions by calibrating the
 * upper-bound estimate (potential students) with actual demand patterns.
 */
export class PassRateAdjustedForecaster implements CourseDemandForecaster {
  public readonly methodId: string = METHOD_ID;
  public readonly methodLabel: string = METHOD_LABEL;

  private readonly baseForecaster: CourseDemandForecaster;
  private readonly conversionRateCalculator: ConversionRateCalculator;
  private readonly historicalProvider: HistoricalConversionProvider;
  private readonly options: Required<PassRateAdjustedForecasterOptions>;

  constructor(
    deps: PassRateAdjustedForecasterDeps,
    options: PassRateAdjustedForecasterOptions = {},
  ) {
    this.baseForecaster = deps.baseForecaster;
    this.conversionRateCalculator = deps.conversionRateCalculator;
    this.historicalProvider = deps.historicalConversionProvider;
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  async forecast(
    input: CourseDemandForecasterInput,
  ): Promise<PassRateAdjustedResult> {
    const { courseCode, academicTerm } = input;

    // Step 1: Get base forecast (potential students)
    const baseResult = await this.baseForecaster.forecast(input);
    const baseForecast = baseResult.forecastedEnrollment;

    // Step 2: Get historical conversion data
    const historicalData =
      await this.historicalProvider.getHistoricalConversionData(
        courseCode,
        academicTerm,
        this.options.lookbackTerms,
      );

    // Step 3: Calculate conversion rate
    const conversionResult =
      this.conversionRateCalculator.calculate(historicalData);

    // Step 4: Determine if adjustment should be applied
    const shouldApplyAdjustment = this.shouldApplyAdjustment(
      conversionResult.confidence,
    );

    // Step 5: Calculate adjusted forecast
    const adjustedForecast = shouldApplyAdjustment
      ? Math.round(baseForecast * conversionResult.rate)
      : baseForecast;

    // Build details
    const details: PassRateAdjustedDetails = {
      baseForecast,
      conversionRate: conversionResult.rate,
      conversionRateConfidence: conversionResult.confidence,
      historicalDataPoints: conversionResult.dataPointsUsed,
      adjustmentApplied: shouldApplyAdjustment,
      fallbackReason: shouldApplyAdjustment
        ? undefined
        : `Insufficient historical data (confidence: ${conversionResult.confidence})`,
      historicalRates: historicalData.map(d => ({
        term: d.academicTerm,
        rate: Math.round(d.conversionRate * 1000) / 1000,
      })),
      baseForecasterDetails: baseResult.details,
    };

    return {
      courseCode,
      academicTerm,
      forecastedEnrollment: adjustedForecast,
      methodId: this.methodId,
      methodLabel: this.methodLabel,
      details,
    };
  }

  private shouldApplyAdjustment(
    confidence: ConversionRateConfidence,
  ): boolean {
    const confidenceOrder: ConversionRateConfidence[] = [
      'insufficient',
      'low',
      'medium',
      'high',
    ];
    const actualIndex = confidenceOrder.indexOf(confidence);
    const minimumIndex = confidenceOrder.indexOf(
      this.options.minimumConfidence,
    );
    return actualIndex >= minimumIndex;
  }
}
