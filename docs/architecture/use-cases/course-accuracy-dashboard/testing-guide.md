# Course Accuracy Dashboard Testing Guide

## 1. Overview

This document outlines the testing strategy for the Course Accuracy Dashboard, covering unit tests, integration tests, and end-to-end tests.

---

## 2. Test Structure

```
apps/frontend/src/
├── components/
│   └── dashboard/
│       ├── __tests__/
│       │   ├── CourseInput.test.tsx
│       │   ├── SummaryTable.test.tsx
│       │   ├── DashboardEmptyState.test.tsx
│       │   └── CourseAccuracyDashboard.test.tsx
├── contexts/
│   └── __tests__/
│       └── DashboardContext.test.tsx
└── hooks/
    └── __tests__/
        └── useDebounce.test.ts
```

---

## 3. Unit Tests

### 3.1 DashboardContext Tests

**File:** `apps/frontend/src/contexts/__tests__/DashboardContext.test.tsx`

```typescript
import { renderHook, act } from '@testing-library/react';
import { DashboardProvider, useDashboard } from '../DashboardContext';

describe('DashboardContext', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <DashboardProvider>{children}</DashboardProvider>
  );

  describe('initial state', () => {
    it('should have null courseCode initially', () => {
      const { result } = renderHook(() => useDashboard(), { wrapper });

      expect(result.current.courseCode).toBeNull();
      expect(result.current.isValidCourseCode).toBe(false);
      expect(result.current.validationError).toBeNull();
    });
  });

  describe('setCourseCode', () => {
    it('should set valid course code', () => {
      const { result } = renderHook(() => useDashboard(), { wrapper });

      act(() => {
        result.current.setCourseCode('ISIS-3204');
      });

      expect(result.current.courseCode).toBe('ISIS-3204');
      expect(result.current.isValidCourseCode).toBe(true);
      expect(result.current.validationError).toBeNull();
    });

    it('should normalize course code to uppercase', () => {
      const { result } = renderHook(() => useDashboard(), { wrapper });

      act(() => {
        result.current.setCourseCode('isis-3204');
      });

      expect(result.current.courseCode).toBe('ISIS-3204');
    });

    it('should set validation error for invalid format', () => {
      const { result } = renderHook(() => useDashboard(), { wrapper });

      act(() => {
        result.current.setCourseCode('ISIS3204');
      });

      expect(result.current.isValidCourseCode).toBe(false);
      expect(result.current.validationError).toBe(
        'Invalid format. Use XXXX-DDDD (e.g., ISIS-3204)'
      );
    });

    it('should reject course codes with wrong letter count', () => {
      const { result } = renderHook(() => useDashboard(), { wrapper });

      act(() => {
        result.current.setCourseCode('IS-3204');
      });

      expect(result.current.isValidCourseCode).toBe(false);
    });

    it('should reject course codes with wrong digit count', () => {
      const { result } = renderHook(() => useDashboard(), { wrapper });

      act(() => {
        result.current.setCourseCode('ISIS-320');
      });

      expect(result.current.isValidCourseCode).toBe(false);
    });

    it('should handle null value', () => {
      const { result } = renderHook(() => useDashboard(), { wrapper });

      act(() => {
        result.current.setCourseCode('ISIS-3204');
      });

      act(() => {
        result.current.setCourseCode(null);
      });

      expect(result.current.courseCode).toBeNull();
      expect(result.current.validationError).toBeNull();
    });

    it('should handle empty string as null', () => {
      const { result } = renderHook(() => useDashboard(), { wrapper });

      act(() => {
        result.current.setCourseCode('');
      });

      expect(result.current.courseCode).toBeNull();
    });
  });

  describe('clearCourse', () => {
    it('should clear course code and validation error', () => {
      const { result } = renderHook(() => useDashboard(), { wrapper });

      act(() => {
        result.current.setCourseCode('ISIS-3204');
      });

      act(() => {
        result.current.clearCourse();
      });

      expect(result.current.courseCode).toBeNull();
      expect(result.current.validationError).toBeNull();
    });
  });

  describe('error handling', () => {
    it('should throw when used outside provider', () => {
      expect(() => {
        renderHook(() => useDashboard());
      }).toThrow('useDashboard must be used within DashboardProvider');
    });
  });
});
```

