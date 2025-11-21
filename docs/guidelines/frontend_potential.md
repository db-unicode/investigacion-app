Nice, con tus respuestas ya está bastante claro. Te dejo el **documento en inglés** con el diseño y los pasos de implementación.

---

# Feature Design: Course History + Forecast Evaluation

## 1. Overview

Goal: extend the existing **Course History by Term** view for a single course so that:

* The user can **select one forecaster at a time** (e.g. “Potential students by prerequisites”).
* For each **historical academic term** of that course, the UI shows:

  * actual enrollments,
  * forecasted enrollments (what the forecaster would have predicted *before* that term, using only data up to that term),
  * difference and accuracy.
* For the **next upcoming term**, the UI shows only the forecasted enrollments.
* A **side panel (Course Forecaster Data)** summarizes accuracy over all historical terms.

Layout (high-level):

* Left: existing **Course History Table** (one row per term).
* Middle: **Course Forecaster Data** (aggregated stats).
* Right: **Forecaster selector** (A/B/C) – only one can be active at a time.

When the user switches forecaster, the table is **recomputed** for that forecaster and the previous forecast columns are replaced.

---

## 2. Data & Metrics

### 2.1. Existing data

You already have:

* `CourseHistoryByTermDto` from `@app/contracts`, roughly:

```ts
type CourseHistoryByTermDto = Record<
  string, // academicTerm as string: "202010", ...
  {
    enrolled: number;
    passed: number;
    failed: number;
    withdrawn: number;
  }
>;
```

* A backend endpoint like:

```http
GET /api/courses/:courseCode/history
→ CourseHistoryByTermDto
```

* A forecast endpoint:

```http
GET /api/courses/:courseCode/forecasts/potential-students?term=202410
→ CourseDemandForecastResultDto
```

where `CourseDemandForecastResultDto` (from `@app/contracts`) contains:

* `courseCode`
* `academicTerm`
* `forecastedEnrollment`
* `methodId`
* `methodLabel`
* `details` (forecaster specific)

### 2.2. What we need per term on the frontend

For each **academic term T** (historical):

* `academicTerm: string`
* `enrolledActual: number` (from history)
* `forecastedEnrollments: number` (from forecaster call)
* `difference: number`
  `difference = forecastedEnrollments - enrolledActual`
* `accuracy: number | null`

  * `accuracy = 1 - |forecasted - actual| / actual`
  * if `actual === 0`, accuracy is `null` (or handled specially in UI).

For the **next future term**:

* `academicTerm: string`
* `enrolledActual: null`
* `forecastedEnrollments: number`
* `difference: null`
* `accuracy: null`

This “view model” is computed **entirely on the frontend**.

---

## 3. Forecaster usage model

* Only **one forecaster is active at a time** (initially A = `potential-students-by-prerequisites`).
* The frontend will call the **per-term endpoint** once per term:

```http
GET /api/courses/:courseCode/forecasts/:method?term=T
```

For now you already have:

```http
GET /api/courses/:courseCode/forecasts/potential-students?term=T
```

so:

* Historical evaluation: loop over each `academicTerm` present in `CourseHistoryByTermDto` and call the forecast endpoint.
* Future term: call the same endpoint with the **next academic term** (computed client-side or provided by the backend) to get only a forecast.

Data leakage: by design, each call uses a `term` and the backend forecaster only looks at data **strictly before** that term. That satisfies your requirement: “use only data before that term”.

---

## 4. UI Behavior

### 4.1. Table behavior

Base table: one row per academic term (sorted descending by term), with columns:

* `Academic Term`
* `Enrolled`
* `Passed`
* `Failed`
* `Withdrawn`

When a forecaster is selected, **three additional columns** appear:

* `Forecasted Enrollments`
* `Difference`
* `Accuracy %`

For **historical rows**:

* `Forecasted Enrollments` shows the forecast.
* `Difference` shows `+X` or `-X` where `X = forecast - actual`.

  * Color:

    * **Green** when `difference < 0` (underestimation: predicted fewer than actual).
    * **Red** when `difference > 0` (overestimation: predicted more than actual).
  * `0` can be neutral/default color.
* `Accuracy %`:

  * `accuracy = 1 - |forecast - actual| / actual` converted to percentage.
  * If `actual === 0` → show `"N/A"` and no color.
  * Simple thresholds for color:

    * ≥ 90%: green,
    * 70–89%: amber,
    * < 70%: red.

For the **future term row**:

* `Forecasted Enrollments`: number.
* `Difference`: `"N/A"`.
* `Accuracy %`: `"N/A"`.

### 4.2. Side summary panel (Course Forecaster Data)

The middle blue block shows **aggregated metrics over all evaluated historical terms** for the currently selected forecaster:

