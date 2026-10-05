import { Router } from "express";
import { validateCoupon } from "../controllers/couponController.js";
import { protect } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validateMiddleware.js";
import { validateCouponSchema } from "../validations/couponValidation.js";

const router = Router();
router.use(protect);
router.post(
  "/validate",
  validate(validateCouponSchema, "body"),
  validateCoupon,
);

export const couponRouter = router;
