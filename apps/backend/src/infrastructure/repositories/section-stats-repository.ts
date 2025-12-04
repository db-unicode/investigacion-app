import type { InferSelectModel } from 'drizzle-orm';
import { eq, asc, desc } from 'drizzle-orm';
import { createDbContext, type DbClient } from '../db/client';
import { sectionStats } from '../db/schema/section-stats';

export type SectionStatsRecord = InferSelectModel<typeof sectionStats>;

export interface SectionStatsRepository {
  findByCourseAndTerms(
    courseCode: string,
    terms: string[],
  ): Promise<SectionStatsRecord[]>;
}

/**
 * Creates a SectionStatsRepository backed by Drizzle and SQLite.
 */
export const createSectionStatsRepository = (
  dbClient: DbClient,
): SectionStatsRepository => {
  const findByCourseAndTerms = async (
    courseCode: string,
    terms: string[],
  ): Promise<SectionStatsRecord[]> => {
    if (terms.length === 0) {
      return [];
    }

    const rows = await dbClient
      .select()
      .from(sectionStats)
      .where(eq(sectionStats.courseCode, courseCode))
      .orderBy(asc(sectionStats.academicTerm), desc(sectionStats.section));

    // Filter by terms in-memory for SQLite compatibility
    const termsSet = new Set(terms);
    return rows.filter(row => termsSet.has(row.academicTerm));
  };

  return { findByCourseAndTerms };
};

/**
 * Singleton instance for use across the application.
 */
const { dbClient } = createDbContext();
export const sectionStatsRepository = createSectionStatsRepository(dbClient);
