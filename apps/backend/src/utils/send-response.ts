import { Response } from "express";

interface SendResponseOptions<T> {
  statusCode: number;
  message: string;
  data?: T;
  meta?: Record<string, unknown>;
}

export const sendResponse = <T>(
  res: Response,
  options: SendResponseOptions<T>
): void => {
  const { statusCode, message, data, meta } = options;

  res.status(statusCode).json({
    success: statusCode < 400,
    message,
    data,
    meta,
  });
};