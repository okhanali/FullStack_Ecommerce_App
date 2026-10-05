import { model, Schema, type Document } from "mongoose";
import { type IOrder, OrderStatus } from "../types/orderTypes.js";

export interface IOrderDocument extends Omit<IOrder, "_id">, Document {}

const orderItemSchema = new Schema(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    name: { type: String, required: true },
    image: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
  },
  { _id: false },
);

const orderSchema = new Schema<IOrderDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    courier: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true, // <-- Kuryeye atanan siparişleri hızlı bulmak için
    },
    courierLocation: {
      lat: { type: Number },
      lng: { type: Number },
      updatedAt: { type: Date },
    },
    trackingProgress: { type: Number, min: 0, max: 1, default: 0 },
    estimatedDeliveryAt: { type: Date },
    statusHistory: [
      {
        status: {
          type: String,
          enum: Object.values(OrderStatus),
          required: true,
        },
        at: { type: Date, required: true, default: Date.now },
        note: { type: String, maxlength: 240 },
      },
    ],
    orderItems: [orderItemSchema],
    shippingAddress: {
      address: { type: String, required: true },
      city: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, required: true },
    },
    paymentMethod: {
      type: String,
      required: [true, "Ödeme yöntemi gereklidir."],
    },
    coupon: { type: Schema.Types.ObjectId, ref: "Coupon" },
    couponCode: { type: String, uppercase: true, trim: true },
    couponDiscount: { type: Number, min: 0, default: 0 },
    paymentResult: {
      id: String,
      status: String,
      updateTime: String,
      emailAddress: String,
    },
    itemsPrice: { type: Number, required: true, default: 0.0 },
    taxPrice: { type: Number, required: true, default: 0.0 },
    shippingPrice: { type: Number, required: true, default: 0.0 },
    totalPrice: { type: Number, required: true, default: 0.0 },
    status: {
      type: String,
      enum: Object.values(OrderStatus),
      default: OrderStatus.PENDING,
      index: true,
    },
    isPaid: { type: Boolean, required: true, default: false },
    paidAt: { type: Date },
    isDelivered: { type: Boolean, required: true, default: false },
    deliveredAt: { type: Date },
  },
  {
    timestamps: true,
  },
);

export const Order = model<IOrderDocument>("Order", orderSchema);
