import type { TermLookbackProvider } from '../../domain/forecasts/term-lookback-provider';
import type { TermType } from '../../domain/forecasts/models/weighted-moving-average';

export interface TermLookbackProviderOptions {
  /** Earliest year to consider for lookback (default: 2018) */
  minYear?: number;
}

const DEFAULT_OPTIONS: Required<TermLookbackProviderOptions> = {
  minYear: 2018,
};

/**
 * Default implementation of TermLookbackProvider.
 *
 * Generates term-type-aware lookback lists:
 * - Main semesters (10, 20): Alternates between spring and fall
 * - Intersessions (11-19): Uses same term type from previous years
 */
export class DefaultTermLookbackProvider implements TermLookbackProvider {
  private readonly options: Required<TermLookbackProviderOptions>;

  constructor(options: TermLookbackProviderOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  getTermType(term: number): TermType {
    const semester = term % 100;

    // Intersession terms: 11-19
    if (semester > 10 && semester < 20) {
      return 'intersession';
    }

    // Main semester terms: 10, 20
    return 'main-semester';
  }

  getPastTerms(targetTerm: number, count: number): number[] {
    const year = Math.floor(targetTerm / 100);
    const semester = targetTerm % 100;
    const termType = this.getTermType(targetTerm);

    if (termType === 'intersession') {
      return this.getPastIntersessionTerms(year, semester, count);
    }

    return this.getPastMainTerms(year, semester, count);
  }

  /**
   * Gets past main semester terms (10 and 20).
   *
   * Academic term sequence example:
   * [202110, 202120, 202210, 202220, 202310, 202320, 202410, ...]
   *
   * For target 202410 (Spring 2024):
   * → Previous is 202320 (Fall 2023)
   * → Before that is 202310 (Spring 2023)
   * → Before that is 202220 (Fall 2022)
   * Result: [202320, 202310, 202220]
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

    // Go back one main semester term from target
    if (currentSemester === 10) {
      currentYear -= 1;
      currentSemester = 20;
    } else {
      currentSemester = 10;
    }

    // Generate past main semester terms
    while (terms.length < count && currentYear >= this.options.minYear) {
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
   * Gets past intersession terms of the same type.
   *
   * For the same intersession code across years.
   * Example for term 202415 (Summer 2024):
   * → Previous is 202315 (Summer 2023)
   * → Before that is 202215 (Summer 2022)
   * → Before that is 202115 (Summer 2021)
   * Result: [202315, 202215, 202115]
   */
  private getPastIntersessionTerms(
    year: number,
    semester: number,
    count: number,
  ): number[] {
    const terms: number[] = [];
    let currentYear = year - 1; // Start from previous year

    // Get the same intersession term from previous years
    while (terms.length < count && currentYear >= this.options.minYear) {
      terms.push(currentYear * 100 + semester);
      currentYear -= 1;
    }

    return terms;
  }
}
