import type { TermType } from './models/weighted-moving-average';

/**
 * Provider interface for term-type-aware lookback.
 *
 * This provider generates a list of past academic terms based on term type:
 *
 * **Main Semester Terms (10, 20):**
 * - Lookback uses previous main semester terms alternating 10 ↔ 20
 *
 * **Intersession/Summer Terms (11-19):**
 * - Lookback uses the same term type from previous years
 */
export interface TermLookbackProvider {
  /**
   * Gets past academic terms of the same type.
   *
   * @param targetTerm - The term to forecast for (e.g., 202410)
   * @param count - Number of past terms to retrieve (default: 3)
   * @returns Array of past term numbers, ordered most recent first
   *
   * @example
   * // Main semester: targetTerm=202410, count=3
   * // Returns: [202320, 202310, 202220]
   *
   * // Intersession: targetTerm=202415, count=3
   * // Returns: [202315, 202215, 202115]
   */
  getPastTerms(targetTerm: number, count: number): number[];

  /**
   * Determines the type of an academic term.
   *
   * @param term - Academic term number (e.g., 202410)
   * @returns Term type: 'main-semester' or 'intersession'
   *
   * @example
   * getTermType(202410) // → 'main-semester'
   * getTermType(202420) // → 'main-semester'
   * getTermType(202415) // → 'intersession'
   */
  getTermType(term: number): TermType;
}
