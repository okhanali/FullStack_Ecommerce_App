import { Router } from "express";
import {
  getVendorReviews,
  getVendorSales,
} from "../controllers/vendorController.js";
import { protect, restrictTo } from "../middleware/authMiddleware.js";
import { UserRole } from "../types/userTypes.js";

const router = Router();

router.use(protect, restrictTo(UserRole.SELLER, "vendor"));
router.get("/sales", getVendorSales);
router.get("/reviews", getVendorReviews);

export const vendorRouter = router;
