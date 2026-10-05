import { z } from "zod";

import {
  PROGRESS_STATUS,
  COMPLETION_SOURCE,
} from "./progress.constants";

import { objectIdSchema } from "../../shared/validators/object-id.validator";

/**
 * Create Progress Validation
 */
export const createProgressSchema = z.object({
  enrollment: objectIdSchema,

  lesson: objectIdSchema,
});

/**
 * Update Progress Validation
 */
export const updateProgressSchema = z.object({
  status: z
    .enum([
      PROGRESS_STATUS.NOT_STARTED,
      PROGRESS_STATUS.IN_PROGRESS,
      PROGRESS_STATUS.COMPLETED,
    ])
    .optional(),

  progressPercentage: z
    .number()
    .min(0, "Progress cannot be less than 0.")
    .max(100, "Progress cannot exceed 100.")
    .optional(),

  timeSpent: z
    .number()
    .min(0, "Time spent cannot be negative.")
    .optional(),

  lastPosition: z
    .number()
    .min(0, "Last position cannot be negative.")
    .optional(),

  quizScore: z
    .number()
    .min(0, "Quiz score cannot be less than 0.")
    .max(100, "Quiz score cannot exceed 100.")
    .optional(),

  completionSource: z
    .enum([
      COMPLETION_SOURCE.MANUAL,
      COMPLETION_SOURCE.QUIZ,
      COMPLETION_SOURCE.AI,
      COMPLETION_SOURCE.SYSTEM,
    ])
    .optional(),

  startedAt: z
    .date()
    .optional(),

  lastAccessedAt: z
    .date()
    .optional(),

  completedAt: z
    .date()
    .nullable()
    .optional(),
});