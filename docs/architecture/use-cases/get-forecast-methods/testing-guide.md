# Get Forecast Methods - Testing Guide

## Overview

This guide provides comprehensive testing strategies for the Get Forecast Methods feature.

---

## 1. Unit Tests

### 1.1 InMemoryForecastMethodRegistry

**Location**: `apps/backend/src/domain/forecasts/__tests__/in-memory-forecast-method-registry.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryForecastMethodRegistry } from '../in-memory-forecast-method-registry';
import type { ForecastMethodMetadata } from '../forecast-method-metadata';

describe('InMemoryForecastMethodRegistry', () => {
  let registry: InMemoryForecastMethodRegistry;

  const testMethod: ForecastMethodMetadata = {
    id: 'test-method',
    label: 'Test Method',
    description: 'A test method',
    shortDescription: 'Test',
    category: 'prerequisite-based',
    status: 'active',
    capabilities: {
      supportsMultiTerm: true,
      supportsBacktesting: true,
      requiresPrerequisites: false,
      requiresHistoricalData: true,
    },
  };

  beforeEach(() => {
    registry = new InMemoryForecastMethodRegistry();
  });

  describe('register', () => {
    it('should register a new method', () => {
      registry.register(testMethod);
      expect(registry.has(testMethod.id)).toBe(true);
    });

    it('should throw error for duplicate registration', () => {
      registry.register(testMethod);
      expect(() => registry.register(testMethod)).toThrow(
        `Method with ID '${testMethod.id}' is already registered`,
      );
    });
  });

  describe('getById', () => {
    it('should return method by ID', () => {
      registry.register(testMethod);
      const result = registry.getById(testMethod.id);
      expect(result).toEqual(testMethod);
    });

    it('should return undefined for unknown ID', () => {
      const result = registry.getById('unknown');
      expect(result).toBeUndefined();
    });
  });

  describe('getAll', () => {
    it('should return all registered methods', () => {
      const method2: ForecastMethodMetadata = {
        ...testMethod,
        id: 'method-2',
      };

      registry.register(testMethod);
      registry.register(method2);

      const result = registry.getAll();
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no methods registered', () => {
      expect(registry.getAll()).toEqual([]);
    });
  });

  describe('getFiltered', () => {
    beforeEach(() => {
      // Register methods with different statuses and capabilities
      registry.register(testMethod);
      registry.register({
        ...testMethod,
        id: 'beta-method',
        status: 'beta',
      });
      registry.register({
        ...testMethod,
        id: 'deprecated-method',
        status: 'deprecated',
      });
      registry.register({
        ...testMethod,
        id: 'no-backtest',
        capabilities: {
          ...testMethod.capabilities,
          supportsBacktesting: false,
        },
      });
    });

    it('should filter by status', () => {
      const result = registry.getFiltered({ status: 'beta' });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('beta-method');
    });

    it('should default to active status when no status provided', () => {
      const result = registry.getFiltered({});
      const activeOnly = result.every(m => m.status === 'active');
      expect(activeOnly).toBe(true);
    });

    it('should filter by backtesting support', () => {
      const result = registry.getFiltered({
        status: 'active',
        supportsBacktesting: true,
      });
      const allSupportBacktest = result.every(
        m => m.capabilities.supportsBacktesting,
      );
      expect(allSupportBacktest).toBe(true);
    });

    it('should filter by category', () => {
      registry.register({
        ...testMethod,
        id: 'ml-method',
        category: 'machine-learning',
      });

      const result = registry.getFiltered({
        category: 'machine-learning',
        status: 'active',
      });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('ml-method');
    });
  });

  describe('count', () => {
    it('should return total method count', () => {
      registry.register(testMethod);
      registry.register({ ...testMethod, id: 'method-2' });
      expect(registry.count()).toBe(2);
    });
  });

  describe('activeCount', () => {
    it('should return only active method count', () => {
      registry.register(testMethod); // active
      registry.register({ ...testMethod, id: 'beta', status: 'beta' });
      registry.register({
        ...testMethod,
        id: 'deprecated',
        status: 'deprecated',
      });

      expect(registry.activeCount()).toBe(1);
    });
  });
});
```

### 1.2 GetForecastMethodsUseCase

