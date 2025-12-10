/**
 * Confidence level for the conversion rate estimate
 */
export type ConversionRateConfidence =
  | 'high'
  | 'medium'
  | 'low'
  | 'insufficient';

/**
 * Historical data point for conversion calculation.
 * Represents the relationship between potential students
 * and actual enrollment for a specific term.
 */
export interface HistoricalConversionData {
  readonly academicTerm: number;
  readonly potentialStudents: number;
  readonly actualEnrollment: number;
  readonly conversionRate: number;
}

/**
 * Result of conversion rate calculation
 */
export interface ConversionRateResult {
  /** Calculated conversion rate (0.0 - 1.0+) */
  readonly rate: number;

  /** Confidence level based on data quality */
  readonly confidence: ConversionRateConfidence;

  /** Number of historical terms used */
  readonly dataPointsUsed: number;

  /** Standard deviation of historical rates */
  readonly standardDeviation: number;

  /** Minimum rate observed */
  readonly minRate: number;

  /** Maximum rate observed */
  readonly maxRate: number;
}
