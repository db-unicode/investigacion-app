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
  {
    id: 'pass-rate-adjusted',
    label: 'Pass Rate Adjusted',
    description:
      'Builds on the "Potential Students by Prerequisites" method by applying a historical conversion rate adjustment. First, it calculates the pool of eligible students who have completed all prerequisites (same as the base method). Then, it multiplies this count by a weighted average conversion rate derived from past terms, where conversion rate = actual enrollments / potential students. This calibration reduces over-prediction by accounting for the fact that not all eligible students enroll. Requires prerequisite data and historical enrollment records. Uses term-type-aware lookback (main semesters vs intersession).',
    shortDescription: 'Prerequisites + historical conversion rate',
    category: 'prerequisite-based',
    status: 'active',
    capabilities: {
      supportsMultiTerm: true,
      supportsBacktesting: true,
      requiresPrerequisites: true,
      requiresHistoricalData: true,
    },
    icon: 'calibrated',
  },
];
