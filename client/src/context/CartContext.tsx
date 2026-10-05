import { useState, useEffect, type ReactNode } from "react";
import { CartContext } from "./cartContextInstance";
import toast from "react-hot-toast";
import type { ICartItem } from "../features/cart/types/cartTypes";
import type { IProduct } from "../features/products/types/productTypes";

const CART_STORAGE_KEY = "app_cart";

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<ICartItem[]>(() => {
    const savedCart = localStorage.getItem(CART_STORAGE_KEY);
    if (!savedCart) return [];

    try {
      const parsedCart: unknown = JSON.parse(savedCart);
      return Array.isArray(parsedCart) ? (parsedCart as ICartItem[]) : [];
    } catch {
      localStorage.removeItem(CART_STORAGE_KEY);
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product: IProduct, quantity = 1) => {
    if (quantity < 1 || quantity > product.stock) {
      toast.error("İstenen miktar için yeterli stok yok.");
      return;
    }

    const existingItem = cart.find((item) => item.product._id === product._id);
    const nextQuantity = (existingItem?.quantity ?? 0) + quantity;

    if (nextQuantity > product.stock) {
      toast.error("Stok sınırına ulaştınız!");
      return;
    }

    setCart(
      existingItem
        ? cart.map((item) =>
            item.product._id === product._id
              ? { ...item, quantity: nextQuantity, product }
              : item,
          )
        : [...cart, { product, quantity }],
    );
    toast.success(existingItem ? "Sepet güncellendi." : "Ürün sepete eklendi.");
  };

  const removeFromCart = (productId: string) => {
    setCart((prevCart) =>
      prevCart.filter((item) => item.product._id !== productId),
    );
    toast.success("Ürün sepetten çıkarıldı.");
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const item = cart.find((cartItem) => cartItem.product._id === productId);
    if (!item) return;
    if (quantity > item.product.stock) {
      toast.error("Stok sınırını aşamazsınız!");
      return;
    }

    setCart(
      cart.map((cartItem) =>
        cartItem.product._id === productId
          ? { ...cartItem, quantity }
          : cartItem,
      ),
    );
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem(CART_STORAGE_KEY);
  };

  const totalPrice = cart.reduce(
    (total, item) =>
      total +
      (item.product.discountPrice ?? item.product.price) * item.quantity,
    0,
  );

  const totalItems = cart.reduce((total, item) => total + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalPrice,
        totalItems,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
