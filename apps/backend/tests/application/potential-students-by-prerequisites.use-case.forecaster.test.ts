import { describe, expect, it } from 'vitest';
import type {
  CourseDemandForecaster,
  CourseDemandForecasterInput,
  CourseDemandForecasterResult,
} from '../../src/domain/forecasts/course-demand-forecaster';
import {
  PotentialStudentsByPrerequisitesUseCase,
} from '../../src/application/use-cases/forecasts/potential-students-by-prerequisites.use-case.forecaster';

describe('PotentialStudentsByPrerequisitesUseCase', () => {
  it('delegates to the forecaster and maps the result', async () => {
    const fakeForecaster: CourseDemandForecaster = {
      methodId: 'fake-method',
      methodLabel: 'Fake method',
      async forecast(
        input: CourseDemandForecasterInput,
      ): Promise<CourseDemandForecasterResult> {
        return {
          courseCode: input.courseCode,
          academicTerm: input.academicTerm,
          forecastedEnrollment: 42,
          methodId: 'fake-method',
          methodLabel: 'Fake method',
          details: { foo: 'bar' },
        };
      },
    };

    const useCase = new PotentialStudentsByPrerequisitesUseCase({
      forecaster: fakeForecaster,
    });

    const result = await useCase.execute({
      courseCode: 'ISIS-3204',
      academicTerm: 202410,
    });

    expect(result).toEqual({
      courseCode: 'ISIS-3204',
      academicTerm: 202410,
      forecastedEnrollment: 42,
      methodId: 'fake-method',
      methodLabel: 'Fake method',
      details: { foo: 'bar' },
    });
  });
});
