import { Router } from "express";

import { authenticate ,} from "../../middlewares";
import { validateRequest } from "../../middlewares/validate-request";
import { authorize } from "../../middlewares";
import { userController } from "./user.controller";
import { USER_ROLES } from "../../constants";
import {
  changePasswordSchema,
  updateCurrentUserSchema,
} from "./user.validation";

const router = Router();

/**
 * Get Current Authenticated User
 */
router.get(
  "/me",
  authenticate,
  userController.getCurrentUser
);

/**
 * Update Current Authenticated User
 */
router.patch(
  "/me",
  authenticate,
   validateRequest(updateCurrentUserSchema),
  userController.updateCurrentUser
);

/**
 * Change Current User Password
 */
router.patch(
  "/change-password",
  authenticate,
  validateRequest(changePasswordSchema),
  userController.changePassword
);

/**
 * Get All Users (Admin Only)
 */
router.get(
  "/",
  authenticate,
  authorize(USER_ROLES.ADMIN),
  userController.getAllUsers
);
export default router;