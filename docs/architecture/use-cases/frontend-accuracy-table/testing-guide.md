# Frontend Accuracy Table - Testing Guide

## Overview

This guide provides comprehensive testing strategies for the Frontend Accuracy Table feature.

---

## 1. Unit Tests

### 1.1 AccuracyTableRow

**Location**: `apps/frontend/src/components/forecasts/__tests__/AccuracyTableRow.test.tsx`

```tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AccuracyTableRow } from '../AccuracyTableRow';
import type { ComparisonItem } from '../../../types/forecast-accuracy';

const createMockComparison = (overrides?: Partial<ComparisonItem>): ComparisonItem => ({
  academicTerm: 202410,
  forecast: {
    predictedEnrollment: 42,
  },
  actual: {
    realEnrollment: 38,
    dataSource: 'enrollments',
  },
  metrics: {
    accuracyPercentage: 89.47,
    absoluteError: 4,
    errorDirection: 'over',
    studentsOff: 4,
    errorPercentage: 10.53,
  },
  ...overrides,
});

// Wrap in table for valid HTML
const renderRow = (comparison: ComparisonItem) => {
  return render(
    <table>
      <tbody>
        <AccuracyTableRow comparison={comparison} />
      </tbody>
    </table>
  );
};

describe('AccuracyTableRow', () => {
  describe('rendering', () => {
    it('displays formatted term', () => {
      renderRow(createMockComparison({ academicTerm: 202410 }));
      expect(screen.getByText('2024-10')).toBeInTheDocument();
    });

    it('displays forecast value', () => {
      renderRow(createMockComparison());
      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('displays actual value', () => {
      renderRow(createMockComparison());
      expect(screen.getByText('38')).toBeInTheDocument();
    });

    it('displays accuracy percentage', () => {
      renderRow(createMockComparison());
      expect(screen.getByText('89.5%')).toBeInTheDocument();
    });

    it('displays error with direction', () => {
      renderRow(createMockComparison());
      expect(screen.getByText('+4')).toBeInTheDocument();
      expect(screen.getByText('(over)')).toBeInTheDocument();
    });
  });

  describe('error direction', () => {
    it('shows up arrow for over-prediction', () => {
      renderRow(createMockComparison({
        metrics: { ...createMockComparison().metrics, errorDirection: 'over' }
      }));
      expect(screen.getByText('↑')).toBeInTheDocument();
    });

    it('shows down arrow for under-prediction', () => {
      renderRow(createMockComparison({
        metrics: {
          ...createMockComparison().metrics,
          errorDirection: 'under',
          absoluteError: -5,
        }
      }));
      expect(screen.getByText('↓')).toBeInTheDocument();
    });

    it('shows equals for exact prediction', () => {
      renderRow(createMockComparison({
        metrics: {
          ...createMockComparison().metrics,
          errorDirection: 'exact',
          absoluteError: 0,
          studentsOff: 0,
        }
      }));
      expect(screen.getByText('=')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has aria-label on accuracy cell', () => {
      renderRow(createMockComparison());
      expect(
        screen.getByLabelText('89.5 percent accuracy')
      ).toBeInTheDocument();
    });

    it('has aria-label on error cell', () => {
      renderRow(createMockComparison());
      expect(
        screen.getByLabelText('4 students over predicted')
      ).toBeInTheDocument();
    });
  });
});
```

### 1.2 AccuracyTable

**Location**: `apps/frontend/src/components/forecasts/__tests__/AccuracyTable.test.tsx`

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AccuracyTable } from '../AccuracyTable';
import type { ComparisonItem } from '../../../types/forecast-accuracy';

const mockComparisons: ComparisonItem[] = [
  {
    academicTerm: 202410,
    forecast: { predictedEnrollment: 42 },
    actual: { realEnrollment: 38, dataSource: 'enrollments' },
    metrics: {
      accuracyPercentage: 89.47,
      absoluteError: 4,
      errorDirection: 'over',
      studentsOff: 4,
      errorPercentage: 10.53,
    },
  },
  {
    academicTerm: 202420,
    forecast: { predictedEnrollment: 35 },
    actual: { realEnrollment: 40, dataSource: 'enrollments' },
    metrics: {
      accuracyPercentage: 87.5,
      absoluteError: -5,
      errorDirection: 'under',
      studentsOff: 5,
      errorPercentage: 12.5,
    },
  },
];

