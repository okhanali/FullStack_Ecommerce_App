import { api } from "../../../services/api";
import type { ICartItem } from "../types/cartTypes";

export const cartService = {
  async syncCart(items: ICartItem[]) {
    await api.delete("/carts");

    for (const item of items) {
      await api.post("/carts", {
        productId: item.product._id,
        quantity: item.quantity,
      });
    }
  },
};
