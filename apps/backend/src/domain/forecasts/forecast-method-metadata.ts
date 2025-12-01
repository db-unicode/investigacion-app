/**
 * Categories for grouping forecast methods
 */
export type MethodCategory =
  | 'prerequisite-based'
  | 'historical-trend'
  | 'machine-learning';

/**
 * Status of a forecast method
 */
export type MethodStatus = 'active' | 'beta' | 'deprecated';

/**
 * Capabilities of a forecast method
 */
export interface MethodCapabilities {
  readonly supportsMultiTerm: boolean;
  readonly supportsBacktesting: boolean;
  readonly requiresPrerequisites: boolean;
  readonly requiresHistoricalData: boolean;
}

/**
 * Complete metadata for a forecast method
 */
export interface ForecastMethodMetadata {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly shortDescription: string;
  readonly category: MethodCategory;
  readonly status: MethodStatus;
  readonly capabilities: MethodCapabilities;
  readonly icon?: string;
}
