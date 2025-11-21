import type { InferSelectModel } from 'drizzle-orm';
import { eq } from 'drizzle-orm';
import type { DbClient } from '../db/client';
import { enrollments } from '../db/schema/enrollments';

export type EnrollmentRecord = InferSelectModel<typeof enrollments>;

export interface EnrollmentRepository {
  findByCourse(courseCode: string): Promise<EnrollmentRecord[]>;
}

/**
 * Creates an EnrollmentRepository backed by Drizzle and SQLite.
 */
export const createEnrollmentRepository = (
  dbClient: DbClient,
): EnrollmentRepository => {
  const findByCourse = async (
    courseCode: string,
  ): Promise<EnrollmentRecord[]> => {
    const rows = await dbClient
      .select()
      .from(enrollments)
      .where(eq(enrollments.courseCode, courseCode))
      .orderBy(enrollments.academicTerm);

    return rows;
  };

  return { findByCourse };
};
