import { z } from "zod";

import {
  LESSON_CONTENT_TYPE,
  LESSON_STATUS,
} from "./lesson.constants";

//import { objectIdSchema } from "../../shared/validators/object-id.validator";

/**
 * Lesson Resource Validation
 */
const lessonResourceSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Resource title must be at least 2 characters.")
    .max(150, "Resource title cannot exceed 150 characters."),

  url: z
    .string()
    .url("Please provide a valid resource URL."),
});

export const createLessonSchema = z.object({


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

  content: z
    .string()
    .trim()
    .min(50),

  order: z
    .number()
    .int()
    .positive(),

  estimatedDuration: z
    .number()
    .int()
    .positive(),

  contentType: z.enum([
    LESSON_CONTENT_TYPE.THEORY,
    LESSON_CONTENT_TYPE.PRACTICAL,
    LESSON_CONTENT_TYPE.QUIZ,
    LESSON_CONTENT_TYPE.PROJECT,
  ]),

  resources: z
    .array(lessonResourceSchema)
    .default([]),

  status: z
    .enum([
      LESSON_STATUS.DRAFT,
      LESSON_STATUS.REVIEW,
      LESSON_STATUS.PUBLISHED,
      LESSON_STATUS.ARCHIVED,
    ])
    .optional(),

  isFreePreview: z
    .boolean()
    .optional(),
});

export const updateLessonSchema =
  createLessonSchema.partial();