const mockMethod = {
  id: 'test-method',
  label: 'Test Method',
};

describe('AccuracyTable', () => {
  describe('rendering', () => {
    it('displays method label in title', () => {
      render(<AccuracyTable comparisons={mockComparisons} method={mockMethod} />);
      expect(screen.getByText('Accuracy: Test Method')).toBeInTheDocument();
    });

    it('renders all comparison rows', () => {
      render(<AccuracyTable comparisons={mockComparisons} method={mockMethod} />);
      expect(screen.getByText('2024-10')).toBeInTheDocument();
      expect(screen.getByText('2024-20')).toBeInTheDocument();
    });

    it('renders column headers', () => {
      render(<AccuracyTable comparisons={mockComparisons} method={mockMethod} />);
      expect(screen.getByText('Term')).toBeInTheDocument();
      expect(screen.getByText('Forecast')).toBeInTheDocument();
      expect(screen.getByText('Actual')).toBeInTheDocument();
      expect(screen.getByText('Accuracy')).toBeInTheDocument();
      expect(screen.getByText('Error')).toBeInTheDocument();
    });
  });

  describe('sorting', () => {
    it('sorts by term by default (descending)', () => {
      render(<AccuracyTable comparisons={mockComparisons} method={mockMethod} />);
      const rows = screen.getAllByRole('row');
      // Header row + 2 data rows
      expect(rows).toHaveLength(3);
      // Newest term first (202420)
      expect(rows[1]).toHaveTextContent('2024-20');
    });

    it('toggles sort direction on column click', () => {
      render(<AccuracyTable comparisons={mockComparisons} method={mockMethod} />);

      const termHeader = screen.getByRole('button', { name: /term/i });
      fireEvent.click(termHeader);

      // Should now be ascending
      const rows = screen.getAllByRole('row');
      expect(rows[1]).toHaveTextContent('2024-10');
    });

    it('sorts by accuracy when accuracy header clicked', () => {
      render(<AccuracyTable comparisons={mockComparisons} method={mockMethod} />);

      const accuracyHeader = screen.getByRole('button', { name: /accuracy/i });
      fireEvent.click(accuracyHeader);

      // First click sorts descending (highest accuracy first)
      const rows = screen.getAllByRole('row');
      expect(rows[1]).toHaveTextContent('89.5%');
    });

    it('shows sort indicator on active column', () => {
      render(<AccuracyTable comparisons={mockComparisons} method={mockMethod} />);
      expect(screen.getByText('↓')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has correct table role', () => {
      render(<AccuracyTable comparisons={mockComparisons} method={mockMethod} />);
      expect(screen.getByRole('grid')).toBeInTheDocument();
    });

    it('has aria-label on table', () => {
      render(<AccuracyTable comparisons={mockComparisons} method={mockMethod} />);
      expect(
        screen.getByRole('grid', { name: 'Forecast accuracy for Test Method' })
      ).toBeInTheDocument();
    });

    it('has aria-sort on sortable headers', () => {
      render(<AccuracyTable comparisons={mockComparisons} method={mockMethod} />);
      const headers = screen.getAllByRole('columnheader');
      expect(headers[0]).toHaveAttribute('aria-sort', 'descending');
    });
  });
});
```

### 1.3 AccuracySummary

**Location**: `apps/frontend/src/components/forecasts/__tests__/AccuracySummary.test.tsx`

```tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AccuracySummary } from '../AccuracySummary';
import type { SummaryMetrics } from '../../../types/forecast-accuracy';

