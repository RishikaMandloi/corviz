import { Router } from "express";

import { authenticate } from "../../middlewares/auth.middleware";
import { authorize } from "../../middlewares/authorization.middleware";
import { validateRequest } from "../../middlewares";

import { USER_ROLES } from "../../constants";

import { lessonController } from "./lesson.controller";
import {
  createLessonSchema,
  updateLessonSchema,
} from "./lesson.validation";


const router = Router();

/**
 * POST /api/v1/courses/:courseId/lessons
 */
router.post(
  "/courses/:courseId/lessons",
  authenticate,
  authorize(USER_ROLES.ADMIN),
  validateRequest(createLessonSchema),
  lessonController.createLesson
);

/**
 * GET /api/v1/courses/:courseId/lessons
 */
router.get(
  "/courses/:courseId/lessons",
  lessonController.getLessons
);

/**
 * GET /api/v1/courses/:courseId/lessons/:slug
 */
router.get(
  "/courses/:courseId/lessons/:slug",
  lessonController.getLesson
);

/**
 * PATCH /api/v1/lessons/:id
 */
router.patch(
  "/lessons/:id",
  authenticate,
  authorize(USER_ROLES.ADMIN),
  validateRequest(updateLessonSchema),
  lessonController.updateLesson
);

/**
 * DELETE /api/v1/lessons/:id
 */
router.delete(
  "/lessons/:id",
  authenticate,
  authorize(USER_ROLES.ADMIN),
  lessonController.deleteLesson
);

export default router;