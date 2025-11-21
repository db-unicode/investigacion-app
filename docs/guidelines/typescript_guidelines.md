### General

* All **code, identifiers, comments, and docs must be in English**.
* Prefer **clarity over cleverness**; readability beats “smart” hacks.
* Follow the **Google TypeScript Style Guide** as default reference.

---

### Naming & Files

* Use **`UpperCamelCase`** for classes, interfaces, types, enums, and decorators.
* Use **`lowerCamelCase`** for variables, parameters, functions, methods, and properties.
* Use **`CONSTANT_CASE`** for constants and enum values.
* Do **not** use leading/trailing underscores; do **not** prefix interfaces with `I`.
* Names must be **descriptive and unambiguous**; avoid project-specific or cryptic abbreviations except in very small local scopes.

---

### Modules, Imports & Exports

* Use **ES modules only**: `import` / `export`.
* **Do not** use `namespace` or `module` for namespacing; organize with modules and folders.
* Use **named exports only**; **avoid default exports**.
* Prefer **relative imports** within a project (`./foo`, `../bar`) and keep paths shallow when possible.
* Use `import type` / `export type` when a symbol is used purely as a type.

---

### Variables & Constants

* Always use **`const` or `let`**; **never use `var`**.
* Default to `const`; use `let` only when reassignment is required.
* Declare **one variable per statement** for clarity.
* Avoid magic numbers/strings; extract them into **named constants** or enums.

---

### Types & Strictness

* Enable **strict mode** in `tsconfig.json` (`"strict": true`) and keep it that way.
* **Avoid `any`**; prefer:

  * Specific types (`string`, `number`, etc.)
  * `unknown` when the type is truly dynamic and must be checked
  * Custom `interface` / `type` definitions for structured data
* Let TypeScript **infer types** when the intent is obvious; add explicit types for public APIs, complex logic, or when inference harms clarity.

---

### Interfaces, Types & Enums

* Prefer **`interface`** for object shapes that are intended to be extended or implemented; use `type` for unions, mapped types, and composition.
* Use **union types** and **discriminated unions** instead of ad-hoc flags where they clarify state.
* Use **string enums** or union string literals instead of raw magic string values.

---

### Classes & Members

* Use classes when you truly have **state + behavior**; otherwise prefer plain functions and types.
* Mark properties that never change after construction as **`readonly`**.
* Use constructor parameter properties (`constructor(private readonly repo: UserRepository)`) to avoid boilerplate, but keep the constructor simple.
* Avoid `#private` fields; use `private` with visibility modifiers instead.

---

### Functions & API Design

* Functions should do **one clear thing** and be short; extract helpers rather than building huge functions.
* Prefer **pure functions** for business logic; keep side effects (I/O, logging, HTTP) at the edges.
* Use **named parameters via object** for functions with many options, plus destructuring in the signature.
* Always specify **return types** on exported functions, class methods in public APIs, and non-trivial logic.

---

### Collections & Data Handling

* Use `Array<T>` / `T[]` with **array methods** (`map`, `filter`, `reduce`) instead of manual loops when this improves readability.
* Use `Record<K, V>` or index signatures for dictionary-like objects; use `Map` / `Set` when their semantics are clearer.
* Do not mutate arguments in place unless clearly documented; prefer returning new objects/arrays.

---

### Nullability & Errors

* Treat `null` / `undefined` explicitly; avoid relying on falsy checks when the difference matters.
* Use **optional chaining** and **nullish coalescing** to handle nullable fields safely, not as a substitute for good modeling.
* Throw **typed, meaningful errors**; avoid bare `throw 'message'`.
* Catch only the errors you can handle and rethrow or propagate others.

---

### Comments & Documentation

* Prefer **self-explanatory names** over comments.
* Use **JSDoc (`/** ... */`) for exported APIs** and for complex logic; describe the “why”, not just the “what”.
* Avoid comments that duplicate type information or parameter names.
* Use `//` inline comments sparingly to explain non-obvious implementation details or business rules.

---

### Project Structure & Tooling

* Organize files **by feature/domain**, not only by technical layer, to keep related types, services, and components together.
* Use **ESLint + Prettier** or **Google’s `gts`** for automated style and linting; do not override rules casually.
* Keep public module APIs small: export only what external code truly needs.

---

### Clean Code Expectations for the Agent

* Generate **TypeScript that compiles with `strict`**, passes linting with Google-style rules, and uses:

  * Descriptive English identifiers
  * ES modules with named exports
  * `const` by default, no `var`, no `any`
  * Clear separation of concerns (domain logic vs I/O vs presentation)
  * No magic values (use constants/enums)
  * Minimal but meaningful documentation and comments.
