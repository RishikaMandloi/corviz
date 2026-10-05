import { Request, Response } from "express";

import {
  asyncHandler,
  sendResponse,
} from "../../utils";

import {
  quizAttemptService,
} from "./quiz-attempt.service";

class QuizAttemptController {
  /**
   * Start Quiz Attempt
   */
  startQuizAttempt = asyncHandler(
    async (
      req: Request,
      res: Response
    ) => {
      const quizId =
        req.params.quizId as string;

      if (!req.user?.id) {
        throw new Error(
          "Authenticated user not found."
        );
      }

      const attempt =
        await quizAttemptService.startQuizAttempt(
          quizId,
          req.user.id
        );

      sendResponse(res, {
        statusCode: 201,
        message:
          "Quiz attempt started successfully.",
        data: attempt,
      });
    }
  );

  /**
   * Submit Quiz Attempt
   */
 /**
 * Submit Quiz Attempt
 */
submitQuizAttempt = asyncHandler(
  async (
    req: Request,
    res: Response
  ) => {
    if (!req.user?.id) {
      throw new Error(
        "Authenticated user not found."
      );
    }

    const attempt =
      await quizAttemptService.submitQuizAttempt(
        req.params.attemptId as string,
        req.user.id,
        req.body.answers
      );

    sendResponse(res, {
      statusCode: 200,
      message:
        "Quiz submitted successfully.",
      data: attempt,
    });
  }
);

/**
 * Get My Quiz Attempts
 */
getMyQuizAttempts = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user?.id) {
      throw new Error(
        "Authenticated user not found."
      );
    }

    const attempts =
      await quizAttemptService.getMyQuizAttempts(
        req.user.id
      );

    sendResponse(res, {
      statusCode: 200,
      message:
        "Quiz attempts fetched successfully.",
      data: attempts,
    });
  }
);

/**
 * Get Single Quiz Attempt
 */
getQuizAttemptById = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user?.id) {
      throw new Error(
        "Authenticated user not found."
      );
    }

    const attempt =
      await quizAttemptService.getQuizAttemptById(
        req.params.id as string,
        req.user.id,
        req.user.role
      );

    sendResponse(res, {
      statusCode: 200,
      message:
        "Quiz attempt fetched successfully.",
      data: attempt,
    });
  }
);

/**
 * Get Active Quiz Attempt
 */
getActiveQuizAttempt = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user?.id) {
      throw new Error(
        "Authenticated user not found."
      );
    }

    const attempt =
      await quizAttemptService.getActiveQuizAttempt(
        req.params.quizId as string,
        req.user.id
      );

    sendResponse(res, {
      statusCode: 200,
      message:
        "Active quiz attempt fetched successfully.",
      data: attempt,
    });
  }
);


}

export const quizAttemptController =
  new QuizAttemptController();