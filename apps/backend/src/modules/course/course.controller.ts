import { Request, Response } from "express";
import { AppError } from "../../errors";
import { asyncHandler, sendResponse } from "../../utils";
import { courseService } from "./course.service";
import { ICourse } from "./course.types";

class CourseController {
  /**
   * Create Course
   */
  createCourse = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new AppError(
        "Authentication required.",
        401
      );
    }

    const payload = {
      ...req.body,
      createdBy: req.user.id,
    } as ICourse;

    const course =
      await courseService.createCourse(payload);

    sendResponse(res, {
      statusCode: 201,
      message: "Course created successfully.",
      data: course,
    });
  }
);

  /**
   * Get All Courses
   */
  getCourses = asyncHandler(
    async (_req: Request, res: Response) => {
      const courses = await courseService.getCourses();

      sendResponse(res, {
        statusCode: 200,
        message: "Courses fetched successfully.",
        data: courses,
      });
    }
  );

  /**
   * Get Course By Slug
   */
  getCourseBySlug = asyncHandler(
    async (req: Request, res: Response) => {
      const course = await courseService.getCourseBySlug(
        req.params.slug as string
      );

      sendResponse(res, {
        statusCode: 200,
        message: "Course fetched successfully.",
        data: course,
      });
    }
  );

  /**
   * Update Course
   */
  updateCourse = asyncHandler(
    async (req: Request, res: Response) => {
      const payload = req.body as Partial<ICourse>;

      const course = await courseService.updateCourse(
        req.params.id as string,
        payload
      );

      sendResponse(res, {
        statusCode: 200,
        message: "Course updated successfully.",
        data: course,
      });
    }
  );

  /**
   * Delete Course
   */
  deleteCourse = asyncHandler(
    async (req: Request, res: Response) => {
      await courseService.deleteCourse(
        req.params.id as string
      );

      sendResponse(res, {
        statusCode: 200,
        message: "Course deleted successfully.",
      });
    }
  );
}

export const courseController = new CourseController();