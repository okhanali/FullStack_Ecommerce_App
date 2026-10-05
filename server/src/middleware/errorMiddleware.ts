import type { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError.js";
import { ZodError } from "zod";

interface ErrorResponse {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
  stack?: string;
}

export const errorHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  let statusCode = 500;
  let message = "Sunucu Hatası";
  let validationErrors: Record<string, string[]> | undefined;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err instanceof ZodError) {
    statusCode = 400;
    message = "Doğrulama Hatası";
    validationErrors = {};

    err.issues.forEach((issue) => {
      const path = issue.path.join(".").replace(/^(body|query|params)\./, "");
      if (!validationErrors![path]) {
        validationErrors![path] = [];
      }
      validationErrors![path].push(issue.message);
    });
  } else if (
    err.name === "MongoServerError" &&
    (err as unknown as { code: number }).code === 11000
  ) {
    statusCode = 409;
    const keyValue = (err as unknown as { keyValue: Record<string, string> })
      .keyValue;
    const field = Object.keys(keyValue)[0];
    message = `${field} zaten mevcut`;
  } else if (err.name === "CastError") {
    statusCode = 400;
    message = "Geçersiz kimlik.";
  } else if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Geçersiz kimlik. Lütfen tekrar giriş yapın";
  } else if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Giriş süresi doldu. Lütfen tekrar oturum açın.";
  }

  const response: ErrorResponse = {
    success: false,
    message,
    ...(validationErrors && { errors: validationErrors }),
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  };

  res.status(statusCode).json(response);
};
