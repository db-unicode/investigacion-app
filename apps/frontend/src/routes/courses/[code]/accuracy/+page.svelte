<script lang="ts">
  import { page } from '$app/stores';
  import { cn } from '$lib/utils/cn';
  import { isCourseCodeValid } from '$lib/features/course-history/api/course-history.api';
  import {
    MethodSelectorPanel,
    methodSelectorStore,
    AccuracyTable,
    type MethodSelectorState,
  } from '$lib/features/forecasts';

  // Get course code from URL params
  const courseCode = $derived($page.params.code?.toUpperCase() ?? '');
  const isValidCode = $derived(isCourseCodeValid(courseCode));

  // Subscribe to store for selected method
  let state = $state<MethodSelectorState>({
    methods: [],
    selectedMethod: null,
    isLoading: false,
    error: null,
  });

  const unsubscribe = methodSelectorStore.subscribe(value => {
    state = value;
  });

  // Cleanup on unmount
  import { onDestroy } from 'svelte';
  onDestroy(() => {
    unsubscribe();
    methodSelectorStore.reset();
  });
</script>

<svelte:head>
  <title>Forecast Accuracy - {courseCode || 'Course'}</title>
</svelte:head>

<div
  class={cn(
    'min-h-screen',
    'bg-slate-950',
    'text-slate-50',
  )}
>
  <!-- Header -->
  <header class="border-b border-slate-800 bg-slate-900/50 px-6 py-4">
    <div class="mx-auto max-w-7xl">
      <nav class="mb-2 text-sm">
        <a
          href="/"
          class="text-slate-400 hover:text-slate-200 transition-colors"
        >
          Dashboard
        </a>
        <span class="mx-2 text-slate-600">/</span>
        <span class="text-slate-200">Forecast Accuracy</span>
      </nav>
      <h1 class="text-2xl font-bold tracking-tight">
        {#if isValidCode}
          <span class="font-mono text-blue-400">{courseCode}</span>
          <span class="text-slate-400 font-normal">Forecast Accuracy</span>
        {:else}
          Forecast Accuracy
        {/if}
      </h1>
    </div>
  </header>

  <!-- Main content with sidebar -->
  <div class="mx-auto max-w-7xl px-6 py-8">
    {#if !isValidCode}
      <!-- Invalid course code state -->
      <div
        class="flex flex-col items-center justify-center rounded-lg border border-red-500/30 bg-red-500/10 p-12 text-center"
      >
        <svg
          class="h-12 w-12 text-red-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <p class="mt-4 text-lg font-medium text-red-300">
          Invalid Course Code
        </p>
        <p class="mt-2 text-sm text-red-400/80">
          Course code must match pattern <code class="font-mono">XXXX-0000</code>
        </p>
        <a
          href="/"
          class="mt-6 rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700 transition-colors"
        >
          Go to Home
        </a>
      </div>
    {:else}
      <!-- Two-column layout -->
      <div class="flex gap-8">
        <!-- Main content area -->
        <main class="flex-1 min-w-0">
          <!-- Course info card -->
          <div
            class="mb-6 rounded-lg border border-slate-800 bg-slate-900/50 p-4"
          >
            <div class="flex items-center gap-4">
              <div
                class="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400"
              >
                <svg
                  class="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
              <div>
                <h2 class="text-lg font-semibold text-slate-100">
                  {courseCode}
                </h2>
                <p class="text-sm text-slate-400">
                  Enrollment forecast accuracy analysis
                </p>
              </div>
            </div>
          </div>

          <!-- Accuracy table -->
          <AccuracyTable
            {courseCode}
            method={state.selectedMethod}
          />
        </main>

        <!-- Right sidebar -->
        <aside class="w-72 shrink-0">
          <div class="sticky top-8">
            <MethodSelectorPanel
              backtestingOnly={true}
              onMethodSelect={(method) => {
                console.log('Method selected:', method.id);
              }}
            />
          </div>
        </aside>
      </div>
    {/if}
  </div>
</div>
