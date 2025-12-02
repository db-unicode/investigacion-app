# Course Accuracy Dashboard Implementation Guide

## 1. Overview

This guide provides step-by-step instructions for implementing the Course Accuracy Dashboard, which combines the Summary Table and Forecast Accuracy Backtesting components with a shared course input.

---

## 2. Prerequisites

Before starting implementation, ensure:

- [ ] `frontend-method-selector` use case is fully implemented
- [ ] `frontend-accuracy-table` use case is fully implemented
- [ ] `forecast-accuracy-backtesting` backend is functional
- [ ] Course history endpoint exists: `GET /api/courses/{code}/history`

---

## 3. Implementation Steps

### Step 1: Create DashboardContext

**File:** `apps/frontend/src/contexts/DashboardContext.tsx`

```typescript
import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';

// Course code validation regex: XXXX-DDDD
const COURSE_CODE_REGEX = /^[A-Z]{4}-\d{4}$/;

interface DashboardContextValue {
  courseCode: string | null;
  setCourseCode: (code: string | null) => void;
  isValidCourseCode: boolean;
  validationError: string | null;
  clearCourse: () => void;
}

const DashboardContext = createContext<DashboardContextValue | null>(null);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [courseCode, setCourseCodeState] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const isValidCourseCode = useMemo(() => {
    if (!courseCode) return false;
    return COURSE_CODE_REGEX.test(courseCode);
  }, [courseCode]);

  const setCourseCode = useCallback((code: string | null) => {
    if (code === null || code === '') {
      setCourseCodeState(null);
      setValidationError(null);
      return;
    }

    const normalized = code.toUpperCase().trim();

    if (!COURSE_CODE_REGEX.test(normalized)) {
      setValidationError('Invalid format. Use XXXX-DDDD (e.g., ISIS-3204)');
      setCourseCodeState(normalized);
      return;
    }

    setValidationError(null);
    setCourseCodeState(normalized);
  }, []);

  const clearCourse = useCallback(() => {
    setCourseCodeState(null);
    setValidationError(null);
  }, []);

  const value = useMemo<DashboardContextValue>(() => ({
    courseCode,
    setCourseCode,
    isValidCourseCode,
    validationError,
    clearCourse,
  }), [courseCode, setCourseCode, isValidCourseCode, validationError, clearCourse]);

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard(): DashboardContextValue {
  const context = useContext(DashboardContext);

  if (!context) {
    throw new Error('useDashboard must be used within DashboardProvider');
  }

  return context;
}
```

---

### Step 2: Create CourseInput Component

**File:** `apps/frontend/src/components/dashboard/CourseInput.tsx`

```typescript
import React, { useState, useCallback, useEffect } from 'react';
import { useDashboard } from '../../contexts/DashboardContext';
import { useDebounce } from '../../hooks/useDebounce';

interface CourseInputProps {
  /** Debounce delay in ms (default: 300) */
  debounceMs?: number;
  /** Auto-focus on mount */
  autoFocus?: boolean;
  /** Placeholder text */
  placeholder?: string;
}

export function CourseInput({
  debounceMs = 300,
  autoFocus = false,
  placeholder = 'Enter course code (e.g., ISIS-3204)',
}: CourseInputProps) {
  const { courseCode, setCourseCode, validationError, isValidCourseCode, clearCourse } = useDashboard();

  const [inputValue, setInputValue] = useState(courseCode ?? '');
  const debouncedValue = useDebounce(inputValue, debounceMs);

  // Sync debounced value to context
  useEffect(() => {
    if (debouncedValue !== courseCode) {
      setCourseCode(debouncedValue || null);
    }
  }, [debouncedValue, courseCode, setCourseCode]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    setInputValue(value);
  }, []);

  const handleClear = useCallback(() => {
    setInputValue('');
    clearCourse();
  }, [clearCourse]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClear();
    }
  }, [handleClear]);

  return (
    <div className="course-input-container">
      <label htmlFor="course-code-input" className="course-input-label">
        Course Code
      </label>

      <div className="course-input-wrapper">
        <input
          id="course-code-input"
          type="text"
          value={inputValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          aria-invalid={!!validationError}
          aria-describedby={validationError ? 'course-input-error' : undefined}
          className={`course-input ${validationError ? 'course-input--error' : ''} ${isValidCourseCode ? 'course-input--valid' : ''}`}
        />

        {inputValue && (
          <button
            type="button"
            onClick={handleClear}
            className="course-input-clear"
            aria-label="Clear course code"
          >
            ×
          </button>
        )}

        {isValidCourseCode && (
          <span className="course-input-valid-icon" aria-hidden="true">
            ✓
          </span>
        )}
      </div>

      {validationError && (
        <p id="course-input-error" className="course-input-error" role="alert">
          {validationError}
        </p>
      )}
    </div>
  );
}
```

