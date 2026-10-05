/**
 * Course Difficulty Levels
 */
export const COURSE_DIFFICULTY = {
  BEGINNER: "BEGINNER",
  INTERMEDIATE: "INTERMEDIATE",
  ADVANCED: "ADVANCED",
} as const;

export type CourseDifficulty =
  (typeof COURSE_DIFFICULTY)[keyof typeof COURSE_DIFFICULTY];

/**
 * Course Status
 *
 * Used by Admin Workflow.
 */
export const COURSE_STATUS = {
  DRAFT: "DRAFT",
  REVIEW: "REVIEW",
  PUBLISHED: "PUBLISHED",
  ARCHIVED: "ARCHIVED",
} as const;

export type CourseStatus =
  (typeof COURSE_STATUS)[keyof typeof COURSE_STATUS];

/**
 * Course Visibility
 */
export const COURSE_VISIBILITY = {
  PUBLIC: "PUBLIC",
  PRIVATE: "PRIVATE",
} as const;

export type CourseVisibility =
  (typeof COURSE_VISIBILITY)[keyof typeof COURSE_VISIBILITY];