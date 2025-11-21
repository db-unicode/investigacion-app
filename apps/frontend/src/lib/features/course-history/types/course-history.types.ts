export type CourseHistoryTermStats = {
  readonly enrolled: number;
  readonly passed: number;
  readonly failed: number;
  readonly withdrawn: number;
};

export type CourseHistoryByTerm = Record<string, CourseHistoryTermStats>;

export type CourseHistoryRow = {
  readonly academicTerm: string;
  readonly enrolled: number;
  readonly passed: number;
  readonly failed: number;
  readonly withdrawn: number;
};
