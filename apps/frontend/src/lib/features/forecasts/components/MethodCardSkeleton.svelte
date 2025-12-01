<script lang="ts">
  import { cn } from '$lib/utils/cn';
</script>

<div
  class={cn(
    'w-full animate-pulse rounded-lg border border-slate-700/50 bg-slate-800/30 p-4',
  )}
>
  <div class="flex items-start justify-between gap-3">
    <div class="flex-1 space-y-2">
      <div class="flex items-center gap-2">
        <!-- Radio indicator skeleton -->
        <div class="h-4 w-4 rounded-full bg-slate-700"></div>
        <!-- Title skeleton -->
        <div class="h-4 w-32 rounded bg-slate-700"></div>
      </div>
      <!-- Description skeleton -->
      <div class="h-3 w-full rounded bg-slate-700/60"></div>
      <div class="h-3 w-3/4 rounded bg-slate-700/60"></div>
    </div>
    <!-- Status badge skeleton -->
    <div class="h-5 w-14 rounded-full bg-slate-700"></div>
  </div>
</div>
