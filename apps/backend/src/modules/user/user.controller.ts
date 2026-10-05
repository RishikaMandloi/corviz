import { Request, Response } from "express";

import { asyncHandler, sendResponse } from "../../utils";
import { userService } from "./user.service";

class UserController {
  /**
   * Get Current Authenticated User
   */
  getCurrentUser = asyncHandler(async (req: Request, res: Response) => {
    const user = await userService.getCurrentUser(req.user!.id);

    sendResponse(res, {
      statusCode: 200,
      message: "Current user fetched successfully.",
      data: user,
    });
  });

  /**
 * Update Current Authenticated User
 */
updateCurrentUser = asyncHandler(async (req: Request, res: Response) => {
  const updatedUser = await userService.updateCurrentUser(
    req.user!.id,
    req.body
  );

  sendResponse(res, {
    statusCode: 200,
    message: "Profile updated successfully.",
    data: updatedUser,
  });
});


/**
 * Change Current User Password
 */
changePassword = asyncHandler(async (req: Request, res: Response) => {
  await userService.changePassword(
    req.user!.id,
    req.body
  );

  sendResponse(res, {
    statusCode: 200,
    message: "Password changed successfully.",
    data: null,
  });
});


/**
 * Get All Users (Admin)
 */
getAllUsers = asyncHandler(async (_req: Request, res: Response) => {
  const users = await userService.getAllUsers();

  sendResponse(res, {
    statusCode: 200,
    message: "Users fetched successfully.",
    data: users,
  });
});


}

export const userController = new UserController();