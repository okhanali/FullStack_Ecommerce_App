import type { Request, Response, NextFunction } from "express";
import type { ZodSchema } from "zod";

type ValidationTarget = "body" | "params" | "query";

export const validate =
  <T>(schema: ZodSchema<T>, target: ValidationTarget = "body") =>
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = await schema.parseAsync(req[target]);

      if (target === "body") {
        req.body = parsed;
      } else {
        const targetObj = req[target] as Record<string, unknown>;
        for (const key of Object.keys(targetObj)) {
          delete targetObj[key];
        }
        Object.assign(targetObj, parsed);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
