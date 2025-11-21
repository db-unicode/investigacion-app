import type {
  CourseDemandForecaster,
  CourseDemandForecasterInput,
  CourseDemandForecasterResult,
} from './course-demand-forecaster';
import type {
  CourseCode,
  PrerequisiteClause,
  PrerequisiteExpression,
} from '../models/prerequisite-expression';

export interface PrerequisitesProvider {
  findByCourseCode(
    courseCode: CourseCode,
  ): Promise<PrerequisiteExpression | null>;
}

export interface EnrollmentHistoryProvider {
  findStudentsWhoPassedCoursesBeforeTerm(
    courseCodes: string[],
    academicTerm: number,
  ): Promise<Map<string, Set<number>>>;

  findStudentsWhoPassedCourseBeforeTerm(
    courseCode: string,
    academicTerm: number,
  ): Promise<Set<number>>;
}

export interface PotentialStudentsByPrerequisitesDetails {
  readonly prerequisiteExpression: PrerequisiteExpression | null;
  readonly eligibleStudentCountBeforeTargetFilter: number;
  readonly alreadyPassedTargetCount: number;
  readonly potentialStudentCount: number;
  readonly perCoursePassedCounts: Record<string, number>;
  readonly reason?: string;
}

export interface PotentialStudentsByPrerequisitesResult
  extends CourseDemandForecasterResult {
  readonly details: PotentialStudentsByPrerequisitesDetails;
}

const METHOD_ID = 'potential-students-by-prerequisites';
const METHOD_LABEL =
  'Potential students by prerequisites (set-based)';

export interface PotentialStudentsByPrerequisitesForecasterDeps {
  readonly prerequisitesProvider: PrerequisitesProvider;
  readonly enrollmentHistoryProvider: EnrollmentHistoryProvider;
}

/**
 * Forecaster that estimates potential enrollment based on prerequisite
 * completion. It:
 * - loads the prerequisite expression for the target course,
 * - computes students that satisfy all clauses before the target term,
 * - removes those that already passed the target course,
 * - returns the size of the remaining set.
 */
export class PotentialStudentsByPrerequisitesForecaster
  implements CourseDemandForecaster
{
  public readonly methodId: string = METHOD_ID;

  public readonly methodLabel: string = METHOD_LABEL;

  private readonly prerequisitesProvider: PrerequisitesProvider;

  private readonly enrollmentHistoryProvider: EnrollmentHistoryProvider;

  constructor(deps: PotentialStudentsByPrerequisitesForecasterDeps) {
    this.prerequisitesProvider = deps.prerequisitesProvider;
    this.enrollmentHistoryProvider = deps.enrollmentHistoryProvider;
  }

  public async forecast(
    input: CourseDemandForecasterInput,
  ): Promise<PotentialStudentsByPrerequisitesResult> {
    const { courseCode, academicTerm } = input;

    const expression =
      await this.prerequisitesProvider.findByCourseCode(courseCode);

    if (expression === null) {
      const emptyDetails: PotentialStudentsByPrerequisitesDetails = {
        prerequisiteExpression: null,
        eligibleStudentCountBeforeTargetFilter: 0,
        alreadyPassedTargetCount: 0,
        potentialStudentCount: 0,
        perCoursePassedCounts: {},
        reason: 'NO_PREREQUISITES_DEFINED',
      };

      return {
        courseCode,
        academicTerm,
        forecastedEnrollment: 0,
        methodId: this.methodId,
        methodLabel: this.methodLabel,
        details: emptyDetails,
      };
    }

    const allCourseCodes = collectAllPrerequisiteCourseCodes(
      expression,
    );

    const passedPerCourse =
      await this.enrollmentHistoryProvider.findStudentsWhoPassedCoursesBeforeTerm(
        Array.from(allCourseCodes),
        academicTerm,
      );

    const perCoursePassedCounts: Record<string, number> = {};
    for (const [code, set] of passedPerCourse.entries()) {
      perCoursePassedCounts[code] = set.size;
    }

    const eligibleBeforeTargetFilter = computeEligibleStudents(
      expression,
      passedPerCourse,
    );

    const eligibleStudentCountBeforeTargetFilter =
      eligibleBeforeTargetFilter.size;

    const alreadyPassedTarget =
      await this.enrollmentHistoryProvider.findStudentsWhoPassedCourseBeforeTerm(
        courseCode,
        academicTerm,
      );

    const potentialStudents = subtractSets(
      eligibleBeforeTargetFilter,
      alreadyPassedTarget,
    );

    const potentialStudentCount = potentialStudents.size;
    const alreadyPassedTargetCount = alreadyPassedTarget.size;

    const details: PotentialStudentsByPrerequisitesDetails = {
      prerequisiteExpression: expression,
      eligibleStudentCountBeforeTargetFilter,
      alreadyPassedTargetCount,
      potentialStudentCount,
      perCoursePassedCounts,
    };

    return {
      courseCode,
      academicTerm,
      forecastedEnrollment: potentialStudentCount,
      methodId: this.methodId,
      methodLabel: this.methodLabel,
      details,
    };
  }
}

const collectAllPrerequisiteCourseCodes = (
  expression: PrerequisiteExpression,
): Set<string> => {
  const result = new Set<string>();

  for (const clause of expression.clauses) {
    if (clause.kind === 'required-course') {
      result.add(clause.courseCode);
    } else if (clause.kind === 'any-of-group') {
      for (const code of clause.courseCodes) {
        result.add(code);
      }
    }
  }

  return result;
};

const computeEligibleStudents = (
  expression: PrerequisiteExpression,
  passedPerCourse: Map<string, Set<number>>,
): Set<number> => {
  let eligible: Set<number> | null = null;

  for (const clause of expression.clauses) {
    const clauseEligible = computeClauseEligible(clause, passedPerCourse);

    if (eligible === null) {
      // First clause sets the initial eligible set.
      eligible = new Set<number>(clauseEligible);
    } else {
      eligible = intersectSets(eligible, clauseEligible);
    }

    if (eligible.size === 0) {
      break;
    }
  }

  return eligible ?? new Set<number>();
};

const computeClauseEligible = (
  clause: PrerequisiteClause,
  passedPerCourse: Map<string, Set<number>>,
): Set<number> => {
  if (clause.kind === 'required-course') {
    return new Set<number>(
      passedPerCourse.get(clause.courseCode) ?? [],
    );
  }

  const unionSet = new Set<number>();

  for (const courseCode of clause.courseCodes) {
    const students = passedPerCourse.get(courseCode);
    if (students == null) {
      continue;
    }

    for (const id of students) {
      unionSet.add(id);
    }
  }

  return unionSet;
};

const intersectSets = (
  left: Set<number>,
  right: Set<number>,
): Set<number> => {
  const result = new Set<number>();

  const smaller = left.size <= right.size ? left : right;
  const larger = left.size <= right.size ? right : left;

  for (const value of smaller) {
    if (larger.has(value)) {
      result.add(value);
    }
  }

  return result;
};

const subtractSets = (
  base: Set<number>,
  toRemove: Set<number>,
): Set<number> => {
  const result = new Set<number>();

  for (const value of base) {
    if (!toRemove.has(value)) {
      result.add(value);
    }
  }

  return result;
};
