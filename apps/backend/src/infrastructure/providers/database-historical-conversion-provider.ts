import type { HistoricalConversionProvider } from '../../domain/forecasts/historical-conversion-provider';
import type { HistoricalConversionData } from '../../domain/forecasts/models/conversion-rate';
import type { CourseDemandForecaster } from '../../domain/forecasts/course-demand-forecaster';
import type { ActualEnrollmentProvider } from '../../domain/backtesting/actual-enrollment-provider';

export interface DatabaseHistoricalConversionProviderDeps {
  readonly baseForecaster: CourseDemandForecaster;
  readonly actualEnrollmentProvider: ActualEnrollmentProvider;
}

/**
 * Implementation of HistoricalConversionProvider that retrieves
 * historical conversion data from the database.
 *
 * It computes conversion rates by:
 * 1. Getting potential students from the base forecaster for each past term
 * 2. Getting actual enrollments from the actual enrollment provider
 * 3. Calculating conversion rate as actual / potential
 *
 * Uses term-type-aware lookback strategy:
 * - Main semesters (10, 20) -> lookback alternates between spring and fall
 * - Intersession (11-19) -> lookback uses same type from previous years
 */
export class DatabaseHistoricalConversionProvider
  implements HistoricalConversionProvider
{
  private readonly baseForecaster: CourseDemandForecaster;
  private readonly actualEnrollmentProvider: ActualEnrollmentProvider;

  constructor(deps: DatabaseHistoricalConversionProviderDeps) {
    this.baseForecaster = deps.baseForecaster;
    this.actualEnrollmentProvider = deps.actualEnrollmentProvider;
  }

  async getHistoricalConversionData(
    courseCode: string,
    beforeTerm: number,
    termCount: number,
  ): Promise<HistoricalConversionData[]> {
    // Get list of past terms (term-type-aware)
    const pastTerms = this.getPastTerms(beforeTerm, termCount);

    if (pastTerms.length === 0) {
      return [];
    }

    // Get actual enrollments for all terms in a single batch
    const actualEnrollments =
      await this.actualEnrollmentProvider.getActualEnrollments(
        courseCode,
        pastTerms,
      );

    // Get potential students for each past term (parallel execution)
    const forecastPromises = pastTerms.map(async term => {
      const actual = actualEnrollments.get(term);

      // Skip terms without actual data
      if (actual === null || actual === undefined) {
        return null;
      }

      try {
        const forecast = await this.baseForecaster.forecast({
          courseCode,
          academicTerm: term,
        });

        const potential = forecast.forecastedEnrollment;

        // Skip if potential is 0 (can't calculate rate)
        if (potential === 0) {
          return null;
        }

        return {
          academicTerm: term,
          potentialStudents: potential,
          actualEnrollment: actual,
          conversionRate: actual / potential,
        };
      } catch {
        // Skip terms where forecast fails
        return null;
      }
    });

    const results = await Promise.all(forecastPromises);

    // Filter out nulls and sort by term descending
    return results
      .filter((r): r is HistoricalConversionData => r !== null)
      .sort((a, b) => b.academicTerm - a.academicTerm);
  }

  /**
   * Generates a list of past academic terms based on term type.
   * Uses term-type-aware lookback strategy:
   *
   * **Main Semester Terms (10, 20):**
   * - Spring: YYYY10, Fall: YYYY20
   * - Lookback alternates between 10 and 20
   *
   * **Intersession/Summer Terms (11-19):**
   * - Lookback uses the same term type from previous years
   * - Example: 202415 -> [202315, 202215, 202115]
   *
   * @example
   * // Main semester: beforeTerm = 202410, count = 3
   * // Returns: [202320, 202310, 202220]
   *
   * // Intersession: beforeTerm = 202415, count = 3
   * // Returns: [202315, 202215, 202115]
   */
  private getPastTerms(beforeTerm: number, count: number): number[] {
    const year = Math.floor(beforeTerm / 100);
    const semester = beforeTerm % 100;

    // Determine if this is an intersession/summer term (11-19)
    const isIntersession = semester > 10 && semester < 20;

    if (isIntersession) {
      return this.getPastIntersessionTerms(year, semester, count);
    } else {
      return this.getPastMainTerms(year, semester, count);
    }
  }

  /**
   * Gets past main semester terms (10 and 20)
   */
  private getPastMainTerms(
    year: number,
    semester: number,
    count: number,
  ): number[] {
    const terms: number[] = [];
    let currentYear = year;
    let currentSemester = semester;

    // Normalize to main semester (10 or 20)
    if (currentSemester < 10) {
      currentYear -= 1;
      currentSemester = 20;
    } else if (currentSemester < 20) {
      currentSemester = 10;
    } else {
      currentSemester = 20;
    }

    // Go back one main semester term
    if (currentSemester === 10) {
      currentYear -= 1;
      currentSemester = 20;
    } else {
      currentSemester = 10;
    }

    // Generate past main semester terms only (10 and 20)
    while (terms.length < count && currentYear >= 2018) {
      terms.push(currentYear * 100 + currentSemester);

      // Alternate between spring (10) and fall (20)
      if (currentSemester === 10) {
        currentYear -= 1;
        currentSemester = 20;
      } else {
        currentSemester = 10;
      }
    }

    return terms;
  }

  /**
   * Gets past intersession/summer terms of the same type.
   * For term 202415, returns [202315, 202215, 202115]
   */
  private getPastIntersessionTerms(
    year: number,
    semester: number,
    count: number,
  ): number[] {
    const terms: number[] = [];
    let currentYear = year - 1; // Start from previous year

    // Get the same intersession term from previous years
    while (terms.length < count && currentYear >= 2018) {
      terms.push(currentYear * 100 + semester);
      currentYear -= 1;
    }

    return terms;
  }
}
