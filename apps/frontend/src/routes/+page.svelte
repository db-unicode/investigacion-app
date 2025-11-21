<script lang="ts">
  import { cn } from '$lib/utils/cn';
  import CourseHistoryPanel from '$lib/features/course-history/components/CourseHistoryPanel.svelte';
</script>

<main
  class={cn(
    'min-h-screen',
    'bg-slate-950',
    'text-slate-50',
    'flex',
    'flex-col',
    'items-center',
    'pt-16',
    'px-4',
  )}
>
  <CourseHistoryPanel />
</main>
