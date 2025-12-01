import { InMemoryForecastMethodRegistry } from './in-memory-forecast-method-registry';
import { FORECAST_METHODS } from './method-definitions';
import type { ForecastMethodRegistry } from './forecast-method-registry';

/**
 * Create and initialize the forecast method registry
 */
function createInitializedRegistry(): ForecastMethodRegistry {
  const registry = new InMemoryForecastMethodRegistry();

  for (const method of FORECAST_METHODS) {
    registry.register(method);
  }

  return registry;
}

/**
 * Singleton instance of the forecast method registry
 */
export const forecastMethodRegistry: ForecastMethodRegistry =
  createInitializedRegistry();
