import type { Request, Response, NextFunction } from "express";
import { catchAsync } from "../utils/catchAsync.js";
import { verifyToken } from "../utils/jwtUtils.js";
import { User } from "../models/userModel.js";
import { ForbiddenError, UnAuthorizedError } from "../utils/AppError.js";
import type { UserRole } from "../types/userTypes.js";

export const protect = catchAsync(
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    let token: string | undefined;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      throw new UnAuthorizedError("Lütfen giriş yapın (Token bulunamadı).");
    }

    const decoded = verifyToken(token);
    const currentUser = await User.findById(decoded.id);

    if (!currentUser) {
      throw new UnAuthorizedError(
        "Bu token'a ait kullanıcı artık mevcut değil.",
      );
    }

    req.user = currentUser;
    next();
  },
);

export const restrictTo = (...roles: (UserRole | string)[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new ForbiddenError(
        "Bu işlemi gerçekleştirmek için gerekli izniniz yok.",
      );
    }
    next();
  };
};
