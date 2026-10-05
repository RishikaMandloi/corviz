import { NextFunction, Request, Response } from "express";

import { AppError } from "../errors";
import { UserRole } from "../constants";

/**
 * Role-Based Authorization Middleware
 */
export const authorize =
  (...allowedRoles: UserRole[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    const user = req.user;

    if (!user) {
      return next(new AppError("Authentication required.", 401));
    }

    if (!allowedRoles.includes(user.role)) {
      return next(new AppError("You are not authorized to access this resource.", 403));
    }

    next();
  };