import { z } from 'zod';

export const courseHistoryTermStatsSchema = z.object({
  enrolled: z.number().int().nonnegative(),
  passed: z.number().int().nonnegative(),
  failed: z.number().int().nonnegative(),
  withdrawn: z.number().int().nonnegative(),
});

export const courseHistoryByTermSchema = z.record(
  z.string().regex(/^\d{6}$/),
  courseHistoryTermStatsSchema,
);

export type CourseHistoryTermStatsDto = z.infer<
  typeof courseHistoryTermStatsSchema
>;

export type CourseHistoryByTermDto = z.infer<
  typeof courseHistoryByTermSchema
>;
