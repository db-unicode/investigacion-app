import type {
  CourseHistoryByTermDto,
  CourseHistoryTermStatsDto,
} from '../dtos/course-history-dto';
import type {
  CourseHistoryPoint,
  CourseOutcome,
} from '../../domain/models/course-history';
import type {
  EnrollmentForHistory,
} from '../../domain/services/course-history-service';
import type {
  EnrollmentRecord,
} from '../../infrastructure/repositories/enrollment-repository';

/**
 * Maps an EnrollmentRecord from infrastructure to EnrollmentForHistory for domain logic.
 */
export const mapEnrollmentRecordToEnrollmentForHistory = (
  record: EnrollmentRecord,
): EnrollmentForHistory => {
  return {
    academicTerm: record.academicTerm ?? 0,
    courseCode: record.courseCode ?? '',
    courseOutcome: record.courseOutcome as CourseOutcome,
  };
};

/**
 * Maps an array of CourseHistoryPoint objects to a CourseHistoryByTermDto.
 */
export const mapHistoryPointsToByTermDto = (
  points: CourseHistoryPoint[],
): CourseHistoryByTermDto => {
  const result: CourseHistoryByTermDto = {};

  for (const point of points) {
    const key = String(point.academicTerm);
    const stats: CourseHistoryTermStatsDto = {
      enrolled: point.totalEnrollments,
      passed: point.passedCount,
      failed: point.failedCount,
      withdrawn: point.withdrawnCount,
    };

    result[key] = stats;
  }

  return result;
};
