import type { ForecastMethodMetadata } from './forecast-method-metadata';

/**
 * All available forecast methods
 */
export const FORECAST_METHODS: ForecastMethodMetadata[] = [
  {
    id: 'potential-students-by-prerequisites',
    label: 'Potential Students by Prerequisites',
    description:
      'Forecasts potential enrollment by analyzing students who have completed all prerequisite courses but have not yet taken the target course. Uses set-based intersection to identify eligible students and provides detailed breakdown of prerequisite completion.',
    shortDescription: 'Based on prerequisite completion',
    category: 'prerequisite-based',
    status: 'active',
    capabilities: {
      supportsMultiTerm: true,
      supportsBacktesting: true,
      requiresPrerequisites: true,
      requiresHistoricalData: true,
    },
    icon: 'prerequisites',
  },
  // Additional methods can be added here
];
