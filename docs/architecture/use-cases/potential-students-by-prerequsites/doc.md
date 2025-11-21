Here’s a design/guide document you can follow when you implement this use case.

---

# Use Case: Potential Students by Prerequisites Forecaster

## 1. Goal and High–Level Idea

**Goal:**
Given:

* a **target course** `Y` (e.g. `ISIS-3204`), and
* a **target academic term** `X` (e.g. `202410`),

estimate how many students are **potential candidates to enroll** in `Y` at term `X`, based on whether they have already satisfied all prerequisites **before** term `X`, excluding those who have **already passed** `Y` before `X`.

Concretely:

1. Interpret the prerequisite expression for `Y`.
2. Find all students who satisfy that expression before term `X`.
3. Remove any students who already passed `Y` before term `X`.
4. Return the size of the remaining set as the **potential enrollment** for `(Y, X)` and surface relevant details (what prerequisites were used, how many students per prerequisite, etc.).

This forecaster is one implementation of a **generic “course demand forecaster” contract**.

---

## 2. Generic Forecaster Contracts

### 2.1. Domain Contracts (shared by all forecasters)

Location (suggested):

* `packages/contracts/src/forecasts/course-demand-forecast.dto.ts` (DTOs + schemas)
* `apps/backend/src/domain/forecasts/course-demand-forecaster.ts` (domain interfaces)

**Input contract (DTO):**

```ts
export type CourseDemandForecastInputDto = {
  readonly courseCode: string;      // target course, e.g. "ISIS-3204"
  readonly academicTerm: number;    // target term, e.g. 202410
};
```

**Output contract (DTO):**

```ts
export type CourseDemandForecastResultDto = {
  readonly courseCode: string;
  readonly academicTerm: number;
  readonly forecastedEnrollment: number;
  readonly methodId: string;        // e.g. "potential-students-by-prerequisites"
  readonly methodLabel: string;     // human-readable label
  readonly details?: unknown;       // forecaster-specific payload (typed per implementation)
};
```

> The `details` field is intentionally generic (`unknown` in DTO). Each concrete forecaster will define a typed domain structure and cast it when needed.

**Domain interface for forecasters:**

Location: `apps/backend/src/domain/forecasts/course-demand-forecaster.ts`

```ts
export interface CourseDemandForecaster {
  readonly methodId: string;
  readonly methodLabel: string;

  forecast(
    input: CourseDemandForecasterInput,
  ): Promise<CourseDemandForecasterResult>;
}

export interface CourseDemandForecasterInput {
  readonly courseCode: string;
  readonly academicTerm: number;
}

export interface CourseDemandForecasterResult {
  readonly courseCode: string;
  readonly academicTerm: number;
  readonly forecastedEnrollment: number;
  readonly methodId: string;
  readonly methodLabel: string;
  readonly details: unknown;
}
```

Later, the **use case** will adapt between DTOs (from `@app/contracts`) and these domain interfaces.

---

## 3. Specific Forecaster: Potential Students by Prerequisites

### 3.1. Name and Location

**Use case file (Application layer):**

* `apps/backend/src/application/use-cases/forecasts/potential-students-by-prerequisites.use-case.forecaster.ts`

**Domain service file:**

* `apps/backend/src/domain/forecasts/potential-students-by-prerequisites-forecaster.ts`

**Repository interface(s):**

* `apps/backend/src/infrastructure/repositories/prerequisites-repository.ts`
* re-use `EnrollmentRepository` (already exists) with additional methods.

---

## 4. Prerequisite Expression Model

We need a clear formal model for expressions like:

```json
["ISIS-1304", "ISIS-1225", ["FISI-1028", "FISI-1528"]]
```

**Semantics:**

* At the top level, we have an **AND** over a list.
* Each element is either:

  * a **string** course code → the student must have **passed that course**, OR
  * an **array of strings** → the student must have passed **at least one** course from that group (OR).

So:

```json
["A", "B", ["C", "D"]]
```

means:

```text
passed(A) AND passed(B) AND (passed(C) OR passed(D))
```

### 4.1. Domain Types for Prerequisite Expressions

Location: `apps/backend/src/domain/models/prerequisite-expression.ts`

