import { Router } from "express";

import { validateRequest } from "../../middlewares/validate-request";
import { authController } from "./auth.controller";
import {
  loginUserSchema,
  registerUserSchema,
} from "./auth.validation";
import { asyncHandler } from "../../utils/async-handler";

const router = Router();

/**
 * Register a new user
 * POST /api/v1/auth/register
 */
router.post(
  "/register",
  // (req, _res, next) => {
  //   console.log("✅ Register route hit");
  //   next();
  // },
  validateRequest(registerUserSchema),
   asyncHandler(authController.register.bind(authController))
);

/**
 * Login existing user
 * POST /api/v1/auth/login
 */
router.post(
  "/login",
  validateRequest(loginUserSchema),
  authController.login.bind(authController)
);

export default router;