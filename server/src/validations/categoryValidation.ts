import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const createCategorySchema = z.object({
  name: z
    .string()
    .min(2, "Kategori adı en az 2 karakter olmalıdır.")
    .max(80, "Kategori adı en fazla 80 karakter olabilir."),
  description: z
    .string()
    .max(500, "Açıklama en fazla 500 karakter olabilir.")
    .optional(),
  image: z
    .string()
    .url("Geçerli bir görsel URL'si giriniz.")
    .optional()
    .or(z.literal("")),
  parent: z
    .string()
    .regex(objectIdRegex, "Geçersiz Üst Kategori ID formatı")
    .nullable()
    .optional(),
  isActive: z.boolean().optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

export const categoryIdParamSchema = z.object({
  id: z.string().regex(objectIdRegex, "Geçersiz Kategori ID formatı"),
});

export const categoryQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20)),
  search: z.string().optional(),
  parent: z.string().optional(),
  isActive: z
    .string()
    .optional()
    .transform((val) =>
      val === "true" ? true : val === "false" ? false : undefined,
    ),
});

//* DTO Tipleri
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CategoryIdParamInput = z.infer<typeof categoryIdParamSchema>;
export type CategoryQueryInput = z.infer<typeof categoryQuerySchema>;