---

### Step 3: Create SummaryTable Component

**File:** `apps/frontend/src/components/dashboard/SummaryTable.tsx`

```typescript
import React, { useMemo } from 'react';
import { useCourseHistory } from '../../hooks/useCourseHistory';

interface SummaryTableProps {
  courseCode: string;
  maxTerms?: number;
}

export function SummaryTable({ courseCode, maxTerms = 10 }: SummaryTableProps) {
  const { data: history, isLoading, error } = useCourseHistory(courseCode);

  const displayData = useMemo(() => {
    if (!history) return [];
    // Sort by term descending, limit to maxTerms
    return [...history]
      .sort((a, b) => b.academicTerm - a.academicTerm)
      .slice(0, maxTerms);
  }, [history, maxTerms]);

  if (isLoading) {
    return <SummaryTableSkeleton />;
  }

  if (error) {
    return <SummaryTableError error={error} />;
  }

  if (displayData.length === 0) {
    return <SummaryTableEmpty courseCode={courseCode} />;
  }

  return (
    <div className="summary-table-container">
      <h2 className="summary-table-title">Course History Summary</h2>

      <table className="summary-table" role="grid" aria-label="Course enrollment history">
        <thead>
          <tr>
            <th scope="col">Term</th>
            <th scope="col">Enrollment</th>
            <th scope="col">Passed</th>
            <th scope="col">Failed</th>
            <th scope="col">Withdrawn</th>
            <th scope="col">Pass Rate</th>
          </tr>
        </thead>
        <tbody>
          {displayData.map(point => {
            const passRate = point.totalEnrollments > 0
              ? ((point.passedCount / point.totalEnrollments) * 100).toFixed(1)
              : '0.0';

            return (
              <tr key={point.academicTerm}>
                <td>{formatTerm(point.academicTerm)}</td>
                <td>{point.totalEnrollments}</td>
                <td>{point.passedCount}</td>
                <td>{point.failedCount}</td>
                <td>{point.withdrawnCount}</td>
                <td>{passRate}%</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function SummaryTableSkeleton() {
  return (
    <div className="summary-table-skeleton">
      <div className="skeleton-title" />
      <div className="skeleton-table">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="skeleton-row">
            <div className="skeleton-cell" />
            <div className="skeleton-cell" />
            <div className="skeleton-cell" />
            <div className="skeleton-cell" />
            <div className="skeleton-cell" />
            <div className="skeleton-cell" />
          </div>
        ))}
      </div>
    </div>
  );
}

function SummaryTableError({ error }: { error: Error }) {
  return (
    <div className="summary-table-error">
      <span className="error-icon">⚠</span>
      <p>Failed to load course history</p>
      <p className="error-message">{error.message}</p>
    </div>
  );
}

function SummaryTableEmpty({ courseCode }: { courseCode: string }) {
  return (
    <div className="summary-table-empty">
      <span className="info-icon">ℹ</span>
      <p>No enrollment history found for {courseCode}</p>
    </div>
  );
}

function formatTerm(term: number): string {
  const year = Math.floor(term / 100);
  const semester = term % 100;

  const semesterNames: Record<number, string> = {
    10: 'Spring',
    20: 'Summer',
    30: 'Fall',
  };

  return `${semesterNames[semester] || semester} ${year}`;
}
```

---

### Step 4: Create Context-Wrapped Components

**File:** `apps/frontend/src/components/dashboard/SummaryTableWithContext.tsx`

```typescript
import React from 'react';
import { useDashboard } from '../../contexts/DashboardContext';
import { SummaryTable } from './SummaryTable';

export function SummaryTableWithContext() {
  const { courseCode, isValidCourseCode } = useDashboard();

  if (!courseCode || !isValidCourseCode) {
    return null;
  }

  return <SummaryTable courseCode={courseCode} />;
}
```

**File:** `apps/frontend/src/components/dashboard/AccuracyTableWithContext.tsx`

```typescript
import React from 'react';
import { useDashboard } from '../../contexts/DashboardContext';
import { useMethodSelector } from '../../contexts/MethodSelectorContext';
import { AccuracyTableContainer } from '../forecasts/AccuracyTableContainer';

export function AccuracyTableWithContext() {
  const { courseCode, isValidCourseCode } = useDashboard();
  const { selectedMethod } = useMethodSelector();

  if (!courseCode || !isValidCourseCode) {
    return (
      <div className="accuracy-table-placeholder">
        <p>Enter a course code to view accuracy data</p>
      </div>
    );
  }

  if (!selectedMethod) {
    return (
      <div className="accuracy-table-placeholder">
        <p>Select a forecast method from the sidebar to view accuracy data</p>
      </div>
    );
  }

  return <AccuracyTableContainer courseCode={courseCode} />;
}
```

