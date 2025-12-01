import type {
  ForecastMethodMetadata,
  MethodCategory,
  MethodStatus,
} from './forecast-method-metadata';

/**
 * Filter options for querying methods
 */
export interface MethodFilterOptions {
  category?: MethodCategory;
  status?: MethodStatus;
  supportsBacktesting?: boolean;
}

/**
 * Registry for managing forecast method metadata
 */
export interface ForecastMethodRegistry {
  /**
   * Register a new forecast method
   */
  register(metadata: ForecastMethodMetadata): void;

  /**
   * Get all registered methods
   */
  getAll(): ForecastMethodMetadata[];

  /**
   * Get methods matching filter criteria
   */
  getFiltered(options: MethodFilterOptions): ForecastMethodMetadata[];

  /**
   * Get method by ID
   */
  getById(id: string): ForecastMethodMetadata | undefined;

  /**
   * Get methods by category
   */
  getByCategory(category: MethodCategory): ForecastMethodMetadata[];

  /**
   * Check if a method exists
   */
  has(id: string): boolean;

  /**
   * Get count of all methods
   */
  count(): number;

  /**
   * Get count of active methods
   */
  activeCount(): number;
}
