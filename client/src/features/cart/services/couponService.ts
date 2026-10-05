import { api } from "../../../services/api";

export interface ICouponResponse {
  data: {
    discountPercentage: number;
    code: string;
    discountAmount: number;
    discountedItemsPrice: number;
    minimumOrderAmount: number;
    remainingUses: number | null;
    expiresAt: string | null;
  };
}

export const couponService = {
  applyCoupon: async (code: string) => {
    const response = await api.post<ICouponResponse>("/coupons/validate", {
      code,
    });
    return response.data.data;
  },
};
