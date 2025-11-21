import { describe, expect, it } from 'vitest';
import type {
  PrerequisiteExpression,
} from '../../src/domain/models/prerequisite-expression';
import {
  PotentialStudentsByPrerequisitesForecaster,
} from '../../src/domain/forecasts/potential-students-by-prerequisites-forecaster';
import type {
  EnrollmentHistoryProvider,
  PrerequisitesProvider,
} from '../../src/domain/forecasts/potential-students-by-prerequisites-forecaster';

const makeExpression = (): PrerequisiteExpression => ({
  targetCourseCode: 'ISIS-3204',
  clauses: [
    {
      kind: 'required-course',
      courseCode: 'ISIS-1304',
    },
    {
      kind: 'required-course',
      courseCode: 'ISIS-1225',
    },
    {
      kind: 'any-of-group',
      courseCodes: ['FISI-1028', 'FISI-1528'],
    },
  ],
});

describe('PotentialStudentsByPrerequisitesForecaster', () => {
  const academicTerm = 202410;
  const targetCourseCode = 'ISIS-3204';

  it('returns 0 when no prerequisites are defined', async () => {
    const prerequisitesProvider: PrerequisitesProvider = {
      async findByCourseCode() {
        return null;
      },
    };

    const enrollmentHistoryProvider: EnrollmentHistoryProvider = {
      async findStudentsWhoPassedCoursesBeforeTerm() {
        return new Map<string, Set<number>>();
      },
      async findStudentsWhoPassedCourseBeforeTerm() {
        return new Set<number>();
      },
    };

    const forecaster = new PotentialStudentsByPrerequisitesForecaster(
      {
        prerequisitesProvider,
        enrollmentHistoryProvider,
      },
    );

    const result = await forecaster.forecast({
      courseCode: targetCourseCode,
      academicTerm,
    });

    expect(result.forecastedEnrollment).toBe(0);
    expect(result.details).toMatchObject({
      reason: 'NO_PREREQUISITES_DEFINED',
    });
  });

  it('computes potential students based on AND + any-of-group logic', async () => {
    const expression = makeExpression();

    const prerequisitesProvider: PrerequisitesProvider = {
      async findByCourseCode() {
        return expression;
      },
    };

    const enrollmentHistoryProvider: EnrollmentHistoryProvider = {
      async findStudentsWhoPassedCoursesBeforeTerm() {
        const map = new Map<string, Set<number>>();

        // Students who passed ISIS-1304: 1, 2, 3
        map.set('ISIS-1304', new Set([1, 2, 3]));

        // Students who passed ISIS-1225: 2, 3, 4
        map.set('ISIS-1225', new Set([2, 3, 4]));

        // Students who passed FISI-1028: 3, 5
        map.set('FISI-1028', new Set([3, 5]));

        // Students who passed FISI-1528: 2
        map.set('FISI-1528', new Set([2]));

        return map;
      },
      async findStudentsWhoPassedCourseBeforeTerm() {
        // Students who already passed ISIS-3204: only id 2
        return new Set([2]);
      },
    };

    const forecaster = new PotentialStudentsByPrerequisitesForecaster(
      {
        prerequisitesProvider,
        enrollmentHistoryProvider,
      },
    );

    const result = await forecaster.forecast({
      courseCode: targetCourseCode,
      academicTerm,
    });

    // Explanation:
    // - Required ISIS-1304: {1,2,3}
    // - Required ISIS-1225: {2,3,4}
    //   -> intersection so far: {2,3}
    // - Any-of [FISI-1028 {3,5}, FISI-1528 {2}]
    //   -> union group: {2,3,5}
    //   -> final eligible before target filter: {2,3}
    //
    // Already passed target course ISIS-3204: {2}
    // -> potential students: {3}
    // -> forecastedEnrollment = 1

    expect(result.forecastedEnrollment).toBe(1);

    const details = result.details as any;

    expect(details.eligibleStudentCountBeforeTargetFilter).toBe(2);
    expect(details.alreadyPassedTargetCount).toBe(1);
    expect(details.potentialStudentCount).toBe(1);
  });

  it('returns 0 when intersection of clauses is empty', async () => {
    const expression = makeExpression();

    const prerequisitesProvider: PrerequisitesProvider = {
      async findByCourseCode() {
        return expression;
      },
    };

    const enrollmentHistoryProvider: EnrollmentHistoryProvider = {
      async findStudentsWhoPassedCoursesBeforeTerm() {
        const map = new Map<string, Set<number>>();

        // Non-overlapping sets
        map.set('ISIS-1304', new Set([1]));
        map.set('ISIS-1225', new Set([2]));
        map.set('FISI-1028', new Set([3]));
        map.set('FISI-1528', new Set([4]));

        return map;
      },
      async findStudentsWhoPassedCourseBeforeTerm() {
        return new Set<number>();
      },
    };

    const forecaster = new PotentialStudentsByPrerequisitesForecaster(
      {
        prerequisitesProvider,
        enrollmentHistoryProvider,
      },
    );

    const result = await forecaster.forecast({
      courseCode: targetCourseCode,
      academicTerm,
    });

    expect(result.forecastedEnrollment).toBe(0);

    const details = result.details as any;
    expect(details.eligibleStudentCountBeforeTargetFilter).toBe(0);
  });
});
