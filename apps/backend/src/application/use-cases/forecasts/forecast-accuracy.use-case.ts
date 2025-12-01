import type { ForecastAccuracyResultDto } from '@app/contracts';
import type { CourseDemandForecaster } from '../../../domain/forecasts/course-demand-forecaster';
import { MultiTermForecasterDecorator } from '../../../domain/forecasts/multi-term-forecaster.decorator';
import type { BacktestingService } from '../../../domain/backtesting/backtesting-service';

export interface ForecastAccuracyUseCaseInput {
  courseCode: string;
  methodId: string;
  terms: number[];
}

export interface ForecastAccuracyUseCaseDeps {
  forecaster: CourseDemandForecaster;
  backtestingService: BacktestingService;
}

/**
 * Use case for calculating forecast accuracy against actual enrollments.
 *
 * This use case orchestrates:
 * 1. Generating forecasts for the requested terms using MultiTermForecasterDecorator
 * 2. Comparing forecasts with actual enrollment data using BacktestingService
 * 3. Building the accuracy result DTO
 */
export class ForecastAccuracyUseCase {
  private readonly multiTermForecaster: MultiTermForecasterDecorator;
  private readonly backtestingService: BacktestingService;

  constructor(deps: ForecastAccuracyUseCaseDeps) {
    this.multiTermForecaster = new MultiTermForecasterDecorator(
      deps.forecaster,
      { maxTerms: 10, allowPartialFailure: true },
    );
    this.backtestingService = deps.backtestingService;
  }

  async execute(
    input: ForecastAccuracyUseCaseInput,
  ): Promise<ForecastAccuracyResultDto> {
    // Generate forecasts for all terms
    const { results: forecasts, errors: forecastErrors } =
      await this.multiTermForecaster.forecastMultiple(
        { courseCode: input.courseCode },
        input.terms,
      );

    if (forecasts.length === 0) {
      throw new Error(
        `All forecasts failed. Errors: ${forecastErrors.map(e => e.error.message).join(', ')}`,
      );
    }

    // Compare forecasts with actual enrollments
    const backtestingResult = await this.backtestingService.compareMultiple(
      input.courseCode,
      forecasts,
    );

    // Build response DTO
    const methodId = forecasts[0]?.methodId ?? input.methodId;
    const methodLabel = forecasts[0]?.methodLabel ?? 'Unknown method';

    return {
      courseCode: input.courseCode,
      method: {
        id: methodId,
        label: methodLabel,
      },
      comparisons: backtestingResult.comparisons.map(c => ({
        academicTerm: c.academicTerm,
        forecast: {
          predictedEnrollment: c.forecast.predictedEnrollment,
          generatedAt: c.forecast.generatedAt,
        },
        actual: {
          realEnrollment: c.actual.realEnrollment,
          dataSource: c.actual.dataSource,
        },
        metrics: {
          accuracyPercentage: c.metrics.accuracyPercentage,
          absoluteError: c.metrics.absoluteError,
          errorDirection: c.metrics.errorDirection,
          studentsOff: c.metrics.studentsOff,
          errorPercentage: c.metrics.errorPercentage,
        },
      })),
      summary: backtestingResult.summary,
      metadata: {
        requestedTerms: input.terms,
        processedAt: new Date().toISOString(),
        termsWithData: backtestingResult.comparisons.length,
        ...(backtestingResult.termsWithoutData.length > 0 && {
          termsWithoutData: backtestingResult.termsWithoutData,
        }),
      },
    };
  }
}
