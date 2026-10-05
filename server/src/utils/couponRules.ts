import { Coupon, type ICouponDocument } from "../models/couponModel.js";
import { BadRequestError } from "./AppError.js";

const normalizeCode = (code: string) => code.trim().toUpperCase();

export type CouponTerms = Pick<
  ICouponDocument,
  | "isActive"
  | "startsAt"
  | "expiresAt"
  | "minimumOrderAmount"
  | "maxUses"
  | "usedCount"
>;

export const assertCouponUsable: (
  coupon: CouponTerms | null,
  itemsPrice: number,
  now?: Date,
) => asserts coupon is CouponTerms = (coupon, itemsPrice, now = new Date()) => {
  if (
    !coupon ||
    !coupon.isActive ||
    coupon.startsAt > now ||
    (coupon.expiresAt && coupon.expiresAt <= now)
  ) {
    throw new BadRequestError("Kupon geçersiz veya kullanım süresi dolmuş.");
  }

  if (coupon.maxUses !== undefined && coupon.usedCount >= coupon.maxUses) {
    throw new BadRequestError("Kuponun kullanım limiti dolmuş.");
  }

  if (itemsPrice < coupon.minimumOrderAmount) {
    throw new BadRequestError(
      `Bu kupon için sepet tutarı en az ${coupon.minimumOrderAmount.toLocaleString("tr-TR")} ₺ olmalıdır.`,
    );
  }
};

export const findUsableCoupon = async (
  rawCode: string,
  itemsPrice: number,
): Promise<ICouponDocument> => {
  const coupon = await Coupon.findOne({ code: normalizeCode(rawCode) });
  assertCouponUsable(coupon, itemsPrice);
  return coupon;
};

export const reserveCouponUse = async (
  coupon: ICouponDocument,
): Promise<void> => {
  const now = new Date();
  const result = await Coupon.updateOne(
    {
      _id: coupon._id,
      isActive: true,
      usedCount: coupon.usedCount,
      startsAt: { $lte: now },
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: null },
        { expiresAt: { $gt: now } },
      ],
    },
    { $inc: { usedCount: 1 } },
  );

  if (result.modifiedCount !== 1) {
    throw new BadRequestError("Kupon limiti doldu; lütfen tekrar deneyin.");
  }
};

export const releaseCouponCodeUse = async (code: string): Promise<void> => {
  await Coupon.updateOne(
    { code: normalizeCode(code), usedCount: { $gt: 0 } },
    { $inc: { usedCount: -1 } },
  );
};

export const releaseCouponUse = async (couponId: string): Promise<void> => {
  await Coupon.updateOne(
    { _id: couponId, usedCount: { $gt: 0 } },
    { $inc: { usedCount: -1 } },
  );
};
