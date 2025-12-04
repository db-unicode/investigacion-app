<script lang="ts">
  import type {
    ForecastMethodDto,
    ForecastAccuracyResultDto,
    ComparisonItemDto,
  } from '@app/contracts';
  import { goto } from '$app/navigation';
  import { cn } from '$lib/utils/cn';
  import {
    formatTerm,
    formatPercent,
    formatWithSign,
    getAccuracyBadgeClass,
    getErrorDirectionClass,
  } from '$lib/utils/formatters';
  import { fetchForecastAccuracy } from '../api/forecast-accuracy.api';
  import { fetchCourseHistory } from '$lib/features/course-history/api/course-history.api';
  import AccuracySummary from './AccuracySummary.svelte';

  interface Props {
    /** Course code to show accuracy for */
    courseCode: string;
    /** Selected forecast method */
    method: ForecastMethodDto | null;
    /** Optional CSS class */
    class?: string;
  }

  let { courseCode, method, class: className }: Props = $props();

  // State
  let isLoading = $state(false);
  let error = $state<string | null>(null);
  let data = $state<ForecastAccuracyResultDto | null>(null);

  // Sorting state
  type SortColumn = 'term' | 'forecast' | 'actual' | 'accuracy' | 'error';
  type SortDirection = 'asc' | 'desc';
  let sortColumn = $state<SortColumn>('term');
  let sortDirection = $state<SortDirection>('desc');

  // Sorted comparisons
  const sortedComparisons = $derived.by(() => {
    if (!data?.comparisons) return [];

    return [...data.comparisons].sort((a, b) => {
      const multiplier = sortDirection === 'asc' ? 1 : -1;

      switch (sortColumn) {
        case 'term':
          return (a.academicTerm - b.academicTerm) * multiplier;
        case 'forecast':
          return (
            (a.forecast.predictedEnrollment - b.forecast.predictedEnrollment) *
            multiplier
          );
        case 'actual':
          return (
            (a.actual.realEnrollment - b.actual.realEnrollment) * multiplier
          );
        case 'accuracy':
          return (
            (a.metrics.accuracyPercentage - b.metrics.accuracyPercentage) *
            multiplier
          );
        case 'error':
          return (a.metrics.absoluteError - b.metrics.absoluteError) * multiplier;
        default:
          return 0;
      }
    });
  });

  // Toggle sort on column click
  function handleSort(column: SortColumn) {
    if (sortColumn === column) {
      sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      sortColumn = column;
      sortDirection = 'desc';
    }
  }

  // Get sort indicator
  function getSortIndicator(column: SortColumn): string {
    if (sortColumn !== column) return '';
    return sortDirection === 'asc' ? ' ↑' : ' ↓';
  }

  // Fetch accuracy data when method changes
  $effect(() => {
    if (!method || !courseCode) {
      data = null;
      return;
    }

    const methodId = method.id;

    // Async fetch
    (async () => {
      isLoading = true;
      error = null;

      try {
        // First, get available terms from course history
        const history = await fetchCourseHistory(courseCode);
        const terms = Object.keys(history)
          .map(t => parseInt(t, 10))
          .filter(t => !isNaN(t))
          .sort((a, b) => b - a); // Descending

        if (terms.length === 0) {
          error = 'No historical data available for this course';
          data = null;
          return;
        }

        // Limit to last 10 terms for performance
        const termsToFetch = terms.slice(0, 10);

        // Fetch accuracy data
        const result = await fetchForecastAccuracy({
          courseCode,
          methodId,
          terms: termsToFetch,
        });

        data = result;
      } catch (e) {
        error = e instanceof Error ? e.message : 'Failed to load accuracy data';
        data = null;
      } finally {
        isLoading = false;
      }
    })();
  });

  // Error direction icon
  function getErrorIcon(direction: 'over' | 'under' | 'exact'): string {
    switch (direction) {
      case 'over':
        return '↑';
      case 'under':
        return '↓';
      case 'exact':
        return '=';
    }
  }

  // Navigate to section summary page
  function handleTermClick(term: number): void {
    goto(`/courses/${courseCode}/sections/${term}`);
  }
</script>

