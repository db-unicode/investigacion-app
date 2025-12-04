<script lang="ts">
  interface Props {
    rows?: number;
    class?: string;
  }

  let { rows = 5, class: className = '' }: Props = $props();

  const skeletonRows = Array.from({ length: rows }, (_, i) => i);
</script>

<div
  class="rounded-lg border border-slate-800 overflow-hidden {className}"
  aria-busy="true"
  aria-label="Loading section statistics"
>
  <table class="w-full">
    <thead class="bg-slate-800/50">
      <tr>
        <th class="px-4 py-3 text-left text-sm font-medium text-slate-400">Section</th>
        <th class="px-4 py-3 text-right text-sm font-medium text-slate-400">Enrolled</th>
        <th class="px-4 py-3 text-right text-sm font-medium text-slate-400">Passed</th>
        <th class="px-4 py-3 text-right text-sm font-medium text-slate-400">Failed</th>
        <th class="px-4 py-3 text-right text-sm font-medium text-slate-400">Withdrawn</th>
        <th class="px-4 py-3 text-right text-sm font-medium text-slate-400">Pass Rate</th>
      </tr>
    </thead>
    <tbody class="divide-y divide-slate-800">
      {#each skeletonRows as _}
        <tr class="animate-pulse">
          <td class="px-4 py-3">
            <div class="h-5 w-8 rounded bg-slate-700"></div>
          </td>
          <td class="px-4 py-3">
            <div class="h-5 w-12 rounded bg-slate-700 ml-auto"></div>
          </td>
          <td class="px-4 py-3">
            <div class="h-5 w-10 rounded bg-slate-700 ml-auto"></div>
          </td>
          <td class="px-4 py-3">
            <div class="h-5 w-8 rounded bg-slate-700 ml-auto"></div>
          </td>
          <td class="px-4 py-3">
            <div class="h-5 w-8 rounded bg-slate-700 ml-auto"></div>
          </td>
          <td class="px-4 py-3">
            <div class="h-5 w-16 rounded bg-slate-700 ml-auto"></div>
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>
