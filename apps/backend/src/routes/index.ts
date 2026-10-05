import { Router } from "express";

import authRoutes from "../modules/auth/auth.routes";
import userRoutes from "../modules/user/user.routes";
import courseRoutes from "../modules/course/course.routes";
import lessonRoutes from "../modules/lesson/lesson.routes";
import quizRoutes from "../modules/quiz/quiz.routes";
import enrollmentRoutes from "../modules/enrollment/enrollment.routes";
import progressRoutes from "../modules/progress/progress.routes";
import quizAttemptRoutes from "../modules/quiz-attempt/quiz-attempt.routes";
import pipelineRoutes from "../modules/pipeline/pipeline.routes";
import tutorRoutes from "../modules/tutor/tutor.routes";

const router = Router();

/**
 * Authentication Routes
 */
router.use(authRoutes);

/**
 * User Routes
 */
router.use(userRoutes);

/**
 * Course Routes
 */
router.use(courseRoutes);

/**
 * Lesson Routes
 */
router.use(lessonRoutes);

/**
 * Quiz Routes
 */
router.use(quizRoutes);

/**
 * Enrollment Routes
 */
router.use(enrollmentRoutes);

/**
 * Progress Routes
 */
router.use(progressRoutes);

/**
 * Quiz Attempt Routes
 */
router.use(quizAttemptRoutes);

/**
 * Verified Learning Pipeline Routes
 */
router.use(pipelineRoutes);
router.use(tutorRoutes);

export default router;