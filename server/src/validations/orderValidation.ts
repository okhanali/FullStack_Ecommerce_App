import { z } from "zod";
import { OrderStatus } from "../types/orderTypes.js";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const createOrderSchema = z.object({
  shippingAddress: z.object({
    address: z.string().min(5, "Adres en az 5 karakter olmalıdır."),
    city: z.string().min(2, "Şehir adı zorunludur."),
    postalCode: z.string().min(3, "Posta kodu zorunludur."),
    country: z.string().min(2, "Ülke adı zorunludur."),
  }),
  paymentMethod: z.enum(["SIMULATED_CARD", "SIMULATED_CASH"], {
    message: "Demo ödeme yöntemlerinden birini seçmelisiniz.",
  }),
  couponCode: z.string().trim().min(3).max(32).optional(),
});

export const updateOrderStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus, {
    message: "Geçersiz sipariş durumu.",
  }),
});

export const orderIdParamSchema = z.object({
  id: z.string().regex(objectIdRegex, "Geçersiz Sipariş ID formatı"),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
