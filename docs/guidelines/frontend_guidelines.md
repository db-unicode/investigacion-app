### Svelte / SvelteKit Frontend Guidelines

#### General

* All **code, identifiers, comments, and docs must be in English** and follow the existing TypeScript guidelines.
* All Svelte `<script>` blocks must use **TypeScript**: `\<script lang="ts">`.
* Prefer **clarity over cleverness**; components should be small, focused, and easy to read.
* Use **Svelte 5 runes** (`$state`, `$derived`, `$effect`, `$props`, etc.) as the primary reactivity model, both in `.svelte` and `.svelte.ts` files.

---

### Project & File Structure (SvelteKit)

* Follow SvelteKit’s standard structure: `src/routes` for pages/layouts, `src/lib` for reusable code (components, logic, stores, helpers).

* Organize **by feature/domain**, not just by technical type:

  ```text
  src/
    lib/
      ui/                     # design system / shared UI
      features/
        course-history/
          components/
          logic/
          stores/
          api/
        forecast/
          components/
          logic/
          stores/
          api/
  ```

* Keep route-specific code under `src/routes/...` until a piece is reused; then move it into `$lib`.

---

### Component Types & Responsibilities

**Route components (`+page.svelte`, `+layout.svelte`)**

* Responsibility: **presentation and orchestration only**.
* Consume `data` from `+page.ts` / `+page.server.ts` and pass it to feature components.
* Do not implement domain logic or complex state; delegate to feature components or hooks.

**Feature container components (`src/lib/features/.../components`)**

* Responsibility: connect hooks/logic and UI for a specific feature (e.g. course history, forecast).
* Manage feature-level state (filters, tabs, chart options) using runes.
* Do not perform direct HTTP calls; use `api/` modules and SvelteKit load functions.

**Presentational components**

* Responsibility: render UI given props; emit events.
* No data fetching, no routing, no domain logic.
* Compose shadcn-svelte primitives + Tailwind classes to implement the design.

---

### Logic Extraction & `.svelte.ts` Files

* Extract **reactive feature logic** into `*.svelte.ts` modules using runes:

  * State: `$state`
  * Derived values: `$derived`
  * Side effects: `$effect`

* Example pattern (hook-style):

  ```ts
  // src/lib/features/course-history/logic/useCourseHistory.svelte.ts
  export function useCourseHistory(courseCode: string) {
    let loading = $state(false);
    let error = $state<string | null>(null);
    let data = $state<CourseHistoryPoint[] | null>(null);

    async function load(range: TermRange): Promise<void> {
      loading = true;
      error = null;
      try {
        data = await fetchCourseHistory(courseCode, range);
      } catch {
        error = 'Failed to load course history';
      } finally {
        loading = false;
      }
    }

    return { loading, error, data, load };
  }
  ```

* Components import and use this logic instead of re-implementing it:

  ```svelte
  <script lang="ts">
    import { useCourseHistory } from '$lib/features/course-history/logic/useCourseHistory.svelte';
    const { loading, error, data, load } = useCourseHistory(courseCode);
  </script>
  ```

* Use `.ts` modules (without runes) for **pure, non-reactive logic**: formatting, mapping, validation, calculations.

---

### State & Reactivity

* Prefer runes over legacy `$:` style in new code.
* Use `$state` for local mutable state; avoid global singletons by default.
* Use `$derived` for computed values; keep expressions side-effect free.
* Extract **shared state** into feature stores in `stores/` (either rune-based `.svelte.ts` or classic stores), scoped per feature, not global across the whole app.

---

### Data Fetching & SvelteKit Integration

* Use `+page.server.ts` / `+page.ts` for **data loading** from the backend; do not call backend APIs directly from presentational components.
* Keep load functions thin:

  * Call feature-specific API modules (e.g. `course-history/api/courseHistory.api.ts`).
  * Map raw API responses to typed data structures before passing to the page.
* Use client-side fetch only where strictly necessary (e.g. highly interactive dashboards that refine existing data).

---

### shadcn-svelte & UI Layer

* Treat shadcn-svelte as a **design system foundation**, not as scattered copy-paste snippets.
* Wrap shadcn-svelte primitives into **project-specific UI components** (e.g. `AppButton`, `AppCard`, `AppDialog`) under `src/lib/ui` to centralize styling and behavior.
* For feature-specific UI (e.g. `CourseHistoryCard`, `ForecastPanel`), put components under `features/.../components` and compose from `ui/` + shadcn-svelte primitives.
* Keep accessibility features from shadcn-svelte (ARIA attributes, keyboard navigation) intact when customizing.

---

### Tailwind CSS 4.1 Usage

* Use Tailwind utility classes as the **primary styling mechanism**, directly in markup.
* For repeated complex class combinations, extract them into:

  * Reusable UI components, or
  * Tailwind v4 CSS-first utilities / layers (e.g. custom classes in your main CSS).
* Keep class lists readable by splitting long attribute values across multiple lines in large components.
* Only use `<style>` blocks for rare, non-utility-based styling that cannot be expressed cleanly with Tailwind.

---

### Error Handling & UX

* Handle loading and error states explicitly in feature components:

  * `loading` and `error` from hooks/stores.
  * Render consistent loading skeletons and error messages using shared UI components.
* Do not swallow errors silently; surface user-friendly messages and log detailed errors where appropriate.

---

### Testing & Maintainability

* Ensure that `logic/` and `api/` modules are **testable without Svelte runtime** (pure TypeScript tests).
* Keep `.svelte` files small; if they grow beyond a reasonable size or mix multiple concerns, extract logic into:

  * `*.svelte.ts` hooks/stores, or
  * Smaller child components.
* Use feature-level boundaries to avoid circular dependencies between components and logic.

---

### Clean Frontend Code Expectations for the Agent

* Generate Svelte/SvelteKit code that:

  * Uses **TypeScript everywhere**, following the existing TS style guidelines.
  * Uses **Svelte 5 runes** for reactivity and keeps logic reusable through `*.svelte.ts` where appropriate.
  * Keeps **components focused on UI**, delegating domain and data logic to `logic/`, `stores/`, and `api/` modules.
  * Treats **shadcn-svelte + Tailwind 4.1** as a consistent design system, with reusable UI wrappers.
  * Avoids large, monolithic `.svelte` files by structuring code per feature and separating concerns cleanly.
