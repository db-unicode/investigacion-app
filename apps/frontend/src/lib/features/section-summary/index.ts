// Components
export { default as SectionSummaryHeader } from './components/SectionSummaryHeader.svelte';
export { default as SectionStatsTable } from './components/SectionStatsTable.svelte';
export { default as SectionStatsSummary } from './components/SectionStatsSummary.svelte';
export { default as SectionStatsTableSkeleton } from './components/SectionStatsTableSkeleton.svelte';

// API
export {
  fetchSectionStats,
  type FetchSectionStatsOptions,
} from './api/section-stats.api';

// Types
export type {
  SectionStatDto,
  TermSectionStatsDto,
  SectionStatsByTermDto,
  SectionTableRow,
  SectionSummaryData,
  SectionSortColumn,
  SortDirection,
} from './types/section-stats.types';
