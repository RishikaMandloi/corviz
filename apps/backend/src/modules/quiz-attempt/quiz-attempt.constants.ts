export const QUIZ_ATTEMPT_STATUS = {
  IN_PROGRESS: "IN_PROGRESS",
  SUBMITTED: "SUBMITTED",
  EVALUATED: "EVALUATED",
} as const;

export type QuizAttemptStatus =
  (typeof QUIZ_ATTEMPT_STATUS)[keyof typeof QUIZ_ATTEMPT_STATUS];

export const QUIZ_ATTEMPT_RESULT = {
  PASS: "PASSED",
  FAIL: "FAILED",
} as const;

export type QuizAttemptResult =
  (typeof QUIZ_ATTEMPT_RESULT)[keyof typeof QUIZ_ATTEMPT_RESULT];