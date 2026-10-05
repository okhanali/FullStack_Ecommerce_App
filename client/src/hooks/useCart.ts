import { useContext } from "react";
import { CartContext } from "../context/cartContextInstance";

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart hook must be used within a CartProvider");
  }
  return context;
};
