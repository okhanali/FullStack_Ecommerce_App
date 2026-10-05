import { z } from "zod";

export const validateCouponSchema = z.object({
  code: z.string().trim().min(3).max(32),
});

export type ValidateCouponInput = z.infer<typeof validateCouponSchema>;
