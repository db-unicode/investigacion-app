export interface CourseDemandForecasterInput {
  readonly courseCode: string;
  readonly academicTerm: number;
}

export interface CourseDemandForecasterResult {
  readonly courseCode: string;
  readonly academicTerm: number;
  readonly forecastedEnrollment: number;
  readonly methodId: string;
  readonly methodLabel: string;
  readonly details: unknown;
}

/**
 * Generic contract for any course demand forecaster.
 */
export interface CourseDemandForecaster {
  readonly methodId: string;
  readonly methodLabel: string;

  forecast(
    input: CourseDemandForecasterInput,
  ): Promise<CourseDemandForecasterResult>;
}
