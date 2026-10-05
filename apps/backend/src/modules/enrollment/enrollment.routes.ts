import { Router } from "express";

import { enrollmentController } from "./enrollment.controller";

import {
  createEnrollmentSchema,
  updateEnrollmentSchema,
} from "./enrollment.validation";

import {
  authenticate,
  authorize,
  validateRequest,
} from "../../middlewares";

import { USER_ROLES } from "../../constants";

const router = Router();

/**
 * POST /api/v1/enrollments
 * Enroll in a Course
 */
router.post(
  "/enrollments",
  authenticate,
  authorize(
    USER_ROLES.USER,
    USER_ROLES.ADMIN
  ),
  validateRequest(createEnrollmentSchema),
  enrollmentController.createEnrollment
);

/**
 * GET /api/v1/enrollments/me
 * Current User Enrollments
 */
router.get(
  "/enrollments/me",
  authenticate,
  authorize(
    USER_ROLES.USER,
    USER_ROLES.ADMIN
  ),
  enrollmentController.getMyEnrollments
);

/**
 * GET /api/v1/enrollments/:id
 * Enrollment Details
 */
router.get(
  "/enrollments/:id",
  authenticate,
  authorize(
    USER_ROLES.USER,
    USER_ROLES.ADMIN
  ),
  enrollmentController.getEnrollmentById
);

/**
 * PATCH /api/v1/enrollments/:id
 * Update Enrollment
 */
router.patch(
  "/enrollments/:id",
  authenticate,
  authorize(USER_ROLES.ADMIN),
  validateRequest(updateEnrollmentSchema),
  enrollmentController.updateEnrollment
);

/**
 * DELETE /api/v1/enrollments/:id
 * Delete Enrollment
 */
router.delete(
  "/enrollments/:id",
  authenticate,
  authorize(USER_ROLES.ADMIN),
  enrollmentController.deleteEnrollment
);

export default router;