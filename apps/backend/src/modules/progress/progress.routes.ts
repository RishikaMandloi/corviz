import { Router } from "express";

import { progressController } from "./progress.controller";

import {
  createProgressSchema,
  updateProgressSchema,
} from "./progress.validation";

import {
  authenticate,
  authorize,
  validateRequest,
} from "../../middlewares";

import { USER_ROLES } from "../../constants";

const router = Router();

/**
 * POST /api/v1/progress
 *
 * Create lesson progress
 *
 * USER + ADMIN
 */
router.post(
  "/progress",
  authenticate,
  authorize(
    USER_ROLES.USER,
    USER_ROLES.ADMIN
  ),
  validateRequest(
    createProgressSchema
  ),
  progressController.createProgress
);

/**
 * GET /api/v1/progress/enrollment/:enrollmentId/summary
 *
 * Get progress summary for enrollment
 *
 * USER + ADMIN
 */
router.get(
  "/progress/enrollment/:enrollmentId/summary",
  authenticate,
  authorize(
    USER_ROLES.USER,
    USER_ROLES.ADMIN
  ),
  progressController.getProgressSummary
);

/**
 * GET /api/v1/progress/enrollment/:enrollmentId/analytics
 *
 * Get progress analytics
 *
 * USER + ADMIN
 */
router.get(
  "/progress/enrollment/:enrollmentId/analytics",
  authenticate,
  authorize(
    USER_ROLES.USER,
    USER_ROLES.ADMIN
  ),
  progressController.getProgressAnalytics
);

/**
 * GET /api/v1/progress/enrollment/:enrollmentId
 *
 * Get all progress for an enrollment
 *
 * Ownership is verified inside service.
 */
router.get(
  "/progress/enrollment/:enrollmentId",
  authenticate,
  authorize(
    USER_ROLES.USER,
    USER_ROLES.ADMIN
  ),
  progressController.getProgressByEnrollment
);

/**
 * GET /api/v1/progress/:id
 *
 * Get single progress
 *
 * Ownership is verified inside service.
 */
router.get(
  "/progress/:id",
  authenticate,
  authorize(
    USER_ROLES.USER,
    USER_ROLES.ADMIN
  ),
  progressController.getProgressById
);

/**
 * PATCH /api/v1/progress/:id
 *
 * Update progress
 *
 * USER + ADMIN
 */
router.patch(
  "/progress/:id",
  authenticate,
  authorize(
    USER_ROLES.USER,
    USER_ROLES.ADMIN
  ),
  validateRequest(
    updateProgressSchema
  ),
  progressController.updateProgress
);

/**
 * DELETE /api/v1/progress/:id
 *
 * Delete progress
 *
 * ADMIN ONLY
 */
router.delete(
  "/progress/:id",
  authenticate,
  authorize(
    USER_ROLES.ADMIN
  ),
  progressController.deleteProgress
);

export default router;