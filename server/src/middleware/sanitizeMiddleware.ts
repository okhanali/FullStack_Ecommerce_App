import type { Request, Response, NextFunction } from "express";

const sanitizeValue = <T>(value: T): T => {
  if (value && typeof value === "object") {
    for (const key of Object.keys(value)) {
      if (key.startsWith("$") || key.includes(".")) {
        delete (value as Record<string, unknown>)[key];
      } else {
        (value as Record<string, unknown>)[key] = sanitizeValue(
          (value as Record<string, unknown>)[key],
        );
      }
    }
  }
  return value;
};

export const mongoSanitize = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (req.body) req.body = sanitizeValue(req.body);
  if (req.params) req.params = sanitizeValue(req.params);
  if (req.query) {
    sanitizeValue(req.query);
  }
  next();
};
