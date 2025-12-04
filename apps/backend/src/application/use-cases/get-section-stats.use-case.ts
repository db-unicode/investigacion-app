import type {
  SectionStatsByTermDto,
  TermSectionStatsDto,
  SectionStatDto,
} from '@app/contracts';
import type {
  SectionStatsRepository,
  SectionStatsRecord,
} from '../../infrastructure/repositories/section-stats-repository';

export interface GetSectionStatsInput {
  readonly courseCode: string;
  readonly terms: number[];
}

export interface GetSectionStatsUseCase {
  execute(input: GetSectionStatsInput): Promise<SectionStatsByTermDto>;
}

export const createGetSectionStatsUseCase = (
  repository: SectionStatsRepository,
): GetSectionStatsUseCase => {
  const execute = async (
    input: GetSectionStatsInput,
  ): Promise<SectionStatsByTermDto> => {
    // Convert integer terms to string for database query
    const termsAsStrings = input.terms.map(t => String(t));

    const records = await repository.findByCourseAndTerms(
      input.courseCode,
      termsAsStrings,
    );

    // Group records by term
    const recordsByTerm = groupByTerm(records);

    // Map to DTOs
    const termsWithData: TermSectionStatsDto[] = [];
    const termsWithoutData: number[] = [];

    for (const requestedTerm of input.terms) {
      const termRecords = recordsByTerm.get(String(requestedTerm));

      if (termRecords && termRecords.length > 0) {
        termsWithData.push(mapToTermSectionStats(requestedTerm, termRecords));
      } else {
        termsWithoutData.push(requestedTerm);
      }
    }

    return {
      courseCode: input.courseCode,
      terms: termsWithData,
      metadata: {
        requestedTerms: input.terms,
        termsWithData: termsWithData.length,
        termsWithoutData:
          termsWithoutData.length > 0 ? termsWithoutData : undefined,
        processedAt: new Date().toISOString(),
      },
    };
  };

  return { execute };
};

function groupByTerm(
  records: SectionStatsRecord[],
): Map<string, SectionStatsRecord[]> {
  const map = new Map<string, SectionStatsRecord[]>();

  for (const record of records) {
    const existing = map.get(record.academicTerm) ?? [];
    existing.push(record);
    map.set(record.academicTerm, existing);
  }

  return map;
}

function mapToTermSectionStats(
  term: number,
  records: SectionStatsRecord[],
): TermSectionStatsDto {
  const sections: SectionStatDto[] = records.map(r => ({
    section: r.section,
    enrolled: r.enrolled,
    passed: r.passed,
    failed: r.failed,
    withdrawn: r.withdrawn,
  }));

  const totals = {
    totalSections: sections.length,
    totalEnrolled: sections.reduce((sum, s) => sum + s.enrolled, 0),
    totalPassed: sections.reduce((sum, s) => sum + s.passed, 0),
    totalFailed: sections.reduce((sum, s) => sum + s.failed, 0),
    totalWithdrawn: sections.reduce((sum, s) => sum + s.withdrawn, 0),
  };

  return {
    academicTerm: term,
    sections,
    totals,
  };
}
