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
  {
    id: 'weighted-moving-average',
    label: 'Weighted Moving Average (3-term WMA)',
    description:
      'Forecasts enrollment using a 3-term Weighted Moving Average of past enrollments. ' +
      'Fixed weights: 50% (most recent term), 30% (previous term), 20% (third most recent). ' +
      'Uses term-type-aware lookback: main semesters (10, 20) are compared with other main semesters, ' +
      'while intersessions (11-19) are compared with the same intersession type from previous years. ' +
      'Gracefully handles edge cases with fewer than 3 terms by normalizing weights.',
    shortDescription: '3-term weighted moving average',
    category: 'historical-trend',
    status: 'active',
    capabilities: {
      supportsMultiTerm: true,
      supportsBacktesting: true,
      requiresPrerequisites: false,
      requiresHistoricalData: true,
    },
    icon: 'trend',
  },
];
