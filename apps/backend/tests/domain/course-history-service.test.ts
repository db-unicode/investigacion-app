import { describe, expect, it } from 'vitest';
import { createCourseHistoryService } from '../../src/domain/services/course-history-service';

describe('CourseHistoryService', () => {
  it('aggregates enrollments by academic term and outcome', () => {
    const service = createCourseHistoryService();

    const result = service.aggregateByTerm([
      { academicTerm: 202010, courseCode: 'MATE-1010', courseOutcome: 'P' },
      { academicTerm: 202010, courseCode: 'MATE-1010', courseOutcome: 'F' },
      { academicTerm: 202010, courseCode: 'MATE-1010', courseOutcome: 'W' },
      { academicTerm: 202020, courseCode: 'MATE-1010', courseOutcome: 'P' },
    ]);

    expect(result).toHaveLength(2);

    const term202010 = result.find((point) => point.academicTerm === 202010);
    const term202020 = result.find((point) => point.academicTerm === 202020);

    expect(term202010).toEqual({
      academicTerm: 202010,
      courseCode: 'MATE-1010',
      totalEnrollments: 3,
      passedCount: 1,
      failedCount: 1,
      withdrawnCount: 1,
    });

    expect(term202020).toEqual({
      academicTerm: 202020,
      courseCode: 'MATE-1010',
      totalEnrollments: 1,
      passedCount: 1,
      failedCount: 0,
      withdrawnCount: 0,
    });
  });
});