---

### 3.2 CourseInput Tests

**File:** `apps/frontend/src/components/dashboard/__tests__/CourseInput.test.tsx`

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CourseInput } from '../CourseInput';
import { DashboardProvider } from '../../../contexts/DashboardContext';

const renderWithProvider = (props = {}) => {
  return render(
    <DashboardProvider>
      <CourseInput {...props} />
    </DashboardProvider>
  );
};

describe('CourseInput', () => {
  describe('rendering', () => {
    it('should render input with label', () => {
      renderWithProvider();

      expect(screen.getByLabelText('Course Code')).toBeInTheDocument();
    });

    it('should render with placeholder', () => {
      renderWithProvider({ placeholder: 'Enter course' });

      expect(screen.getByPlaceholderText('Enter course')).toBeInTheDocument();
    });

    it('should auto-focus when autoFocus is true', () => {
      renderWithProvider({ autoFocus: true });

      expect(screen.getByLabelText('Course Code')).toHaveFocus();
    });
  });

  describe('input behavior', () => {
    it('should convert input to uppercase', async () => {
      const user = userEvent.setup();
      renderWithProvider();

      const input = screen.getByLabelText('Course Code');
      await user.type(input, 'isis');

      expect(input).toHaveValue('ISIS');
    });

    it('should show clear button when input has value', async () => {
      const user = userEvent.setup();
      renderWithProvider();

      const input = screen.getByLabelText('Course Code');
      await user.type(input, 'ISIS-3204');

      expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();
    });

    it('should clear input when clear button is clicked', async () => {
      const user = userEvent.setup();
      renderWithProvider();

      const input = screen.getByLabelText('Course Code');
      await user.type(input, 'ISIS-3204');

      await user.click(screen.getByRole('button', { name: /clear/i }));

      expect(input).toHaveValue('');
    });

    it('should clear input when Escape is pressed', async () => {
      const user = userEvent.setup();
      renderWithProvider();

      const input = screen.getByLabelText('Course Code');
      await user.type(input, 'ISIS-3204');
      await user.keyboard('{Escape}');

      expect(input).toHaveValue('');
    });
  });

  describe('validation', () => {
    it('should show valid indicator for valid course code', async () => {
      const user = userEvent.setup();
      renderWithProvider();

      const input = screen.getByLabelText('Course Code');
      await user.type(input, 'ISIS-3204');

      // Wait for debounce
      await waitFor(() => {
        expect(input).toHaveClass('course-input--valid');
      });
    });

    it('should show error for invalid format', async () => {
      const user = userEvent.setup();
      renderWithProvider();

      const input = screen.getByLabelText('Course Code');
      await user.type(input, 'INVALID');

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
    });
  });

  describe('debouncing', () => {
    it('should debounce input before updating context', async () => {
      jest.useFakeTimers();
      const user = userEvent.setup({ delay: null });
      renderWithProvider({ debounceMs: 300 });

      const input = screen.getByLabelText('Course Code');
      await user.type(input, 'ISIS');

      // Context not updated yet
      expect(input).toHaveValue('ISIS');

      // Fast forward debounce timer
      jest.advanceTimersByTime(300);

      // Now context should be updated (checked via validation state)
      await waitFor(() => {
        expect(input).toHaveClass('course-input--error');
      });

      jest.useRealTimers();
    });
  });

  describe('accessibility', () => {
    it('should have aria-invalid when there is an error', async () => {
      const user = userEvent.setup();
      renderWithProvider();

      const input = screen.getByLabelText('Course Code');
      await user.type(input, 'BAD');

      await waitFor(() => {
        expect(input).toHaveAttribute('aria-invalid', 'true');
      });
    });

    it('should have aria-describedby linking to error message', async () => {
      const user = userEvent.setup();
      renderWithProvider();

      const input = screen.getByLabelText('Course Code');
      await user.type(input, 'BAD');

      await waitFor(() => {
        expect(input).toHaveAttribute('aria-describedby', 'course-input-error');
      });
    });
  });
});
```

---

### 3.3 SummaryTable Tests

**File:** `apps/frontend/src/components/dashboard/__tests__/SummaryTable.test.tsx`

```typescript
import { render, screen } from '@testing-library/react';
import { SummaryTable } from '../SummaryTable';
import { useCourseHistory } from '../../../hooks/useCourseHistory';

