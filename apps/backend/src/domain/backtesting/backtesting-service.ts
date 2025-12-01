import type { AccuracyCalculator } from './accuracy-calculator';
import type { ActualEnrollmentProvider } from './actual-enrollment-provider';
import type { ComparisonResult } from './comparison-result';
import type { SummaryMetrics } from './accuracy-metrics';
import type { CourseDemandForecasterResult } from '../forecasts/course-demand-forecaster';

export interface BacktestingServiceDeps {
  actualEnrollmentProvider: ActualEnrollmentProvider;
  accuracyCalculator: AccuracyCalculator;
}

export interface BacktestingResult {
  comparisons: ComparisonResult[];
  summary: SummaryMetrics;
  termsWithoutData: number[];
}

/**
 * Service for comparing forecast predictions with actual enrollments.
 *
 * This service orchestrates the comparison between forecasted values
 * and actual enrollment data, calculating accuracy metrics.
 */
export class BacktestingService {
  private readonly actualEnrollmentProvider: ActualEnrollmentProvider;
  private readonly accuracyCalculator: AccuracyCalculator;

  constructor(deps: BacktestingServiceDeps) {
    this.actualEnrollmentProvider = deps.actualEnrollmentProvider;
    this.accuracyCalculator = deps.accuracyCalculator;
  }

  /**
   * Compare a single forecast with actual enrollment
   * @param courseCode - The course code
   * @param forecast - The forecast result to compare
   * @returns Comparison result, or null if no actual data exists
   */
  async compare(
    courseCode: string,
    forecast: CourseDemandForecasterResult,
  ): Promise<ComparisonResult | null> {
    const actual = await this.actualEnrollmentProvider.getActualEnrollment(
      courseCode,
      forecast.academicTerm,
    );

    if (actual === null) {
      return null;
    }

    const metrics = this.accuracyCalculator.calculate(
      forecast.forecastedEnrollment,
      actual,
    );

    return {
      academicTerm: forecast.academicTerm,
      forecast: {
        predictedEnrollment: forecast.forecastedEnrollment,
        methodId: forecast.methodId,
        methodLabel: forecast.methodLabel,
      },
      actual: {
        realEnrollment: actual,
        dataSource: 'enrollments',
      },
      metrics,
    };
  }

  /**
   * Compare multiple forecasts with actual enrollments
   * @param courseCode - The course code
   * @param forecasts - Array of forecast results to compare
   * @returns Backtesting result with comparisons, summary, and missing terms
   */
  async compareMultiple(
    courseCode: string,
    forecasts: CourseDemandForecasterResult[],
  ): Promise<BacktestingResult> {
    const terms = forecasts.map(f => f.academicTerm);

    // Fetch all actual enrollments in one query
    const actuals = await this.actualEnrollmentProvider.getActualEnrollments(
      courseCode,
      terms,
    );

    const comparisons: ComparisonResult[] = [];
    const termsWithoutData: number[] = [];

    for (const forecast of forecasts) {
      const actual = actuals.get(forecast.academicTerm);

      if (actual === null || actual === undefined) {
        termsWithoutData.push(forecast.academicTerm);
        continue;
      }

      const metrics = this.accuracyCalculator.calculate(
        forecast.forecastedEnrollment,
        actual,
      );

      comparisons.push({
        academicTerm: forecast.academicTerm,
        forecast: {
          predictedEnrollment: forecast.forecastedEnrollment,
          methodId: forecast.methodId,
          methodLabel: forecast.methodLabel,
        },
        actual: {
          realEnrollment: actual,
          dataSource: 'enrollments',
        },
        metrics,
      });
    }

    const summary = this.accuracyCalculator.calculateBatch(comparisons);

    return {
      comparisons,
      summary,
      termsWithoutData,
    };
  }
}
