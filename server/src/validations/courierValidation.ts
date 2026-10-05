import { z } from "zod";
import { OrderStatus } from "../types/orderTypes.js";

export const courierOrderStatusSchema = z.object({
  status: z.enum([OrderStatus.SHIPPED, OrderStatus.DELIVERED]),
});

export type CourierOrderStatusInput = z.infer<typeof courierOrderStatusSchema>;