jest.mock('../../../hooks/useCourseHistory');

const mockUseCourseHistory = useCourseHistory as jest.MockedFunction<
  typeof useCourseHistory
>;

const mockHistoryData = [
  {
    academicTerm: 202510,
    courseCode: 'ISIS-3204',
    totalEnrollments: 44,
    passedCount: 38,
    failedCount: 4,
    withdrawnCount: 2,
  },
  {
    academicTerm: 202420,
    courseCode: 'ISIS-3204',
    totalEnrollments: 40,
    passedCount: 32,
    failedCount: 5,
    withdrawnCount: 3,
  },
];

describe('SummaryTable', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('loading state', () => {
    it('should show skeleton when loading', () => {
      mockUseCourseHistory.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
      });

      render(<SummaryTable courseCode="ISIS-3204" />);

      expect(screen.getByTestId('summary-table-skeleton')).toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('should show error message when fetch fails', () => {
      mockUseCourseHistory.mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('Failed to fetch'),
      });

      render(<SummaryTable courseCode="ISIS-3204" />);

      expect(screen.getByText(/failed to load/i)).toBeInTheDocument();
      expect(screen.getByText('Failed to fetch')).toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    it('should show empty state when no data', () => {
      mockUseCourseHistory.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });

      render(<SummaryTable courseCode="ISIS-3204" />);

      expect(screen.getByText(/no enrollment history/i)).toBeInTheDocument();
    });
  });

  describe('data display', () => {
    it('should render table with course history', () => {
      mockUseCourseHistory.mockReturnValue({
        data: mockHistoryData,
        isLoading: false,
        error: null,
      });

      render(<SummaryTable courseCode="ISIS-3204" />);

      expect(screen.getByRole('grid')).toBeInTheDocument();
      expect(screen.getByText('Spring 2025')).toBeInTheDocument();
      expect(screen.getByText('Summer 2024')).toBeInTheDocument();
    });

    it('should display correct enrollment numbers', () => {
      mockUseCourseHistory.mockReturnValue({
        data: mockHistoryData,
        isLoading: false,
        error: null,
      });

      render(<SummaryTable courseCode="ISIS-3204" />);

      expect(screen.getByText('44')).toBeInTheDocument();
      expect(screen.getByText('40')).toBeInTheDocument();
    });

    it('should calculate pass rate correctly', () => {
      mockUseCourseHistory.mockReturnValue({
        data: mockHistoryData,
        isLoading: false,
        error: null,
      });

      render(<SummaryTable courseCode="ISIS-3204" />);

      // 38/44 = 86.4%
      expect(screen.getByText('86.4%')).toBeInTheDocument();
    });

    it('should limit displayed terms with maxTerms prop', () => {
      const manyTerms = Array.from({ length: 20 }, (_, i) => ({
        ...mockHistoryData[0],
        academicTerm: 202510 - i * 10,
      }));

      mockUseCourseHistory.mockReturnValue({
        data: manyTerms,
        isLoading: false,
        error: null,
      });

      render(<SummaryTable courseCode="ISIS-3204" maxTerms={5} />);

      const rows = screen.getAllByRole('row');
      // 1 header row + 5 data rows
      expect(rows).toHaveLength(6);
    });

    it('should sort terms in descending order', () => {
      mockUseCourseHistory.mockReturnValue({
        data: mockHistoryData,
        isLoading: false,
        error: null,
      });

      render(<SummaryTable courseCode="ISIS-3204" />);

      const rows = screen.getAllByRole('row');
      // First data row should be the most recent term
      expect(rows[1]).toHaveTextContent('Spring 2025');
    });
  });

  describe('accessibility', () => {
    it('should have proper table role and aria-label', () => {
      mockUseCourseHistory.mockReturnValue({
        data: mockHistoryData,
        isLoading: false,
        error: null,
      });

      render(<SummaryTable courseCode="ISIS-3204" />);

      expect(
        screen.getByRole('grid', { name: /course enrollment history/i })
      ).toBeInTheDocument();
    });
  });
});
```

---

### 3.4 useDebounce Tests

**File:** `apps/frontend/src/hooks/__tests__/useDebounce.test.ts`

```typescript
import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '../useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 500));

    expect(result.current).toBe('initial');
  });

  it('should not update value before delay', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: 'initial' } }
    );

    rerender({ value: 'updated' });

    expect(result.current).toBe('initial');
  });

  it('should update value after delay', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: 'initial' } }
    );

    rerender({ value: 'updated' });

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(result.current).toBe('updated');
  });

  it('should reset timer on rapid changes', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: 'initial' } }
    );

    rerender({ value: 'first' });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    rerender({ value: 'second' });

    act(() => {
      jest.advanceTimersByTime(300);
    });

    // Still initial because timer was reset
    expect(result.current).toBe('initial');

    act(() => {
      jest.advanceTimersByTime(200);
    });

    // Now it should be 'second'
    expect(result.current).toBe('second');
  });

  it('should work with different delay values', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 1000 } }
    );

    rerender({ value: 'updated', delay: 1000 });

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(result.current).toBe('initial');

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(result.current).toBe('updated');
  });
});
```

---

## 4. Integration Tests

### 4.1 CourseAccuracyDashboard Integration Tests

**File:** `apps/frontend/src/components/dashboard/__tests__/CourseAccuracyDashboard.test.tsx`

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CourseAccuracyDashboard } from '../CourseAccuracyDashboard';
import { server } from '../../../mocks/server';
import { rest } from 'msw';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const renderDashboard = () => {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <CourseAccuracyDashboard />
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('CourseAccuracyDashboard Integration', () => {
  beforeAll(() => server.listen());
  afterEach(() => {
    server.resetHandlers();
    queryClient.clear();
  });
  afterAll(() => server.close());

  describe('initial state', () => {
    it('should show empty state initially', () => {
      renderDashboard();

      expect(screen.getByText(/enter a course code/i)).toBeInTheDocument();
    });

    it('should show method selector in sidebar', () => {
      renderDashboard();

      expect(screen.getByRole('listbox', { name: /forecast methods/i })).toBeInTheDocument();
    });
  });

  describe('course input flow', () => {
    it('should load summary table when valid course code is entered', async () => {
      const user = userEvent.setup();
      renderDashboard();

      const input = screen.getByLabelText('Course Code');
      await user.type(input, 'ISIS-3204');

      await waitFor(() => {
        expect(screen.getByText('Course History Summary')).toBeInTheDocument();
      });
    });

    it('should show error for non-existent course', async () => {
      server.use(
        rest.get('/api/courses/:code/history', (req, res, ctx) => {
          return res(ctx.status(404), ctx.json({ error: 'Course not found' }));
        })
      );

      const user = userEvent.setup();
      renderDashboard();

      const input = screen.getByLabelText('Course Code');
      await user.type(input, 'XXXX-9999');

      await waitFor(() => {
        expect(screen.getByText(/course not found/i)).toBeInTheDocument();
      });
    });
  });

  describe('method selection flow', () => {
    it('should show accuracy table after method selection', async () => {
      const user = userEvent.setup();
      renderDashboard();

      // Enter course code
      const input = screen.getByLabelText('Course Code');
      await user.type(input, 'ISIS-3204');

      // Wait for summary table
      await waitFor(() => {
        expect(screen.getByText('Course History Summary')).toBeInTheDocument();
      });

      // Select a method
      const methodCard = screen.getByRole('option', { name: /potential students/i });
      await user.click(methodCard);

      // Wait for accuracy table
      await waitFor(() => {
        expect(screen.getByText('Forecast Accuracy')).toBeInTheDocument();
      });
    });

    it('should update accuracy table when method changes', async () => {
      const user = userEvent.setup();
      renderDashboard();

      const input = screen.getByLabelText('Course Code');
      await user.type(input, 'ISIS-3204');

      await waitFor(() => {
        expect(screen.getByText('Course History Summary')).toBeInTheDocument();
      });

      // Select first method
      const firstMethod = screen.getByRole('option', { name: /potential students/i });
      await user.click(firstMethod);

      await waitFor(() => {
        expect(screen.getByText('Forecast Accuracy')).toBeInTheDocument();
      });

      // Select second method
      const secondMethod = screen.getByRole('option', { name: /historical average/i });
      await user.click(secondMethod);

      // Accuracy table should refetch
      await waitFor(() => {
        expect(screen.getByText(/historical average/i)).toBeInTheDocument();
      });
    });
  });

  describe('data coordination', () => {
    it('should show placeholder when no method is selected', async () => {
      const user = userEvent.setup();
      renderDashboard();

      const input = screen.getByLabelText('Course Code');
      await user.type(input, 'ISIS-3204');

      await waitFor(() => {
        expect(
          screen.getByText(/select a forecast method/i)
        ).toBeInTheDocument();
      });
    });

    it('should clear accuracy table when course changes', async () => {
      const user = userEvent.setup();
      renderDashboard();

      // Enter first course
      const input = screen.getByLabelText('Course Code');
      await user.type(input, 'ISIS-3204');

      // Select method
      await waitFor(() => {
        expect(screen.getByText('Course History Summary')).toBeInTheDocument();
      });

      const method = screen.getByRole('option', { name: /potential students/i });
      await user.click(method);

      await waitFor(() => {
        expect(screen.getByText('Forecast Accuracy')).toBeInTheDocument();
      });

      // Clear and enter new course
      await user.clear(input);
      await user.type(input, 'MATE-1105');

      // Accuracy table should refetch with new course
      await waitFor(() => {
        expect(screen.getByText('Forecast Accuracy')).toBeInTheDocument();
      });
    });
  });
});
```