const mockSummary: SummaryMetrics = {
  averageAccuracy: 91.57,
  totalPredicted: 122,
  totalActual: 122,
  overallError: 0,
  mape: 8.43,
  rmse: 3.42,
  overPredictions: 2,
  underPredictions: 1,
  exactPredictions: 0,
};

describe('AccuracySummary', () => {
  it('displays average accuracy', () => {
    render(<AccuracySummary summary={mockSummary} termCount={3} />);
    expect(screen.getByText('91.6')).toBeInTheDocument();
    expect(screen.getByText('Average Accuracy')).toBeInTheDocument();
  });

  it('displays MAPE', () => {
    render(<AccuracySummary summary={mockSummary} termCount={3} />);
    expect(screen.getByText('8.43')).toBeInTheDocument();
    expect(screen.getByText('MAPE')).toBeInTheDocument();
  });

  it('displays RMSE', () => {
    render(<AccuracySummary summary={mockSummary} termCount={3} />);
    expect(screen.getByText('3.42')).toBeInTheDocument();
    expect(screen.getByText('RMSE')).toBeInTheDocument();
  });

  it('displays prediction direction counts', () => {
    render(<AccuracySummary summary={mockSummary} termCount={3} />);
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('Over-predictions')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('Under-predictions')).toBeInTheDocument();
  });

  it('displays totals', () => {
    render(<AccuracySummary summary={mockSummary} termCount={3} />);
    expect(screen.getByText('122')).toBeInTheDocument();
    expect(screen.getByText('Total Forecast')).toBeInTheDocument();
    expect(screen.getByText('Total Actual')).toBeInTheDocument();
  });

  it('displays net error with sign', () => {
    render(<AccuracySummary summary={{ ...mockSummary, overallError: 5 }} termCount={3} />);
    expect(screen.getByText('+5')).toBeInTheDocument();
  });

  it('displays term count', () => {
    render(<AccuracySummary summary={mockSummary} termCount={3} />);
    expect(screen.getByText('Based on 3 academic terms')).toBeInTheDocument();
  });

  it('handles singular term', () => {
    render(<AccuracySummary summary={mockSummary} termCount={1} />);
    expect(screen.getByText('Based on 1 academic term')).toBeInTheDocument();
  });
});
```

### 1.4 useForecastAccuracy Hook

**Location**: `apps/frontend/src/hooks/__tests__/useForecastAccuracy.test.ts`

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useForecastAccuracy } from '../useForecastAccuracy';
import * as api from '../../api/forecast-accuracy';

vi.mock('../../api/forecast-accuracy');

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('useForecastAccuracy', () => {
  const mockData = {
    courseCode: 'ISIS-3204',
    method: { id: 'test', label: 'Test' },
    comparisons: [],
    summary: {
      averageAccuracy: 90,
      totalPredicted: 100,
      totalActual: 100,
      overallError: 0,
      mape: 10,
      rmse: 5,
      overPredictions: 0,
      underPredictions: 0,
      exactPredictions: 1,
    },
    metadata: {
      requestedTerms: [202410],
      processedAt: '2024-01-01T00:00:00Z',
      termsWithData: 1,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns loading state initially', () => {
    vi.mocked(api.fetchForecastAccuracy).mockImplementation(
      () => new Promise(() => {})
    );

    const { result } = renderHook(
      () => useForecastAccuracy({
        courseCode: 'ISIS-3204',
        methodId: 'test',
        terms: [202410],
      }),
      { wrapper: createWrapper() }
    );

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeNull();
  });

  it('returns data on success', async () => {
    vi.mocked(api.fetchForecastAccuracy).mockResolvedValue(mockData);

    const { result } = renderHook(
      () => useForecastAccuracy({
        courseCode: 'ISIS-3204',
        methodId: 'test',
        terms: [202410],
      }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(mockData);
    expect(result.current.isError).toBe(false);
  });

  it('returns error on failure', async () => {
    const error = new Error('Network error');
    vi.mocked(api.fetchForecastAccuracy).mockRejectedValue(error);

    const { result } = renderHook(
      () => useForecastAccuracy({
        courseCode: 'ISIS-3204',
        methodId: 'test',
        terms: [202410],
      }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isError).toBe(true);
    expect(result.current.error).toEqual(error);
  });

  it('does not fetch when methodId is null', () => {
    renderHook(
      () => useForecastAccuracy({
        courseCode: 'ISIS-3204',
        methodId: null,
        terms: [202410],
      }),
      { wrapper: createWrapper() }
    );

    expect(api.fetchForecastAccuracy).not.toHaveBeenCalled();
  });

  it('does not fetch when disabled', () => {
    renderHook(
      () => useForecastAccuracy({
        courseCode: 'ISIS-3204',
        methodId: 'test',
        terms: [202410],
        enabled: false,
      }),
      { wrapper: createWrapper() }
    );

    expect(api.fetchForecastAccuracy).not.toHaveBeenCalled();
  });
});
```

