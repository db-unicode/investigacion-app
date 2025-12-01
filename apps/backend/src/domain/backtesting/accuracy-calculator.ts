import type { AccuracyMetrics, SummaryMetrics } from './accuracy-metrics';
import type { ComparisonResult } from './comparison-result';

/**
 * Interface for calculating forecast accuracy metrics
 */
export interface AccuracyCalculator {
  /**
   * Calculate accuracy metrics for a single comparison
   * @param predicted - The predicted enrollment count
   * @param actual - The actual enrollment count
   * @returns Accuracy metrics for this comparison
   */
  calculate(predicted: number, actual: number): AccuracyMetrics;

  /**
   * Calculate summary metrics across multiple comparisons
   * @param comparisons - Array of comparison results
   * @returns Summary metrics across all comparisons
   */
  calculateBatch(comparisons: ComparisonResult[]): SummaryMetrics;
}
