import { z } from 'zod';

/**
 * Single section statistics within a term
 */
export const sectionStatSchema = z.object({
  section: z.number().int().nonnegative(),
  enrolled: z.number().int().nonnegative(),
  passed: z.number().int().nonnegative(),
  failed: z.number().int().nonnegative(),
  withdrawn: z.number().int().nonnegative(),
});

export type SectionStatDto = z.infer<typeof sectionStatSchema>;

/**
 * Section stats for a single term with aggregated totals
 */
export const termSectionStatsSchema = z.object({
  academicTerm: z.number().int(),
  sections: z.array(sectionStatSchema),
  totals: z.object({
    totalSections: z.number().int().nonnegative(),
    totalEnrolled: z.number().int().nonnegative(),
    totalPassed: z.number().int().nonnegative(),
    totalFailed: z.number().int().nonnegative(),
    totalWithdrawn: z.number().int().nonnegative(),
  }),
});

export type TermSectionStatsDto = z.infer<typeof termSectionStatsSchema>;

/**
 * Complete response for section stats query
 */
export const sectionStatsByTermSchema = z.object({
  courseCode: z.string().regex(/^[A-Z]{4}-\d{4}$/),
  terms: z.array(termSectionStatsSchema),
  metadata: z.object({
    requestedTerms: z.array(z.number().int()),
    termsWithData: z.number().int().nonnegative(),
    termsWithoutData: z.array(z.number().int()).optional(),
    processedAt: z.string().datetime(),
  }),
});

export type SectionStatsByTermDto = z.infer<typeof sectionStatsByTermSchema>;
