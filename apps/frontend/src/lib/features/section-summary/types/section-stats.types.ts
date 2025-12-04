import type {
  SectionStatDto,
  TermSectionStatsDto,
  SectionStatsByTermDto,
} from '@app/contracts';

// Re-export contract types
export type { SectionStatDto, TermSectionStatsDto, SectionStatsByTermDto };

/**
 * Extended section row with computed pass rate for table display
 */
export interface SectionTableRow extends SectionStatDto {
  passRate: number;
}

/**
 * Summary data computed from section stats
 */
export interface SectionSummaryData {
  totalSections: number;
  totalEnrolled: number;
  totalPassed: number;
  totalFailed: number;
  totalWithdrawn: number;
  overallPassRate: number;
}

/**
 * Sort column options for the section stats table
 */
export type SectionSortColumn =
  | 'section'
  | 'enrolled'
  | 'passed'
  | 'failed'
  | 'withdrawn'
  | 'passRate';

/**
 * Sort direction
 */
export type SortDirection = 'asc' | 'desc';