```ts
export type CourseCode = string;

export type PrerequisiteClause =
  | { readonly kind: 'required-course'; readonly courseCode: CourseCode }
  | { readonly kind: 'any-of-group'; readonly courseCodes: CourseCode[] };

export interface PrerequisiteExpression {
  readonly targetCourseCode: CourseCode;
  readonly clauses: PrerequisiteClause[]; // AND over all clauses
}
```

### 4.2. Parsing the JSON/String Representation

**Source representation:**
Database stores a `TEXT` column containing a JSON string like:

```text
["ISIS-1304", "ISIS-1225", ["FISI-1028", "FISI-1528"]]
```

**Domain service:**

* `PrerequisiteParser` parses that JSON into `PrerequisiteExpression`.
* It should validate:

  * top-level is array,
  * elements are either string or array of strings,
  * course codes match expected pattern (`^[A-Z]{4}-\d{4}$`).

Location: `apps/backend/src/domain/services/prerequisite-parser.ts`

Responsibilities:

* Pure (no I/O).
* Throw meaningful errors on malformed data.
* Provide `parse(targetCourseCode: string, rawJson: string): PrerequisiteExpression`.

---

## 5. Persistence Model for Prerequisites

### 5.1. Table Design

You proposed a separate DB. For simplicity and performance, the first implementation can keep everything in the **same SQLite database** (`enrollments.db`), with a new table:

**Table:** `course_prerequisites`

Columns:

* `course_code TEXT PRIMARY KEY NOT NULL`
* `prerequisites_json TEXT NOT NULL`

This gives you a simple key–value mapping between a course and its prerequisite expression.

### 5.2. Repository Interface

Location: `apps/backend/src/infrastructure/repositories/prerequisites-repository.ts`

```ts
export interface PrerequisitesRepository {
  findByCourseCode(
    courseCode: string,
  ): Promise<PrerequisiteExpression | null>;
}
```

Implementation responsibilities:

* Query `course_prerequisites` by `course_code`.
* If found:

  * call `PrerequisiteParser.parse(courseCode, prerequisites_json)`.
* If not found:

  * return `null` (interpreted as “no prerequisite-based forecast available” or “no prerequisites”).

---

## 6. Enrollment Data Requirements

We reuse the existing `enrollments` table with columns:

* `student_id`
* `academic_term`
* `course_code`
* `course_outcome` ∈ `{ 'P', 'F', 'W' }`, where `'P'` = Passed.

### 6.1. Additional Repository Operations

We can extend `EnrollmentRepository` with specialized methods for this forecaster. For clarity, we can add a separate interface:

Location: `apps/backend/src/infrastructure/repositories/enrollment-forecast-repository.ts`
(or extend the existing one if you prefer).

Required operations:

1. **Students who passed a set of courses before a term:**

   ```ts
   findStudentsWhoPassedCoursesBeforeTerm(
     courseCodes: string[],
     academicTerm: number,
   ): Promise<Map<string, Set<number>>>;
   ```

   * Returns a mapping `courseCode → set of student_ids` who have `course_outcome = 'P'` and `academic_term < targetTerm`.
   * Used to compute AND/OR logic in memory.

2. **Students who passed the target course before a term:**

   ```ts
   findStudentsWhoPassedCourseBeforeTerm(
     courseCode: string,
     academicTerm: number,
   ): Promise<Set<number>>;
   ```

   * Students who have already passed the **target** course before `X` (step 2 in your description).

Later we can optimize these to use aggregation and set operations in SQL if needed.

---

## 7. Forecasting Algorithm

For a given `(targetCourseCode, targetAcademicTerm)`:

### Step 1 – Load prerequisites

1. Call `PrerequisitesRepository.findByCourseCode(targetCourseCode)`.
2. If `null`:

   * Option A: return a result with `forecastedEnrollment = 0` and a `details.reason = 'NO_PREREQUISITES_DEFINED'`.
   * Option B: let the orchestrator choose another forecaster; this one simply cannot provide a value.
3. If found, we have a `PrerequisiteExpression` with `clauses`.

### Step 2 – Collect required course codes

From `PrerequisiteExpression.clauses`:

