import { Request, Response } from "express";

import { authService } from "./auth.service";
import { LoginUserDto, RegisterUserDto } from "./auth.types";
import { sendResponse } from "../../utils";

class AuthController {
  /**
   * Register User
   */
  async register(req: Request, res: Response): Promise<void> {
    try {
      const data = req.body as RegisterUserDto;

      const result = await authService.register(data);

     sendResponse(res, {
  statusCode: 201,
  message: "User registered successfully.",
  data: result,
});
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Internal Server Error";

      res.status(400).json({
        success: false,
        message,
      });
    }
  }

  /**
   * Login User
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      const data = req.body as LoginUserDto;

      const result = await authService.login(data);

      sendResponse(res, {
      statusCode: 200,
      message: "Login successful.",
      data: result,
});
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Internal Server Error";

      res.status(401).json({
        success: false,
        message,
      });
    }
  }
}

export const authController = new AuthController();