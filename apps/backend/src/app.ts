import cors from "cors";
import express, {
  Application,
  Request,
  Response,
} from "express";

import authRoutes from "./modules/auth/auth.routes";
import userRoutes from "./modules/user/user.routes";
import courseRoutes from "./modules/course/course.routes";
import lessonRoutes from "./modules/lesson/lesson.routes";
import quizRoutes from "./modules/quiz/quiz.routes";
import enrollmentRoutes from "./modules/enrollment/enrollment.routes";
import progressRoutes from "./modules/progress/progress.routes";
import quizAttemptRoutes from "./modules/quiz-attempt/quiz-attempt.routes";
import pipelineRoutes from "./modules/pipeline/pipeline.routes";
import tutorRoutes from "./modules/tutor/tutor.routes";
import topicRoutes from "./modules/topic/topic.routes";

import { errorHandler } from "./middlewares/error-handler";

const app: Application = express();

/**
 * Global Middlewares
 */
app.use(cors());

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true,
  })
);

/**
 * Health Check
 */
app.get(
  "/health",
  (_req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      message:
        "Backend is running successfully.",
    });
  }
);

/**
 * API Routes
 */
app.use(
  "/api/v1/auth",
  authRoutes
);

app.use(
  "/api/v1/users",
  userRoutes
);

app.use(
  "/api/v1/courses",
  courseRoutes
);

app.use(
  "/api/v1",
  lessonRoutes
);

app.use(
  "/api/v1",
  quizRoutes
);

app.use(
  "/api/v1",
  enrollmentRoutes
);

app.use(
  "/api/v1",
  progressRoutes
);

app.use("/api/v1", quizAttemptRoutes);
app.use("/api/v1", topicRoutes);
app.use("/api/v1", pipelineRoutes);
app.use("/api/v1", tutorRoutes);

/**
 * Root Route
 */
app.get(
  "/",
  (_req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      message:
        "Corviz Backend is running successfully.",
    });
  }
);

/**
 * 404 Route Handler
 */
app.use(
  (_req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      message: "Route not found.",
    });
  }
);

/**
 * Global Error Handler
 */
app.use(errorHandler);

export default app;