Example content:

* `Forecaster: Potential students by prerequisites`
* `Evaluated terms: N`
* `Mean forecasted enrollments` (average forecast)
* `Mean absolute difference (MAE)`
* `Mean accuracy %` (average of `accuracy` over terms with `actual > 0`)
* Possibly: best term / worst term by accuracy (optional).

This panel only considers **historical terms** (where both forecast and actual exist).

---

## 5. Frontend Architecture

You already use SvelteKit + Svelte 5, feature folders and runes. We extend the existing `course-history` feature.

### 5.1. Folder structure

```text
apps/frontend/
  src/
    lib/
      features/
        course-history/
          api/
            courseHistory.api.ts
            courseForecast.api.ts       # NEW
          logic/
            useCourseHistory.svelte.ts
            useCourseHistoryForecast.svelte.ts   # NEW
          components/
            CourseHistoryPanel.svelte
            CourseHistoryTable.svelte
            ForecasterSelector.svelte           # NEW
            CourseForecasterSummary.svelte      # NEW
```

* `CourseHistoryPanel.svelte`: container for the whole green+blue+yellow layout.
* `CourseHistoryTable.svelte`: existing table, extended with optional forecast columns.
* `ForecasterSelector.svelte`: UI to choose the active forecaster (A/B/C).
* `CourseForecasterSummary.svelte`: summary panel in the blue block.
* `useCourseHistoryForecast.svelte.ts`: rune-based logic to fetch forecasts and build per-term view models.

### 5.2. API layer

`courseForecast.api.ts` (simplified shape):

```ts
// apps/frontend/src/lib/features/course-history/api/courseForecast.api.ts
import type { CourseDemandForecastResultDto } from '@app/contracts';

export type ForecastMethodId =
  'potential-students-by-prerequisites'; // extend later with 'method-b', 'method-c', ...

export async function fetchCourseForecastForTerm(
  fetchFn: typeof fetch,
  params: {
    courseCode: string;
    academicTerm: number;
    methodId: ForecastMethodId;
  },
): Promise<CourseDemandForecastResultDto> {
  const search = new URLSearchParams({
    term: String(params.academicTerm),
  });

  // For now methodId is mapped to path segment:
  const url =
    `/api/courses/${params.courseCode}` +
    `/forecasts/potential-students?${search.toString()}`;

  const response = await fetchFn(url);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch forecast (${response.status} ${response.statusText})`,
    );
  }

  const data = (await response.json()) as CourseDemandForecastResultDto;
  return data;
}
```

Later, when you add Forecaster B/C, you can map `methodId` → endpoint path.

---

## 6. Frontend Logic: `useCourseHistoryForecast`

Create a rune-based logic module:

```ts
// apps/frontend/src/lib/features/course-history/logic/useCourseHistoryForecast.svelte.ts
import type {
  CourseHistoryByTermDto,
} from '@app/contracts';
import { $state, $derived } from 'svelte/reactivity'; // Svelte 5 runes pseudo-import
import {
  fetchCourseForecastForTerm,
  type ForecastMethodId,
} from '../api/courseForecast.api';

export interface CourseHistoryForecastRow {
  readonly academicTerm: string;
  readonly enrolledActual: number | null;
  readonly forecastedEnrollments: number | null;
  readonly difference: number | null;
  readonly accuracy: number | null;
  readonly isFuture: boolean;
}

export interface CourseForecasterSummary {
  readonly evaluatedTerms: number;
  readonly meanAbsoluteDifference: number | null;
  readonly meanAccuracy: number | null;
}

