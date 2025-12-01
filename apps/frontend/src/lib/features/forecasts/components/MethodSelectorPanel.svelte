<script lang="ts">
  import type { ForecastMethodDto } from '@app/contracts';
  import { cn } from '$lib/utils/cn';
  import { onMount } from 'svelte';
  import {
    methodSelectorStore,
    type MethodSelectorState,
  } from '../stores/method-selector.store';
  import MethodCard from './MethodCard.svelte';
  import MethodCardSkeleton from './MethodCardSkeleton.svelte';

  interface Props {
    /** Whether to only show methods that support backtesting */
    backtestingOnly?: boolean;
    /** Callback when method is selected */
    onMethodSelect?: (method: ForecastMethodDto) => void;
    /** Optional CSS class */
    class?: string;
  }

  let {
    backtestingOnly = true,
    onMethodSelect,
    class: className,
  }: Props = $props();

  let state = $state<MethodSelectorState>({
    methods: [],
    selectedMethod: null,
    isLoading: false,
    error: null,
  });

  // Subscribe to store changes
  const unsubscribe = methodSelectorStore.subscribe(value => {
    state = value;
  });

  // Derived values
  const displayMethods = $derived(
    backtestingOnly
      ? state.methods.filter(m => m.capabilities.supportsBacktesting)
      : state.methods,
  );

  const disabledMethods = $derived(
    backtestingOnly
      ? state.methods.filter(m => !m.capabilities.supportsBacktesting)
      : [],
  );

  const handleMethodClick = (method: ForecastMethodDto): void => {
    methodSelectorStore.selectMethod(method);
    onMethodSelect?.(method);
  };

  const handleRetry = (): void => {
    void methodSelectorStore.loadMethods({
      backtesting: backtestingOnly ? true : undefined,
    });
  };

  // Handle keyboard navigation
  const handleKeyDown = (event: KeyboardEvent): void => {
    if (!displayMethods.length) return;

    const currentIndex = state.selectedMethod
      ? displayMethods.findIndex(m => m.id === state.selectedMethod?.id)
      : -1;

    let newIndex = currentIndex;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      newIndex = currentIndex < displayMethods.length - 1 ? currentIndex + 1 : 0;
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      newIndex = currentIndex > 0 ? currentIndex - 1 : displayMethods.length - 1;
    } else if (event.key === 'Home') {
      event.preventDefault();
      newIndex = 0;
    } else if (event.key === 'End') {
      event.preventDefault();
      newIndex = displayMethods.length - 1;
    }

    if (newIndex !== currentIndex && newIndex >= 0) {
      handleMethodClick(displayMethods[newIndex]);
    }
  };

  onMount(() => {
    // Load methods on mount
    void methodSelectorStore.loadMethods({
      backtesting: backtestingOnly ? true : undefined,
    });

    // Cleanup subscription on unmount
    return unsubscribe;
  });
</script>

<aside
  class={cn('flex flex-col space-y-4', className)}
  aria-label="Forecast method selector"
>
  <header class="space-y-1">
    <h2 class="text-lg font-semibold text-slate-100">Forecast Methods</h2>
    <p class="text-xs text-slate-400">
      Select a method to view accuracy metrics
    </p>
  </header>

  <!-- Loading state -->
  {#if state.isLoading}
    <div
      class="space-y-3"
      role="status"
      aria-label="Loading forecast methods"
    >
      <MethodCardSkeleton />
      <MethodCardSkeleton />
      <MethodCardSkeleton />
    </div>

  <!-- Error state -->
  {:else if state.error}
    <div
      class="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-center"
      role="alert"
    >
      <svg
        class="mx-auto h-8 w-8 text-red-400"
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
      <p class="mt-2 text-sm text-red-300">Failed to load forecast methods</p>
      <p class="mt-1 text-xs text-red-400/80">{state.error}</p>
      <button
        type="button"
        onclick={handleRetry}
        class="mt-3 rounded-md bg-red-500/20 px-3 py-1.5 text-sm font-medium text-red-300 hover:bg-red-500/30 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-slate-900"
      >
        Try Again
      </button>
    </div>

  <!-- Empty state -->
  {:else if displayMethods.length === 0 && disabledMethods.length === 0}
    <div
      class="rounded-lg border border-slate-700 bg-slate-800/30 p-4 text-center"
    >
      <svg
        class="mx-auto h-8 w-8 text-slate-500"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
        />
      </svg>
      <p class="mt-2 text-sm text-slate-400">No forecast methods available</p>
      <p class="mt-1 text-xs text-slate-500">
        Contact support if this seems incorrect.
      </p>
    </div>

  <!-- Methods list -->
  {:else}
    <div
      class="space-y-2"
      role="listbox"
      aria-label="Available forecast methods"
      aria-activedescendant={state.selectedMethod?.id}
      tabindex="0"
      onkeydown={handleKeyDown}
    >
      <!-- Active methods -->
      {#each displayMethods as method (method.id)}
        <MethodCard
          {method}
          isSelected={state.selectedMethod?.id === method.id}
          onclick={() => handleMethodClick(method)}
        />
      {/each}

      <!-- Disabled methods (when filtering for backtesting) -->
      {#if disabledMethods.length > 0}
        <div class="mt-4 space-y-2">
          <p class="text-xs font-medium text-slate-500 uppercase tracking-wide">
            Not available for backtesting
          </p>
          {#each disabledMethods as method (method.id)}
            <MethodCard {method} disabled={true} />
          {/each}
        </div>
      {/if}
    </div>
  {/if}
</aside>
