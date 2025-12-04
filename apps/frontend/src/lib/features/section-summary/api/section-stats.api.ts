import type { SectionStatsByTermDto } from '@app/contracts';

const DEFAULT_API_BASE_URL = 'http://localhost:3000';
const COURSES_PATH = '/api/courses';

const getApiBaseUrl = (): string => {
  return import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL;
};

const COURSE_CODE_PATTERN = /^[A-Z]{4}-\d{4}$/;

export interface FetchSectionStatsOptions {
  courseCode: string;
  term: number;
}

/**
 * Fetches section statistics for a specific course and academic term.
 *
 * @param options - The course code and term to fetch stats for
 * @returns Section statistics grouped by term
 * @throws Error if validation fails or API request fails
 */
export const fetchSectionStats = async (
  options: FetchSectionStatsOptions,
): Promise<SectionStatsByTermDto> => {
  const { courseCode, term } = options;

  // Validate course code format
  if (!COURSE_CODE_PATTERN.test(courseCode)) {
    throw new Error(
      'Invalid course code format. Expected format: XXXX-DDDD (e.g., ISIS-3204)',
    );
  }

  // Validate term is a positive integer
  if (!Number.isInteger(term) || term <= 0) {
    throw new Error('Invalid academic term. Expected a positive integer.');
  }

  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${COURSES_PATH}/${courseCode}/sections?term=${term}`;

  const response = await fetch(url);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(
        `No section data found for course ${courseCode} in term ${term}`,
      );
    }

    if (response.status === 400) {
      const errorData = await response.json().catch(() => null);
      const message = errorData?.error?.message ?? 'Invalid request parameters';
      throw new Error(message);
    }

    throw new Error(
      `Failed to fetch section statistics: ${response.statusText}`,
    );
  }

  return response.json() as Promise<SectionStatsByTermDto>;
};
