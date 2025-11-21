import { eq } from 'drizzle-orm';
import {
  coursePrerequisites,
  type CoursePrerequisiteRecord,
} from '../db/schema/course-prerequisites';
import { createDbContext } from '../db/client';
import type {
  PrerequisiteExpression,
} from '../../domain/models/prerequisite-expression';
import {
  createPrerequisiteParser,
} from '../../domain/services/prerequisite-parser';

export interface PrerequisitesRepository {
  findByCourseCode(
    courseCode: string,
  ): Promise<PrerequisiteExpression | null>;
}

const { dbClient } = createDbContext();
const prerequisiteParser = createPrerequisiteParser();

/**
 * Default implementation of PrerequisitesRepository backed by SQLite via Drizzle.
 */
export const prerequisitesRepository: PrerequisitesRepository = {
  async findByCourseCode(
    courseCode: string,
  ): Promise<PrerequisiteExpression | null> {
    const rows = await dbClient
      .select()
      .from(coursePrerequisites)
      .where(eq(coursePrerequisites.courseCode, courseCode))
      .limit(1);

    if (rows.length === 0) {
      return null;
    }

    const record: CoursePrerequisiteRecord = {
      courseCode: rows[0]?.courseCode,
      prerequisitesJson: rows[0]?.prerequisitesJson,
    };

    const expression = prerequisiteParser.parse(
      record.courseCode,
      record.prerequisitesJson,
    );

    return expression;
  },
};
