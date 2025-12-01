import type {
  CourseDemandForecaster,
  CourseDemandForecasterInput,
  CourseDemandForecasterResult,
} from './course-demand-forecaster';

/**
 * Configuration options for the multi-term decorator
 */
export interface MultiTermForecasterOptions {
  /**
   * Maximum number of terms allowed per request
   * @default 10
   */
  readonly maxTerms?: number;

  /**
   * Whether to continue processing if some terms fail
   * @default true
   */
  readonly allowPartialFailure?: boolean;
}

/**
 * Error information for a failed term forecast
 */
export interface TermForecastError {
  readonly term: number;
  readonly error: Error;
}

/**
 * Result of a multi-term forecast operation
 */
export interface MultiTermForecasterResult {
  readonly results: CourseDemandForecasterResult[];
  readonly errors: TermForecastError[];
}

/**
 * Decorator that wraps any CourseDemandForecaster to add multi-term support.
 *
 * This allows any forecaster to handle multiple academic terms in a single
 * request without modifying the original forecaster implementation.
 *
 * @example
 * ```typescript
 * const forecaster = new PotentialStudentsByPrerequisitesForecaster({...});
 * const multiTermForecaster = new MultiTermForecasterDecorator(forecaster);
 *
 * const { results, errors } = await multiTermForecaster.forecastMultiple(
 *   { courseCode: 'ISIS-3204' },
 *   [202410, 202420, 202510]
 * );
 * ```
 */
export class MultiTermForecasterDecorator {
  private readonly maxTerms: number;
  private readonly allowPartialFailure: boolean;

  constructor(
    private readonly forecaster: CourseDemandForecaster,
    options: MultiTermForecasterOptions = {},
  ) {
    this.maxTerms = options.maxTerms ?? 10;
    this.allowPartialFailure = options.allowPartialFailure ?? true;
  }

  /**
   * Get the method ID from the wrapped forecaster
   */
  get methodId(): string {
    return this.forecaster.methodId;
  }

  /**
   * Get the method label from the wrapped forecaster
   */
  get methodLabel(): string {
    return this.forecaster.methodLabel;
  }

  /**
   * Execute forecast for a single term (delegates to wrapped forecaster)
   */
  async forecastSingle(
    input: CourseDemandForecasterInput,
  ): Promise<CourseDemandForecasterResult> {
    return this.forecaster.forecast(input);
  }

  /**
   * Execute forecasts for multiple academic terms concurrently
   *
   * @param input - Base forecast input (without academicTerm)
   * @param terms - Array of academic terms to forecast
   * @returns Array of forecast results and any errors
   * @throws Error if terms array exceeds maxTerms limit or contains duplicates
   */
  async forecastMultiple(
    input: Omit<CourseDemandForecasterInput, 'academicTerm'>,
    terms: readonly number[],
  ): Promise<MultiTermForecasterResult> {
    this.validateTerms(terms);

    const settledResults = await Promise.allSettled(
      terms.map(term =>
        this.forecaster.forecast({
          ...input,
          academicTerm: term,
        }),
      ),
    );

    const results: CourseDemandForecasterResult[] = [];
    const errors: TermForecastError[] = [];

    settledResults.forEach((result, index) => {
      const term = terms[index];
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        errors.push({
          term,
          error: result.reason instanceof Error
            ? result.reason
            : new Error(String(result.reason)),
        });
      }
    });

    if (!this.allowPartialFailure && errors.length > 0) {
      const failedTerms = errors.map(e => e.term).join(', ');
      throw new Error(`Forecasts failed for terms: ${failedTerms}`);
    }

    return { results, errors };
  }

  private validateTerms(terms: readonly number[]): void {
    if (terms.length > this.maxTerms) {
      throw new Error(
        `Maximum ${this.maxTerms} terms allowed per request. Received: ${terms.length}`,
      );
    }

    const uniqueTerms = new Set(terms);
    if (uniqueTerms.size !== terms.length) {
      throw new Error('Duplicate terms are not allowed');
    }
  }
}
