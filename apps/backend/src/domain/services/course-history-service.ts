import type { CourseHistoryPoint, CourseOutcome } from '../models/course-history';

export interface EnrollmentForHistory {
  readonly academicTerm: number;
  readonly courseCode: string;
  readonly courseOutcome: CourseOutcome;
}

export interface CourseHistoryService {
  aggregateByTerm(enrollments: EnrollmentForHistory[]): CourseHistoryPoint[];
}

/**
 * Creates a CourseHistoryService with aggregation logic.
 */
export const createCourseHistoryService = (): CourseHistoryService => {
  const aggregateByTerm = (
    enrollments: EnrollmentForHistory[],
  ): CourseHistoryPoint[] => {
    const byTerm = new Map<number, CourseHistoryPoint>();

    for (const enrollment of enrollments) {
      const existing = byTerm.get(enrollment.academicTerm);

      if (existing === undefined) {
        const initialPoint: CourseHistoryPoint = {
          academicTerm: enrollment.academicTerm,
          courseCode: enrollment.courseCode,
          totalEnrollments: 0,
          passedCount: 0,
          failedCount: 0,
          withdrawnCount: 0,
        };

        byTerm.set(enrollment.academicTerm, initialPoint);
      }

      const current = byTerm.get(enrollment.academicTerm);
      if (current === undefined) {
        continue;
      }

      const nextTotals = getNextTotals(current, enrollment.courseOutcome);
      byTerm.set(enrollment.academicTerm, nextTotals);
    }

    return Array.from(byTerm.values()).sort(
      (left, right) => left.academicTerm - right.academicTerm,
    );
  };

  return { aggregateByTerm };
};

const getNextTotals = (
  point: CourseHistoryPoint,
  outcome: CourseOutcome,
): CourseHistoryPoint => {
  let passedCount = point.passedCount;
  let failedCount = point.failedCount;
  let withdrawnCount = point.withdrawnCount;

  if (outcome === 'P') {
    passedCount += 1;
  } else if (outcome === 'F') {
    failedCount += 1;
  } else if (outcome === 'W') {
    withdrawnCount += 1;
  }

  return {
    academicTerm: point.academicTerm,
    courseCode: point.courseCode,
    totalEnrollments: point.totalEnrollments + 1,
    passedCount,
    failedCount,
    withdrawnCount,
  };
};
