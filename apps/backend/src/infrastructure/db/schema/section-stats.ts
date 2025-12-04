import { integer, sqliteTable, text, primaryKey } from 'drizzle-orm/sqlite-core';

export const sectionStats = sqliteTable(
  'section_stats',
  {
    courseCode: text('course_code').notNull(),
    academicTerm: text('academic_term').notNull(),
    section: integer('section').notNull(),
    enrolled: integer('enrolled').notNull(),
    passed: integer('passed').notNull(),
    failed: integer('failed').notNull(),
    withdrawn: integer('withdrawn').notNull(),
  },
  table => ({
    pk: primaryKey({
      columns: [table.courseCode, table.academicTerm, table.section],
    }),
  }),
);
