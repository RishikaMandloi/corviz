import { Router } from "express";

import {
  authenticate,
  authorize,
} from "../../middlewares";

import { USER_ROLES } from "../../constants";

import {
  quizAttemptController,
} from "./quiz-attempt.controller";

const router = Router();


/**
 * GET /api/v1/quizzes/:quizId/attempts/active
 *
 * Get current user's active attempt
 *
 * USER + ADMIN
 */
router.get(
  "/quizzes/:quizId/attempts/active",
  authenticate,
  authorize(
    USER_ROLES.USER,
    USER_ROLES.ADMIN
  ),
  quizAttemptController.getActiveQuizAttempt
);

/**
 * POST /api/v1/quizzes/:quizId/attempts
 *
 * Start Quiz Attempt
 *
 * USER + ADMIN
 */
router.post(
  "/quizzes/:quizId/attempts",
  authenticate,
  authorize(
    USER_ROLES.USER,
    USER_ROLES.ADMIN
  ),
  quizAttemptController.startQuizAttempt
);

/**
 * GET /api/v1/quiz-attempts/my
 *
 * Get current user's quiz attempts
 *
 * USER + ADMIN
 */
router.get(
  "/quiz-attempts/my",
  authenticate,
  authorize(
    USER_ROLES.USER,
    USER_ROLES.ADMIN
  ),
  quizAttemptController.getMyQuizAttempts
);


/**
 * GET /api/v1/quiz-attempts/:id
 *
 * Get single quiz attempt
 *
 * Ownership checked inside service.
 *
 * USER + ADMIN
 */
router.get(
  "/quiz-attempts/:id",
  authenticate,
  authorize(
    USER_ROLES.USER,
    USER_ROLES.ADMIN
  ),
  quizAttemptController.getQuizAttemptById
);


/**
 * POST /api/v1/quiz-attempts/:attemptId/submit
 *
 * Submit Quiz Attempt
 *
 * USER + ADMIN
 */
router.post(
  "/quiz-attempts/:attemptId/submit",
  authenticate,
  authorize(
    USER_ROLES.USER,
    USER_ROLES.ADMIN
  ),
  quizAttemptController.submitQuizAttempt
);

export default router;