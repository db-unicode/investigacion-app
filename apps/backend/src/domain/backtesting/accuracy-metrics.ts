/**
 * Accuracy metrics for a single forecast comparison
 */
export interface AccuracyMetrics {
  /** Accuracy as percentage (0-100) */
  readonly accuracyPercentage: number;

  /** Absolute error: predicted - actual */
  readonly absoluteError: number;

  /** Direction of error */
  readonly errorDirection: 'over' | 'under' | 'exact';

  /** Absolute value of error */
  readonly studentsOff: number;

  /** Error as percentage of actual */
  readonly errorPercentage: number;
}

/**
 * Summary metrics across all comparisons
 */
export interface SummaryMetrics {
  /** Average accuracy across all comparisons */
  readonly averageAccuracy: number;

  /** Total predicted enrollment */
  readonly totalPredicted: number;

  /** Total actual enrollment */
  readonly totalActual: number;

  /** Overall error (sum of individual errors) */
  readonly overallError: number;

  /** Mean Absolute Percentage Error */
  readonly mape: number;

  /** Root Mean Square Error */
  readonly rmse: number;

  /** Number of over-predictions */
  readonly overPredictions: number;

  /** Number of under-predictions */
  readonly underPredictions: number;

  /** Number of exact predictions */
  readonly exactPredictions: number;
}
