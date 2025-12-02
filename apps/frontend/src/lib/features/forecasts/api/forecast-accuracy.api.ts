import type { ForecastAccuracyResultDto } from '@app/contracts';

const DEFAULT_API_BASE_URL = 'http://localhost:3000';

/**
 * Returns the configured API base URL.
 */
const getApiBaseUrl = (): string => {
  return import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL;
};

/**
 * Options for fetching forecast accuracy data.
 */
export interface FetchForecastAccuracyOptions {
  /** Course code (e.g., "ISIS-3204") */
  courseCode: string;
  /** Forecast method ID */
  methodId: string;
  /** Academic terms to analyze (e.g., [202410, 202420]) */
  terms: number[];
}

/**
 * Fetches forecast accuracy data comparing predicted vs actual enrollments.
 *
 * @throws Error if the request fails or parameters are invalid
 */
export const fetchForecastAccuracy = async (
  options: FetchForecastAccuracyOptions,
): Promise<ForecastAccuracyResultDto> => {
  const { courseCode, methodId, terms } = options;

  if (!courseCode || !methodId || terms.length === 0) {
    throw new Error('courseCode, methodId, and at least one term are required');
  }

  const baseUrl = getApiBaseUrl();
  const termsParam = terms.join(',');
  const url = `${baseUrl}/api/courses/${courseCode}/forecasts/${methodId}/accuracy?terms=${termsParam}`;

  const response = await fetch(url);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Course or forecast method not found');
    }
    if (response.status === 400) {
      const errorData = await response.json().catch(() => ({}));
      const message =
        errorData?.error?.message ?? 'Invalid request parameters';
      throw new Error(message);
    }
    throw new Error(
      `Failed to fetch forecast accuracy: ${response.statusText}`,
    );
  }

  return response.json() as Promise<ForecastAccuracyResultDto>;
};
