import { Router } from "express";

import { quizController } from "./quiz.controller";
import {
  createQuizSchema,
  updateQuizSchema,
} from "./quiz.validation";

import {
  authenticate,
  authorize,
  validateRequest,
} from "../../middlewares";

import { USER_ROLES } from "../../constants";

const router = Router();

/**
 * Create Quiz
 * POST /api/v1/quizzes
 */
router.post(
  "/quizzes",
  authenticate,
  authorize(USER_ROLES.ADMIN),
  validateRequest(createQuizSchema),
  quizController.createQuiz
);

router.post(
  "/lessons/:lessonId/quiz",
  authenticate,
  authorize(USER_ROLES.ADMIN),
  validateRequest(createQuizSchema),
  quizController.createQuiz
);

/**
 * Get All Quizzes
 * GET /api/v1/quizzes
 */
router.get(
  "/quizzes",
  quizController.getQuizzes
);

/**
 * Get Quiz By ID
 * GET /api/v1/quizzes/:id
 */
router.get(
  "/quizzes/:id",
  quizController.getQuizById
);

/**
 * Update Quiz
 * PATCH /api/v1/quizzes/:id
 */
router.patch(
  "/quizzes/:id",
  authenticate,
  authorize(USER_ROLES.ADMIN),
  validateRequest(updateQuizSchema),
  quizController.updateQuiz
);

/**
 * Delete Quiz
 * DELETE /api/v1/quizzes/:id
 */
router.delete(
  "/quizzes/:id",
  authenticate,
  authorize(USER_ROLES.ADMIN),
  quizController.deleteQuiz
);

export default router;