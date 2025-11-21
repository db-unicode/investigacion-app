import { z } from 'zod';

export const courseDemandForecastInputSchema = z.object({
  courseCode: z
    .string()
    .regex(/^[A-Z]{4}-\d{4}$/, {
      message: 'courseCode must match pattern XXXX-DDDD.',
    }),
  academicTerm: z
    .number()
    .int()
    .nonnegative(),
});

export type CourseDemandForecastInputDto = z.infer<
  typeof courseDemandForecastInputSchema
>;

export const courseDemandForecastResultSchema = z.object({
  courseCode: z
    .string()
    .regex(/^[A-Z]{4}-\d{4}$/),
  academicTerm: z
    .number()
    .int()
    .nonnegative(),
  forecastedEnrollment: z
    .number()
    .int()
    .nonnegative(),
  methodId: z.string(),
  methodLabel: z.string(),
  // Forecaster-specific payload (strongly typed on the backend side).
  details: z.unknown().optional(),
});

export type CourseDemandForecastResultDto = z.infer<
  typeof courseDemandForecastResultSchema
>;
