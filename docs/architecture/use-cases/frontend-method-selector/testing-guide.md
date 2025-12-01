# Frontend Method Selector - Testing Guide

## Overview

This guide provides comprehensive testing strategies for the Frontend Method Selector feature.

---

## 1. Unit Tests

### 1.1 MethodCard Component

**Location**: `apps/frontend/src/components/forecasts/__tests__/MethodCard.test.tsx`

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MethodCard } from '../MethodCard';
import type { ForecastMethod } from '../../../types/forecast-methods';

const createMockMethod = (overrides?: Partial<ForecastMethod>): ForecastMethod => ({
  id: 'test-method',
  label: 'Test Method',
  description: 'Full description',
  shortDescription: 'Short description',
  category: 'prerequisite-based',
  status: 'active',
  capabilities: {
    supportsMultiTerm: true,
    supportsBacktesting: true,
    requiresPrerequisites: false,
    requiresHistoricalData: true,
  },
  ...overrides,
});

describe('MethodCard', () => {
  describe('rendering', () => {
    it('displays method label', () => {
      render(
        <MethodCard
          method={createMockMethod({ label: 'My Method' })}
          isSelected={false}
          onClick={() => {}}
        />
      );

      expect(screen.getByText('My Method')).toBeInTheDocument();
    });

    it('displays short description', () => {
      render(
        <MethodCard
          method={createMockMethod({ shortDescription: 'Brief info' })}
          isSelected={false}
          onClick={() => {}}
        />
      );

      expect(screen.getByText('Brief info')).toBeInTheDocument();
    });

    it('displays status badge', () => {
      render(
        <MethodCard
          method={createMockMethod({ status: 'beta' })}
          isSelected={false}
          onClick={() => {}}
        />
      );

      expect(screen.getByText('beta')).toBeInTheDocument();
    });

    it('shows checkmark when selected', () => {
      render(
        <MethodCard
          method={createMockMethod()}
          isSelected={true}
          onClick={() => {}}
        />
      );

      expect(screen.getByText('✓')).toBeInTheDocument();
    });

    it('hides checkmark when not selected', () => {
      render(
        <MethodCard
          method={createMockMethod()}
          isSelected={false}
          onClick={() => {}}
        />
      );

      expect(screen.queryByText('✓')).not.toBeInTheDocument();
    });
  });

  describe('interaction', () => {
    it('calls onClick when clicked', () => {
      const handleClick = vi.fn();
      render(
        <MethodCard
          method={createMockMethod()}
          isSelected={false}
          onClick={handleClick}
        />
      );

      fireEvent.click(screen.getByRole('option'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onClick when disabled', () => {
      const handleClick = vi.fn();
      render(
        <MethodCard
          method={createMockMethod()}
          isSelected={false}
          onClick={handleClick}
          disabled
        />
      );

      fireEvent.click(screen.getByRole('option'));
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('keyboard navigation', () => {
    it('triggers onClick on Enter key', () => {
      const handleClick = vi.fn();
      render(
        <MethodCard
          method={createMockMethod()}
          isSelected={false}
          onClick={handleClick}
        />
      );

      fireEvent.keyDown(screen.getByRole('option'), { key: 'Enter' });
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('triggers onClick on Space key', () => {
      const handleClick = vi.fn();
      render(
        <MethodCard
          method={createMockMethod()}
          isSelected={false}
          onClick={handleClick}
        />
      );

      fireEvent.keyDown(screen.getByRole('option'), { key: ' ' });
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('does not trigger on other keys', () => {
      const handleClick = vi.fn();
      render(
        <MethodCard
          method={createMockMethod()}
          isSelected={false}
          onClick={handleClick}
        />
      );

      fireEvent.keyDown(screen.getByRole('option'), { key: 'a' });
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('has correct aria-selected when selected', () => {
      render(
        <MethodCard
          method={createMockMethod()}
          isSelected={true}
          onClick={() => {}}
        />
      );

      expect(screen.getByRole('option')).toHaveAttribute('aria-selected', 'true');
    });

    it('has correct aria-selected when not selected', () => {
      render(
        <MethodCard
          method={createMockMethod()}
          isSelected={false}
          onClick={() => {}}
        />
      );

      expect(screen.getByRole('option')).toHaveAttribute('aria-selected', 'false');
    });

    it('has correct aria-disabled when disabled', () => {
      render(
        <MethodCard
          method={createMockMethod()}
          isSelected={false}
          onClick={() => {}}
          disabled
        />
      );

      expect(screen.getByRole('option')).toHaveAttribute('aria-disabled', 'true');
    });

    it('is focusable when not disabled', () => {
      render(
        <MethodCard
          method={createMockMethod()}
          isSelected={false}
          onClick={() => {}}
        />
      );

      expect(screen.getByRole('option')).toHaveAttribute('tabIndex', '0');
    });

    it('is not focusable when disabled', () => {
      render(
        <MethodCard
          method={createMockMethod()}
          isSelected={false}
          onClick={() => {}}
          disabled
        />
      );

      expect(screen.getByRole('option')).toHaveAttribute('tabIndex', '-1');
    });
  });
});
```

### 1.2 useForecastMethods Hook

**Location**: `apps/frontend/src/hooks/__tests__/useForecastMethods.test.ts`

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useForecastMethods } from '../useForecastMethods';
import * as api from '../../api/forecast-methods';

vi.mock('../../api/forecast-methods');

describe('useForecastMethods', () => {
  const mockMethods = [
    {
      id: 'method-1',
      label: 'Method 1',
      description: 'Description 1',
      shortDescription: 'Short 1',
      category: 'prerequisite-based',
      status: 'active',
      capabilities: {
        supportsMultiTerm: true,
        supportsBacktesting: true,
        requiresPrerequisites: false,
        requiresHistoricalData: true,
      },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns loading state initially', () => {
    vi.mocked(api.fetchForecastMethods).mockImplementation(
      () => new Promise(() => {})
    );

    const { result } = renderHook(() => useForecastMethods());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.methods).toEqual([]);
  });

  it('returns methods on success', async () => {
    vi.mocked(api.fetchForecastMethods).mockResolvedValue({
      methods: mockMethods,
      metadata: { totalCount: 1, activeCount: 1 },
    });

    const { result } = renderHook(() => useForecastMethods());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.methods).toEqual(mockMethods);
    expect(result.current.isError).toBe(false);
  });

  it('returns error on failure', async () => {
    const error = new Error('Network error');
    vi.mocked(api.fetchForecastMethods).mockRejectedValue(error);

    const { result } = renderHook(() => useForecastMethods());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isError).toBe(true);
    expect(result.current.error).toEqual(error);
  });

  it('passes filter options to API', async () => {
    vi.mocked(api.fetchForecastMethods).mockResolvedValue({
      methods: mockMethods,
      metadata: { totalCount: 1, activeCount: 1 },
    });

    renderHook(() => useForecastMethods({ backtesting: true }));

    await waitFor(() => {
      expect(api.fetchForecastMethods).toHaveBeenCalledWith({
        backtesting: true,
      });
    });
  });
});
```

---

## 2. Integration Tests

### 2.1 MethodSelectorPanel

**Location**: `apps/frontend/src/components/forecasts/__tests__/MethodSelectorPanel.test.tsx`

```tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MethodSelectorProvider } from '../../../contexts/MethodSelectorContext';
import { MethodSelectorPanel } from '../MethodSelectorPanel';
import * as api from '../../../api/forecast-methods';

vi.mock('../../../api/forecast-methods');

const mockMethods = [
  {
    id: 'method-1',
    label: 'Method One',
    description: 'Description 1',
    shortDescription: 'Short 1',
    category: 'prerequisite-based' as const,
    status: 'active' as const,
    capabilities: {
      supportsMultiTerm: true,
      supportsBacktesting: true,
      requiresPrerequisites: false,
      requiresHistoricalData: true,
    },
  },
  {
    id: 'method-2',
    label: 'Method Two',
    description: 'Description 2',
    shortDescription: 'Short 2',
    category: 'historical-trend' as const,
    status: 'active' as const,
    capabilities: {
      supportsMultiTerm: true,
      supportsBacktesting: true,
      requiresPrerequisites: false,
      requiresHistoricalData: true,
    },
  },
];

describe('MethodSelectorPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loading state', () => {
    it('shows loading skeleton while fetching', () => {
      vi.mocked(api.fetchForecastMethods).mockImplementation(
        () => new Promise(() => {})
      );

      render(
        <MethodSelectorProvider>
          <MethodSelectorPanel />
        </MethodSelectorProvider>
      );

      expect(screen.getByText('Forecast Methods')).toBeInTheDocument();
      expect(document.querySelector('.method-card-skeleton')).toBeInTheDocument();
    });
  });

  describe('success state', () => {
    beforeEach(() => {
      vi.mocked(api.fetchForecastMethods).mockResolvedValue({
        methods: mockMethods,
        metadata: { totalCount: 2, activeCount: 2 },
      });
    });

    it('displays all methods', async () => {
      render(
        <MethodSelectorProvider>
          <MethodSelectorPanel />
        </MethodSelectorProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Method One')).toBeInTheDocument();
        expect(screen.getByText('Method Two')).toBeInTheDocument();
      });
    });

    it('auto-selects first method', async () => {
      render(
        <MethodSelectorProvider>
          <MethodSelectorPanel />
        </MethodSelectorProvider>
      );

      await waitFor(() => {
        const cards = screen.getAllByRole('option');
        expect(cards[0]).toHaveAttribute('aria-selected', 'true');
      });
    });

    it('changes selection on click', async () => {
      render(
        <MethodSelectorProvider>
          <MethodSelectorPanel />
        </MethodSelectorProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Method Two')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Method Two'));

      await waitFor(() => {
        const cards = screen.getAllByRole('option');
        expect(cards[1]).toHaveAttribute('aria-selected', 'true');
        expect(cards[0]).toHaveAttribute('aria-selected', 'false');
      });
    });
  });

  describe('error state', () => {
    it('shows error message and retry button', async () => {
      vi.mocked(api.fetchForecastMethods).mockRejectedValue(
        new Error('Network error')
      );

      render(
        <MethodSelectorProvider>
          <MethodSelectorPanel />
        </MethodSelectorProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Failed to load forecast methods')).toBeInTheDocument();
        expect(screen.getByText('Network error')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument();
      });
    });

    it('retries on button click', async () => {
      vi.mocked(api.fetchForecastMethods)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          methods: mockMethods,
          metadata: { totalCount: 2, activeCount: 2 },
        });

      render(
        <MethodSelectorProvider>
          <MethodSelectorPanel />
        </MethodSelectorProvider>
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: 'Try Again' }));

      await waitFor(() => {
        expect(screen.getByText('Method One')).toBeInTheDocument();
      });
    });
  });

  describe('empty state', () => {
    it('shows empty message when no methods', async () => {
      vi.mocked(api.fetchForecastMethods).mockResolvedValue({
        methods: [],
        metadata: { totalCount: 0, activeCount: 0 },
      });

      render(
        <MethodSelectorProvider>
          <MethodSelectorPanel />
        </MethodSelectorProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('No forecast methods available')).toBeInTheDocument();
      });
    });
  });
});
```

---

## 3. Context Tests

### 3.1 MethodSelectorContext

**Location**: `apps/frontend/src/contexts/__tests__/MethodSelectorContext.test.tsx`

```tsx
import { render, screen, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  MethodSelectorProvider,
  useMethodSelector,
} from '../MethodSelectorContext';
import * as api from '../../api/forecast-methods';

vi.mock('../../api/forecast-methods');

function TestConsumer() {
  const { selectedMethod, setSelectedMethod, methods, isLoading, error } =
    useMethodSelector();

  return (
    <div>
      <div data-testid="loading">{isLoading ? 'loading' : 'done'}</div>
      <div data-testid="error">{error?.message ?? 'no error'}</div>
      <div data-testid="selected">{selectedMethod?.id ?? 'none'}</div>
      <div data-testid="count">{methods.length}</div>
      {methods.map(m => (
        <button key={m.id} onClick={() => setSelectedMethod(m)}>
          Select {m.id}
        </button>
      ))}
    </div>
  );
}

describe('MethodSelectorContext', () => {
  const mockMethods = [
    {
      id: 'method-1',
      label: 'Method 1',
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
    {
      id: 'method-2',
      label: 'Method 2',
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

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws when used outside provider', () => {
    // Suppress console.error for this test
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => render(<TestConsumer />)).toThrow(
      'useMethodSelector must be used within a MethodSelectorProvider'
    );

    spy.mockRestore();
  });

  it('provides loading state', () => {
    vi.mocked(api.fetchForecastMethods).mockImplementation(
      () => new Promise(() => {})
    );

    render(
      <MethodSelectorProvider>
        <TestConsumer />
      </MethodSelectorProvider>
    );

    expect(screen.getByTestId('loading')).toHaveTextContent('loading');
  });

  it('provides methods after loading', async () => {
    vi.mocked(api.fetchForecastMethods).mockResolvedValue({
      methods: mockMethods,
      metadata: { totalCount: 2, activeCount: 2 },
    });

    render(
      <MethodSelectorProvider>
        <TestConsumer />
      </MethodSelectorProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('loading')).toHaveTextContent('done');
      expect(screen.getByTestId('count')).toHaveTextContent('2');
    });
  });

  it('auto-selects first method', async () => {
    vi.mocked(api.fetchForecastMethods).mockResolvedValue({
      methods: mockMethods,
      metadata: { totalCount: 2, activeCount: 2 },
    });

    render(
      <MethodSelectorProvider>
        <TestConsumer />
      </MethodSelectorProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('selected')).toHaveTextContent('method-1');
    });
  });

  it('respects initialMethodId', async () => {
    vi.mocked(api.fetchForecastMethods).mockResolvedValue({
      methods: mockMethods,
      metadata: { totalCount: 2, activeCount: 2 },
    });

    render(
      <MethodSelectorProvider initialMethodId="method-2">
        <TestConsumer />
      </MethodSelectorProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('selected')).toHaveTextContent('method-2');
    });
  });

  it('allows changing selection', async () => {
    vi.mocked(api.fetchForecastMethods).mockResolvedValue({
      methods: mockMethods,
      metadata: { totalCount: 2, activeCount: 2 },
    });

    render(
      <MethodSelectorProvider>
        <TestConsumer />
      </MethodSelectorProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Select method-2')).toBeInTheDocument();
    });

    act(() => {
      screen.getByText('Select method-2').click();
    });

    expect(screen.getByTestId('selected')).toHaveTextContent('method-2');
  });
});
```

---

## 4. E2E Tests

### 4.1 Playwright Tests

**Location**: `apps/frontend/e2e/method-selector.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Method Selector', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a course accuracy page
    await page.goto('/courses/ISIS-3204/accuracy');
  });

  test('displays method cards', async ({ page }) => {
    // Wait for methods to load
    await expect(page.locator('text=Forecast Methods')).toBeVisible();

    // At least one method should be visible
    await expect(page.locator('[role="option"]').first()).toBeVisible();
  });

  test('selects method on click', async ({ page }) => {
    // Wait for methods
    const options = page.locator('[role="option"]');
    await expect(options.first()).toBeVisible();

    // Click second method if available
    const count = await options.count();
    if (count > 1) {
      await options.nth(1).click();
      await expect(options.nth(1)).toHaveAttribute('aria-selected', 'true');
    }
  });

  test('keyboard navigation works', async ({ page }) => {
    const options = page.locator('[role="option"]');
    await expect(options.first()).toBeVisible();

    // Focus first option
    await options.first().focus();

    // Press Enter to select
    await page.keyboard.press('Enter');

    await expect(options.first()).toHaveAttribute('aria-selected', 'true');
  });

  test('updates accuracy table on method change', async ({ page }) => {
    const options = page.locator('[role="option"]');
    await expect(options.first()).toBeVisible();

    // Select first method
    await options.first().click();

    // Wait for accuracy table to appear
    await expect(page.locator('.accuracy-table')).toBeVisible();
  });

  test('handles loading state', async ({ page }) => {
    // Should show loading skeleton initially
    await expect(page.locator('.method-card-skeleton').first()).toBeVisible();

    // Then methods should appear
    await expect(page.locator('[role="option"]').first()).toBeVisible({ timeout: 10000 });
  });
});
```

---

## 5. Manual Testing Checklist

### 5.1 Functional Tests

- [ ] Methods load on page mount
- [ ] First method is auto-selected
- [ ] Clicking a method selects it
- [ ] Previous selection is deselected
- [ ] Selected method updates accuracy table

### 5.2 Keyboard Navigation

- [ ] Tab focuses method selector
- [ ] Arrow keys navigate between methods
- [ ] Enter/Space selects focused method
- [ ] Focus ring is visible

### 5.3 Loading States

- [ ] Skeleton shows while loading
- [ ] Error message shows on failure
- [ ] Retry button works
- [ ] Empty state shows when no methods

### 5.4 Responsive Design

- [ ] Desktop: sidebar visible
- [ ] Tablet: collapsible sidebar
- [ ] Mobile: bottom sheet or modal

### 5.5 Accessibility

- [ ] Screen reader announces method names
- [ ] Selection state is announced
- [ ] Color contrast meets WCAG AA

---

## 6. Test Coverage Requirements

| Component | Coverage Target |
|-----------|-----------------|
| MethodCard | 90% |
| MethodSelectorPanel | 85% |
| MethodSelectorContext | 90% |
| useForecastMethods | 85% |
| API client | 80% |

---

## Related Documents

- [Architecture Document](./architecture.md)
- [Implementation Guide](./implementation-guide.md)
- [System Impact](./system-impact.md)