---

## 5. End-to-End Tests

### 5.1 Cypress E2E Tests

**File:** `apps/frontend/cypress/e2e/dashboard.cy.ts`

```typescript
describe('Course Accuracy Dashboard', () => {
  beforeEach(() => {
    cy.intercept('GET', '/api/forecasts/methods', { fixture: 'methods.json' });
    cy.intercept('GET', '/api/courses/*/history', { fixture: 'courseHistory.json' });
    cy.intercept('GET', '/api/courses/*/forecasts/*/accuracy', {
      fixture: 'accuracy.json',
    });
  });

  it('should load and display dashboard', () => {
    cy.visit('/dashboard');

    cy.findByText(/enter a course code/i).should('be.visible');
    cy.findByLabelText('Course Code').should('be.visible');
  });

  it('should search for a course', () => {
    cy.visit('/dashboard');

    cy.findByLabelText('Course Code').type('ISIS-3204');

    cy.findByText('Course History Summary').should('be.visible');
    cy.findByRole('grid').should('be.visible');
  });

  it('should display accuracy after method selection', () => {
    cy.visit('/dashboard');

    cy.findByLabelText('Course Code').type('ISIS-3204');

    cy.findByText('Course History Summary').should('be.visible');

    cy.findByRole('option', { name: /potential students/i }).click();

    cy.findByText('Forecast Accuracy').should('be.visible');
    cy.findByText(/average accuracy/i).should('be.visible');
  });

  it('should handle invalid course code', () => {
    cy.visit('/dashboard');

    cy.findByLabelText('Course Code').type('INVALID');

    cy.findByRole('alert').should('contain', 'Invalid format');
  });

  it('should handle course not found', () => {
    cy.intercept('GET', '/api/courses/XXXX-9999/history', {
      statusCode: 404,
      body: { error: 'Course not found' },
    });

    cy.visit('/dashboard');

    cy.findByLabelText('Course Code').type('XXXX-9999');

    cy.findByText(/course not found/i).should('be.visible');
  });

  it('should persist state in URL', () => {
    cy.visit('/dashboard?course=ISIS-3204&method=potential-students');

    cy.findByLabelText('Course Code').should('have.value', 'ISIS-3204');
    cy.findByText('Course History Summary').should('be.visible');
    cy.findByRole('option', { name: /potential students/i }).should(
      'have.attr',
      'aria-selected',
      'true'
    );
  });

  it('should be keyboard accessible', () => {
    cy.visit('/dashboard');

    cy.findByLabelText('Course Code').focus().type('ISIS-3204');

    cy.findByText('Course History Summary').should('be.visible');

    // Tab to method selector
    cy.realPress('Tab');
    cy.realPress('Tab');

    // Navigate with arrow keys
    cy.realPress('ArrowDown');
    cy.realPress('Enter');

    cy.findByText('Forecast Accuracy').should('be.visible');
  });
});
```

