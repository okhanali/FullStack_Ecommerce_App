import { createContext } from "react";
import type { ICartContextType } from "../features/cart/types/cartTypes";

export const CartContext = createContext<ICartContextType | undefined>(
  undefined,
);
