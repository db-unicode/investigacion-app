<script lang="ts">
  import { formatTerm } from '$lib/utils/formatters';

  interface Props {
    courseCode: string;
    term: number;
    class?: string;
  }

  let { courseCode, term, class: className = '' }: Props = $props();

  const formattedTerm = $derived(formatTerm(term));
  const dashboardUrl = $derived(`/?course=${courseCode}`);
</script>

<header class={className}>
  <!-- Breadcrumb Navigation -->
  <nav class="mb-2 text-sm" aria-label="Breadcrumb">
    <ol class="flex items-center space-x-2">
      <li>
        <a href={dashboardUrl} class="text-slate-400 hover:text-slate-200 transition-colors">
          Dashboard
        </a>
      </li>
      <li>
        <span class="text-slate-600">/</span>
      </li>
      <li>
        <a
          href={dashboardUrl}
          class="text-slate-400 hover:text-slate-200 transition-colors"
        >
          {courseCode}
        </a>
      </li>
      <li>
        <span class="text-slate-600">/</span>
      </li>
      <li>
        <span class="text-slate-400">Sections</span>
      </li>
      <li>
        <span class="text-slate-600">/</span>
      </li>
      <li>
        <span class="text-slate-200" aria-current="page">{formattedTerm}</span>
      </li>
    </ol>
  </nav>

  <!-- Page Title -->
  <div class="mt-4 flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-semibold text-slate-50">
        Section Statistics
      </h1>
      <p class="text-slate-400 mt-1">
        <span class="font-mono text-slate-200">{courseCode}</span>
        <span class="mx-2">·</span>
        <span>{formattedTerm}</span>
      </p>
    </div>

    <!-- Back to Dashboard link -->
    <a
      href={dashboardUrl}
      class="inline-flex items-center gap-2 rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700 transition-colors"
    >
      <svg
        class="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M10 19l-7-7m0 0l7-7m-7 7h18"
        />
      </svg>
      Back to Dashboard
    </a>
  </div>
</header>
