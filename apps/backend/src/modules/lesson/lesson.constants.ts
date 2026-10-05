/**
 * Lesson Status
 */
export const LESSON_STATUS = {
  DRAFT: "DRAFT",
  REVIEW: "REVIEW",
  PUBLISHED: "PUBLISHED",
  ARCHIVED: "ARCHIVED",
} as const;

export type LessonStatus =
  (typeof LESSON_STATUS)[keyof typeof LESSON_STATUS];

/**
 * Lesson Content Type
 */
export const LESSON_CONTENT_TYPE = {
  THEORY: "THEORY",
  PRACTICAL: "PRACTICAL",
  QUIZ: "QUIZ",
  PROJECT: "PROJECT",
} as const;

export type LessonContentType =
  (typeof LESSON_CONTENT_TYPE)[keyof typeof LESSON_CONTENT_TYPE];