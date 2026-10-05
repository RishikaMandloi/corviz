import { NextFunction, Request, Response } from "express";
import {
  JsonWebTokenError,
  TokenExpiredError,
} from "jsonwebtoken";
import { AppError } from "../errors";




export const errorHandler = (
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if ((error as Error & { type?: string }).type === "entity.parse.failed") {
    res.status(400).json({
      success: false,
      message: "Request body must contain valid JSON.",
    });
    return;
  }

  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });

    return;
  }
  
  if (error instanceof TokenExpiredError) {
  res.status(401).json({
    success: false,
    message: "Authentication token has expired.",
  });

  return;
}

if (error instanceof JsonWebTokenError) {
  res.status(401).json({
    success: false,
    message: "Invalid authentication token.",
  });

  return;
}

  
  
  console.error(error);

  res.status(500).json({
    success: false,
    message: "Internal Server Error",
  });
  
};