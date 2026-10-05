import { Request, Response } from "express";

import {
  asyncHandler,
  sendResponse,
} from "../../utils";

import { quizService } from "./quiz.service";
import { IQuiz } from "./quiz.types";

class QuizController {
  /**
   * Create Quiz
   */
  createQuiz = asyncHandler(
    async (
      req: Request,
      res: Response
    ) => {
      if (!req.user?.id) {
        throw new Error(
          "Authenticated user not found."
        );
      }

      const payload = {
        ...req.body,
        lesson: req.params.lessonId,
        createdBy: req.user.id,
      } as IQuiz;

      const quiz =
        await quizService.createQuiz(
          payload
        );

      sendResponse(res, {
        statusCode: 201,
        message:
          "Quiz created successfully.",
        data: quiz,
      });
    }
  );

  /**
   * Get All Quizzes
   */
  getQuizzes = asyncHandler(
    async (
      _req: Request,
      res: Response
    ) => {
      const quizzes =
        await quizService.getQuizzes();

      sendResponse(res, {
        statusCode: 200,
        message:
          "Quizzes fetched successfully.",
        data: quizzes,
      });
    }
  );

  /**
   * Get Quiz By ID
   */
  getQuizById = asyncHandler(
    async (
      req: Request,
      res: Response
    ) => {
      const quiz =
        await quizService.getQuizById(
          req.params.id as string
        );

      sendResponse(res, {
        statusCode: 200,
        message:
          "Quiz fetched successfully.",
        data: quiz,
      });
    }
  );

  /**
   * Update Quiz
   */
  updateQuiz = asyncHandler(
    async (
      req: Request,
      res: Response
    ) => {
      const payload =
        req.body as Partial<IQuiz>;

      const quiz =
        await quizService.updateQuiz(
          req.params.id as string,
          payload
        );

      sendResponse(res, {
        statusCode: 200,
        message:
          "Quiz updated successfully.",
        data: quiz,
      });
    }
  );

  /**
   * Delete Quiz
   */
  deleteQuiz = asyncHandler(
    async (
      req: Request,
      res: Response
    ) => {
      await quizService.deleteQuiz(
        req.params.id as string
      );

      sendResponse(res, {
        statusCode: 200,
        message:
          "Quiz deleted successfully.",
        data: null,
      });
    }
  );
}

export const quizController =
  new QuizController();