* Extract:

  * `requiredCourses`: set of courses from `kind === 'required-course'`.
  * `groupCourses`: union of all `courseCodes` from `kind === 'any-of-group'`.

**Example:**

```text
["ISIS-1304", "ISIS-1225", ["FISI-1028", "FISI-1528"]]
```

→

* requiredCourses = { "ISIS-1304", "ISIS-1225" }
* groupCourses = { "FISI-1028", "FISI-1528" }
* allCoursesToFetch = requiredCourses ∪ groupCourses

### Step 3 – Fetch passing students per course

Call:

```ts
const passedPerCourse =
  await enrollmentForecastRepository.findStudentsWhoPassedCoursesBeforeTerm(
    allCoursesToFetch,
    targetAcademicTerm,
  );
```

We now have, for each course code, a `Set<student_id>` of students who passed that course before `X`.

### Step 4 – Evaluate the prerequisite expression

To compute the set of **eligible students**:

1. Start with `eligible = ALL_STUDENTS` conceptually, but in practice we build from the first clause.
2. For each `required-course` clause:

   * Intersect `eligible` with `passedPerCourse[courseCode]`.
3. For each `any-of-group` clause with course codes `[C1, C2, ..., Cn]`:

   * Compute `groupEligible = union(passedPerCourse[C1], ..., passedPerCourse[Cn])`.
   * Intersect `eligible` with `groupEligible`.

At the end, `eligible` is the set of **students who satisfied every clause**, i.e. all prerequisites.

Edge cases:

* If any `required-course` has an empty set → `eligible` becomes empty.
* If any `any-of-group` has no passing students for any of its members → `eligible` becomes empty.

### Step 5 – Remove students who already passed the target course

Call:

```ts
const alreadyPassedTarget =
  await enrollmentForecastRepository.findStudentsWhoPassedCourseBeforeTerm(
    targetCourseCode,
    targetAcademicTerm,
  );
```

Compute:

```text
potentialStudents = eligible \ alreadyPassedTarget
```

### Step 6 – Build result

* `forecastedEnrollment = potentialStudents.size`
* `details` should capture:

  * The parsed prerequisite expression.
  * Counts:

    * `eligibleBeforeTargetCourseFilter = eligible.size`
    * `alreadyPassedTargetCount = alreadyPassedTarget.size`
    * `potentialStudentsCount = potentialStudents.size`
  * Optionally, per-prerequisite counts (for debugging / analytics).

---

## 8. Domain Types for Forecaster Details

Location: `apps/backend/src/domain/forecasts/potential-students-by-prerequisites-forecaster.ts`

Example:

```ts
export interface PotentialStudentsByPrerequisitesDetails {
  readonly prerequisiteExpression: PrerequisiteExpression;
  readonly eligibleStudentCountBeforeTargetFilter: number;
  readonly alreadyPassedTargetCount: number;
  readonly potentialStudentCount: number;
  readonly perCoursePassedCounts: Record<string, number>;
}
```

The forecaster will return:

```ts
export interface PotentialStudentsByPrerequisitesResult
  extends CourseDemandForecasterResult {
  readonly details: PotentialStudentsByPrerequisitesDetails;
}
```

When mapping to DTO (`CourseDemandForecastResultDto`), we simply set:

* `methodId = 'potential-students-by-prerequisites'`
* `methodLabel = 'Potential students by prerequisites (set-based)'`
* `details = detailsObject`

---

## 9. Use Case Orchestration

**File:**
`apps/backend/src/application/use-cases/forecasts/potential-students-by-prerequisites.use-case.forecaster.ts`

Responsibilities:

1. Validate input (`courseCode` format, `academicTerm`).

2. Call the domain forecaster:

   ```ts
   const result = await forecaster.forecast({
     courseCode,
     academicTerm,
   });
   ```

3. Map `CourseDemandForecasterResult` → `CourseDemandForecastResultDto` (from `@app/contracts`).

4. Return DTO to controllers.

The use case itself should **not** contain the prerequisite logic; it simply orchestrates and maps.

---

## 10. HTTP API Endpoint (Controller Layer)

Suggested endpoint:

```http
GET /api/courses/:courseCode/forecasts/potential-students?term=202410
```

