<script lang="ts">
  import { Input } from '$lib/components/ui/input';
  import { cn } from '$lib/utils/cn';
  import { isCourseCodeValid } from '$lib/features/course-history/api/course-history.api';
  import { dashboardStore, type DashboardState } from '../stores/dashboard.store';
  import { onDestroy } from 'svelte';

  interface Props {
    /** Debounce delay in ms */
    debounceMs?: number;
    /** Auto-focus on mount */
    autoFocus?: boolean;
    /** Placeholder text */
    placeholder?: string;
    /** Optional CSS class */
    class?: string;
  }

  let {
    debounceMs = 300,
    autoFocus = false,
    placeholder = 'Enter course code (e.g., ISIS-3204)',
    class: className,
  }: Props = $props();

  // Local input value for immediate UI updates
  let inputValue = $state('');
  let debounceId: ReturnType<typeof setTimeout> | null = null;

  // Subscribe to store for reactive state
  let storeState = $state<DashboardState>({
    courseCode: '',
    courseHistory: null,
    isLoading: false,
    error: null,
  });

  const unsubscribe = dashboardStore.subscribe(value => {
    storeState = value;
    // Sync input value when store changes externally
    if (value.courseCode !== inputValue.toUpperCase()) {
      inputValue = value.courseCode;
    }
  });

  onDestroy(() => {
    unsubscribe();
    if (debounceId !== null) {
      clearTimeout(debounceId);
    }
  });

  // Derived validation states
  const isValid = $derived(isCourseCodeValid(inputValue.toUpperCase()));
  const hasValue = $derived(inputValue.length > 0);
  const showFormatError = $derived(hasValue && !isValid && !storeState.isLoading);

  // Handle input changes with debouncing
  const handleInput = (event: Event): void => {
    const target = event.target as HTMLInputElement;
    inputValue = target.value.toUpperCase();

    if (debounceId !== null) {
      clearTimeout(debounceId);
    }

    debounceId = setTimeout(() => {
      void dashboardStore.setCourseCode(inputValue);
    }, debounceMs);
  };

  // Handle clear button click
  const handleClear = (): void => {
    inputValue = '';
    if (debounceId !== null) {
      clearTimeout(debounceId);
    }
    dashboardStore.clear();
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') {
      handleClear();
    } else if (event.key === 'Enter') {
      // Immediately fetch on Enter
      if (debounceId !== null) {
        clearTimeout(debounceId);
      }
      void dashboardStore.setCourseCode(inputValue);
    }
  };
</script>

<div class={cn('space-y-2', className)}>
  <label
    for="course-code-input"
    class="block text-sm font-medium text-slate-200"
  >
    Course Code
  </label>

  <div class="relative max-w-sm">
    <Input
      id="course-code-input"
      type="text"
      value={inputValue}
      oninput={handleInput}
      onkeydown={handleKeyDown}
      {placeholder}
      autofocus={autoFocus}
      aria-invalid={showFormatError}
      aria-describedby={showFormatError ? 'course-input-error' : 'course-input-hint'}
      class={cn(
        'pr-10',
        'bg-slate-900',
        'border',
        'text-slate-50',
        showFormatError ? 'border-red-500' : isValid && hasValue ? 'border-emerald-500' : 'border-slate-700',
      )}
    />

    <!-- Clear button -->
    {#if hasValue}
      <button
        type="button"
        onclick={handleClear}
        class="absolute right-8 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
        aria-label="Clear course code"
      >
        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    {/if}

    <!-- Valid indicator -->
    {#if isValid && hasValue}
      <span
        class="absolute right-2 top-1/2 -translate-y-1/2 text-emerald-400"
        aria-hidden="true"
      >
        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
      </span>
    {/if}

    <!-- Loading indicator -->
    {#if storeState.isLoading}
      <span
        class="absolute right-2 top-1/2 -translate-y-1/2 text-blue-400"
        aria-hidden="true"
      >
        <svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </span>
    {/if}
  </div>

  <!-- Validation error -->
  {#if showFormatError}
    <p id="course-input-error" class="text-xs text-red-400" role="alert">
      Invalid format. Use XXXX-DDDD (e.g., ISIS-3204)
    </p>
  {:else}
    <p id="course-input-hint" class="text-xs text-slate-400">
      Format: <span class="font-mono">XXXX-DDDD</span> (letters and digits)
    </p>
  {/if}
</div>
