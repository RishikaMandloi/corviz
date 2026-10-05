import jwt, {
  JwtPayload as DefaultJwtPayload,
} from "jsonwebtoken";

import { AppError } from "../errors";
import { User } from "../modules/user";
import { asyncHandler } from "../utils";
import { UserRole } from "../constants";

interface JwtPayload extends DefaultJwtPayload {
  userId: string;
  role: UserRole;
}

export const authenticate = asyncHandler(
  async (req, _res, next) => {
    const authorizationHeader =
      req.headers.authorization;

    if (!authorizationHeader) {
      throw new AppError(
        "Authentication token is required.",
        401
      );
    }

    if (
      !authorizationHeader.startsWith("Bearer ")
    ) {
      throw new AppError(
        "Invalid authorization header.",
        401
      );
    }

    const token =
      authorizationHeader.substring(7).trim();

    if (!token) {
      throw new AppError(
        "Authentication token is required.",
        401
      );
    }

    const secret =
      process.env.JWT_SECRET;

    if (!secret) {
      throw new AppError(
        "JWT_SECRET is not configured.",
        500
      );
    }

    const decoded =
      jwt.verify(
        token,
        secret
      ) as JwtPayload;

    if (!decoded.userId) {
      throw new AppError(
        "Invalid authentication token.",
        401
      );
    }

    const user =
      await User.findById(decoded.userId);

    if (!user) {
      throw new AppError(
        "User not found.",
        401
      );
    }

    req.user = {
      id: user._id.toString(),
      role: user.role,
    };

    next();
  }
);