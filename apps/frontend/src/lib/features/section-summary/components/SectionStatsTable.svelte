<script lang="ts">
  import type {
    SectionTableRow,
    SectionSortColumn,
    SortDirection,
    SectionSummaryData,
    SectionStatsByTermDto,
  } from '../types/section-stats.types';
  import { fetchSectionStats } from '../api/section-stats.api';
  import { formatPercent } from '$lib/utils/formatters';
  import SectionStatsTableSkeleton from './SectionStatsTableSkeleton.svelte';
  import SectionStatsSummary from './SectionStatsSummary.svelte';

  interface Props {
    courseCode: string;
    term: number;
    class?: string;
  }

  let { courseCode, term, class: className = '' }: Props = $props();

  // State
  let isLoading = $state(true);
  let error = $state<string | null>(null);
  let data = $state<SectionStatsByTermDto | null>(null);

  // Sorting
  let sortColumn = $state<SectionSortColumn>('section');
  let sortDirection = $state<SortDirection>('desc');

  // Computed: transform sections to table rows with pass rate
  const tableRows = $derived.by((): SectionTableRow[] => {
    if (!data?.terms?.[0]?.sections) return [];

    return data.terms[0].sections.map(section => ({
      ...section,
      passRate: section.enrolled > 0
        ? (section.passed / section.enrolled) * 100
        : 0,
    }));
  });

  // Computed: sorted rows
  const sortedRows = $derived.by((): SectionTableRow[] => {
    if (tableRows.length === 0) return [];

    return [...tableRows].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];
      const modifier = sortDirection === 'asc' ? 1 : -1;
      return (aVal - bVal) * modifier;
    });
  });

  // Computed: summary data
  const summary = $derived.by((): SectionSummaryData | null => {
    if (!data?.terms?.[0]?.totals) return null;

    const totals = data.terms[0].totals;
    return {
      totalSections: totals.totalSections,
      totalEnrolled: totals.totalEnrolled,
      totalPassed: totals.totalPassed,
      totalFailed: totals.totalFailed,
      totalWithdrawn: totals.totalWithdrawn,
      overallPassRate: totals.totalEnrolled > 0
        ? (totals.totalPassed / totals.totalEnrolled) * 100
        : 0,
    };
  });

  // Toggle sort
  function toggleSort(column: SectionSortColumn): void {
    if (sortColumn === column) {
      sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      sortColumn = column;
      sortDirection = 'desc';
    }
  }

  // Get sort indicator
  function getSortIndicator(column: SectionSortColumn): string {
    if (sortColumn !== column) return '';
    return sortDirection === 'asc' ? ' ↑' : ' ↓';
  }

  // Fetch data on mount and when params change
  $effect(() => {
    if (!courseCode || !term) {
      data = null;
      return;
    }

    (async () => {
      isLoading = true;
      error = null;

      try {
        const result = await fetchSectionStats({ courseCode, term });
        data = result;
      } catch (e) {
        error = e instanceof Error ? e.message : 'Failed to load section statistics';
        data = null;
      } finally {
        isLoading = false;
      }
    })();
  });

  // Retry handler
  function handleRetry(): void {
    error = null;
    isLoading = true;
    fetchSectionStats({ courseCode, term })
      .then(result => {
        data = result;
      })
      .catch(e => {
        error = e instanceof Error ? e.message : 'Failed to load section statistics';
      })
      .finally(() => {
        isLoading = false;
      });
  }

  // Pass rate badge styling
  function getPassRateBadgeClass(rate: number): string {
    if (rate >= 80) return 'bg-emerald-500/20 text-emerald-400';
    if (rate >= 60) return 'bg-amber-500/20 text-amber-400';
    return 'bg-red-500/20 text-red-400';
  }
</script>

<div class={className}>
  <!-- Loading State -->
  {#if isLoading}
    <SectionStatsTableSkeleton rows={5} />

  <!-- Error State -->
  {:else if error}
    <div class="rounded-lg border border-red-800/50 bg-red-900/20 p-6 text-center">
      <svg
        class="mx-auto h-12 w-12 text-red-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
      <p class="mt-4 text-red-300">{error}</p>
      <button
        class="mt-4 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 transition-colors"
        onclick={handleRetry}
      >
        Try Again
      </button>
    </div>

  <!-- No Data State -->
  {:else if !data || data.terms.length === 0}
    <div class="rounded-lg border border-slate-800 bg-slate-900/50 p-8 text-center">
      <svg
        class="mx-auto h-12 w-12 text-slate-600"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
      <h3 class="mt-4 text-lg font-medium text-slate-300">No Section Data</h3>
      <p class="mt-2 text-slate-500">
        No section statistics are available for this course and term.
      </p>
      <a
        href="/"
        class="mt-4 inline-block text-blue-400 hover:text-blue-300 transition-colors"
      >
        Return to Dashboard
      </a>
    </div>

  <!-- Data State -->
  {:else}
    <!-- Summary Cards -->
    {#if summary}
      <SectionStatsSummary {summary} class="mb-6" />
    {/if}

    <!-- Data Table -->
    <div class="rounded-lg border border-slate-800 overflow-hidden">
      <table class="w-full" role="grid" aria-label="Section statistics">
        <thead class="bg-slate-800/50">
          <tr>
            {#each [
              { key: 'section', label: 'Section', align: 'left' },
              { key: 'enrolled', label: 'Enrolled', align: 'right' },
              { key: 'passed', label: 'Passed', align: 'right' },
              { key: 'failed', label: 'Failed', align: 'right' },
              { key: 'withdrawn', label: 'Withdrawn', align: 'right' },
              { key: 'passRate', label: 'Pass Rate', align: 'right' },
            ] as column}
              <th
                class="px-4 py-3 text-sm font-medium text-slate-400 cursor-pointer hover:text-slate-200 transition-colors select-none {column.align === 'right' ? 'text-right' : 'text-left'}"
                scope="col"
                aria-sort={sortColumn === column.key
                  ? sortDirection === 'asc' ? 'ascending' : 'descending'
                  : 'none'}
                tabindex="0"
                onclick={() => toggleSort(column.key as SectionSortColumn)}
                onkeydown={(e) => e.key === 'Enter' && toggleSort(column.key as SectionSortColumn)}
              >
                {column.label}{getSortIndicator(column.key as SectionSortColumn)}
              </th>
            {/each}
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-800">
          {#each sortedRows as row (row.section)}
            <tr class="hover:bg-slate-800/40 transition-colors">
              <td class="px-4 py-3 font-mono text-slate-200">
                {row.section}
              </td>
              <td class="px-4 py-3 text-right font-mono text-slate-300">
                {row.enrolled}
              </td>
              <td class="px-4 py-3 text-right font-mono text-emerald-400">
                {row.passed}
              </td>
              <td class="px-4 py-3 text-right font-mono text-red-400">
                {row.failed}
              </td>
              <td class="px-4 py-3 text-right font-mono text-amber-400">
                {row.withdrawn}
              </td>
              <td class="px-4 py-3 text-right">
                <span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium {getPassRateBadgeClass(row.passRate)}">
                  {formatPercent(row.passRate)}
                </span>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>
