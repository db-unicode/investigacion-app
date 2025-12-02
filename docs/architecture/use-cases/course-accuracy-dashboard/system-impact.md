# Course Accuracy Dashboard - System Impact Analysis

## 1. Overview

This document analyzes the impact of the Course Accuracy Dashboard on existing system components, particularly the already-implemented `frontend-method-selector` use case.

---

## 2. Impact Summary

| Component | Impact Level | Action Required |
|-----------|--------------|-----------------|
| `MethodSelectorContext` | Low | Minor extension |
| `MethodSelectorPanel` | None | Reuse as-is |
| `AccuracyTableContainer` | Low | Wrapper component |
| `useForecastMethods` hook | None | Reuse as-is |
| `useForecastAccuracy` hook | None | Reuse as-is |
| `useCourseHistory` hook | None | Reuse as-is |
| API endpoints | None | No changes |
| Contracts | None | No changes |

---

## 3. Detailed Impact Analysis

### 3.1 MethodSelectorContext

**Current Implementation:**

```typescript
// apps/frontend/src/contexts/MethodSelectorContext.tsx
interface MethodSelectorContextValue {
  selectedMethod: ForecastMethodDto | null;
  setSelectedMethod: (method: ForecastMethodDto | null) => void;
  methods: ForecastMethodDto[];
  isLoading: boolean;
  error: Error | null;
}
```

**Impact:** Low - No structural changes required

**Changes:**

The existing context works perfectly for the dashboard. The only consideration is the context hierarchy:

```typescript
// New hierarchy
<DashboardProvider>        // NEW - provides courseCode
  <MethodSelectorProvider>  // EXISTING - provides selectedMethod
    <DashboardContent />
  </MethodSelectorProvider>
</DashboardProvider>
```

**Backward Compatibility:**

- Existing pages using `MethodSelectorProvider` directly continue to work
- The dashboard simply wraps it in an additional context
- No breaking changes to the API

---

### 3.2 MethodSelectorPanel

**Current Implementation:**

```typescript
// apps/frontend/src/components/forecasts/MethodSelectorPanel.tsx
interface MethodSelectorPanelProps {
  courseCode: string;
  onMethodSelect?: (method: ForecastMethodDto) => void;
  className?: string;
}
```

**Impact:** None - Reuse as-is

**Integration:**

The panel can be used directly in the dashboard sidebar:

```tsx
// CourseAccuracyDashboard.tsx
<aside className="dashboard-sidebar">
  <MethodSelectorPanel />  {/* Works without modification */}
</aside>
```

**Note:** If `MethodSelectorPanel` currently requires `courseCode` as a prop, it can optionally be modified to read from `DashboardContext` when no prop is provided:

```typescript
function MethodSelectorPanel({ courseCode: propCourseCode, ...props }: MethodSelectorPanelProps) {
  const dashboardContext = useDashboardOptional(); // Safe hook that doesn't throw
  const courseCode = propCourseCode ?? dashboardContext?.courseCode;

  // ... rest of implementation
}
```

---

### 3.3 AccuracyTableContainer

**Current Implementation:**

```typescript
// apps/frontend/src/components/forecasts/AccuracyTableContainer.tsx
interface AccuracyTableContainerProps {
  courseCode: string;
  terms?: number[];
  className?: string;
}
```

**Impact:** Low - Wrapper component added

**Changes:**

Create a context-aware wrapper that doesn't modify the original component:

```typescript
// NEW FILE: AccuracyTableWithContext.tsx
import { AccuracyTableContainer } from '../forecasts/AccuracyTableContainer';
import { useDashboard } from '../../contexts/DashboardContext';

export function AccuracyTableWithContext() {
  const { courseCode, isValidCourseCode } = useDashboard();

  if (!courseCode || !isValidCourseCode) {
    return <AccuracyTablePlaceholder />;
  }

  // Delegates to existing component
  return <AccuracyTableContainer courseCode={courseCode} />;
}
```

**Backward Compatibility:**

- `AccuracyTableContainer` remains unchanged
- Existing usages continue to work
- New wrapper is additive, not modifying

---

### 3.4 MethodCard

**Current Implementation:**

```typescript
interface MethodCardProps {
  method: ForecastMethodDto;
  isSelected: boolean;
  onClick: () => void;
  disabled?: boolean;
}
```

**Impact:** None

The `MethodCard` component is used internally by `MethodSelectorPanel` and doesn't need modification.

---

### 3.5 Hooks

#### useForecastMethods

**Impact:** None - Reuse as-is

```typescript
// Existing hook works for the dashboard
const { methods, isLoading, error } = useForecastMethods({
  backtestingOnly: true,
});
```

#### useForecastAccuracy

**Impact:** None - Reuse as-is

```typescript
// Existing hook called by AccuracyTableContainer
const { data, isLoading, error } = useForecastAccuracy({
  courseCode,
  methodId: selectedMethod?.id ?? null,
  enabled: !!selectedMethod,
});
```

