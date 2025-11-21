<script lang="ts">
  import { Input } from '$lib/components/ui/input';
  import { cn } from '$lib/utils/cn';
  import {
    fetchCourseHistory,
    isCourseCodeValid,
  } from '$lib/features/course-history/api/course-history.api';
  import type {
    CourseHistoryByTerm,
    CourseHistoryRow,
  } from '$lib/features/course-history/types/course-history.types';
  import CourseHistoryTable from '$lib/features/course-history/components/CourseHistoryTable.svelte';

  const DEBOUNCE_MS = 300;

  let courseCode = $state('');
  let rows = $state<CourseHistoryRow[]>([]);
  let isLoading = $state(false);
  let errorMessage = $state<string | null>(null);

  let debounceId: ReturnType<typeof setTimeout> | null = null;

  const isValid = $derived(isCourseCodeValid(courseCode));
  const hasValue = $derived(courseCode.length > 0);
  const showFormatError = $derived(hasValue && !isValid && !isLoading);
  const showIdleHint = $derived(!hasValue && rows.length === 0 && !isLoading && errorMessage === null);

  const scheduleFetch = (): void => {
    if (!isValid) {
      rows = [];
      errorMessage = null;
      return;
    }

    if (debounceId !== null) {
      clearTimeout(debounceId);
    }

    debounceId = setTimeout(() => {
      void loadCourseHistory(courseCode);
    }, DEBOUNCE_MS);
  };

  const mapHistoryToRows = (
    history: CourseHistoryByTerm,
  ): CourseHistoryRow[] => {
    const mappedRows: CourseHistoryRow[] = Object.entries(history).map(
      ([academicTerm, stats]) => ({
        academicTerm,
        enrolled: stats.enrolled,
        passed: stats.passed,
        failed: stats.failed,
        withdrawn: stats.withdrawn,
      }),
    );

    return mappedRows.sort(
      (left, right) =>
        right.academicTerm.localeCompare(left.academicTerm),
    );
  };

  const loadCourseHistory = async (code: string): Promise<void> => {
    isLoading = true;
    errorMessage = null;

    try {
      const history = await fetchCourseHistory(code);

      if (Object.keys(history).length === 0) {
        rows = [];
        errorMessage = 'Course not found.';
        return;
      }

      rows = mapHistoryToRows(history);
    } catch (error) {
      console.error('Failed to load course history', error);
      rows = [];
      errorMessage = 'Failed to load course history. Please try again.';
    } finally {
      isLoading = false;
    }
  };

  $effect(() => {
    scheduleFetch();
  });
</script>

<section class="w-full max-w-5xl space-y-8">
  <header class="space-y-2">
    <h1 class="text-3xl font-bold tracking-tight">
      Course History Viewer
    </h1>
    <p class="text-sm text-slate-300">
      Enter a course code (format XXXX-DDDD) to explore its enrollment
      history by academic term.
    </p>
  </header>

  <div class="space-y-2">
    <label
      for="course-code"
      class="block text-sm font-medium text-slate-200"
    >
      Course code
    </label>
    <Input
      id="course-code"
      placeholder="e.g. MATE-1010"
      class={cn(
        'max-w-sm',
        'bg-slate-900',
        'border',
        'text-slate-50',
        showFormatError ? 'border-red-500' : 'border-slate-700',
      )}
      bind:value={courseCode}
    />
    {#if showFormatError}
      <p class="text-xs text-red-400">
        Course code must match pattern <span class="font-mono">XXXX-DDDD</span>.
      </p>
    {:else}
      <p class="text-xs text-slate-400">
        Format: <span class="font-mono">XXXX-DDDD</span> (A–Z letters and digits).
      </p>
    {/if}
  </div>

  <CourseHistoryTable
    {rows}
    {isLoading}
    {errorMessage}
    {courseCode}
    {isValid}
    {showIdleHint}
  />
</section>
