export {
  courseHistoryTermStatsSchema,
  courseHistoryByTermSchema,
} from './course-history/course-history.dto.js';

export type {
  CourseHistoryTermStatsDto,
  CourseHistoryByTermDto,
} from './course-history/course-history.dto.js';

export {
  courseDemandForecastInputSchema,
  courseDemandForecastResultSchema,
} from './forecasts/course-demand-forecast.dto.js';

export type {
  CourseDemandForecastInputDto,
  CourseDemandForecastResultDto,
} from './forecasts/course-demand-forecast.dto.js';

export {
  termForecastItemSchema,
  forecastErrorSchema,
  forecastMetadataSchema,
  forecastMethodSchema,
  multiTermForecastResultSchema,
  multiTermForecastInputSchema,
} from './forecasts/multi-term-forecast.dto.js';

export type {
  TermForecastItem,
  ForecastError,
  ForecastMetadata,
  ForecastMethod,
  MultiTermForecastResultDto,
  MultiTermForecastInputDto,
} from './forecasts/multi-term-forecast.dto.js';

export {
  accuracyMetricsSchema,
  comparisonItemSchema,
  summaryMetricsSchema,
  forecastAccuracyResultSchema,
  forecastAccuracyInputSchema,
} from './forecasts/forecast-accuracy.dto.js';

export type {
  AccuracyMetricsDto,
  ComparisonItemDto,
  SummaryMetricsDto,
  ForecastAccuracyResultDto,
  ForecastAccuracyInputDto,
} from './forecasts/forecast-accuracy.dto.js';

export {
  methodCapabilitiesSchema,
  methodCategorySchema,
  methodStatusSchema,
  forecastMethodDtoSchema,
  forecastMethodListSchema,
  forecastMethodQuerySchema,
} from './forecasts/forecast-method.dto.js';

export type {
  MethodCapabilitiesDto,
  MethodCategoryDto,
  MethodStatusDto,
  ForecastMethodDto,
  ForecastMethodListDto,
  ForecastMethodQueryDto,
} from './forecasts/forecast-method.dto.js';
