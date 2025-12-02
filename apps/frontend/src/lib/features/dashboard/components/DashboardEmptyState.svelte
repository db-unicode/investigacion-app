<script lang="ts">
  import { cn } from '$lib/utils/cn';

  interface Props {
    /** Optional CSS class */
    class?: string;
  }

  let { class: className }: Props = $props();

  const exampleCourses = [
    { code: 'ISIS-3204', name: 'Software Development' },
    { code: 'MATE-1105', name: 'Calculus I' },
    { code: 'FISI-1028', name: 'Physics I' },
  ];
</script>

<div class={cn('text-center py-12 px-6', className)}>
  <!-- Icon -->
  <div
    class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-800"
  >
    <svg
      class="h-8 w-8 text-slate-400"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="1.5"
        d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  </div>

  <!-- Title and description -->
  <h2 class="mt-6 text-xl font-semibold text-slate-100">
    Enter a Course Code to Begin
  </h2>
  <p class="mt-2 text-sm text-slate-400 max-w-md mx-auto">
    View enrollment history and forecast accuracy for any course.
    Enter a valid course code above to get started.
  </p>

  <!-- Example courses -->
  <div class="mt-8">
    <p class="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">
      Example Courses
    </p>
    <div class="flex flex-wrap justify-center gap-2">
      {#each exampleCourses as example (example.code)}
        <div
          class="rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-2"
        >
          <span class="font-mono text-sm text-blue-400">{example.code}</span>
          <span class="text-xs text-slate-500 ml-2">{example.name}</span>
        </div>
      {/each}
    </div>
  </div>

  <!-- Instructions -->
  <div class="mt-8 rounded-lg border border-slate-800 bg-slate-900/30 p-4 max-w-sm mx-auto">
    <h3 class="text-sm font-medium text-slate-200 mb-2">How it works</h3>
    <ol class="text-left text-xs text-slate-400 space-y-2">
      <li class="flex items-start gap-2">
        <span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-blue-400 text-xs font-medium">1</span>
        <span>Enter a course code in the input above</span>
      </li>
      <li class="flex items-start gap-2">
        <span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-blue-400 text-xs font-medium">2</span>
        <span>View the enrollment history summary</span>
      </li>
      <li class="flex items-start gap-2">
        <span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-blue-400 text-xs font-medium">3</span>
        <span>Select a forecast method from the sidebar to see accuracy data</span>
      </li>
    </ol>
  </div>
</div>
