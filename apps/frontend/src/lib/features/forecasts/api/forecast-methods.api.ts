import type {
  ForecastMethodDto,
  ForecastMethodListDto,
  MethodCategoryDto,
  MethodStatusDto,
} from '@app/contracts';

const FORECAST_METHODS_PATH = '/api/forecasts/methods';
const DEFAULT_API_BASE_URL = 'http://localhost:3000';

/**
 * Returns the configured API base URL.
 */
const getApiBaseUrl = (): string => {
  return import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL;
};

/**
 * Options for filtering forecast methods.
 */
export interface FetchForecastMethodsOptions {
  /** Only fetch methods that support backtesting */
  backtesting?: boolean;
  /** Filter by category */
  category?: MethodCategoryDto;
  /** Filter by status */
  status?: MethodStatusDto;
}

/**
 * Fetches all available forecast methods from the backend API.
 */
export const fetchForecastMethods = async (
  options?: FetchForecastMethodsOptions,
): Promise<ForecastMethodListDto> => {
  const baseUrl = getApiBaseUrl();
  const params = new URLSearchParams();

  if (options?.backtesting !== undefined) {
    params.set('backtesting', String(options.backtesting));
  }
  if (options?.category) {
    params.set('category', options.category);
  }
  if (options?.status) {
    params.set('status', options.status);
  }

  const queryString = params.toString();
  const url = queryString
    ? `${baseUrl}${FORECAST_METHODS_PATH}?${queryString}`
    : `${baseUrl}${FORECAST_METHODS_PATH}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch forecast methods: ${response.statusText}`,
    );
  }

  return response.json() as Promise<ForecastMethodListDto>;
};

/**
 * Fetches a single forecast method by ID.
 */
export const fetchForecastMethod = async (
  methodId: string,
): Promise<ForecastMethodDto> => {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${FORECAST_METHODS_PATH}/${methodId}`;

  const response = await fetch(url);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Method '${methodId}' not found`);
    }
    throw new Error(`Failed to fetch method: ${response.statusText}`);
  }

  return response.json() as Promise<ForecastMethodDto>;
};
