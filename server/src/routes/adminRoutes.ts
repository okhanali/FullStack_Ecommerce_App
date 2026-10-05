import { Router } from "express";
import { getDashboardAnalytics } from "../controllers/analyticsController.js";
import { assignCourierToOrder } from "../controllers/orderController.js"; // <-- Ekledik
import { UserRole } from "../types/userTypes.js";
import { protect, restrictTo } from "../middleware/authMiddleware.js";
import { validate } from "../middleware/validateMiddleware.js";
import { orderIdParamSchema } from "../validations/orderValidation.js"; // Veya ID validasyonun nerede ise

const router = Router();

router.use(protect, restrictTo(UserRole.ADMIN));

router.get("/analytics/summary", getDashboardAnalytics);

// Yeni Eklenen Kurye Atama Rotosu
router.patch(
  "/orders/:id/assign-courier",
  validate(orderIdParamSchema, "params"), // İsteğe bağlı Zod validasyonu
  assignCourierToOrder,
);

export const adminRouter = router;
