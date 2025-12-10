export type {
  CourseDemandForecaster,
  CourseDemandForecasterInput,
  CourseDemandForecasterResult,
} from './course-demand-forecaster';

export {
  MultiTermForecasterDecorator,
  type MultiTermForecasterOptions,
  type MultiTermForecasterResult,
  type TermForecastError,
} from './multi-term-forecaster.decorator';

export {
  PotentialStudentsByPrerequisitesForecaster,
  type PotentialStudentsByPrerequisitesForecasterDeps,
  type PotentialStudentsByPrerequisitesDetails,
  type PotentialStudentsByPrerequisitesResult,
  type EnrollmentHistoryProvider,
  type PrerequisitesProvider,
} from './potential-students-by-prerequisites-forecaster';

// Pass Rate Adjusted Forecaster
export type {
  ConversionRateConfidence,
  HistoricalConversionData,
  ConversionRateResult,
  HistoricalRateEntry,
  PassRateAdjustedDetails,
  PassRateAdjustedResult,
} from './models';

export type { ConversionRateCalculator } from './conversion-rate-calculator';

export {
  DefaultConversionRateCalculator,
  type ConversionRateCalculatorOptions,
} from './default-conversion-rate-calculator';

export type { HistoricalConversionProvider } from './historical-conversion-provider';

export {
  PassRateAdjustedForecaster,
  type PassRateAdjustedForecasterDeps,
  type PassRateAdjustedForecasterOptions,
} from './pass-rate-adjusted-forecaster';

export type {
  MethodCategory,
  MethodStatus,
  MethodCapabilities,
  ForecastMethodMetadata,
} from './forecast-method-metadata';

export type {
  ForecastMethodRegistry,
  MethodFilterOptions,
} from './forecast-method-registry';

export { InMemoryForecastMethodRegistry } from './in-memory-forecast-method-registry';

export { FORECAST_METHODS } from './method-definitions';

export { forecastMethodRegistry } from './forecast-method-registry.singleton';