**Location**: `apps/backend/src/application/use-cases/forecasts/__tests__/get-forecast-methods.use-case.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GetForecastMethodsUseCase } from '../get-forecast-methods.use-case';
import type { ForecastMethodRegistry } from '../../../../domain/forecasts/forecast-method-registry';
import type { ForecastMethodMetadata } from '../../../../domain/forecasts/forecast-method-metadata';

describe('GetForecastMethodsUseCase', () => {
  let useCase: GetForecastMethodsUseCase;
  let mockRegistry: ForecastMethodRegistry;

  const testMethod: ForecastMethodMetadata = {
    id: 'test-method',
    label: 'Test Method',
    description: 'Description',
    shortDescription: 'Short',
    category: 'prerequisite-based',
    status: 'active',
    capabilities: {
      supportsMultiTerm: true,
      supportsBacktesting: true,
      requiresPrerequisites: false,
      requiresHistoricalData: true,
    },
  };

  beforeEach(() => {
    mockRegistry = {
      register: vi.fn(),
      getAll: vi.fn().mockReturnValue([testMethod]),
      getFiltered: vi.fn().mockReturnValue([testMethod]),
      getById: vi.fn().mockReturnValue(testMethod),
      getByCategory: vi.fn(),
      has: vi.fn(),
      count: vi.fn().mockReturnValue(1),
      activeCount: vi.fn().mockReturnValue(1),
    };

    useCase = new GetForecastMethodsUseCase({ registry: mockRegistry });
  });

  describe('execute', () => {
    it('should return methods list with metadata', () => {
      const result = useCase.execute({});

      expect(result.methods).toHaveLength(1);
      expect(result.methods[0].id).toBe('test-method');
      expect(result.metadata.totalCount).toBe(1);
      expect(result.metadata.activeCount).toBe(1);
    });

    it('should pass filter options to registry', () => {
      useCase.execute({
        category: 'prerequisite-based',
        status: 'active',
        supportsBacktesting: true,
      });

      expect(mockRegistry.getFiltered).toHaveBeenCalledWith({
        category: 'prerequisite-based',
        status: 'active',
        supportsBacktesting: true,
      });
    });
  });

  describe('executeById', () => {
    it('should return method when found', () => {
      const result = useCase.executeById('test-method');

      expect(result).not.toBeNull();
      expect(result!.id).toBe('test-method');
    });

    it('should return null when method not found', () => {
      vi.mocked(mockRegistry.getById).mockReturnValue(undefined);

      const result = useCase.executeById('unknown');

      expect(result).toBeNull();
    });
  });
});
```

---

## 2. Integration Tests

### 2.1 API Endpoint Tests

**Location**: `apps/backend/src/presentation/controllers/forecasts/__tests__/forecast-methods.controller.test.ts`

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Hono } from 'hono';
import { testClient } from 'hono/testing';
import { registerForecastMethodsRoutes } from '../forecast-methods.controller';

describe('Forecast Methods Controller', () => {
  let app: Hono;
  let client: ReturnType<typeof testClient>;

  beforeAll(() => {
    app = new Hono();
    registerForecastMethodsRoutes(app);
    client = testClient(app);
  });

  describe('GET /api/forecasts/methods', () => {
    it('should return list of methods', async () => {
      const res = await client.api.forecasts.methods.$get();

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.methods).toBeDefined();
      expect(Array.isArray(body.methods)).toBe(true);
      expect(body.metadata).toBeDefined();
    });

    it('should return methods with backtesting support', async () => {
      const res = await client.api.forecasts.methods.$get({
        query: { backtesting: 'true' },
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      body.methods.forEach((m: any) => {
        expect(m.capabilities.supportsBacktesting).toBe(true);
      });
    });

    it('should filter by category', async () => {
      const res = await client.api.forecasts.methods.$get({
        query: { category: 'prerequisite-based' },
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      body.methods.forEach((m: any) => {
        expect(m.category).toBe('prerequisite-based');
      });
    });
  });

  describe('GET /api/forecasts/methods/:methodId', () => {
    it('should return method by ID', async () => {
      const res = await client.api.forecasts.methods[
        ':methodId'
      ].$get({
        param: { methodId: 'potential-students-by-prerequisites' },
      });

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.id).toBe('potential-students-by-prerequisites');
    });

    it('should return 404 for unknown method', async () => {
      const res = await client.api.forecasts.methods[
        ':methodId'
      ].$get({
        param: { methodId: 'unknown-method' },
      });

      expect(res.status).toBe(404);
    });
  });
});
```

---

## 3. Manual Testing

### 3.1 cURL Commands

```bash
# List all active methods
curl -s "http://localhost:3000/api/forecasts/methods" | jq

# List methods with backtesting support
curl -s "http://localhost:3000/api/forecasts/methods?backtesting=true" | jq

# Filter by category
curl -s "http://localhost:3000/api/forecasts/methods?category=prerequisite-based" | jq

# Get single method
curl -s "http://localhost:3000/api/forecasts/methods/potential-students-by-prerequisites" | jq

# Test 404
curl -s -w "\nHTTP Status: %{http_code}\n" \
  "http://localhost:3000/api/forecasts/methods/unknown-method"
```

### 3.2 Expected Responses

**GET /api/forecasts/methods**
```json
{
  "methods": [
    {
      "id": "potential-students-by-prerequisites",
      "label": "Potential Students by Prerequisites",
      "description": "...",
      "shortDescription": "Based on prerequisite completion",
      "category": "prerequisite-based",
      "status": "active",
      "capabilities": {
        "supportsMultiTerm": true,
        "supportsBacktesting": true,
        "requiresPrerequisites": true,
        "requiresHistoricalData": true
      },
      "icon": "prerequisites"
    }
  ],
  "metadata": {
    "totalCount": 1,
    "activeCount": 1
  }
}
```

---

## 4. Test Coverage Requirements

| Component | Coverage Target | Key Scenarios |
|-----------|-----------------|---------------|
| Registry | 90% | Registration, lookup, filtering |
| Use Case | 85% | DTO mapping, null handling |
| Controller | 80% | Request validation, error responses |

---

## 5. Edge Cases

### 5.1 Empty Registry

- Should return empty methods array
- Metadata counts should be 0

### 5.2 Filter with No Matches

- Should return empty methods array
- Total/active counts should still reflect registry state

### 5.3 Duplicate Registration

- Should throw descriptive error
- Registry state should remain unchanged

---

## Related Documents

- [Architecture Document](./architecture.md)
- [Implementation Guide](./implementation-guide.md)
- [System Impact](./system-impact.md)
