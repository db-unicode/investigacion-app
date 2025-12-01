import type { AccuracyCalculator } from './accuracy-calculator';
import type { AccuracyMetrics, SummaryMetrics } from './accuracy-metrics';
import type { ComparisonResult } from './comparison-result';

/**
 * Default implementation of AccuracyCalculator
 *
 * Formulas used:
 * - Accuracy %: max(0, 100 - errorPercentage)
 * - Error %: |predicted - actual| / actual × 100
 * - Absolute Error: predicted - actual
 * - MAPE: mean(|predicted - actual| / actual) × 100
 * - RMSE: sqrt(mean((predicted - actual)²))
 */
export class DefaultAccuracyCalculator implements AccuracyCalculator {
  calculate(predicted: number, actual: number): AccuracyMetrics {
    // Handle edge case: actual is 0
    if (actual === 0) {
      return {
        accuracyPercentage: predicted === 0 ? 100 : 0,
        absoluteError: predicted,
        errorDirection: predicted === 0 ? 'exact' : 'over',
        studentsOff: predicted,
        errorPercentage: predicted === 0 ? 0 : 100,
      };
    }

    const absoluteError = predicted - actual;
    const studentsOff = Math.abs(absoluteError);
    const errorPercentage = (studentsOff / actual) * 100;
    const accuracyPercentage = Math.max(0, 100 - errorPercentage);

    let errorDirection: 'over' | 'under' | 'exact';
    if (absoluteError > 0) {
      errorDirection = 'over';
    } else if (absoluteError < 0) {
      errorDirection = 'under';
    } else {
      errorDirection = 'exact';
    }

    return {
      accuracyPercentage: this.round(accuracyPercentage),
      absoluteError,
      errorDirection,
      studentsOff,
      errorPercentage: this.round(errorPercentage),
    };
  }

  calculateBatch(comparisons: ComparisonResult[]): SummaryMetrics {
    if (comparisons.length === 0) {
      return this.emptySummary();
    }

    const totalPredicted = comparisons.reduce(
      (sum, c) => sum + c.forecast.predictedEnrollment,
      0,
    );
    const totalActual = comparisons.reduce(
      (sum, c) => sum + c.actual.realEnrollment,
      0,
    );

    const metrics = comparisons.map(c => c.metrics);

    const averageAccuracy =
      metrics.reduce((sum, m) => sum + m.accuracyPercentage, 0) /
      metrics.length;

    const mape =
      metrics.reduce((sum, m) => sum + m.errorPercentage, 0) / metrics.length;

    const squaredErrors = comparisons.map(c =>
      Math.pow(c.forecast.predictedEnrollment - c.actual.realEnrollment, 2),
    );
    const rmse = Math.sqrt(
      squaredErrors.reduce((sum, se) => sum + se, 0) / squaredErrors.length,
    );

    return {
      averageAccuracy: this.round(averageAccuracy),
      totalPredicted,
      totalActual,
      overallError: totalPredicted - totalActual,
      mape: this.round(mape),
      rmse: this.round(rmse),
      overPredictions: metrics.filter(m => m.errorDirection === 'over').length,
      underPredictions: metrics.filter(m => m.errorDirection === 'under')
        .length,
      exactPredictions: metrics.filter(m => m.errorDirection === 'exact')
        .length,
    };
  }

  private emptySummary(): SummaryMetrics {
    return {
      averageAccuracy: 0,
      totalPredicted: 0,
      totalActual: 0,
      overallError: 0,
      mape: 0,
      rmse: 0,
      overPredictions: 0,
      underPredictions: 0,
      exactPredictions: 0,
    };
  }

  private round(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
