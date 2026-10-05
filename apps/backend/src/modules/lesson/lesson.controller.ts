import { Request, Response } from "express";

import { asyncHandler, sendResponse } from "../../utils";
import { lessonService } from "./lesson.service";
import { ILesson } from "./lesson.types";

class LessonController {
  /**
   * Create Lesson
   */
  createLesson = asyncHandler(
    async (req: Request, res: Response) => {
      if (!req.user) {
        throw new Error("Authenticated user not found.");
      }

      const payload = {
        ...req.body,
        course: req.params.courseId,
        createdBy: req.user.id,
      } as ILesson;

      const lesson =
        await lessonService.createLesson(payload);

      sendResponse(res, {
        statusCode: 201,
        message: "Lesson created successfully.",
        data: lesson,
      });
    }
  );

  /**
   * Get All Lessons
   */
  getLessons = asyncHandler(
    async (req: Request, res: Response) => {
      const courseId =
        req.params.courseId as string;

      const lessons =
        await lessonService.getLessons(courseId);

      sendResponse(res, {
        statusCode: 200,
        message: "Lessons fetched successfully.",
        data: lessons,
      });
    }
  );

  /**
   * Get Lesson By Slug
   */
  getLesson = asyncHandler(
    async (req: Request, res: Response) => {
      const courseId =
        req.params.courseId as string;

      const slug =
        req.params.slug as string;

      const lesson =
        await lessonService.getLesson(
          courseId,
          slug
        );

      sendResponse(res, {
        statusCode: 200,
        message: "Lesson fetched successfully.",
        data: lesson,
      });
    }
  );

  /**
   * Update Lesson
   */
  updateLesson = asyncHandler(
    async (req: Request, res: Response) => {
      const id =
        req.params.id as string;

      const payload =
        req.body as Partial<ILesson>;

      const lesson =
        await lessonService.updateLesson(
          id,
          payload
        );

      sendResponse(res, {
        statusCode: 200,
        message: "Lesson updated successfully.",
        data: lesson,
      });
    }
  );

  /**
   * Delete Lesson
   */
  deleteLesson = asyncHandler(
    async (req: Request, res: Response) => {
      const id =
        req.params.id as string;

      await lessonService.deleteLesson(id);

      sendResponse(res, {
        statusCode: 200,
        message: "Lesson deleted successfully.",
      });
    }
  );
}

export const lessonController =
  new LessonController();