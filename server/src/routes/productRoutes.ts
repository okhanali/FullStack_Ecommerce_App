import { Router } from "express";
import {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} from "../controllers/productController.js";
import { protect, restrictTo } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validateMiddleware.js";

import {
  createProductSchema,
  updateProductSchema,
  productQuerySchema,
  productIdParamSchema,
} from "../validations/productValidation.js";
import { UserRole } from "../types/userTypes.js";
import { upload } from "../middleware/uploadMiddleware.js";

const router = Router();

//* Public Rotalar
router.get("/", validate(productQuerySchema, "query"), getAllProducts);
router.get("/:id", getProductById);

//* Korumalı Rotalar (Satıcı ve Admin)
router.use(protect);

router.post(
  "/",
  restrictTo(UserRole.SELLER, UserRole.ADMIN),
  upload.array("images", 5), // En fazla 5 görsel yükleme desteği
  validate(createProductSchema, "body"),
  createProduct,
);

router
  .route("/:id")
  .patch(
    restrictTo(UserRole.SELLER, UserRole.ADMIN),
    upload.array("images", 5), // Güncellemede de görsel eklenebilsin istersen
    validate(productIdParamSchema, "params"),
    validate(updateProductSchema, "body"),
    updateProduct,
  )
  .delete(
    restrictTo(UserRole.SELLER, UserRole.ADMIN),
    validate(productIdParamSchema, "params"),
    deleteProduct,
  );

export default router;
