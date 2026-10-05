import { model, Schema, type Document } from "mongoose";
import type { ICart } from "../types/cartTypes.js";

export interface ICartDocument extends Omit<ICart, "_id">, Document {}

const cartItemSchema = new Schema(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, "Adet en az 1 olmalıdır."],
      default: 1,
    },
    price: {
      type: Number,
      required: true,
      min: [0, "Fiyat negatif olamaz."],
    },
  },
  { _id: false },
);

const cartSchema = new Schema<ICartDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    items: [cartItemSchema],
    totalPrice: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

//* Toplam fiyatı otomatik hesaplayan Pre-save Hook
cartSchema.pre("save", function () {
  this.totalPrice = this.items.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0,
  );
});

export const Cart = model<ICartDocument>("Cart", cartSchema);
