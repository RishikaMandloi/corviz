import { Request, Response } from "express";

import {
  asyncHandler,
  sendResponse,
} from "../../utils";

import { progressService } from "./progress.service";

class ProgressController {
  /**
   * Create Progress
   */
  createProgress = asyncHandler(
    async (req: Request, res: Response) => {
      if (!req.user) {
        throw new Error(
          "Authenticated user not found."
        );
      }

      const progress =
        await progressService.createProgress(
          {
            enrollment:
              req.body.enrollment,
            lesson:
              req.body.lesson,
          },
          req.user.id,
          req.user.role
        );

      sendResponse(res, {
        statusCode: 201,
        message:
          "Progress created successfully.",
        data: progress,
      });
    }
  );

  /**
   * Get Progress By Enrollment
   */
  getProgressByEnrollment =
    asyncHandler(
      async (
        req: Request,
        res: Response
      ) => {
        if (!req.user) {
          throw new Error(
            "Authenticated user not found."
          );
        }

        const progress =
          await progressService.getProgressByEnrollment(
            req.params.enrollmentId as string,
            req.user.id,
            req.user.role
          );

        sendResponse(res, {
          statusCode: 200,
          message:
            "Learning progress fetched successfully.",
          data: progress,
        });
      }
    );

  /**
   * Get Progress By ID
   */
  getProgressById =
    asyncHandler(
      async (
        req: Request,
        res: Response
      ) => {
        if (!req.user) {
          throw new Error(
            "Authenticated user not found."
          );
        }

        const progress =
          await progressService.getProgressById(
            req.params.id as string,
            req.user.id,
            req.user.role
          );

        sendResponse(res, {
          statusCode: 200,
          message:
            "Progress fetched successfully.",
          data: progress,
        });
      }
    );

  /**
   * Update Progress
   */
  updateProgress =
    asyncHandler(
      async (
        req: Request,
        res: Response
      ) => {
        if (!req.user) {
          throw new Error(
            "Authenticated user not found."
          );
        }

        const progress =
          await progressService.updateProgress(
            req.params.id as string,
            req.body,
            req.user.id,
            req.user.role
          );

        sendResponse(res, {
          statusCode: 200,
          message:
            "Progress updated successfully.",
          data: progress,
        });
      }
    );


    /**
 * Get Progress Summary By Enrollment
 */
getProgressSummary =
  asyncHandler(
    async (
      req: Request,
      res: Response
    ) => {
      if (!req.user) {
        throw new Error(
          "Authenticated user not found."
        );
      }

      const summary =
        await progressService.getProgressSummary(
          req.params.enrollmentId as string,
          req.user.id,
          req.user.role
        );

      sendResponse(res, {
        statusCode: 200,
        message:
          "Progress summary fetched successfully.",
        data: summary,
      });
    }
  );

  /**
 * Get Progress Analytics
 */
getProgressAnalytics =
  asyncHandler(
    async (
      req: Request,
      res: Response
    ) => {
      if (!req.user) {
        throw new Error(
          "Authenticated user not found."
        );
      }

      const analytics =
        await progressService.getProgressAnalytics(
          req.params.enrollmentId as string,
          req.user.id,
          req.user.role
        );

      sendResponse(res, {
        statusCode: 200,
        message:
          "Progress analytics fetched successfully.",
        data: analytics,
      });
    }
  );

  /**
   * Delete Progress
   */
  deleteProgress =
    asyncHandler(
      async (
        req: Request,
        res: Response
      ) => {
        if (!req.user) {
          throw new Error(
            "Authenticated user not found."
          );
        }

        await progressService.deleteProgress(
          req.params.id as string,
          req.user.id,
          req.user.role
        );

        sendResponse(res, {
          statusCode: 200,
          message:
            "Progress deleted successfully.",
          data: null,
        });
      }
    );
}

export const progressController =
  new ProgressController();