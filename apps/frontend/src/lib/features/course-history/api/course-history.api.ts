import type {
  CourseHistoryByTerm,
} from '../types/course-history.types';

const COURSE_HISTORY_PATH = '/api/courses';
const COURSE_CODE_PATTERN = /^[A-Z]{4}-\d{4}$/;

const DEFAULT_API_BASE_URL = 'http://localhost:3000';

/**
 * Returns true if the given course code matches XXXX-DDDD pattern.
 */
export const isCourseCodeValid = (value: string): boolean => {
  return COURSE_CODE_PATTERN.test(value);
};

const getApiBaseUrl = (): string => {
  return import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL;
};

/**
 * Fetches course history by course code from the backend API.
 */
export const fetchCourseHistory = async (
  courseCode: string,
): Promise<CourseHistoryByTerm> => {
  if (!isCourseCodeValid(courseCode)) {
    throw new Error('Course code has invalid format.');
  }

  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${COURSE_HISTORY_PATH}/${courseCode}/history`;

  const response = await fetch(url);

  if (response.status === 404) {
    return {};
  }

  if (!response.ok) {
    throw new Error(
      `Unexpected response status while fetching course history: ${response.status}`,
    );
  }

  const data = (await response.json()) as CourseHistoryByTerm;
  return data;
};