---

### Step 5: Create Main Dashboard Component

**File:** `apps/frontend/src/components/dashboard/CourseAccuracyDashboard.tsx`

```typescript
import React from 'react';
import { DashboardProvider } from '../../contexts/DashboardContext';
import { MethodSelectorProvider } from '../../contexts/MethodSelectorContext';
import { CourseInput } from './CourseInput';
import { SummaryTableWithContext } from './SummaryTableWithContext';
import { AccuracyTableWithContext } from './AccuracyTableWithContext';
import { MethodSelectorPanel } from '../forecasts/MethodSelectorPanel';
import { DashboardEmptyState } from './DashboardEmptyState';
import { useDashboard } from '../../contexts/DashboardContext';

import './CourseAccuracyDashboard.css';

export function CourseAccuracyDashboard() {
  return (
    <DashboardProvider>
      <MethodSelectorProvider>
        <DashboardContent />
      </MethodSelectorProvider>
    </DashboardProvider>
  );
}

function DashboardContent() {
  const { courseCode, isValidCourseCode } = useDashboard();

  return (
    <div className="dashboard-layout">
      {/* Header with Course Input */}
      <header className="dashboard-header">
        <h1 className="dashboard-title">Course Accuracy Dashboard</h1>
        <CourseInput autoFocus />
      </header>

      {/* Main Content */}
      <main className="dashboard-main">
        {isValidCourseCode ? (
          <>
            <section className="dashboard-section">
              <SummaryTableWithContext />
            </section>

            <section className="dashboard-section">
              <AccuracyTableWithContext />
            </section>
          </>
        ) : (
          <DashboardEmptyState />
        )}
      </main>

      {/* Sidebar */}
      <aside className="dashboard-sidebar">
        <MethodSelectorPanel />
      </aside>
    </div>
  );
}
```

---

### Step 6: Create Empty State Component

**File:** `apps/frontend/src/components/dashboard/DashboardEmptyState.tsx`

```typescript
import React from 'react';

export function DashboardEmptyState() {
  return (
    <div className="dashboard-empty-state">
      <div className="empty-state-icon">📊</div>
      <h2>Enter a Course Code to Begin</h2>
      <p>
        View enrollment history and forecast accuracy for any course.
      </p>
      <div className="empty-state-examples">
        <p>Examples:</p>
        <ul>
          <li><code>ISIS-3204</code> - Software Development</li>
          <li><code>MATE-1105</code> - Calculus I</li>
          <li><code>FISI-1028</code> - Physics I</li>
        </ul>
      </div>
    </div>
  );
}
```

---

### Step 7: Add CSS Styles

**File:** `apps/frontend/src/components/dashboard/CourseAccuracyDashboard.css`

```css
/* Dashboard Layout */
.dashboard-layout {
  display: grid;
  grid-template-areas:
    "header header"
    "main sidebar";
  grid-template-columns: 1fr 300px;
  grid-template-rows: auto 1fr;
  min-height: 100vh;
  gap: 1.5rem;
  padding: 1.5rem;
}

.dashboard-header {
  grid-area: header;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.dashboard-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
}

.dashboard-main {
  grid-area: main;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.dashboard-sidebar {
  grid-area: sidebar;
  position: sticky;
  top: 1.5rem;
  height: fit-content;
  max-height: calc(100vh - 3rem);
  overflow-y: auto;
}

.dashboard-section {
  background: var(--color-surface);
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* Course Input */
.course-input-container {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-width: 400px;
}

.course-input-label {
  font-weight: 500;
  font-size: 0.875rem;
}

.course-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.course-input {
  width: 100%;
  padding: 0.75rem 2.5rem 0.75rem 1rem;
  font-size: 1rem;
  border: 2px solid var(--color-border);
  border-radius: 6px;
  transition: border-color 0.2s;
}

.course-input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.course-input--error {
  border-color: var(--color-error);
}

.course-input--valid {
  border-color: var(--color-success);
}

.course-input-clear {
  position: absolute;
  right: 2rem;
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  color: var(--color-text-secondary);
}

.course-input-valid-icon {
  position: absolute;
  right: 0.75rem;
  color: var(--color-success);
}

.course-input-error {
  color: var(--color-error);
  font-size: 0.875rem;
  margin: 0;
}

/* Empty State */
.dashboard-empty-state {
  text-align: center;
  padding: 4rem 2rem;
}

.empty-state-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.empty-state-examples {
  margin-top: 2rem;
  text-align: left;
  max-width: 300px;
  margin-left: auto;
  margin-right: auto;
}

.empty-state-examples code {
  background: var(--color-surface-alt);
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
  font-family: monospace;
}

/* Summary Table */
.summary-table-container {
  overflow-x: auto;
}

.summary-table-title {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
}

.summary-table {
  width: 100%;
  border-collapse: collapse;
}

.summary-table th,
.summary-table td {
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid var(--color-border);
}

.summary-table th {
  font-weight: 600;
  background: var(--color-surface-alt);
}

.summary-table tbody tr:hover {
  background: var(--color-surface-hover);
}

/* Responsive */
@media (max-width: 1024px) {
  .dashboard-layout {
    grid-template-areas:
      "header"
      "main"
      "sidebar";
    grid-template-columns: 1fr;
  }

  .dashboard-sidebar {
    position: static;
    max-height: none;
  }
}

@media (max-width: 768px) {
  .dashboard-layout {
    padding: 1rem;
    gap: 1rem;
  }

  .summary-table th,
  .summary-table td {
    padding: 0.5rem;
    font-size: 0.875rem;
  }
}
```

