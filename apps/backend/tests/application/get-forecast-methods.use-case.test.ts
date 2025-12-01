import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GetForecastMethodsUseCase } from '../../src/application/use-cases/forecasts/get-forecast-methods.use-case';
import type { ForecastMethodRegistry } from '../../src/domain/forecasts/forecast-method-registry';
import type { ForecastMethodMetadata } from '../../src/domain/forecasts/forecast-method-metadata';

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
