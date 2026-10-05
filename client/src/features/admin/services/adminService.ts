import { api } from "../../../services/api";

export interface IUserItem {
  _id: string;
  name: string;
  email: string;
  role: "customer" | "seller" | "courier" | "admin";
  createdAt: string;
}

export interface IAdminOrder {
  _id: string;
  user: { _id: string; name: string; email: string } | string;
  orderItems: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  totalPrice: number;
  status: string;
  isPaid: boolean;
  createdAt: string;
}

export const adminService = {
  getAllUsers: async () => {
    const response = await api.get<{ data: { users: IUserItem[] } }>("/users");
    return response.data.data.users;
  },
  updateUserRole: async (userId: string, role: string) => {
    const response = await api.patch(`/users/${userId}/role`, { role });
    return response.data;
  },
  getSystemStats: async () => {
    const response = await api.get("/admin/analytics/summary");
    return response.data.data;
  },
  getAllOrders: async () => {
    const response = await api.get<{ data: { orders: IAdminOrder[] } }>(
      "/orders",
    );
    return response.data.data.orders;
  },
  updateOrderStatus: async (orderId: string, status: string) => {
    const response = await api.patch(`/orders/${orderId}/status`, { status });
    return response.data;
  },
};