export function useCourseHistoryForecast(params: {
  courseCode: string;
  historyByTerm: CourseHistoryByTermDto;
  nextAcademicTerm: number; // computed outside
  fetchFn: typeof fetch;
}) {
  const { courseCode, historyByTerm, nextAcademicTerm, fetchFn } = params;

  let selectedMethodId = $state<ForecastMethodId>(
    'potential-students-by-prerequisites',
  );

  let loading = $state(false);
  let error = $state<string | null>(null);
  let rows = $state<CourseHistoryForecastRow[]>([]);

  async function loadForecasts(): Promise<void> {
    loading = true;
    error = null;

    try {
      const historicalTerms = Object.keys(historyByTerm)
        .map((term) => Number(term))
        .sort((a, b) => a - b);

      const allTerms = [...historicalTerms, nextAcademicTerm];

      const forecastResults = await Promise.all(
        allTerms.map((term) =>
          fetchCourseForecastForTerm(fetchFn, {
            courseCode,
            academicTerm: term,
            methodId: selectedMethodId,
          }),
        ),
      );

      const forecastByTerm = new Map<number, number>();

      for (const result of forecastResults) {
        forecastByTerm.set(
          result.academicTerm,
          result.forecastedEnrollment,
        );
      }

      const newRows: CourseHistoryForecastRow[] = [];

      for (const term of historicalTerms) {
        const key = String(term);
        const stats = historyByTerm[key];
        const actual = stats.enrolled;
        const forecast = forecastByTerm.get(term) ?? null;

        let difference: number | null = null;
        let accuracy: number | null = null;

        if (forecast != null) {
          difference = forecast - actual;

          if (actual > 0) {
            const relativeError = Math.abs(forecast - actual) / actual;
            accuracy = 1 - relativeError;
          }
        }

        newRows.push({
          academicTerm: key,
          enrolledActual: actual,
          forecastedEnrollments: forecast,
          difference,
          accuracy,
          isFuture: false,
        });
      }

      // Future term row
      const futureForecast =
        forecastByTerm.get(nextAcademicTerm) ?? null;

      newRows.push({
        academicTerm: String(nextAcademicTerm),
        enrolledActual: null,
        forecastedEnrollments: futureForecast,
        difference: null,
        accuracy: null,
        isFuture: true,
      });

      // Sort descending by term for display
      rows = newRows.sort(
        (a, b) =>
          Number(b.academicTerm) - Number(a.academicTerm),
      );
    } catch (err) {
      error = 'Failed to load forecasts';
      // Optional: log error detail somewhere.
    } finally {
      loading = false;
    }
  }

  const summary = $derived<CourseForecasterSummary>(() => {
    const historicalRows = rows.filter((row) => !row.isFuture);

    if (historicalRows.length === 0) {
      return {
        evaluatedTerms: 0,
        meanAbsoluteDifference: null,
        meanAccuracy: null,
      };
    }

    let absDiffSum = 0;
    let absDiffCount = 0;
    let accuracySum = 0;
    let accuracyCount = 0;

    for (const row of historicalRows) {
      if (row.difference != null) {
        absDiffSum += Math.abs(row.difference);
        absDiffCount += 1;
      }

      if (row.accuracy != null) {
        accuracySum += row.accuracy;
        accuracyCount += 1;
      }
    }

    return {
      evaluatedTerms: historicalRows.length,
      meanAbsoluteDifference:
        absDiffCount > 0 ? absDiffSum / absDiffCount : null,
      meanAccuracy:
        accuracyCount > 0 ? accuracySum / accuracyCount : null,
    };
  });

  return {
    selectedMethodId,
    loading,
    error,
    rows,
    summary,
    loadForecasts,
  };
}
```

* `selectedMethodId` can later be changed from the `ForecasterSelector`.
* `loadForecasts()` is called whenever the forecaster changes or when the panel is mounted.

---

## 7. Components

### 7.1. `ForecasterSelector.svelte`

* Shows the list of available forecasters (A/B/C).
* For now, only A is wired (potential-students-by-prerequisites).
* Emits `change` or directly mutates `selectedMethodId` passed in by reference (depending on how you set up runes in the parent).

### 7.2. `CourseHistoryTable.svelte`

* Extend existing component to accept rows with forecast fields:

```ts
export type CourseHistoryTableRow = {
  academicTerm: string;
  enrolled: number;
  passed: number;
  failed: number;
  withdrawn: number;
  forecastedEnrollments?: number | null;
  difference?: number | null;
  accuracy?: number | null;
  isFuture?: boolean;
};
```

* The parent maps `CourseHistoryForecastRow` + `CourseHistoryByTermDto` into this structure.
* Table shows forecast columns **only if** `showForecastColumns === true`.

Color logic (Tailwind classes) applied based on:

* `difference` sign,
* `accuracy` thresholds (>=0.9 green, 0.7–0.9 amber, else red).

### 7.3. `CourseForecasterSummary.svelte`

* Receives `summary: CourseForecasterSummary` and `selectedMethodId`.
* Renders:

  * method name (e.g. “Potential students by prerequisites”),
  * number of evaluated terms,
  * mean accuracy as percentage,
  * mean absolute difference (rounded).

---

## 8. Route orchestration: `CourseHistoryPanel.svelte` + `+page.ts`

### 8.1. `+page.ts` for course history route

For route e.g. `/courses/[courseCode]`, server-side load:

* Fetch course history.
* Compute `nextAcademicTerm` (simple rule: `maxTerm + 10` if your codes are `YYYY10`/`YYYY20`, or ask backend later if needed).

```ts
// apps/frontend/src/routes/courses/[courseCode]/+page.ts
import type { PageLoad } from './$types';
import type {
  CourseHistoryByTermDto,
} from '@app/contracts';

