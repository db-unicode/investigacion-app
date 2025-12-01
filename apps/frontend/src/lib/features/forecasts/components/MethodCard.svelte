<script lang="ts">
  import type { ForecastMethodDto } from '@app/contracts';
  import { cn } from '$lib/utils/cn';

  interface Props {
    /** Method data */
    method: ForecastMethodDto;
    /** Whether this card is selected */
    isSelected?: boolean;
    /** Click handler */
    onclick?: () => void;
    /** Disabled state (e.g., method doesn't support backtesting) */
    disabled?: boolean;
  }

  let {
    method,
    isSelected = false,
    onclick,
    disabled = false,
  }: Props = $props();

  const statusColors: Record<string, string> = {
    active: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    beta: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    deprecated: 'bg-red-500/20 text-red-300 border-red-500/30',
  };

  const statusLabel: Record<string, string> = {
    active: 'Active',
    beta: 'Beta',
    deprecated: 'Deprecated',
  };
</script>

<button
  type="button"
  role="option"
  aria-selected={isSelected}
  aria-disabled={disabled}
  tabindex={disabled ? -1 : 0}
  {onclick}
  class={cn(
    'w-full rounded-lg border p-4 text-left transition-all',
    'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900',
    disabled
      ? 'cursor-not-allowed border-slate-700/50 bg-slate-800/30 opacity-50'
      : isSelected
        ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/10'
        : 'border-slate-700 bg-slate-800/50 hover:border-slate-600 hover:bg-slate-800',
  )}
>
  <div class="flex items-start justify-between gap-3">
    <div class="flex-1 space-y-1">
      <div class="flex items-center gap-2">
        <!-- Selection indicator -->
        <span
          class={cn(
            'inline-flex h-4 w-4 items-center justify-center rounded-full border',
            isSelected
              ? 'border-blue-500 bg-blue-500'
              : 'border-slate-500 bg-transparent',
          )}
        >
          {#if isSelected}
            <svg
              class="h-2.5 w-2.5 text-white"
              fill="currentColor"
              viewBox="0 0 12 12"
            >
              <path
                d="M3.707 5.293a1 1 0 00-1.414 1.414l2.5 2.5a1 1 0 001.414 0l4.5-4.5a1 1 0 00-1.414-1.414L5.5 7.086 3.707 5.293z"
              />
            </svg>
          {/if}
        </span>

        <h3
          class={cn(
            'text-sm font-medium',
            isSelected ? 'text-blue-200' : 'text-slate-100',
            disabled && 'text-slate-400',
          )}
        >
          {method.label}
        </h3>
      </div>

      <p
        class={cn(
          'text-xs leading-relaxed',
          isSelected ? 'text-slate-300' : 'text-slate-400',
          disabled && 'text-slate-500',
        )}
      >
        {method.shortDescription}
      </p>
    </div>

    <!-- Status badge -->
    <span
      class={cn(
        'inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-xs font-medium',
        statusColors[method.status] ?? statusColors.active,
      )}
    >
      {statusLabel[method.status] ?? method.status}
    </span>
  </div>

  <!-- Capabilities indicators -->
  {#if !disabled && (method.capabilities.supportsBacktesting || method.capabilities.supportsMultiTerm)}
    <div class="mt-3 flex flex-wrap gap-1.5">
      {#if method.capabilities.supportsBacktesting}
        <span
          class="inline-flex items-center rounded bg-slate-700/50 px-1.5 py-0.5 text-xs text-slate-300"
        >
          Backtesting
        </span>
      {/if}
      {#if method.capabilities.supportsMultiTerm}
        <span
          class="inline-flex items-center rounded bg-slate-700/50 px-1.5 py-0.5 text-xs text-slate-300"
        >
          Multi-term
        </span>
      {/if}
    </div>
  {/if}

  <!-- Disabled reason -->
  {#if disabled}
    <p class="mt-2 text-xs text-slate-500">
      This method does not support backtesting
    </p>
  {/if}
</button>
