<script lang="ts">
  import type {
    CourseHistoryRow,
  } from '$lib/features/course-history/types/course-history.types';

  export let rows: CourseHistoryRow[] = [];
  export let isLoading = false;
  export let errorMessage: string | null = null;
  export let courseCode = '';
  export let isValid = false;
  export let showIdleHint = false;
</script>

<section class="mt-4 space-y-3">
  {#if isLoading}
    <p class="text-sm text-slate-300">Loading course history…</p>
  {:else if errorMessage}
    <p class="text-sm text-red-400">{errorMessage}</p>
  {:else if showIdleHint}
    <p class="text-sm text-slate-500">
      Start by entering a course code above.
    </p>
  {:else if !isValid && courseCode}
    <p class="text-sm text-slate-400">
      Waiting for a valid course code (format XXXX-DDDD).
    </p>
  {:else if rows.length === 0 && isValid}
    <p class="text-sm text-slate-400">
      No history data found for this course.
    </p>
  {:else}
    <div
      class="overflow-x-auto rounded-lg border border-slate-800 bg-slate-900/60"
    >
      <table class="min-w-full text-sm">
        <thead class="bg-slate-900 text-slate-300 border-b border-slate-800">
          <tr>
            <th
              scope="col"
              class="px-4 py-2 text-left font-medium"
            >
              Academic term
            </th>
            <th
              scope="col"
              class="px-4 py-2 text-right font-medium"
            >
              Enrolled
            </th>
            <th
              scope="col"
              class="px-4 py-2 text-right font-medium text-emerald-300"
            >
              Passed
            </th>
            <th
              scope="col"
              class="px-4 py-2 text-right font-medium text-red-300"
            >
              Failed
            </th>
            <th
              scope="col"
              class="px-4 py-2 text-right font-medium text-amber-300"
            >
              Withdrawn
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-800">
          {#each rows as row}
            <tr class="hover:bg-slate-800/60">
              <td class="px-4 py-2 font-mono text-slate-100">
                {row.academicTerm}
              </td>
              <td class="px-4 py-2 text-right">
                {row.enrolled}
              </td>
              <td class="px-4 py-2 text-right text-emerald-300">
                {row.passed}
              </td>
              <td class="px-4 py-2 text-right text-red-300">
                {row.failed}
              </td>
              <td class="px-4 py-2 text-right text-amber-300">
                {row.withdrawn}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</section>
