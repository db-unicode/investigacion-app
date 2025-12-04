<script lang="ts">
  import type { SectionSummaryData } from '../types/section-stats.types';
  import { formatPercent } from '$lib/utils/formatters';

  interface Props {
    summary: SectionSummaryData;
    class?: string;
  }

  let { summary, class: className = '' }: Props = $props();
</script>

<div class="grid grid-cols-3 gap-4 {className}">
  <!-- Total Enrolled -->
  <div class="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
    <p class="text-sm text-slate-400">Total Enrolled</p>
    <p class="mt-1 text-2xl font-semibold font-mono text-slate-50">
      {summary.totalEnrolled.toLocaleString()}
    </p>
  </div>

  <!-- Overall Pass Rate -->
  <div class="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
    <p class="text-sm text-slate-400">Overall Pass Rate</p>
    <p class="mt-1 text-2xl font-semibold font-mono {
      summary.overallPassRate >= 80
        ? 'text-emerald-400'
        : summary.overallPassRate >= 60
          ? 'text-amber-400'
          : 'text-red-400'
    }">
      {formatPercent(summary.overallPassRate)}
    </p>
  </div>

  <!-- Number of Sections -->
  <div class="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
    <p class="text-sm text-slate-400">Sections</p>
    <p class="mt-1 text-2xl font-semibold font-mono text-slate-50">
      {summary.totalSections}
    </p>
  </div>
</div>
