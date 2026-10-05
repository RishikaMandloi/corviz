import { NextFunction, Request, Response } from "express";

import { UserRole } from "../constants";
import { AppError } from "../errors";

export const authorize =
  (...allowedRoles: UserRole[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AppError("Unauthorized.", 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new AppError(
        "You do not have permission to access this resource.",
        403
      );
    }

    next();
  };