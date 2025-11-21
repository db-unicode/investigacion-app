import type {
  CourseDemandForecastInputDto,
  CourseDemandForecastResultDto,
} from '@app/contracts';
import type {
  CourseDemandForecaster,
} from '../../domain/forecasts/course-demand-forecaster';

export interface PotentialStudentsByPrerequisitesUseCaseDeps {
  readonly forecaster: CourseDemandForecaster;
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

  constructor(deps: PotentialStudentsByPrerequisitesUseCaseDeps) {
    this.forecaster = deps.forecaster;
  }

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
}
