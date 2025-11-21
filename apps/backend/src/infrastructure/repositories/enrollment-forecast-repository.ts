import { and, eq, inArray, lt } from 'drizzle-orm';
import { createDbContext } from '../db/client';
import { enrollments } from '../db/schema/enrollments';

export interface EnrollmentForecastRepository {
  /**
   * Returns, for each course code in courseCodes, the set of student ids
   * that have passed that course before the given academic term.
   *
   * A student is considered to have passed if course_outcome === 'P'.
   */
  findStudentsWhoPassedCoursesBeforeTerm(
    courseCodes: string[],
    academicTerm: number,
  ): Promise<Map<string, Set<number>>>;

  /**
   * Returns the set of student ids that have passed the given course
   * before the given academic term.
   */
  findStudentsWhoPassedCourseBeforeTerm(
    courseCode: string,
    academicTerm: number,
  ): Promise<Set<number>>;
}

const { dbClient } = createDbContext();

/**
 * Default implementation of EnrollmentForecastRepository using Drizzle over SQLite.
 */
export const enrollmentForecastRepository: EnrollmentForecastRepository = {
  async findStudentsWhoPassedCoursesBeforeTerm(
    courseCodes: string[],
    academicTerm: number,
  ): Promise<Map<string, Set<number>>> {
    const result = new Map<string, Set<number>>();

    if (courseCodes.length === 0) {
      return result;
    }

    const rows = await dbClient
      .select({
        courseCode: enrollments.courseCode,
        studentId: enrollments.studentId,
      })
      .from(enrollments)
      .where(
        and(
          inArray(enrollments.courseCode, courseCodes),
          lt(enrollments.academicTerm, academicTerm),
          eq(enrollments.courseOutcome, 'P'),
        ),
      );

    for (const row of rows) {
      const courseCode = row.courseCode;
      const studentId = row.studentId;

      if (courseCode == null || studentId == null) {
        continue;
      }

      let set = result.get(courseCode);
      if (!set) {
        set = new Set<number>();
        result.set(courseCode, set);
      }

      set.add(studentId);
    }

    // Ensure every requested course code has an entry (even if empty).
    for (const courseCode of courseCodes) {
      if (!result.has(courseCode)) {
        result.set(courseCode, new Set<number>());
      }
    }

    return result;
  },

  async findStudentsWhoPassedCourseBeforeTerm(
    courseCode: string,
    academicTerm: number,
  ): Promise<Set<number>> {
    const map = await this.findStudentsWhoPassedCoursesBeforeTerm(
      [courseCode],
      academicTerm,
    );

    return map.get(courseCode) ?? new Set<number>();
  },
};