Responsibilities of the controller:

* Validate:

  * `courseCode` via regex `/^[A-Z]{4}-\d{4}$/`
  * `term` as a 6-digit integer.
* Call the use case.
* Return `200` with `CourseDemandForecastResultDto`.

For now, you can implement **only this single forecaster** behind that endpoint. Later, you can introduce a registry of forecasters if you want multiple methods for the same `(course, term)`.

---

## 11. Step-by-Step Implementation Plan

### Step 1 – Data and schema

1. Add `course_prerequisites` table to SQLite (`enrollments.db`).

2. Seed it with rows like:

   ```sql
   INSERT INTO course_prerequisites (course_code, prerequisites_json)
   VALUES (
     'ISIS-3204',
     '["ISIS-1304","ISIS-1225",["FISI-1028","FISI-1528"]]'
   );
   ```

3. Ensure `enrollments` already has `course_outcome = 'P'` for passed courses and the composite index you added before.

### Step 2 – Domain parsing and models

1. Implement `PrerequisiteExpression`, `PrerequisiteClause` types.
2. Implement `PrerequisiteParser` domain service:

   * `parse(targetCourseCode, rawJson) → PrerequisiteExpression`.
3. Add unit tests for valid and invalid expressions.

### Step 3 – Repositories

1. Implement `PrerequisitesRepository` with:

   * `findByCourseCode(courseCode)` using `PrerequisiteParser`.
2. Extend or create `EnrollmentForecastRepository` with:

   * `findStudentsWhoPassedCoursesBeforeTerm(courseCodes, term)`
   * `findStudentsWhoPassedCourseBeforeTerm(courseCode, term)`

Add tests to confirm the queries work correctly with a small test DB.

### Step 4 – Domain forecaster

1. Implement `PotentialStudentsByPrerequisitesForecaster` that:

   * implements `CourseDemandForecaster`,
   * uses `PrerequisitesRepository` + `EnrollmentForecastRepository`,
   * runs the algorithm described in section 7.

2. Unit test:

   * simple synthetic data sets with known intersections and differences.
   * edge cases (no prerequisites, no students passed any prerequisite, all students already passed target course, etc.).

### Step 5 – Application use case

1. Implement `potential-students-by-prerequisites.use-case.forecaster.ts`:

   * input: `CourseDemandForecastInputDto`,
   * orchestrates forecaster, maps `details` and metadata to `CourseDemandForecastResultDto`.

2. Add tests mocking the forecaster to verify mapping and error handling.

### Step 6 – Controller / endpoint

1. Add a Hono route:

   * `GET /api/courses/{courseCode}/forecasts/potential-students`
   * query param `term` (required).

2. Validate inputs with Zod (using shared DTOs/schemas where possible).

3. Call the use case and return the DTO.

4. Integration test with a small SQLite test DB where you control prerequisites and enrollments.

---

## 12. Testing Strategy

**Unit tests:**

* `PrerequisiteParser`:

  * parses simple AND expressions,
  * parses AND with an `any-of-group`,
  * rejects malformed JSON or wrong types.

* Forecaster algorithm:

  * setups synthetic `PrerequisiteExpression` and in-memory sets for students.
  * verifies result counts for:

    * simple AND,
    * AND with one OR group,
    * multiple OR groups.

* Repositories:

  * run against an in-memory SQLite instance or a small test DB file,
  * verify queries use only students with `course_outcome = 'P'`,
  * verify the term cutoff (`academic_term < X`) is correct.

**Integration tests:**

* Seed a mini DB with:

  * prerequisites for `ISIS-3204`,
  * enrollments for students passing the prerequisite courses and target course.
* Call HTTP endpoint and assert:

  * `forecastedEnrollment` matches expected potential student count,
  * `details` contain consistent counts.

---

This document should give you a clear, layered plan:

* **contracts** for any forecaster,
* a concrete **PotentialStudentsByPrerequisitesForecaster** implementation,
* the necessary **schema + repositories**, and
* the **orchestration use case + HTTP endpoint**.

Once you’re ready, we can turn this into concrete TypeScript files step by step, starting from the domain (parser + forecaster) and then wiring it into the infrastructure and presentation layers.
