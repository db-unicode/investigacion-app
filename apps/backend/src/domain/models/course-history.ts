export type CourseOutcome = 'P' | 'F' | 'W';

export interface CourseHistoryPoint {
  readonly academicTerm: number;
  readonly courseCode: string;
  readonly totalEnrollments: number;
  readonly passedCount: number;
  readonly failedCount: number;
  readonly withdrawnCount: number;
}
