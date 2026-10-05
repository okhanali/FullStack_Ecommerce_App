import { Router } from "express";
import {
  getCart,
  addToCart,
  updateCartItemQuantity,
  removeFromCart,
  clearCart,
} from "../controllers/cartController.js";
import { protect } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validateMiddleware.js";
import {
  addToCartSchema,
  updateCartItemSchema,
} from "../validations/cartValidation.js";

const router = Router();

//* Tüm Sepet Rotaları Kimlik Doğrulaması Gerektirir
router.use(protect);

router
  .route("/")
  .get(getCart)
  .post(validate(addToCartSchema, "body"), addToCart)
  .delete(clearCart);

router
  .route("/items/:productId")
  .patch(validate(updateCartItemSchema, "body"), updateCartItemQuantity)
  .delete(removeFromCart);

export default router;
