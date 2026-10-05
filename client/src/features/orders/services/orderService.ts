import { api } from "../../../services/api";
import type {
  ICreateOrderDto,
  IOrder,
  OrderResponse,
} from "../types/orderTypes";

export const orderService = {
  createOrder: async (orderData: ICreateOrderDto) => {
    const response = await api.post<OrderResponse>("/orders", orderData);
    return response.data.data.order;
  },
  getOrder: async (orderId: string) => {
    const response = await api.get<OrderResponse>(`/orders/${orderId}`);
    return response.data.data.order;
  },
  getMyOrders: async () => {
    const response = await api.get<{ data: { orders: IOrder[] } }>(
      "/orders/my-orders",
    );
    return response.data.data.orders;
  },
  cancelMyOrder: async (orderId: string) => {
    const response = await api.patch<OrderResponse>(
      `/orders/${orderId}/cancel`,
    );
    return response.data.data.order;
  },
};
