import { Router } from "express";

import {
  authenticate,
} from "../../middlewares/auth.middleware";
import {
  authorize,
} from "../../middlewares/authorization.middleware";
import { validateRequest } from "../../middlewares";
import { USER_ROLES } from "../../constants";

import { courseController } from "./course.controller";
import {
  createCourseSchema,
  updateCourseSchema,
} from "./course.validation";

const router = Router();

/**
 * Create Course
 */
router.post(
  "/",
  authenticate,
  authorize(USER_ROLES.ADMIN),
  validateRequest(createCourseSchema),
  courseController.createCourse
);

/**
 * Get All Courses
 */
router.get(
  "/",
  courseController.getCourses
);

/**
 * Get Course By Slug
 */
router.get(
  "/:slug",
  courseController.getCourseBySlug
);

/**
 * Update Course
 */
router.patch(
  "/:id",
  authenticate,
  authorize(USER_ROLES.ADMIN),
  validateRequest(updateCourseSchema),
  courseController.updateCourse
);

/**
 * Delete Course
 */
router.delete(
  "/:id",
  authenticate,
  authorize(USER_ROLES.ADMIN),
  courseController.deleteCourse
);

export default router;