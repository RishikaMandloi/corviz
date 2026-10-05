import { Request, Response } from "express";

import { AppError } from "../../errors";
import { asyncHandler, sendResponse } from "../../utils";

import { enrollmentService } from "./enrollment.service";

/**
 * Enrollment Controller
 */
class EnrollmentController {
  /**
   * Create Enrollment
   */
  createEnrollment = asyncHandler(
    async (req: Request, res: Response) => {
      if (!req.user) {
        throw new AppError(
          "Authentication required.",
          401
        );
      }

      const enrollment =
        await enrollmentService.createEnrollment(
          req.user.id,
          {
            course: req.body.course,
          }
        );

      sendResponse(res, {
        statusCode: 201,
        message: "Enrollment created successfully.",
        data: enrollment,
      });
    }
  );

  /**
   * Get Current User Enrollments
   */
  getMyEnrollments = asyncHandler(
    async (req: Request, res: Response) => {
      if (!req.user) {
        throw new AppError(
          "Authentication required.",
          401
        );
      }

      const enrollments =
        await enrollmentService.getMyEnrollments(
          req.user.id
        );

      sendResponse(res, {
        statusCode: 200,
        message: "Enrollments fetched successfully.",
        data: enrollments,
      });
    }
  );

  /**
   * Get Enrollment By ID
   */
  getEnrollmentById = asyncHandler(
    async (req: Request, res: Response) => {
      const enrollment =
        await enrollmentService.getEnrollmentById(
          req.params.id as string
        );

      sendResponse(res, {
        statusCode: 200,
        message: "Enrollment fetched successfully.",
        data: enrollment,
      });
    }
  );

  /**
   * Update Enrollment
   */
  updateEnrollment = asyncHandler(
    async (req: Request, res: Response) => {
      const enrollment =
        await enrollmentService.updateEnrollment(
          req.params.id as string,
          req.body
        );

      sendResponse(res, {
        statusCode: 200,
        message: "Enrollment updated successfully.",
        data: enrollment,
      });
    }
  );

  /**
   * Delete Enrollment
   */
  deleteEnrollment = asyncHandler(
    async (req: Request, res: Response) => {
      await enrollmentService.deleteEnrollment(
        req.params.id as string
      );

      sendResponse(res, {
        statusCode: 200,
        message: "Enrollment deleted successfully.",
        data: null,
      });
    }
  );
}

export const enrollmentController =
  new EnrollmentController();