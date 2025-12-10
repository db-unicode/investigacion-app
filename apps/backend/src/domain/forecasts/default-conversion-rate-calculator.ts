import type { ConversionRateCalculator } from './conversion-rate-calculator';
import type {
  ConversionRateResult,
  ConversionRateConfidence,
  HistoricalConversionData,
} from './models/conversion-rate';

export interface ConversionRateCalculatorOptions {
  /** Exponential decay factor (0-1). Higher = more weight on recent terms */
  decayFactor?: number;

  /** Minimum data points for high confidence */
  highConfidenceThreshold?: number;

  /** Standard deviation threshold for high confidence */
  highConfidenceStdDevMax?: number;

  /** Standard deviation threshold for medium confidence */
  mediumConfidenceStdDevMax?: number;

  /** Whether to cap conversion rate at 1.0 */
  capRateAtOne?: boolean;
}

const DEFAULT_OPTIONS: Required<ConversionRateCalculatorOptions> = {
  decayFactor: 0.7,
  highConfidenceThreshold: 3,
  highConfidenceStdDevMax: 0.15,
  mediumConfidenceStdDevMax: 0.25,
  capRateAtOne: false,
};

/**
 * Default implementation of ConversionRateCalculator.
 *
 * Calculates a weighted average conversion rate from historical data,
 * with more recent terms weighted more heavily using exponential decay.
 */
export class DefaultConversionRateCalculator
  implements ConversionRateCalculator
{
  private readonly options: Required<ConversionRateCalculatorOptions>;

  constructor(options: ConversionRateCalculatorOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  calculate(
    historicalData: readonly HistoricalConversionData[],
  ): ConversionRateResult {
    // Filter out invalid data points (potential = 0)
    const validData = historicalData.filter(d => d.potentialStudents > 0);

    if (validData.length === 0) {
      return this.createInsufficientDataResult();
    }

    // Sort by term descending (most recent first)
    const sorted = [...validData].sort(
      (a, b) => b.academicTerm - a.academicTerm,
    );

    // Calculate individual rates
    const rates = sorted.map(d => {
      const rate = d.actualEnrollment / d.potentialStudents;
      return this.options.capRateAtOne ? Math.min(rate, 1.0) : rate;
    });

    // Compute weighted average using exponential decay
    const weights = rates.map((_, i) =>
      Math.pow(this.options.decayFactor, i),
    );
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    const weightedRate =
      rates.reduce((sum, rate, i) => sum + rate * weights[i], 0) / totalWeight;

    // Calculate statistics
    const mean = rates.reduce((sum, r) => sum + r, 0) / rates.length;
    const variance =
      rates.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / rates.length;
    const stdDev = Math.sqrt(variance);

    return {
      rate: this.round(weightedRate, 3),
      confidence: this.assessConfidence(validData.length, stdDev),
      dataPointsUsed: validData.length,
      standardDeviation: this.round(stdDev, 3),
      minRate: this.round(Math.min(...rates), 3),
      maxRate: this.round(Math.max(...rates), 3),
    };
  }

  private assessConfidence(
    dataPoints: number,
    stdDev: number,
  ): ConversionRateConfidence {
    if (
      dataPoints >= this.options.highConfidenceThreshold &&
      stdDev < this.options.highConfidenceStdDevMax
    ) {
      return 'high';
    }
    if (dataPoints >= 2 && stdDev < this.options.mediumConfidenceStdDevMax) {
      return 'medium';
    }
    if (dataPoints >= 1) {
      return 'low';
    }
    return 'insufficient';
  }

  private createInsufficientDataResult(): ConversionRateResult {
    return {
      rate: 1.0,
      confidence: 'insufficient',
      dataPointsUsed: 0,
      standardDeviation: 0,
      minRate: 0,
      maxRate: 0,
    };
  }

  private round(value: number, decimals: number): number {
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
  }
}
