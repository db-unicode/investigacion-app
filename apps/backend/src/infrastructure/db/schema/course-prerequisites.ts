import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const coursePrerequisites = sqliteTable('course_prerequisites', {
  courseCode: text('course_code')
    .primaryKey()
    .notNull(),
  prerequisitesJson: text('prerequisites_json')
    .notNull(),
});

// Optional helper type if needed later:
export type CoursePrerequisiteRecord = {
  readonly courseCode: string;
  readonly prerequisitesJson: string;
};
