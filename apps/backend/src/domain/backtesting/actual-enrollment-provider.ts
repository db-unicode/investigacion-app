/**
 * Interface for retrieving actual enrollment data.
 *
 * This abstraction allows the backtesting service to be decoupled
 * from the specific data source used to retrieve actual enrollments.
 */
export interface ActualEnrollmentProvider {
  /**
   * Get actual enrollment count for a single term
   * @param courseCode - The course code to look up
   * @param term - The academic term
   * @returns The actual enrollment count, or null if no data exists
   */
  getActualEnrollment(
    courseCode: string,
    term: number,
  ): Promise<number | null>;

  /**
   * Get actual enrollment counts for multiple terms
   * @param courseCode - The course code to look up
   * @param terms - Array of academic terms
   * @returns Map where key is term and value is enrollment count (null if no data)
   */
  getActualEnrollments(
    courseCode: string,
    terms: number[],
  ): Promise<Map<number, number | null>>;
}
