export const ENROLLMENT_STATUS = {
  ENROLLED: "ENROLLED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
} as const;

export type EnrollmentStatus =
  (typeof ENROLLMENT_STATUS)[keyof typeof ENROLLMENT_STATUS];