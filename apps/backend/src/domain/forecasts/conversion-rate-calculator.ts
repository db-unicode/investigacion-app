import type {
  ConversionRateResult,
  HistoricalConversionData,
} from './models/conversion-rate';

/**
 * Interface for calculating conversion rates from historical data
 */
export interface ConversionRateCalculator {
  calculate(historicalData: readonly HistoricalConversionData[]): ConversionRateResult;
}
