<script lang="ts">
  import type { ForecastMethodDto } from '@app/contracts';
  import { cn } from '$lib/utils/cn';

  interface Props {
    /** Course code to show accuracy for */
    courseCode: string;
    /** Selected forecast method */
    method: ForecastMethodDto | null;
    /** Optional CSS class */
    class?: string;
  }

  let { courseCode, method, class: className }: Props = $props();

  // Simulated loading state
  let isLoading = $state(false);

  // Simulated accuracy data (placeholder)
  const mockData = [
    { term: '202410', actual: 45, forecast: 42, error: -3, accuracy: 93.3 },
    { term: '202320', actual: 52, forecast: 55, error: 3, accuracy: 94.2 },
    { term: '202310', actual: 38, forecast: 40, error: 2, accuracy: 94.7 },
    { term: '202220', actual: 61, forecast: 58, error: -3, accuracy: 95.1 },
    { term: '202210', actual: 47, forecast: 49, error: 2, accuracy: 95.7 },
  ];

  // Simulate loading when method changes
  $effect(() => {
    if (method) {
      isLoading = true;
      const timer = setTimeout(() => {
        isLoading = false;
      }, 800);
      return () => clearTimeout(timer);
    }
  });
</script>

<section class={cn('space-y-4', className)}>
  <header>
    <h2 class="text-xl font-semibold text-slate-100">
      Forecast Accuracy
    </h2>
    {#if method}
      <p class="text-sm text-slate-400">
        Method: <span class="text-slate-200">{method.label}</span>
      </p>
    {/if}
  </header>

  {#if !method}
    <div
      class="flex flex-col items-center justify-center rounded-lg border border-slate-700 bg-slate-800/30 p-12 text-center"
    >
      <svg
        class="h-12 w-12 text-slate-600"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
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
    <div class="space-y-3">
      <div class="h-10 w-full animate-pulse rounded bg-slate-800"></div>
      {#each [1, 2, 3, 4, 5] as _}
        <div class="h-12 w-full animate-pulse rounded bg-slate-800/60"></div>
      {/each}
    </div>

  {:else}
    <div
      class="overflow-x-auto rounded-lg border border-slate-800 bg-slate-900/60"
    >
      <table class="min-w-full text-sm">
        <thead class="border-b border-slate-800 bg-slate-900 text-slate-300">
          <tr>
            <th scope="col" class="px-4 py-3 text-left font-medium">
              Academic Term
            </th>
            <th scope="col" class="px-4 py-3 text-right font-medium">
              Actual
            </th>
            <th scope="col" class="px-4 py-3 text-right font-medium">
              Forecast
            </th>
            <th scope="col" class="px-4 py-3 text-right font-medium">
              Error
            </th>
            <th scope="col" class="px-4 py-3 text-right font-medium">
              Accuracy
            </th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-800">
          {#each mockData as row}
            <tr class="hover:bg-slate-800/60">
              <td class="px-4 py-3 font-mono text-slate-100">
                {row.term}
              </td>
              <td class="px-4 py-3 text-right text-slate-200">
                {row.actual}
              </td>
              <td class="px-4 py-3 text-right text-blue-300">
                {row.forecast}
              </td>
              <td
                class={cn(
                  'px-4 py-3 text-right font-mono',
                  row.error > 0 ? 'text-amber-300' : 'text-emerald-300',
                )}
              >
                {row.error > 0 ? '+' : ''}{row.error}
              </td>
              <td class="px-4 py-3 text-right">
                <span
                  class={cn(
                    'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
                    row.accuracy >= 95
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : row.accuracy >= 90
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-red-500/20 text-red-300',
                  )}
                >
                  {row.accuracy.toFixed(1)}%
                </span>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <!-- Summary metrics -->
    <div class="grid grid-cols-3 gap-4">
      <div class="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
        <p class="text-xs font-medium uppercase tracking-wide text-slate-500">
          Avg. Accuracy
        </p>
        <p class="mt-1 text-2xl font-bold text-emerald-400">94.6%</p>
      </div>
      <div class="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
        <p class="text-xs font-medium uppercase tracking-wide text-slate-500">
          MAPE
        </p>
        <p class="mt-1 text-2xl font-bold text-slate-100">5.4%</p>
      </div>
      <div class="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
        <p class="text-xs font-medium uppercase tracking-wide text-slate-500">
          Terms Analyzed
        </p>
        <p class="mt-1 text-2xl font-bold text-slate-100">5</p>
      </div>
    </div>

    <p class="text-xs text-slate-500">
      This is placeholder data. Connect to the actual API endpoint to display real accuracy metrics.
    </p>
  {/if}
</section>
