<script lang="ts">
  import type { CourseHistoryByTerm } from '$lib/features/course-history/types/course-history.types';
  import { goto } from '$app/navigation';
  import { cn } from '$lib/utils/cn';
  import { formatTerm, formatPercent } from '$lib/utils/formatters';

  interface Props {
    /** Course code being displayed */
    courseCode: string;
    /** Course history data */
    history: CourseHistoryByTerm;
    /** Maximum terms to display */
    maxTerms?: number;
    /** Optional CSS class */
    class?: string;
  }

  let {
    courseCode,
    history,
    maxTerms = 10,
    class: className,
  }: Props = $props();

  // Transform history object to array and sort by term descending
  const rows = $derived.by(() => {
    const entries = Object.entries(history).map(([term, stats]) => ({
      academicTerm: parseInt(term, 10),
      enrolled: stats.enrolled,
      passed: stats.passed,
      failed: stats.failed,
      withdrawn: stats.withdrawn,
      passRate: stats.enrolled > 0 ? (stats.passed / stats.enrolled) * 100 : 0,
    }));

    return entries
      .sort((a, b) => b.academicTerm - a.academicTerm)
      .slice(0, maxTerms);
  });

  // Calculate average pass rate
  const averagePassRate = $derived.by(() => {
    if (rows.length === 0) return 0;
    const total = rows.reduce((sum, row) => sum + row.passRate, 0);
    return total / rows.length;
  });

  // Calculate total enrollment
  const totalEnrollment = $derived.by(() => {
    return rows.reduce((sum, row) => sum + row.enrolled, 0);
  });

  // Navigate to section summary page
  function handleTermClick(term: number): void {
    goto(`/courses/${courseCode}/sections/${term}`);
  }
</script>

<section class={cn('space-y-4', className)}>
  <header>
    <h2 class="text-xl font-semibold text-slate-100">Course History Summary</h2>
    <p class="text-sm text-slate-400">
      Historical enrollment data for <span class="text-slate-200 font-mono">{courseCode}</span>
    </p>
  </header>

  {#if rows.length === 0}
    <!-- Empty state -->
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
        No enrollment history
      </h3>
      <p class="mt-2 text-sm text-slate-500">
        No historical data found for {courseCode}
      </p>
    </div>
  {:else}
    <!-- Summary stats -->
    <div class="grid grid-cols-3 gap-4">
      <div class="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
        <p class="text-xs font-medium text-slate-400 uppercase tracking-wide">Terms</p>
        <p class="mt-1 text-2xl font-semibold text-slate-100">{rows.length}</p>
      </div>
      <div class="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
        <p class="text-xs font-medium text-slate-400 uppercase tracking-wide">Total Enrolled</p>
        <p class="mt-1 text-2xl font-semibold text-slate-100">{totalEnrollment}</p>
      </div>
      <div class="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
        <p class="text-xs font-medium text-slate-400 uppercase tracking-wide">Avg Pass Rate</p>
        <p class="mt-1 text-2xl font-semibold text-emerald-400">{formatPercent(averagePassRate)}</p>
      </div>
    </div>

    <!-- Data table -->
    <div
      class="overflow-x-auto rounded-lg border border-slate-800 bg-slate-900/60"
    >
      <table
        class="min-w-full text-sm"
        role="grid"
        aria-label="Course enrollment history"
      >
        <thead class="border-b border-slate-800 bg-slate-900 text-slate-300">
          <tr>
            <th scope="col" class="px-4 py-3 text-left font-medium">
              Term
            </th>
            <th scope="col" class="px-4 py-3 text-right font-medium">
              Enrollment
            </th>
            <th scope="col" class="px-4 py-3 text-right font-medium text-emerald-300">
              Passed
            </th>
            <th scope="col" class="px-4 py-3 text-right font-medium text-red-300">
              Failed
            </th>
            <th scope="col" class="px-4 py-3 text-right font-medium text-amber-300">
              Withdrawn
            </th>
            <th scope="col" class="px-4 py-3 text-right font-medium">
              Pass Rate
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-800">
          {#each rows as row (row.academicTerm)}
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
              <td class="px-4 py-3 text-right text-slate-200">
                {row.enrolled}
              </td>
              <td class="px-4 py-3 text-right text-emerald-300">
                {row.passed}
              </td>
              <td class="px-4 py-3 text-right text-red-300">
                {row.failed}
              </td>
              <td class="px-4 py-3 text-right text-amber-300">
                {row.withdrawn}
              </td>
              <td class="px-4 py-3 text-right">
                <span
                  class={cn(
                    'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
                    row.passRate >= 80 ? 'bg-emerald-500/20 text-emerald-300' :
                    row.passRate >= 60 ? 'bg-amber-500/20 text-amber-300' :
                    'bg-red-500/20 text-red-300',
                  )}
                >
                  {formatPercent(row.passRate)}
                </span>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</section>
