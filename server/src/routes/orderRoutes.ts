import { Router } from "express";
import {
  createOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  cancelMyOrder,
} from "../controllers/orderController.js";
import { protect, restrictTo } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validateMiddleware.js";
import {
  createOrderSchema,
  updateOrderStatusSchema,
  orderIdParamSchema,
} from "../validations/orderValidation.js";
import { UserRole } from "../types/userTypes.js";

const router = Router();

router.use(protect);

router.post("/", validate(createOrderSchema, "body"), createOrder);
router.get("/my-orders", getMyOrders);
router.patch(
  "/:id/cancel",
  validate(orderIdParamSchema, "params"),
  cancelMyOrder,
);
router.get("/:id", validate(orderIdParamSchema, "params"), getOrderById);

//* Admin Rotaları
router.use(restrictTo(UserRole.ADMIN));

router.get("/", getAllOrders);
router.patch(
  "/:id/status",
  validate(orderIdParamSchema, "params"),
  validate(updateOrderStatusSchema, "body"),
  updateOrderStatus,
);

export default router;
