import type { CourseHistoryByTermDto } from '../dtos/course-history-dto';
import type {
  EnrollmentRepository,
} from '../../infrastructure/repositories/enrollment-repository';
import type {
  CourseHistoryService,
} from '../../domain/services/course-history-service';
import {
  mapEnrollmentRecordToEnrollmentForHistory,
  mapHistoryPointsToByTermDto,
} from '../mappers/course-history-mapper';

export interface GetCourseHistoryInput {
  readonly courseCode: string;
}

export interface GetCourseHistoryUseCase {
  execute(input: GetCourseHistoryInput): Promise<CourseHistoryByTermDto>;
}

/**
 * Creates the GetCourseHistory use case.
 */
export const createGetCourseHistoryUseCase = (
  enrollmentRepository: EnrollmentRepository,
  courseHistoryService: CourseHistoryService,
): GetCourseHistoryUseCase => {
  const execute = async (
    input: GetCourseHistoryInput,
  ): Promise<CourseHistoryByTermDto> => {
    const enrollmentRecords =
      await enrollmentRepository.findByCourse(input.courseCode);

    const historyInputs = enrollmentRecords.map(
      mapEnrollmentRecordToEnrollmentForHistory,
    );

    const historyPoints =
      courseHistoryService.aggregateByTerm(historyInputs);

    return mapHistoryPointsToByTermDto(historyPoints);
  };

  return { execute };
};
