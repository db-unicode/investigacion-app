import type {
  CourseDemandForecastInputDto,
  CourseDemandForecastResultDto,
} from '@app/contracts';
import type {
  CourseDemandForecaster,
  CourseDemandForecasterResult,
} from '../../../domain/forecasts/course-demand-forecaster';
import {
  MultiTermForecasterDecorator,
} from '../../../domain/forecasts/multi-term-forecaster.decorator';

export interface PotentialStudentsByPrerequisitesUseCaseDeps {
  readonly forecaster: CourseDemandForecaster;
}

/**
 * Result of executeMultiple operation
 */
export interface ExecuteMultipleResult {
  readonly results: CourseDemandForecastResultDto[];
  readonly errors: Array<{
    readonly term: number;
    readonly message: string;
  }>;
}

/**
 * Application-level use case that orchestrates the
 * PotentialStudentsByPrerequisites forecaster.
 *
 * It:
 * - accepts a DTO input validated at the boundary (controller),
 * - calls the domain forecaster,
 * - maps the domain result back to a DTO.
 */
export class PotentialStudentsByPrerequisitesUseCase {
  private readonly forecaster: CourseDemandForecaster;
  private readonly multiTermDecorator: MultiTermForecasterDecorator;

  constructor(deps: PotentialStudentsByPrerequisitesUseCaseDeps) {
    this.forecaster = deps.forecaster;
    this.multiTermDecorator = new MultiTermForecasterDecorator(
      this.forecaster,
      { maxTerms: 10, allowPartialFailure: true },
    );
  }

  /**
   * Execute forecast for a single academic term
   */
  public async execute(
    input: CourseDemandForecastInputDto,
  ): Promise<CourseDemandForecastResultDto> {
    const { courseCode, academicTerm } = input;

    const result = await this.forecaster.forecast({
      courseCode,
      academicTerm,
    });

    return {
      courseCode: result.courseCode,
      academicTerm: result.academicTerm,
      forecastedEnrollment: result.forecastedEnrollment,
      methodId: result.methodId,
      methodLabel: result.methodLabel,
      details: result.details,
    };
  }

  /**
   * Execute forecasts for multiple academic terms
   */
  public async executeMultiple(
    input: Omit<CourseDemandForecastInputDto, 'academicTerm'>,
    terms: readonly number[],
  ): Promise<ExecuteMultipleResult> {
    const { results, errors } = await this.multiTermDecorator.forecastMultiple(
      { courseCode: input.courseCode },
      terms,
    );

    return {
      results: results.map((r: CourseDemandForecasterResult) => ({
        courseCode: r.courseCode,
        academicTerm: r.academicTerm,
        forecastedEnrollment: r.forecastedEnrollment,
        methodId: r.methodId,
        methodLabel: r.methodLabel,
        details: r.details,
      })),
      errors: errors.map((e: { term: number; error: Error }) => ({
        term: e.term,
        message: e.error.message,
      })),
    };
  }
}
