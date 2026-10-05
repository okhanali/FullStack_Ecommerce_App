export interface IOrderItemDto {
  product: string;
  quantity: number;
}

export interface ICreateOrderDto {
  shippingAddress: {
    address: string;
    city: string;
    postalCode: string;
    country: string;
  };
  paymentMethod: string;
  couponCode?: string;
}

export interface IOrder {
  _id: string;
  user: string;
  orderItems: {
    product:
      | string
      | { _id: string; title: string; price: number; image: string };
    name: string;
    image: string;
    price: number;
    quantity: number;
  }[];
  courier?: string | { _id: string; name?: string } | null;
  courierLocation?: { lat: number; lng: number; updatedAt?: string };
  trackingProgress?: number;
  estimatedDeliveryAt?: string;
  statusHistory?: Array<{
    status: string;
    at: string;
    note?: string;
  }>;
  shippingAddress: {
    address: string;
    city: string;
    postalCode: string;
    country: string;
  };
  paymentMethod: string;
  couponCode?: string;
  couponDiscount?: number;
  isPaid: boolean;
  paidAt?: string;
  itemsPrice: number;
  taxPrice: number;
  shippingPrice: number;
  totalPrice: number;
  status: string;
  createdAt: string;
}

export interface OrderResponse {
  status: string;
  data: {
    order: IOrder;
  };
}
