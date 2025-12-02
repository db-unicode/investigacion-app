import { writable, derived } from 'svelte/store';
import type { CourseHistoryByTerm } from '$lib/features/course-history/types/course-history.types';
import { fetchCourseHistory, isCourseCodeValid } from '$lib/features/course-history/api/course-history.api';

/**
 * State interface for the dashboard store.
 */
export interface DashboardState {
  /** Current course code entered by user */
  courseCode: string;
  /** Course history data */
  courseHistory: CourseHistoryByTerm | null;
  /** Loading state */
  isLoading: boolean;
  /** Error message if loading failed */
  error: string | null;
}

/**
 * Creates the initial state for the dashboard.
 */
const createInitialState = (): DashboardState => ({
  courseCode: '',
  courseHistory: null,
  isLoading: false,
  error: null,
});

/**
 * Creates a dashboard store with course code management.
 */
const createDashboardStore = () => {
  const { subscribe, set, update } = writable<DashboardState>(
    createInitialState(),
  );

  return {
    subscribe,

    /**
     * Sets the course code and fetches course history.
     * @param code - The course code to set
     */
    async setCourseCode(code: string): Promise<void> {
      const normalized = code.toUpperCase().trim();

      update(state => ({
        ...state,
        courseCode: normalized,
      }));

      // If empty or invalid, clear data
      if (!normalized || !isCourseCodeValid(normalized)) {
        update(state => ({
          ...state,
          courseHistory: null,
          error: null,
          isLoading: false,
        }));
        return;
      }

      // Fetch course history
      update(state => ({ ...state, isLoading: true, error: null }));

      try {
        const history = await fetchCourseHistory(normalized);

        if (Object.keys(history).length === 0) {
          update(state => ({
            ...state,
            courseHistory: null,
            error: 'Course not found.',
            isLoading: false,
          }));
          return;
        }

        update(state => ({
          ...state,
          courseHistory: history,
          isLoading: false,
          error: null,
        }));
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to load course history';

        update(state => ({
          ...state,
          courseHistory: null,
          isLoading: false,
          error: message,
        }));
      }
    },

    /**
     * Clears the course code and related data.
     */
    clear(): void {
      set(createInitialState());
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
 * The main dashboard store instance.
 */
export const dashboardStore = createDashboardStore();

/**
 * Derived store for the current course code.
 */
export const courseCode = derived(
  dashboardStore,
  $store => $store.courseCode,
);

/**
 * Derived store for course history data.
 */
export const courseHistory = derived(
  dashboardStore,
  $store => $store.courseHistory,
);

/**
 * Derived store for loading state.
 */
export const isLoading = derived(
  dashboardStore,
  $store => $store.isLoading,
);

/**
 * Derived store for error state.
 */
export const dashboardError = derived(
  dashboardStore,
  $store => $store.error,
);

/**
 * Derived store for course code validity.
 */
export const isValidCourseCode = derived(dashboardStore, $store =>
  $store.courseCode ? isCourseCodeValid($store.courseCode) : false,
);

/**
 * Derived store for available terms from course history.
 */
export const availableTerms = derived(dashboardStore, $store => {
  if (!$store.courseHistory) return [];
  return Object.keys($store.courseHistory)
    .map(t => parseInt(t, 10))
    .filter(t => !isNaN(t))
    .sort((a, b) => b - a);
});
