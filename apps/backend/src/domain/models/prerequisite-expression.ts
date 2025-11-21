export type CourseCode = string;

export type PrerequisiteClause =
  | {
      readonly kind: 'required-course';
      readonly courseCode: CourseCode;
    }
  | {
      readonly kind: 'any-of-group';
      readonly courseCodes: CourseCode[];
    };

/**
 * Represents a prerequisite expression for a target course.
 *
 * Semantics:
 * - All clauses in `clauses` are combined with logical AND.
 * - A `required-course` clause means the student must have passed that course.
 * - An `any-of-group` clause means the student must have passed at least one
 *   course from the given group.
 */
export interface PrerequisiteExpression {
  readonly targetCourseCode: CourseCode;
  readonly clauses: PrerequisiteClause[];
}
