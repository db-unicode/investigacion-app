import type { CourseDemandForecastResultDto } from '@app/contracts';

/**
 * Identifiers for supported forecasting methods.
 * For now we only support "potential-students-by-prerequisites".
 */
export type ForecastMethodId =
  'potential-students-by-prerequisites';

export interface CourseForecastParams {
  readonly courseCode: string;
  readonly academicTerm: number;
  readonly methodId: ForecastMethodId;
  readonly fetchFn: typeof fetch;
}

/**
 * Fetches a forecast for (courseCode, academicTerm) using the selected method.
 *
 * This is intentionally simple: one HTTP call per term.
 * The caller is responsible for batching multiple terms with Promise.all.
 */
export async function fetchCourseForecastForTerm(
  params: CourseForecastParams,
): Promise<CourseDemandForecastResultDto> {
  const { courseCode, academicTerm, methodId, fetchFn } = params;

  // For now there is only one method; we keep the switch so adding
  // new forecasters later is trivial.
  let pathSegment: string;

  switch (methodId) {
    case 'potential-students-by-prerequisites': {
      pathSegment = 'potential-students';
      break;
    }

    default: {
      // Compile-time should prevent this, but we keep a runtime guard.
      const unreachable: never = methodId;
      throw new Error(
        `Unsupported forecast method: ${String(unreachable)}`,
      );
    }
  }

  const search = new URLSearchParams({
    term: String(academicTerm),
  });

  const url =
    `/api/courses/${encodeURIComponent(courseCode)}` +
    `/forecasts/${pathSegment}?${search.toString()}`;

  const response = await fetchFn(url);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch forecast: ${response.status} ${response.statusText}`,
    );
  }

  const data =
    (await response.json()) as CourseDemandForecastResultDto;

  return data;
}