#### useCourseHistory

**Impact:** None - Reuse as-is

```typescript
// Used by SummaryTable component
const { data: history, isLoading, error } = useCourseHistory(courseCode);
```

---

## 4. New Components Required

| Component | Purpose | Dependencies |
|-----------|---------|--------------|
| `DashboardContext` | Share courseCode across components | React Context |
| `DashboardProvider` | Context provider | React |
| `CourseInput` | Course code input with validation | DashboardContext |
| `SummaryTable` | Display course history summary | useCourseHistory |
| `SummaryTableWithContext` | Context-aware wrapper | DashboardContext |
| `AccuracyTableWithContext` | Context-aware wrapper | DashboardContext, MethodSelectorContext |
| `DashboardEmptyState` | Empty state UI | None |
| `CourseAccuracyDashboard` | Main page component | All above |

---

## 5. Routing Impact

### New Route

```typescript
// apps/frontend/src/routes.tsx
import { CourseAccuracyDashboard } from './components/dashboard/CourseAccuracyDashboard';

export const routes = [
  // ... existing routes
  {
    path: '/dashboard',
    element: <CourseAccuracyDashboard />,
  },
];
```

### Existing Routes

No changes to existing routes. The dashboard is additive.

---

## 6. API Impact

### No Backend Changes Required

The dashboard uses existing API endpoints:

| Endpoint | Used By | Change |
|----------|---------|--------|
| `GET /api/forecasts/methods` | MethodSelectorPanel | None |
| `GET /api/courses/{code}/history` | SummaryTable | None |
| `GET /api/courses/{code}/forecasts/{method}/accuracy` | AccuracyTable | None |

---

## 7. Type/Contract Impact

### No Contract Changes

All existing DTOs are reused:

- `ForecastMethodDto` - Method information
- `ForecastMethodListDto` - List of methods
- `ForecastAccuracyResultDto` - Accuracy data
- `CourseHistoryPointDto` - Course history (if exists)

---

## 8. Migration Strategy

Since this is an additive feature, no migration is required. The implementation can proceed in phases:

### Phase 1: Core Infrastructure

1. Create `DashboardContext` and `DashboardProvider`
2. Create `CourseInput` component
3. Create `useDebounce` hook (if not exists)

### Phase 2: Dashboard Components

1. Create `SummaryTable` component
2. Create context wrappers (`SummaryTableWithContext`, `AccuracyTableWithContext`)
3. Create `DashboardEmptyState`

### Phase 3: Integration

1. Create `CourseAccuracyDashboard` page
2. Add route configuration
3. Add navigation link (if desired)

### Phase 4: Enhancement (Optional)

1. Add URL state synchronization
2. Add course autocomplete
3. Add recent courses feature

---

## 9. Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Context conflicts | Low | Medium | Use unique context names, proper provider hierarchy |
| Performance regression | Low | Low | Use existing caching, memoization |
| Breaking existing pages | Very Low | High | Use wrapper components, don't modify originals |
| CSS conflicts | Low | Low | Use BEM naming, scoped styles |

---

## 10. Testing Impact

### Existing Tests

- All existing unit tests for `MethodSelectorContext` should pass
- All existing tests for `AccuracyTableContainer` should pass
- No modification to existing test files

### New Tests Required

See [Testing Guide](./testing-guide.md) for details:

- `DashboardContext.test.tsx` - Context behavior
- `CourseInput.test.tsx` - Input validation, debouncing
- `SummaryTable.test.tsx` - Data display, loading/error states
- `CourseAccuracyDashboard.test.tsx` - Integration tests

---

## 11. Rollback Plan

Since this is purely additive:

1. Remove the `/dashboard` route
2. Delete new components in `components/dashboard/`
3. Delete `DashboardContext`
4. No changes to existing components to revert

---

## 12. Summary

### What Changes

- New context: `DashboardContext`
- New components: 7 new components in `components/dashboard/`
- New route: `/dashboard`
- New hook: `useDebounce` (if not exists)

### What Stays the Same

- `MethodSelectorContext` - unchanged
- `MethodSelectorPanel` - unchanged
- `AccuracyTableContainer` - unchanged
- `AccuracyTable` - unchanged
- All hooks - unchanged
- All API endpoints - unchanged
- All contracts/DTOs - unchanged
- All existing routes - unchanged
- All existing tests - unchanged

### Conclusion

The Course Accuracy Dashboard is designed as a **pure additive feature** that reuses existing components through composition and context wrappers. The impact on the already-implemented `frontend-method-selector` is minimal, requiring no modifications to its core components.

---

## 13. Related Documents

- [Architecture](./architecture.md)
- [Implementation Guide](./implementation-guide.md)
- [Testing Guide](./testing-guide.md)
- [Frontend Method Selector - Architecture](../frontend-method-selector/architecture.md)
- [Frontend Accuracy Table - Architecture](../frontend-accuracy-table/architecture.md)
