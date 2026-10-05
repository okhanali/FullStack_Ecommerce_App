import { api } from "../../../services/api";
import type { IProduct } from "../../products/types/productTypes";

export const wishlistService = {
  getWishlist: async () => {
    const response = await api.get<{ data: { wishlist: IProduct[] } }>(
      "/users/wishlist",
    );
    return response.data.data.wishlist;
  },
  toggleWishlist: async (productId: string) => {
    const response = await api.post(`/users/wishlist/toggle/${productId}`);
    return response.data;
  },
};