---

## 2. Integration Tests

### 2.1 AccuracyTableContainer

**Location**: `apps/frontend/src/components/forecasts/__tests__/AccuracyTableContainer.test.tsx`

```tsx
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  MethodSelectorProvider,
} from '../../../contexts/MethodSelectorContext';
import { AccuracyTableContainer } from '../AccuracyTableContainer';
import * as methodsApi from '../../../api/forecast-methods';
import * as accuracyApi from '../../../api/forecast-accuracy';
import * as historyApi from '../../../api/course-history';

vi.mock('../../../api/forecast-methods');
vi.mock('../../../api/forecast-accuracy');
vi.mock('../../../api/course-history');

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MethodSelectorProvider>
        {children}
      </MethodSelectorProvider>
    </QueryClientProvider>
  );
};

describe('AccuracyTableContainer', () => {
  const mockMethods = [
    {
      id: 'test-method',
      label: 'Test Method',
      description: 'Desc',
      shortDescription: 'Short',
      category: 'prerequisite-based' as const,
      status: 'active' as const,
      capabilities: {
        supportsMultiTerm: true,
        supportsBacktesting: true,
        requiresPrerequisites: false,
        requiresHistoricalData: true,
      },
    },
  ];

  const mockHistory = {
    points: [
      { academicTerm: 202410, totalEnrollments: 38 },
      { academicTerm: 202420, totalEnrollments: 40 },
    ],
  };

  const mockAccuracy = {
    courseCode: 'ISIS-3204',
    method: { id: 'test-method', label: 'Test Method' },
    comparisons: [
      {
        academicTerm: 202410,
        forecast: { predictedEnrollment: 42 },
        actual: { realEnrollment: 38, dataSource: 'enrollments' },
        metrics: {
          accuracyPercentage: 89.47,
          absoluteError: 4,
          errorDirection: 'over',
          studentsOff: 4,
          errorPercentage: 10.53,
        },
      },
    ],
    summary: {
      averageAccuracy: 89.47,
      totalPredicted: 42,
      totalActual: 38,
      overallError: 4,
      mape: 10.53,
      rmse: 4,
      overPredictions: 1,
      underPredictions: 0,
      exactPredictions: 0,
    },
    metadata: {
      requestedTerms: [202410],
      processedAt: '2024-01-01T00:00:00Z',
      termsWithData: 1,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(methodsApi.fetchForecastMethods).mockResolvedValue({
      methods: mockMethods,
      metadata: { totalCount: 1, activeCount: 1 },
    });
    vi.mocked(historyApi.fetchCourseHistory).mockResolvedValue(mockHistory);
    vi.mocked(accuracyApi.fetchForecastAccuracy).mockResolvedValue(mockAccuracy);
  });

  it('shows empty state when no method selected', async () => {
    vi.mocked(methodsApi.fetchForecastMethods).mockResolvedValue({
      methods: [],
      metadata: { totalCount: 0, activeCount: 0 },
    });

    render(<AccuracyTableContainer courseCode="ISIS-3204" />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(screen.getByText('Select a forecast method')).toBeInTheDocument();
    });
  });

  it('shows loading state while fetching', async () => {
    vi.mocked(accuracyApi.fetchForecastAccuracy).mockImplementation(
      () => new Promise(() => {})
    );

    render(<AccuracyTableContainer courseCode="ISIS-3204" />, {
      wrapper: createWrapper(),
    });

    // Wait for method to auto-select
    await waitFor(() => {
      expect(document.querySelector('.accuracy-container__skeleton')).toBeInTheDocument();
    });
  });

  it('displays accuracy table on success', async () => {
    render(<AccuracyTableContainer courseCode="ISIS-3204" />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(screen.getByText('Accuracy: Test Method')).toBeInTheDocument();
      expect(screen.getByText('89.5%')).toBeInTheDocument();
    });
  });

  it('displays summary on success', async () => {
    render(<AccuracyTableContainer courseCode="ISIS-3204" />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(screen.getByText('Summary')).toBeInTheDocument();
      expect(screen.getByText('Average Accuracy')).toBeInTheDocument();
    });
  });

  it('shows error state on failure', async () => {
    vi.mocked(accuracyApi.fetchForecastAccuracy).mockRejectedValue(
      new Error('Network error')
    );

    render(<AccuracyTableContainer courseCode="ISIS-3204" />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(screen.getByText('Failed to load accuracy data')).toBeInTheDocument();
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });
});
```

