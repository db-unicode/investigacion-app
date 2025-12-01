import type { ActualEnrollmentProvider } from '../../domain/backtesting/actual-enrollment-provider';
import type { EnrollmentRepository } from '../repositories/enrollment-repository';
import type { CourseHistoryService } from '../../domain/services/course-history-service';

export interface CourseHistoryActualProviderDeps {
  enrollmentRepository: EnrollmentRepository;
  courseHistoryService: CourseHistoryService;
}

/**
 * Implementation of ActualEnrollmentProvider using existing
 * EnrollmentRepository and CourseHistoryService.
 *
 * This provider bridges the infrastructure layer (EnrollmentRepository)
 * with the domain layer (CourseHistoryService) to get actual enrollment
 * counts for backtesting comparisons.
 */
export class CourseHistoryActualProvider implements ActualEnrollmentProvider {
  private readonly enrollmentRepository: EnrollmentRepository;
  private readonly courseHistoryService: CourseHistoryService;

  constructor(deps: CourseHistoryActualProviderDeps) {
    this.enrollmentRepository = deps.enrollmentRepository;
    this.courseHistoryService = deps.courseHistoryService;
  }

  async getActualEnrollment(
    courseCode: string,
    term: number,
  ): Promise<number | null> {
    const enrollments =
      await this.enrollmentRepository.findByCourse(courseCode);

    if (enrollments.length === 0) {
      return null;
    }

    // Convert EnrollmentRecord[] to EnrollmentForHistory[]
    // The courseOutcome field is stored as string but typed as 'P' | 'F' | 'W'
    const historyPoints = this.courseHistoryService.aggregateByTerm(
      enrollments.map(e => ({
        academicTerm: e.academicTerm,
        courseCode: e.courseCode,
        courseOutcome: e.courseOutcome as 'P' | 'F' | 'W',
      })),
    );

    const termPoint = historyPoints.find(p => p.academicTerm === term);

    return termPoint?.totalEnrollments ?? null;
  }

  async getActualEnrollments(
    courseCode: string,
    terms: number[],
  ): Promise<Map<number, number | null>> {
    const enrollments =
      await this.enrollmentRepository.findByCourse(courseCode);

    const result = new Map<number, number | null>();

    if (enrollments.length === 0) {
      // Return null for all terms when no enrollment data exists
      for (const term of terms) {
        result.set(term, null);
      }
      return result;
    }

    // Convert EnrollmentRecord[] to EnrollmentForHistory[]
    const historyPoints = this.courseHistoryService.aggregateByTerm(
      enrollments.map(e => ({
        academicTerm: e.academicTerm,
        courseCode: e.courseCode,
        courseOutcome: e.courseOutcome as 'P' | 'F' | 'W',
      })),
    );

    // Build lookup map for O(1) access
    const pointsByTerm = new Map(
      historyPoints.map(p => [p.academicTerm, p.totalEnrollments]),
    );

    // Get enrollment for each requested term (null if no data)
    for (const term of terms) {
      const enrollment = pointsByTerm.get(term) ?? null;
      result.set(term, enrollment);
    }

    return result;
  }
}