---

## 6. Test Fixtures

### 6.1 Methods Fixture

**File:** `apps/frontend/cypress/fixtures/methods.json`

```json
{
  "methods": [
    {
      "id": "potential-students-by-prerequisites",
      "label": "Potential Students by Prerequisites",
      "description": "Forecasts based on students who completed prerequisites",
      "status": "active",
      "capabilities": {
        "supportsBacktesting": true
      }
    },
    {
      "id": "historical-average",
      "label": "Historical Average",
      "description": "Based on average enrollment from past terms",
      "status": "active",
      "capabilities": {
        "supportsBacktesting": true
      }
    }
  ]
}
```

### 6.2 Course History Fixture

**File:** `apps/frontend/cypress/fixtures/courseHistory.json`

```json
[
  {
    "academicTerm": 202510,
    "courseCode": "ISIS-3204",
    "totalEnrollments": 44,
    "passedCount": 38,
    "failedCount": 4,
    "withdrawnCount": 2
  },
  {
    "academicTerm": 202420,
    "courseCode": "ISIS-3204",
    "totalEnrollments": 40,
    "passedCount": 32,
    "failedCount": 5,
    "withdrawnCount": 3
  }
]
```

### 6.3 Accuracy Fixture

**File:** `apps/frontend/cypress/fixtures/accuracy.json`

