/**
 * Progress Status
 */
export const PROGRESS_STATUS = {
  NOT_STARTED: "NOT_STARTED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
} as const;

export type ProgressStatus =
  (typeof PROGRESS_STATUS)[keyof typeof PROGRESS_STATUS];

/**
 * Lesson Completion Source
 */
export const COMPLETION_SOURCE = {
  MANUAL: "MANUAL",
  QUIZ: "QUIZ",
  AI: "AI",
  SYSTEM: "SYSTEM",
} as const;

export type CompletionSource =
  (typeof COMPLETION_SOURCE)[keyof typeof COMPLETION_SOURCE];