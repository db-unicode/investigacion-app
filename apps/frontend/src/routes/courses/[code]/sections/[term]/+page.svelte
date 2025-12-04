<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import {
    SectionSummaryHeader,
    SectionStatsTable,
  } from '$lib/features/section-summary';

  // Extract route parameters
  const courseCode = $derived($page.params.code?.toUpperCase() ?? '');
  const term = $derived(parseInt(($page.params as Record<string, string>).term ?? '0', 10));

  // Validation
  const isCourseCodeValid = $derived(/^[A-Z]{4}-\d{4}$/.test(courseCode));
  const isTermValid = $derived(Number.isInteger(term) && term > 0);
  const isValid = $derived(isCourseCodeValid && isTermValid);

  // Redirect if invalid
  $effect(() => {
    if (!isValid && typeof window !== 'undefined') {
      goto('/');
    }
  });
</script>

<svelte:head>
  <title>
    {isValid ? `Sections - ${courseCode} - ${term}` : 'Section Summary'}
  </title>
</svelte:head>

<main class="min-h-screen bg-slate-950 text-slate-50">
  <div class="mx-auto max-w-5xl px-6 py-8">
    {#if isValid}
      <SectionSummaryHeader {courseCode} {term} />

      <div class="mt-8">
        <SectionStatsTable {courseCode} {term} />
      </div>
    {:else}
      <div class="flex items-center justify-center py-24">
        <div class="text-center">
          <p class="text-slate-400">Redirecting to dashboard...</p>
        </div>
      </div>
    {/if}
  </div>
</main>