---

## 3. E2E Tests

### 3.1 Playwright Tests

**Location**: `apps/frontend/e2e/accuracy-table.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Accuracy Table', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/courses/ISIS-3204/accuracy');
  });

  test('displays accuracy table after method selection', async ({ page }) => {
    // Wait for method to auto-select
    await expect(page.locator('.accuracy-table')).toBeVisible();
  });

  test('displays summary section', async ({ page }) => {
    await expect(page.locator('.accuracy-summary')).toBeVisible();
    await expect(page.getByText('Average Accuracy')).toBeVisible();
  });

  test('sorts table by column', async ({ page }) => {
    await page.locator('button:has-text("Accuracy")').click();

    // Verify sort indicator changed
    await expect(page.locator('.sort-indicator--active')).toBeVisible();
  });

  test('updates table when method changes', async ({ page }) => {
    // Wait for initial load
    await expect(page.locator('.accuracy-table')).toBeVisible();

    // Select different method if available
    const methods = page.locator('[role="option"]');
    const count = await methods.count();

    if (count > 1) {
      await methods.nth(1).click();
      // Table should update
      await expect(page.locator('.accuracy-table')).toBeVisible();
    }
  });

  test('shows loading state', async ({ page }) => {
    // Reload to see loading state
    await page.reload();
    await expect(page.locator('.accuracy-container__skeleton')).toBeVisible();
    // Then table appears
    await expect(page.locator('.accuracy-table')).toBeVisible();
  });
});
```

---

## 4. Manual Testing Checklist

### 4.1 Functional Tests

- [ ] Table loads with correct data
- [ ] All columns display correctly
- [ ] Sorting works for all columns
- [ ] Summary displays correct values
- [ ] Loading skeleton appears during fetch
- [ ] Error state shows on API failure
- [ ] Retry button works

### 4.2 Visual Tests

- [ ] Accuracy bars show correct fill
- [ ] Color coding matches accuracy level
- [ ] Error direction icons display correctly
- [ ] Responsive layout works

### 4.3 Accessibility

- [ ] Table is navigable by keyboard
- [ ] Screen reader announces values correctly
- [ ] Sort state is announced
- [ ] Color contrast meets WCAG AA

---

## 5. Test Coverage Requirements

| Component | Coverage Target |
|-----------|-----------------|
| AccuracyTableRow | 90% |
| AccuracyTable | 85% |
| AccuracySummary | 90% |
| AccuracyTableContainer | 85% |
| useForecastAccuracy | 90% |
| API client | 80% |

---

## Related Documents

- [Architecture Document](./architecture.md)
- [Implementation Guide](./implementation-guide.md)
- [System Impact](./system-impact.md)
