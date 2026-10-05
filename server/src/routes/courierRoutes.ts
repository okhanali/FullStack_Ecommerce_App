import { Router } from "express";
import { protect, restrictTo } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validateMiddleware.js";
import { UserRole } from "../types/userTypes.js";
import { orderIdParamSchema } from "../validations/orderValidation.js";
import { courierOrderStatusSchema } from "../validations/courierValidation.js";
import {
  advanceDemoCourierLocation,
  getAssignedCourierOrders,
  updateCourierOrderStatus,
} from "../controllers/courierController.js";

const router = Router();

router.use(protect, restrictTo(UserRole.COURIER));
router.get("/orders", getAssignedCourierOrders);
router.patch(
  "/orders/:id/status",
  validate(orderIdParamSchema, "params"),
  validate(courierOrderStatusSchema, "body"),
  updateCourierOrderStatus,
);
router.post(
  "/orders/:id/simulate-location",
  validate(orderIdParamSchema, "params"),
  advanceDemoCourierLocation,
);

export const courierRouter = router;
