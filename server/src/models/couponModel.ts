import { model, Schema, type Document } from "mongoose";

export interface ICouponDocument extends Document {
  code: string;
  discountPercentage: number;
  isActive: boolean;
  startsAt: Date;
  expiresAt?: Date;
  minimumOrderAmount: number;
  maxUses?: number;
  usedCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const couponSchema = new Schema<ICouponDocument>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      minlength: 3,
      maxlength: 32,
    },
    discountPercentage: { type: Number, required: true, min: 1, max: 90 },
    isActive: { type: Boolean, default: true, index: true },
    startsAt: { type: Date, default: Date.now, required: true },
    expiresAt: { type: Date },
    minimumOrderAmount: { type: Number, default: 0, min: 0 },
    maxUses: { type: Number, min: 1 },
    usedCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

couponSchema.index({ code: 1, isActive: 1 });

export const Coupon = model<ICouponDocument>("Coupon", couponSchema);
