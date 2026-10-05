import { Router } from "express";
import {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} from "../controllers/categoryController.js";
import { protect, restrictTo } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validateMiddleware.js";
import {
  createCategorySchema,
  updateCategorySchema,
  categoryQuerySchema,
  categoryIdParamSchema,
} from "../validations/categoryValidation.js";
import { UserRole } from "../types/userTypes.js";

const router = Router();

//* Public Rotalar
router.get("/", validate(categoryQuerySchema, "query"), getAllCategories);
router.get("/:id", getCategoryById);

//* Korumalı Rotalar (Yalnızca Admin)
router.use(protect, restrictTo(UserRole.ADMIN));

router.post("/", validate(createCategorySchema, "body"), createCategory);

router
  .route("/:id")
  .patch(
    validate(categoryIdParamSchema, "params"),
    validate(updateCategorySchema, "body"),
    updateCategory,
  )
  .delete(validate(categoryIdParamSchema, "params"), deleteCategory);

export default router;
