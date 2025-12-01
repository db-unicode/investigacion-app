import type { AccuracyMetrics } from './accuracy-metrics';

/**
 * Forecast data for comparison
 */
export interface ForecastData {
  readonly predictedEnrollment: number;
  readonly generatedAt?: string;
  readonly methodId: string;
  readonly methodLabel: string;
}

/**
 * Actual enrollment data
 */
export interface ActualData {
  readonly realEnrollment: number;
  readonly dataSource: 'enrollments' | 'external';
}

/**
 * Result of comparing a forecast with actual data
 */
export interface ComparisonResult {
  readonly academicTerm: number;
  readonly forecast: ForecastData;
  readonly actual: ActualData;
  readonly metrics: AccuracyMetrics;
}
