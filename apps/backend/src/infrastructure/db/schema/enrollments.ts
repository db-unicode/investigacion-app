import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const enrollments = sqliteTable('enrollments', {
  studentId: integer('student_id').notNull(),
  academicTerm: integer('academic_term').notNull(),
  courseCode: text('course_code').notNull(),
  campusDescription: text('campus_description'),
  partialGrade: text('partial_grade'),
  finalGrade: text('final_grade'),
  courseStatusDescription: text('course_status_description'),
  courseOutcome: text('course_outcome', { length: 1 }).notNull(),
});
