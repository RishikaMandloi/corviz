import { z } from "zod";

import {
  COURSE_DIFFICULTY,
  COURSE_STATUS,
  COURSE_VISIBILITY,
} from "./course.constants";

/**
 * Learning Objective Validation
 */
const learningObjectiveSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3)
    .max(200),
});

/**
 * Prerequisite Validation
 */
const prerequisiteSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3)
    .max(200),
});

/**
 * Create Course Validation
 */
export const createCourseSchema = z.object({
  title: z
    .string()
    .trim()
    .min(5)
    .max(150),

  slug: z
    .string()
    .trim()
    .min(3)
    .max(150),

  shortDescription: z
    .string()
    .trim()
    .min(20)
    .max(300),

  description: z
    .string()
    .trim()
    .min(50),

  thumbnail: z
    .string()
    .url(),

  category: z
    .string()
    .trim()
    .min(2)
    .max(100),

  difficulty: z.enum([
    COURSE_DIFFICULTY.BEGINNER,
    COURSE_DIFFICULTY.INTERMEDIATE,
    COURSE_DIFFICULTY.ADVANCED,
  ]),

  estimatedDuration: z
    .number()
    .int()
    .positive(),

  learningObjectives: z
    .array(learningObjectiveSchema)
    .default([]),

  prerequisites: z
    .array(prerequisiteSchema)
    .default([]),

  status: z
    .enum([
      COURSE_STATUS.DRAFT,
      COURSE_STATUS.REVIEW,
      COURSE_STATUS.PUBLISHED,
      COURSE_STATUS.ARCHIVED,
    ])
    .optional(),

  visibility: z
    .enum([
      COURSE_VISIBILITY.PUBLIC,
      COURSE_VISIBILITY.PRIVATE,
    ])
    .optional(),
});

/**
 * Update Course Validation
 */
export const updateCourseSchema =
  createCourseSchema.partial();