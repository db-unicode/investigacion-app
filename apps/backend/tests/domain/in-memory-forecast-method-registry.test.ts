import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryForecastMethodRegistry } from '../../src/domain/forecasts/in-memory-forecast-method-registry';
import type { ForecastMethodMetadata } from '../../src/domain/forecasts/forecast-method-metadata';

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
