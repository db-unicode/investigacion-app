import type { HistoricalConversionData } from './models/conversion-rate';

/**
 * Provider interface for retrieving historical conversion data.
 *
 * This abstraction allows the pass-rate adjusted forecaster
 * to be decoupled from the specific data source.
 */
export interface HistoricalConversionProvider {
  /**
   * Retrieves historical conversion data for a course.
   *
   * Uses term-type-aware lookback strategy:
   *
   * **Main Semester Terms (10, 20):**
   * - Spring: YYYY10, Fall: YYYY20
   * - Lookback uses previous main semester terms
   *
   * **Intersession/Summer Terms (11-19):**
   * - Lookback uses the same term type from previous years
   * - Example: 202415 -> [202315, 202215, 202115]
   *
   * @param courseCode - The target course code
   * @param beforeTerm - Get data from terms before this one
   * @param termCount - Number of past terms to retrieve
   * @returns Array of historical conversion data points
   *
   * @example
   * // Main semester: beforeTerm=202410, termCount=3
   * // Returns data for: 202320, 202310, 202220
   *
   * // Intersession: beforeTerm=202415, termCount=3
   * // Returns data for: 202315, 202215, 202115
   */
  getHistoricalConversionData(
    courseCode: string,
    beforeTerm: number,
    termCount: number,
  ): Promise<HistoricalConversionData[]>;
}
