import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

// 1. Temel ürün nesnesi
const baseProductSchema = z.object({
  title: z
    .string()
    .min(3, "Ürün adı en az 3 karakter olmalıdır.")
    .max(120, "Ürün adı en fazla 120 karakter olabilir."),
  description: z
    .string()
    .min(10, "Açıklama en az 10 karakter olmalıdır.")
    .max(2000, "Açıklama en fazla 2000 karakter olabilir."),
  price: z.number().positive("Fiyat pozitif bir sayı olmalıdır."),
  discountPrice: z
    .number()
    .positive("İndirimli fiyat pozitif bir sayı olmalıdır.")
    .optional(),
  stock: z
    .number()
    .int("Stok adedi tam sayı olmalıdır.")
    .nonnegative("Stok adedi negatif olamaz."),
  category: z.string().min(1, "Kategori seçimi zorunludur."),
  images: z
    .array(z.string().url("Geçerli bir görsel URL'si giriniz."))
    .min(1, "En az 1 görsel URL'si girmelisiniz."),
  isFeatured: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
});

// Ortak fiyat kontrol fonksiyonu (exactOptionalPropertyTypes uyumlu tip tanımı)
const checkPrices = (
  data: { price?: number | undefined; discountPrice?: number | undefined },
  ctx: z.RefinementCtx,
) => {
  if (data.discountPrice !== undefined && data.price !== undefined) {
    if (data.discountPrice >= data.price) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "İndirimli fiyat normal fiyattan küçük olmalıdır.",
        path: ["discountPrice"],
      });
    }
  }
};

// 2. Oluşturma şeması
export const createProductSchema = baseProductSchema.superRefine(
  (data, ctx) => {
    checkPrices(data, ctx);
  },
);

// 3. Güncelleme şeması (Partial + Refinement)
export const updateProductSchema = baseProductSchema
  .partial()
  .superRefine((data, ctx) => {
    checkPrices(data, ctx);
  });

export const productQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10)),
  sort: z.string().optional(),
  category: z.string().optional(),
  minPrice: z
    .string()
    .optional()
    .transform((val) => (val ? parseFloat(val) : undefined)),
  maxPrice: z
    .string()
    .optional()
    .transform((val) => (val ? parseFloat(val) : undefined)),
  search: z.string().optional(),
  isFeatured: z
    .string()
    .optional()
    .transform((val) => val === "true"),
});

export const productIdParamSchema = z.object({
  id: z.string().regex(objectIdRegex, "Geçersiz Ürün ID formatı"),
});

//* DTO Tipleri
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ProductQueryInput = z.infer<typeof productQuerySchema>;
export type ProductIdParamInput = z.infer<typeof productIdParamSchema>;