export const load: PageLoad = async ({ fetch, params }) => {
  const { courseCode } = params;

  const response = await fetch(
    `/api/courses/${courseCode}/history`,
  );

  if (!response.ok) {
    throw new Error('Failed to load course history');
  }

  const history =
    (await response.json()) as CourseHistoryByTermDto;

  const terms = Object.keys(history).map((t) => Number(t));
  const maxTerm = terms.length > 0 ? Math.max(...terms) : 0;

  // Simple heuristic for next term, can be refined later.
  const nextAcademicTerm = maxTerm + 10;

  return {
    courseCode,
    historyByTerm: history,
    nextAcademicTerm,
  };
};
```

### 8.2. `CourseHistoryPanel.svelte`

* Uses `useCourseHistoryForecast` with props from `data`.
* Renders:

  * forecaster selector (right side),
  * course history table (left),
  * forecaster summary (middle),
  * handles loading/error states when a forecaster is selected.

Pseudo-structure:

```svelte
<script lang="ts">
  import type { PageData } from './$types';
  import CourseHistoryTable from '$lib/features/course-history/components/CourseHistoryTable.svelte';
  import ForecasterSelector from '$lib/features/course-history/components/ForecasterSelector.svelte';
  import CourseForecasterSummary from '$lib/features/course-history/components/CourseForecasterSummary.svelte';
  import { useCourseHistoryForecast } from '$lib/features/course-history/logic/useCourseHistoryForecast.svelte';

  export let data: PageData;

  const {
    selectedMethodId,
    loading,
    error,
    rows,
    summary,
    loadForecasts,
  } = useCourseHistoryForecast({
    courseCode: data.courseCode,
    historyByTerm: data.historyByTerm,
    nextAcademicTerm: data.nextAcademicTerm,
    fetchFn: fetch,
  });

  // Initial load
  $effect(() => {
    loadForecasts();
  });
</script>

<div class="grid grid-cols-[3fr_minmax(0,1.25fr)_minmax(0,1fr)] gap-4">
  <div class="bg-green-50 rounded-2xl p-4">
    <CourseHistoryTable
      rows={rows}
      showForecastColumns={true}
    />
  </div>

  <div class="bg-blue-50 rounded-2xl p-4">
    <CourseForecasterSummary
      methodId={$selectedMethodId}
      summary={$summary}
      loading={$loading}
      error={$error}
    />
  </div>

  <div class="bg-amber-50 rounded-2xl p-4 space-y-4">
    <ForecasterSelector
      selectedMethodId={$selectedMethodId}
      onChange={(id) => {
        selectedMethodId = id;
        loadForecasts();
      }}
    />
  </div>
</div>
```

(Adapt the exact runes usage to how you currently import them; the key idea is: when `selectedMethodId` changes, call `loadForecasts()` again.)

---

## 9. Step-by-step Implementation Summary

1. **Backend** – nothing more to change right now:

   * You already have:

     * `GET /api/courses/:courseCode/history`
     * `GET /api/courses/:courseCode/forecasts/potential-students?term=...`

2. **Contracts** – already in place:

   * `CourseHistoryByTermDto`
   * `CourseDemandForecastResultDto`

3. **Frontend: API layer**

   * Add `courseForecast.api.ts` with `fetchCourseForecastForTerm`.

4. **Frontend: logic**

   * Create `useCourseHistoryForecast.svelte.ts`:

     * state for `selectedMethodId`, `loading`, `error`, `rows`, `summary`.
     * `loadForecasts()` that:

       * iterates terms,
       * calls forecast endpoint per term,
       * builds `CourseHistoryForecastRow[]`,
       * computes `summary`.

5. **Frontend: routing**

   * In `+page.ts` of the course route:

     * load history,
     * compute `nextAcademicTerm`,
     * pass them to the page.

6. **Frontend: components**

   * Extend `CourseHistoryTable` to support forecast columns + color coding.
   * Add `CourseForecasterSummary` component.
   * Add `ForecasterSelector` component.
   * Update `CourseHistoryPanel` to:

     * wire `useCourseHistoryForecast`,
     * show table + summary + selector in the three-block layout.

7. **UX validation**

   * Test with a course like `ISIS-3204`:

     * confirm historical rows show forecast/diff/accuracy,
     * confirm future term row shows forecast and `N/A` in the other columns,
     * verify colors reflect sign of `difference` and accuracy thresholds,
     * verify switching forecaster (once you implement B/C) recomputes rows.

---

Cuando quieras, el siguiente paso puede ser:
tomar este diseño y escribir el código real de `courseForecast.api.ts`, `useCourseHistoryForecast.svelte.ts` y los componentes de UI, siguiendo tus guidelines de Svelte/TS.
