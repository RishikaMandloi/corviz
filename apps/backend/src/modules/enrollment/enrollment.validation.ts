import { z } from "zod";

import {
  ENROLLMENT_STATUS,
} from "./enrollment.constants";

import { objectIdSchema } from "../../shared/validators/object-id.validator";

/**
 * Create Enrollment Validation
 */
export const createEnrollmentSchema = z.object({
  course: objectIdSchema,
});

/**
 * Update Enrollment Validation
 */
export const updateEnrollmentSchema = z.object({
  status: z
    .enum([
      ENROLLMENT_STATUS.ENROLLED,
      ENROLLMENT_STATUS.IN_PROGRESS,
      ENROLLMENT_STATUS.COMPLETED,
      ENROLLMENT_STATUS.CANCELLED,
    ])
    .optional(),

  progress: z
    .number()
    .min(0)
    .max(100)
    .optional(),

  completedLessons: z
    .array(objectIdSchema)
    .optional(),

  lastAccessedAt: z
    .date()
    .optional(),

  completedAt: z
    .date()
    .nullable()
    .optional(),
});