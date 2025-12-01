<script lang="ts">
  import type { Snippet } from 'svelte';
  import { onDestroy } from 'svelte';
  import { methodSelectorStore } from '../stores/method-selector.store';

  interface Props {
    /** Whether to auto-load methods that support backtesting */
    backtestingOnly?: boolean;
    /** Whether to auto-load methods on mount */
    autoLoad?: boolean;
    /** Child content */
    children: Snippet;
  }

  let {
    backtestingOnly = true,
    autoLoad = true,
    children,
  }: Props = $props();

  // Auto-load methods if enabled
  if (autoLoad) {
    void methodSelectorStore.loadMethods({
      backtesting: backtestingOnly ? true : undefined,
    });
  }

  // Reset store on unmount to prevent stale data
  onDestroy(() => {
    methodSelectorStore.reset();
  });
</script>

{@render children()}
