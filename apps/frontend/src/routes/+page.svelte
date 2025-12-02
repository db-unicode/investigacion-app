<script lang="ts">
  import { onDestroy } from 'svelte';
  import { cn } from '$lib/utils/cn';
  import {
    CourseInput,
    SummaryTable,
    DashboardEmptyState,
    dashboardStore,
    type DashboardState,
  } from '$lib/features/dashboard';
  import {
    MethodSelectorPanel,
    AccuracyTable,
    methodSelectorStore,
    type MethodSelectorState,
  } from '$lib/features/forecasts';
  import { isCourseCodeValid } from '$lib/features/course-history/api/course-history.api';

  // Subscribe to dashboard store
  let dashboardState = $state<DashboardState>({
    courseCode: '',
    courseHistory: null,
    isLoading: false,
    error: null,
  });

  const unsubscribeDashboard = dashboardStore.subscribe(value => {
    dashboardState = value;
  });

  // Subscribe to method selector store
  let methodState = $state<MethodSelectorState>({
    methods: [],
    selectedMethod: null,
    isLoading: false,
    error: null,
  });

  const unsubscribeMethod = methodSelectorStore.subscribe(value => {
    methodState = value;
  });

  // Derived states
  const isValidCode = $derived(isCourseCodeValid(dashboardState.courseCode));
  const hasHistory = $derived(dashboardState.courseHistory !== null && Object.keys(dashboardState.courseHistory).length > 0);
  const showContent = $derived(isValidCode && hasHistory);

  // Cleanup on unmount
  onDestroy(() => {
    unsubscribeDashboard();
    unsubscribeMethod();
    dashboardStore.reset();
    methodSelectorStore.reset();
  });
</script>

<svelte:head>
  <title>Course Accuracy Dashboard</title>
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
      <h1 class="text-2xl font-bold tracking-tight">
        Course Accuracy Dashboard
      </h1>
      <p class="mt-1 text-sm text-slate-400">
        Analyze enrollment history and forecast accuracy for any course
      </p>
    </div>
  </header>

  <!-- Main content -->
  <div class="mx-auto max-w-7xl px-6 py-8">
    <!-- Course Input Section -->
    <div class="mb-8">
      <CourseInput autoFocus />
    </div>

    <!-- Error state -->
    {#if dashboardState.error && isValidCode}
      <div
        class="mb-8 flex flex-col items-center justify-center rounded-lg border border-red-500/30 bg-red-500/10 p-8 text-center"
      >
        <svg
          class="h-10 w-10 text-red-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <h3 class="mt-4 text-lg font-medium text-red-300">
          Course Not Found
        </h3>
        <p class="mt-2 text-sm text-red-400/80">
          {dashboardState.error}
        </p>
        <p class="mt-2 text-sm text-slate-400">
          Check the course code and try again.
        </p>
      </div>
    {/if}

    <!-- Two-column layout when content is available -->
    {#if showContent}
      <div class="flex gap-8">
        <!-- Main content area -->
        <main class="flex-1 min-w-0 space-y-8">
          <!-- Course info card -->
          <div
            class="rounded-lg border border-slate-800 bg-slate-900/50 p-4"
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
                  {dashboardState.courseCode}
                </h2>
                <p class="text-sm text-slate-400">
                  Enrollment history and forecast accuracy analysis
                </p>
              </div>
            </div>
          </div>

          <!-- Summary Table -->
          {#if dashboardState.courseHistory}
            <SummaryTable
              courseCode={dashboardState.courseCode}
              history={dashboardState.courseHistory}
            />
          {/if}

          <!-- Accuracy Table -->
          <AccuracyTable
            courseCode={dashboardState.courseCode}
            method={methodState.selectedMethod}
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
    {:else if !dashboardState.isLoading && !dashboardState.error}
      <!-- Empty state when no course is selected -->
      <DashboardEmptyState />
    {:else if dashboardState.isLoading}
      <!-- Loading state -->
      <div class="flex gap-8">
        <main class="flex-1 min-w-0 space-y-8">
          <!-- Skeleton for course info -->
          <div class="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
            <div class="flex items-center gap-4">
              <div class="h-12 w-12 rounded-lg bg-slate-800 animate-pulse"></div>
              <div class="flex-1 space-y-2">
                <div class="h-5 w-32 bg-slate-800 rounded animate-pulse"></div>
                <div class="h-4 w-48 bg-slate-800/60 rounded animate-pulse"></div>
              </div>
            </div>
          </div>

          <!-- Skeleton for summary stats -->
          <div class="grid grid-cols-3 gap-4">
            {#each [1, 2, 3] as _}
              <div class="rounded-lg border border-slate-800 bg-slate-900/50 p-4">
                <div class="h-3 w-12 bg-slate-800 rounded animate-pulse"></div>
                <div class="mt-2 h-8 w-16 bg-slate-800 rounded animate-pulse"></div>
              </div>
            {/each}
          </div>

          <!-- Skeleton for table -->
          <div class="space-y-3">
            <div class="h-10 w-full animate-pulse rounded bg-slate-800"></div>
            {#each [1, 2, 3, 4, 5] as _}
              <div class="h-12 w-full animate-pulse rounded bg-slate-800/60"></div>
            {/each}
          </div>
        </main>

        <aside class="w-72 shrink-0">
          <div class="sticky top-8">
            <MethodSelectorPanel backtestingOnly={true} />
          </div>
        </aside>
      </div>
    {/if}
  </div>
</div>
