import { api } from "../../../services/api";

export interface ICourierOrder {
  _id: string;
  totalPrice: number;
  status: "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
  shippingAddress: {
    address: string;
    city: string;
    postalCode: string;
    country: string;
  };
  createdAt: string;
  estimatedDeliveryAt?: string;
  trackingProgress?: number;
  user: {
    name: string;
    email: string;
  };
}

export const courierService = {
  getAssignedOrders: async () => {
    const response = await api.get<{ data: { orders: ICourierOrder[] } }>(
      "/courier/orders",
    );
    return response.data.data.orders;
  },
  updateOrderStatus: async (orderId: string, status: string) => {
    const response = await api.patch(`/courier/orders/${orderId}/status`, {
      status,
    });
    return response.data;
  },
  advanceLocation: async (orderId: string) => {
    const response = await api.post(
      `/courier/orders/${orderId}/simulate-location`,
    );
    return response.data;
  },
};