---

### Step 8: Create useDebounce Hook (if not exists)

**File:** `apps/frontend/src/hooks/useDebounce.ts`

```typescript
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
```

---

### Step 9: Add Route Configuration

**File:** Update `apps/frontend/src/routes.tsx`

```typescript
import { CourseAccuracyDashboard } from './components/dashboard/CourseAccuracyDashboard';

// Add to routes
{
  path: '/dashboard',
  element: <CourseAccuracyDashboard />,
}
```

---

### Step 10: Add URL State Sync (Optional)

**File:** `apps/frontend/src/hooks/useDashboardUrl.ts`

```typescript
import { useSearchParams } from 'react-router-dom';
import { useEffect } from 'react';
import { useDashboard } from '../contexts/DashboardContext';
import { useMethodSelector } from '../contexts/MethodSelectorContext';

export function useDashboardUrl() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { courseCode, setCourseCode } = useDashboard();
  const { selectedMethod, setSelectedMethod, methods } = useMethodSelector();

  // Initialize from URL on mount
  useEffect(() => {
    const urlCourse = searchParams.get('course');
    const urlMethod = searchParams.get('method');

    if (urlCourse && !courseCode) {
      setCourseCode(urlCourse);
    }

    if (urlMethod && !selectedMethod && methods.length > 0) {
      const method = methods.find(m => m.id === urlMethod);
      if (method) {
        setSelectedMethod(method);
      }
    }
  }, [searchParams, methods]);

  // Sync state to URL
  useEffect(() => {
    const newParams = new URLSearchParams();

    if (courseCode) {
      newParams.set('course', courseCode);
    }

    if (selectedMethod) {
      newParams.set('method', selectedMethod.id);
    }

    setSearchParams(newParams, { replace: true });
  }, [courseCode, selectedMethod, setSearchParams]);
}
```

---

## 4. File Structure

```
apps/frontend/src/
├── components/
│   ├── dashboard/
│   │   ├── CourseAccuracyDashboard.tsx
│   │   ├── CourseAccuracyDashboard.css
│   │   ├── CourseInput.tsx
│   │   ├── SummaryTable.tsx
│   │   ├── SummaryTableWithContext.tsx
│   │   ├── AccuracyTableWithContext.tsx
│   │   ├── DashboardEmptyState.tsx
│   │   └── index.ts
│   └── forecasts/
│       ├── AccuracyTableContainer.tsx  (existing)
│       └── MethodSelectorPanel.tsx     (existing)
├── contexts/
│   ├── DashboardContext.tsx            (new)
│   └── MethodSelectorContext.tsx       (existing)
├── hooks/
│   ├── useDebounce.ts                  (new if not exists)
│   ├── useCourseHistory.ts             (existing)
│   ├── useForecastAccuracy.ts          (existing)
│   └── useDashboardUrl.ts              (new, optional)
└── routes.tsx                          (update)
```

---

## 5. Integration Checklist

### Context Integration

- [ ] `DashboardContext` wraps `MethodSelectorContext` correctly
- [ ] `courseCode` is accessible in all child components
- [ ] `selectedMethod` is accessible in `AccuracyTableWithContext`

### Component Integration

- [ ] `SummaryTable` receives `courseCode` from context
- [ ] `AccuracyTableContainer` receives `courseCode` from context
- [ ] `MethodSelectorPanel` works without modification

### State Flow

- [ ] Course input updates `DashboardContext`
- [ ] Method selection updates `MethodSelectorContext`
- [ ] Both tables refetch when `courseCode` changes
- [ ] Accuracy table refetches when `selectedMethod` changes

---

## 6. Related Documents

- [Architecture](./architecture.md)
- [System Impact](./system-impact.md)
- [Testing Guide](./testing-guide.md)
