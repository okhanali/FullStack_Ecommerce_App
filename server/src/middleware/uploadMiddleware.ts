import multer from "multer";
import { BadRequestError } from "../utils/AppError.js";

// Dosyaları sunucu diskine kaydetmeden RAM'de (Memory Storage) tutuyoruz
const storage = multer.memoryStorage();

// Sadece resim dosyalarına izin veren filtre
const fileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(
      new BadRequestError(
        "Yalnızca resim dosyaları yüklenebilir (JPEG, PNG, WebP vb.).",
      ) as unknown as null,
      false,
    );
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // Maksimum 5MB
  },
});
