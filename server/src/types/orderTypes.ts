import type { Types } from "mongoose";

export enum OrderStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  SHIPPED = "SHIPPED",
  DELIVERED = "DELIVERED",
  CANCELLED = "CANCELLED",
}

export interface IOrderItem {
  product: Types.ObjectId | string;
  name: string;
  image: string;
  price: number;
  quantity: number;
}

export interface IShippingAddress {
  address: string;
  city: string;
  postalCode: string;
  country: string;
}

// Yeni eklenen kurye konum tipi
export interface ICourierLocation {
  lat: number;
  lng: number;
  updatedAt?: Date;
}

export interface IOrderStatusEvent {
  status: OrderStatus;
  at: Date;
  note?: string;
}

export interface IOrder {
  _id: string;
  user: Types.ObjectId | string;
  courier?: Types.ObjectId | string;
  courierLocation?: ICourierLocation;
  trackingProgress: number;
  estimatedDeliveryAt?: Date;
  statusHistory: IOrderStatusEvent[];
  orderItems: IOrderItem[];
  shippingAddress: IShippingAddress;
  paymentMethod: string;
  coupon?: Types.ObjectId | string;
  couponCode?: string;
  couponDiscount: number;
  paymentResult?: {
    id?: string;
    status?: string;
    updateTime?: string;
    emailAddress?: string;
  };
  itemsPrice: number;
  taxPrice: number;
  shippingPrice: number;
  totalPrice: number;
  status: OrderStatus;
  isPaid: boolean;
  paidAt?: Date;
  isDelivered: boolean;
  deliveredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
