import type { Types } from "mongoose";

export interface ICartItem {
  product: Types.ObjectId | string;
  quantity: number;
  price: number;
}

export interface ICart {
  _id: string;
  user: Types.ObjectId | string;
  items: ICartItem[];
  totalPrice: number;
  createdAt: Date;
  updatedAt: Date;
}
