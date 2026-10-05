import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const addToCartSchema = z.object({
  productId: z.string().regex(objectIdRegex, "Geçersiz Ürün ID formatı"),
  quantity: z
    .number({ message: "Miktar bir sayı olmalıdır." })
    .int("Miktar tam sayı olmalıdır.")
    .positive("Miktar en az 1 olmalıdır.")
    .default(1),
});

export const updateCartItemSchema = z.object({
  quantity: z
    .number({ message: "Miktar bir sayı olmalıdır." })
    .int("Miktar tam sayı olmalıdır.")
    .min(0, "Miktar negatif olamaz."),
});

export type AddToCartInput = z.infer<typeof addToCartSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;
