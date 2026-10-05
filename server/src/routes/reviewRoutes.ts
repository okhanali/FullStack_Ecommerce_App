import { Router } from "express";
import {
  createReview,
  getProductReviews,
  updateReview,
  deleteReview,
} from "../controllers/reviewController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router({ mergeParams: true });

//* Public Rotalar
router.get("/", getProductReviews);

//* Protected Rotalar
router.use(protect);

router.post("/", createReview);
router.route("/:id").patch(updateReview).delete(deleteReview);

export const reviewRouter = router;
