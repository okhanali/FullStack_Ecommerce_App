import type { Request, Response } from "express";
import { Cart } from "../models/cartModel.js";
import { BadRequestError, UnAuthorizedError } from "../utils/AppError.js";
import { catchAsync } from "../utils/catchAsync.js";
import { findUsableCoupon } from "../utils/couponRules.js";
import type { ValidateCouponInput } from "../validations/couponValidation.js";

export const validateCoupon = catchAsync(
  async (req: Request, res: Response) => {
    if (!req.user)
      throw new UnAuthorizedError("Kupon kontrolü için giriş yapın.");

    const { code } = req.body as ValidateCouponInput;
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart || cart.items.length === 0) {
      throw new BadRequestError(
        "Kupon uygulamak için sepetiniz boş olmamalıdır.",
      );
    }

    const itemsPrice = cart.items.reduce(
      (total, item) => total + item.price * item.quantity,
      0,
    );
    const coupon = await findUsableCoupon(code, itemsPrice);
    const discountAmount = Number(
      ((itemsPrice * coupon.discountPercentage) / 100).toFixed(2),
    );

    res.status(200).json({
      success: true,
      data: {
        code: coupon.code,
        discountPercentage: coupon.discountPercentage,
        discountAmount,
        itemsPrice,
        discountedItemsPrice: Number((itemsPrice - discountAmount).toFixed(2)),
        minimumOrderAmount: coupon.minimumOrderAmount,
        remainingUses:
          coupon.maxUses === undefined
            ? null
            : coupon.maxUses - coupon.usedCount,
        expiresAt: coupon.expiresAt ?? null,
      },
    });
  },
);
