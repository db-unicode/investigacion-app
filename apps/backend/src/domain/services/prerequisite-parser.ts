import type {
  CourseCode,
  PrerequisiteClause,
  PrerequisiteExpression,
} from '../models/prerequisite-expression';

const COURSE_CODE_PATTERN = /^[A-Z]{4}-\d{4}$/;

/**
 * Error thrown when a prerequisite JSON payload is invalid.
 */
export class InvalidPrerequisiteExpressionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidPrerequisiteExpressionError';
  }
}

export interface PrerequisiteParser {
  parse(
    targetCourseCode: CourseCode,
    rawJson: string,
  ): PrerequisiteExpression;
}

/**
 * Creates a PrerequisiteParser that converts the JSON representation stored
 * in the database into a PrerequisiteExpression domain model.
 *
 * Expected JSON shape:
 * - Top level: array.
 * - Each element is either:
 *   - string course code: required-course
 *   - array of string course codes: any-of-group (at least one must be passed)
 *
 * Example:
 * ["ISIS-1304", "ISIS-1225", ["FISI-1028", "FISI-1528"]]
 */
export const createPrerequisiteParser = (): PrerequisiteParser => {
  const parse = (
    targetCourseCode: CourseCode,
    rawJson: string,
  ): PrerequisiteExpression => {
    let parsed: unknown;

    try {
      parsed = JSON.parse(rawJson);
    } catch {
      throw new InvalidPrerequisiteExpressionError(
        'Prerequisite JSON is not valid JSON.',
      );
    }

    if (!Array.isArray(parsed)) {
      throw new InvalidPrerequisiteExpressionError(
        'Prerequisite JSON must be a top-level array.',
      );
    }

    const clauses: PrerequisiteClause[] = [];

    for (const element of parsed) {
      if (typeof element === 'string') {
        const courseCode = element.trim();

        if (!isValidCourseCode(courseCode)) {
          throw new InvalidPrerequisiteExpressionError(
            `Invalid course code in prerequisite list: "${courseCode}".`,
          );
        }

        clauses.push({
          kind: 'required-course',
          courseCode,
        });

        continue;
      }

      if (Array.isArray(element)) {
        const courseCodes: CourseCode[] = [];

        for (const rawCourseCode of element) {
          if (typeof rawCourseCode !== 'string') {
            throw new InvalidPrerequisiteExpressionError(
              'Any-of-group clause must contain only string course codes.',
            );
          }

          const courseCode = rawCourseCode.trim();

          if (!isValidCourseCode(courseCode)) {
            throw new InvalidPrerequisiteExpressionError(
              `Invalid course code in any-of-group: "${courseCode}".`,
            );
          }

          courseCodes.push(courseCode);
        }

        if (courseCodes.length === 0) {
          throw new InvalidPrerequisiteExpressionError(
            'Any-of-group clause must contain at least one course code.',
          );
        }

        clauses.push({
          kind: 'any-of-group',
          courseCodes,
        });

        continue;
      }

      throw new InvalidPrerequisiteExpressionError(
        'Prerequisite array elements must be either string or array of strings.',
      );
    }

    return {
      targetCourseCode,
      clauses,
    };
  };

  return { parse };
};

const isValidCourseCode = (courseCode: string): boolean => {
  return COURSE_CODE_PATTERN.test(courseCode);
};
