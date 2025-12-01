import { writable, derived } from 'svelte/store';
import type { ForecastMethodDto } from '@app/contracts';
import {
  fetchForecastMethods,
  type FetchForecastMethodsOptions,
} from '../api/forecast-methods.api';

/**
 * State interface for the method selector store.
 */
export interface MethodSelectorState {
  /** All available methods */
  methods: ForecastMethodDto[];
  /** Currently selected method */
  selectedMethod: ForecastMethodDto | null;
  /** Loading state */
  isLoading: boolean;
  /** Error message if loading failed */
  error: string | null;
}

/**
 * Creates the initial state for the method selector.
 */
const createInitialState = (): MethodSelectorState => ({
  methods: [],
  selectedMethod: null,
  isLoading: false,
  error: null,
});

/**
 * Creates a method selector store with loading capabilities.
 */
const createMethodSelectorStore = () => {
  const { subscribe, set, update } = writable<MethodSelectorState>(
    createInitialState(),
  );

  return {
    subscribe,

    /**
     * Loads available forecast methods from the API.
     * @param options - Optional filtering options
     */
    async loadMethods(options?: FetchForecastMethodsOptions): Promise<void> {
      update(state => ({ ...state, isLoading: true, error: null }));

      try {
        const result = await fetchForecastMethods(options);

        update(state => {
          const newState: MethodSelectorState = {
            ...state,
            methods: result.methods,
            isLoading: false,
            error: null,
          };

          // Auto-select first method if none selected
          if (!state.selectedMethod && result.methods.length > 0) {
            newState.selectedMethod = result.methods[0];
          }

          return newState;
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to load methods';

        update(state => ({
          ...state,
          isLoading: false,
          error: message,
        }));
      }
    },

    /**
     * Sets the currently selected method.
     * @param method - The method to select, or null to clear selection
     */
    selectMethod(method: ForecastMethodDto | null): void {
      update(state => ({
        ...state,
        selectedMethod: method,
      }));
    },

    /**
     * Selects a method by its ID.
     * @param methodId - The ID of the method to select
     * @returns true if the method was found and selected
     */
    selectMethodById(methodId: string): boolean {
      let found = false;

      update(state => {
        const method = state.methods.find(m => m.id === methodId);
        if (method) {
          found = true;
          return { ...state, selectedMethod: method };
        }
        return state;
      });

      return found;
    },

    /**
     * Clears the current selection.
     */
    clearSelection(): void {
      update(state => ({
        ...state,
        selectedMethod: null,
      }));
    },

    /**
     * Resets the store to initial state.
     */
    reset(): void {
      set(createInitialState());
    },
  };
};

/**
 * The main method selector store instance.
 * This is a singleton store that can be used across components.
 */
export const methodSelectorStore = createMethodSelectorStore();

/**
 * Derived store for the currently selected method.
 * Useful for components that only need the selected method.
 */
export const selectedMethod = derived(
  methodSelectorStore,
  $store => $store.selectedMethod,
);

/**
 * Derived store for available methods.
 */
export const availableMethods = derived(
  methodSelectorStore,
  $store => $store.methods,
);

/**
 * Derived store for loading state.
 */
export const isMethodsLoading = derived(
  methodSelectorStore,
  $store => $store.isLoading,
);

/**
 * Derived store for error state.
 */
export const methodsError = derived(
  methodSelectorStore,
  $store => $store.error,
);

/**
 * Derived store that filters methods supporting backtesting.
 */
export const backtestingMethods = derived(methodSelectorStore, $store =>
  $store.methods.filter(m => m.capabilities.supportsBacktesting),
);
