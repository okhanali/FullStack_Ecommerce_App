import type { IProduct } from "../../products/types/productTypes";

export interface ICartItem {
  product: IProduct;
  quantity: number;
}

export interface ICartContextType {
  cart: ICartItem[];
  addToCart: (product: IProduct, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalPrice: number;
  totalItems: number;
}
