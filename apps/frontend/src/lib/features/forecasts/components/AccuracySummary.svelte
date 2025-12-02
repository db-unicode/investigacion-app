<script lang="ts">
  import type { SummaryMetricsDto } from '@app/contracts';
  import { cn } from '$lib/utils/cn';
  import { formatPercent, formatWithSign, getAccuracyColorClass } from '$lib/utils/formatters';

  interface Props {
    /** Summary metrics from the API */
    summary: SummaryMetricsDto;
    /** Number of terms analyzed */
    termCount: number;
    /** Optional CSS class */
    class?: string;
  }

  let { summary, termCount, class: className }: Props = $props();
</script>

<section class={cn('space-y-4', className)}>
  <h3 class="text-lg font-semibold text-slate-100">Summary</h3>

  <!-- Primary metrics row -->
  <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
    <!-- Average Accuracy -->
    <div class="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
      <p class="text-xs font-medium uppercase tracking-wide text-slate-500">
        Avg. Accuracy
      </p>
      <p class={cn('mt-1 text-2xl font-bold', getAccuracyColorClass(summary.averageAccuracy))}>
        {formatPercent(summary.averageAccuracy)}
      </p>
    </div>

    <!-- MAPE -->
    <div class="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
      <p class="text-xs font-medium uppercase tracking-wide text-slate-500">
        MAPE
      </p>
      <p class="mt-1 text-2xl font-bold text-slate-100">
        {formatPercent(summary.mape, 2)}
      </p>
    </div>

    <!-- RMSE -->
    <div class="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
      <p class="text-xs font-medium uppercase tracking-wide text-slate-500">
        RMSE
      </p>
      <p class="mt-1 text-2xl font-bold text-slate-100">
        {summary.rmse.toFixed(2)}
      </p>
    </div>

    <!-- Terms Analyzed -->
    <div class="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
      <p class="text-xs font-medium uppercase tracking-wide text-slate-500">
        Terms Analyzed
      </p>
      <p class="mt-1 text-2xl font-bold text-slate-100">
        {termCount}
      </p>
    </div>
  </div>

  <!-- Secondary metrics row -->
  <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
    <!-- Over-predictions -->
    <div class="rounded-lg border border-slate-700 bg-slate-800/30 p-3">
      <p class="text-xs font-medium text-slate-500">Over-predictions</p>
      <p class="mt-1 text-lg font-semibold text-blue-400">
        {summary.overPredictions}
      </p>
    </div>

    <!-- Under-predictions -->
    <div class="rounded-lg border border-slate-700 bg-slate-800/30 p-3">
      <p class="text-xs font-medium text-slate-500">Under-predictions</p>
      <p class="mt-1 text-lg font-semibold text-amber-400">
        {summary.underPredictions}
      </p>
    </div>

    <!-- Exact -->
    <div class="rounded-lg border border-slate-700 bg-slate-800/30 p-3">
      <p class="text-xs font-medium text-slate-500">Exact</p>
      <p class="mt-1 text-lg font-semibold text-emerald-400">
        {summary.exactPredictions}
      </p>
    </div>

    <!-- Total Predicted -->
    <div class="rounded-lg border border-slate-700 bg-slate-800/30 p-3">
      <p class="text-xs font-medium text-slate-500">Total Forecast</p>
      <p class="mt-1 text-lg font-semibold text-slate-200">
        {summary.totalPredicted}
      </p>
    </div>

    <!-- Total Actual -->
    <div class="rounded-lg border border-slate-700 bg-slate-800/30 p-3">
      <p class="text-xs font-medium text-slate-500">Total Actual</p>
      <p class="mt-1 text-lg font-semibold text-slate-200">
        {summary.totalActual}
      </p>
    </div>

    <!-- Net Error -->
    <div class="rounded-lg border border-slate-700 bg-slate-800/30 p-3">
      <p class="text-xs font-medium text-slate-500">Net Error</p>
      <p
        class={cn(
          'mt-1 text-lg font-semibold font-mono',
          summary.overallError > 0
            ? 'text-blue-400'
            : summary.overallError < 0
              ? 'text-amber-400'
              : 'text-emerald-400',
        )}
      >
        {formatWithSign(summary.overallError)}
      </p>
    </div>
  </div>
</section>