```json
{
  "courseCode": "ISIS-3204",
  "method": {
    "id": "potential-students-by-prerequisites",
    "label": "Potential Students by Prerequisites"
  },
  "comparisons": [
    {
      "academicTerm": 202510,
      "forecast": { "predictedEnrollment": 45 },
      "actual": { "realEnrollment": 44, "dataSource": "enrollments" },
      "metrics": {
        "accuracyPercentage": 97.73,
        "absoluteError": 1,
        "errorDirection": "over",
        "studentsOff": 1,
        "errorPercentage": 2.27
      }
    }
  ],
  "summary": {
    "averageAccuracy": 97.73,
    "totalPredicted": 45,
    "totalActual": 44,
    "overallError": 1,
    "mape": 2.27,
    "rmse": 1.0,
    "overPredictions": 1,
    "underPredictions": 0,
    "exactPredictions": 0
  },
  "metadata": {
    "requestedTerms": [202510],
    "processedAt": "2025-11-21T15:30:00.000Z",
    "termsWithData": 1
  }
}
```

---

## 7. Test Coverage Goals

| Component | Line Coverage | Branch Coverage |
|-----------|--------------|-----------------|
| DashboardContext | 100% | 100% |
| CourseInput | 95%+ | 90%+ |
| SummaryTable | 95%+ | 90%+ |
| useDebounce | 100% | 100% |
| CourseAccuracyDashboard | 90%+ | 85%+ |

---

## 8. Running Tests

```bash
# Unit tests
npm test -- --coverage

# Integration tests
npm test -- --testPathPattern=integration

# E2E tests
npm run cypress:run

# Specific test file
npm test -- DashboardContext.test.tsx
```

---

## 9. Related Documents

- [Architecture](./architecture.md)
- [Implementation Guide](./implementation-guide.md)
- [System Impact](./system-impact.md)