<section class={cn('space-y-6', className)}>
  <header>
    <h2 class="text-xl font-semibold text-slate-100">Forecast Accuracy</h2>
    {#if method}
      <p class="text-sm text-slate-400">
        Method: <span class="text-slate-200">{method.label}</span>
      </p>
    {/if}
  </header>

  {#if !method}
    <!-- Empty state: no method selected -->
    <div
      class="flex flex-col items-center justify-center rounded-lg border border-slate-700 bg-slate-800/30 p-12 text-center"
    >
      <svg
        class="h-12 w-12 text-slate-600"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="1.5"
          d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
      <p class="mt-4 text-sm text-slate-400">
        Select a forecast method from the sidebar to view accuracy data
      </p>
    </div>
  {:else if isLoading}
    <!-- Loading state -->
    <div class="space-y-3" aria-busy="true" aria-label="Loading accuracy data">
      <div class="h-10 w-full animate-pulse rounded bg-slate-800"></div>
      {#each [1, 2, 3, 4, 5] as _}
        <div class="h-12 w-full animate-pulse rounded bg-slate-800/60"></div>
      {/each}
    </div>
  {:else if error}
    <!-- Error state -->
    <div
      class="flex flex-col items-center justify-center rounded-lg border border-red-500/30 bg-red-500/10 p-8 text-center"
    >
      <svg
        class="h-10 w-10 text-red-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
      <h3 class="mt-4 text-lg font-medium text-red-300">
        Failed to load accuracy data
      </h3>
      <p class="mt-2 text-sm text-red-400/80">{error}</p>
      <button
        class="mt-4 rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700 transition-colors"
        onclick={() => {
          // Trigger refetch by toggling method
          const currentMethod = method;
          method = null;
          setTimeout(() => {
            method = currentMethod;
          }, 0);
        }}
      >
        Try Again
      </button>
    </div>
  {:else if data && data.comparisons.length === 0}
    <!-- No data state -->
    <div
      class="flex flex-col items-center justify-center rounded-lg border border-slate-700 bg-slate-800/30 p-8 text-center"
    >
      <svg
        class="h-10 w-10 text-slate-500"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
        />
      </svg>
      <h3 class="mt-4 text-lg font-medium text-slate-300">
        No accuracy data available
      </h3>
      <p class="mt-2 text-sm text-slate-500">
        There is no historical enrollment data to compare forecasts with.
      </p>
    </div>
  {:else if data}
    <!-- Data table -->
    <div
      class="overflow-x-auto rounded-lg border border-slate-800 bg-slate-900/60"
    >
      <table
        class="min-w-full text-sm"
        role="grid"
        aria-label="Forecast accuracy by term"
      >
        <thead class="border-b border-slate-800 bg-slate-900 text-slate-300">
          <tr>
            <th
              scope="col"
              class="px-4 py-3 text-left font-medium"
              aria-sort={sortColumn === 'term'
                ? sortDirection === 'asc'
                  ? 'ascending'
                  : 'descending'
                : 'none'}
            >
              <button
                class="inline-flex items-center gap-1 hover:text-slate-100 transition-colors"
                onclick={() => handleSort('term')}
              >
                Term{getSortIndicator('term')}
              </button>
            </th>
            <th
              scope="col"
              class="px-4 py-3 text-right font-medium"
              aria-sort={sortColumn === 'forecast'
                ? sortDirection === 'asc'
                  ? 'ascending'
                  : 'descending'
                : 'none'}
            >
              <button
                class="inline-flex items-center gap-1 hover:text-slate-100 transition-colors"
                onclick={() => handleSort('forecast')}
              >
                Forecast{getSortIndicator('forecast')}
              </button>
            </th>
            <th
              scope="col"
              class="px-4 py-3 text-right font-medium"
              aria-sort={sortColumn === 'actual'
                ? sortDirection === 'asc'
                  ? 'ascending'
                  : 'descending'
                : 'none'}
            >
              <button
                class="inline-flex items-center gap-1 hover:text-slate-100 transition-colors"
                onclick={() => handleSort('actual')}
              >
                Actual{getSortIndicator('actual')}
              </button>
            </th>
            <th
              scope="col"
              class="px-4 py-3 text-right font-medium"
              aria-sort={sortColumn === 'error'
                ? sortDirection === 'asc'
                  ? 'ascending'
                  : 'descending'
                : 'none'}
            >
              <button
                class="inline-flex items-center gap-1 hover:text-slate-100 transition-colors"
                onclick={() => handleSort('error')}
              >
                Error{getSortIndicator('error')}
              </button>
            </th>
            <th
              scope="col"
              class="px-4 py-3 text-right font-medium"
              aria-sort={sortColumn === 'accuracy'
                ? sortDirection === 'asc'
                  ? 'ascending'
                  : 'descending'
                : 'none'}
            >
              <button
                class="inline-flex items-center gap-1 hover:text-slate-100 transition-colors"
                onclick={() => handleSort('accuracy')}
              >
                Accuracy{getSortIndicator('accuracy')}
              </button>
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-800">
          {#each sortedComparisons as row (row.academicTerm)}
            <tr
              class="cursor-pointer hover:bg-slate-800/60 transition-colors"
              onclick={() => handleTermClick(row.academicTerm)}
              onkeydown={(e) => e.key === 'Enter' && handleTermClick(row.academicTerm)}
              tabindex="0"
              role="button"
              aria-label="View section details for term {formatTerm(row.academicTerm)}"
            >
              <td class="px-4 py-3 font-mono text-slate-100">
                {formatTerm(row.academicTerm)}
              </td>
              <td class="px-4 py-3 text-right text-blue-300">
                {row.forecast.predictedEnrollment}
              </td>
              <td class="px-4 py-3 text-right text-slate-200">
                {row.actual.realEnrollment}
              </td>
              <td
                class="px-4 py-3 text-right font-mono"
                aria-label="{row.metrics.studentsOff} students {row.metrics.errorDirection} predicted"
              >
                <span
                  class={cn('inline-flex items-center gap-1', getErrorDirectionClass(row.metrics.errorDirection))}
                >
                  {formatWithSign(row.metrics.absoluteError)}
                  <span class="text-xs opacity-70">
                    {getErrorIcon(row.metrics.errorDirection)}
                  </span>
                </span>
              </td>
              <td
                class="px-4 py-3 text-right"
                aria-label="{row.metrics.accuracyPercentage.toFixed(1)} percent accuracy"
              >
                <span
                  class={cn(
                    'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
                    getAccuracyBadgeClass(row.metrics.accuracyPercentage),
                  )}
                >
                  {formatPercent(row.metrics.accuracyPercentage)}
                </span>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <!-- Notice for terms without data -->
    {#if data.metadata.termsWithoutData && data.metadata.termsWithoutData.length > 0}
      <div
        class="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-300"
      >
        <svg
          class="h-4 w-4 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <p>
          No enrollment data for:{' '}
          {data.metadata.termsWithoutData.map(t => formatTerm(t)).join(', ')}
        </p>
      </div>
    {/if}

    <!-- Summary metrics -->
    <AccuracySummary summary={data.summary} termCount={data.comparisons.length} />
  {/if}
</section>
