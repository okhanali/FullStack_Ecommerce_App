import { z } from "zod";
import { UserRole } from "../types/userTypes.js";

const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

export const updateMeSchema = z
  .object({
    name: z.string().min(2, "Ad en az 2 karakter olmalıdır").optional(),
    email: z.string().email("Geçerli bir email adresi giriniz.").optional(),
    avatar: z
      .string()
      .url("Geçerli bir görsel URL'si giriniz")
      .optional()
      .or(z.literal("")),
    storeInfo: z
      .object({
        storeName: z.string().trim().optional(),
        description: z.string().optional(),
        taxNumber: z.string().trim().optional(),
      })
      .optional(),
    courierInfo: z
      .object({
        vehicleType: z.enum(["bicycle", "motorcycle", "car"]).optional(),
        plateNumber: z.string().trim().optional(),
      })
      .optional(),
  })
  .refine((data) => Object.values(data).some((val) => val !== undefined), {
    message: "Güncellenecek en az bir alan belirtmelisiniz",
  });

export const updateUserRoleSchema = z.object({
  role: z.nativeEnum(UserRole, {
    message: "Atanacak geçerli bir rol seçmelisiniz",
  }),
});

export const idParamSchema = z.object({
  id: z.string().regex(OBJECT_ID_REGEX, "Geçersiz kullanıcı ID formatı"),
});

//* DTO Types
export type UpdateMeInput = z.infer<typeof updateMeSchema>;
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;
export type IdParamInput = z.infer<typeof idParamSchema>;
