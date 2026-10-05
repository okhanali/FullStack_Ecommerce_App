import { Router } from "express";
import {
  register,
  login,
  getMe,
  updateMe,
  updateAvatar,
  deleteMe,
  addAddress,
  deleteAddress,
  toggleWishlist,
  getWishlist,
  getAllUsers,
  getUserById,
  updateUserRole,
  deleteUser,
} from "../controllers/userControllers.js";
import { UserRole } from "../types/userTypes.js";
import { protect, restrictTo } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/uploadMiddleware.js";

const router = Router();

// ==========================================
// PUBLIC ROTALAR (Giriş & Kayıt)
// ==========================================
router.post("/register", register);
router.post("/login", login);

// ==========================================
// PROTECTED ROTALAR (Oturum Açmış Kullanıcı)
// ==========================================
router.use(protect);

router.get("/me", getMe);
router.patch("/update-me", updateMe);
router.patch("/avatar", upload.single("avatar"), updateAvatar);
router.delete("/delete-me", deleteMe);

// Adres Rotaları
router.post("/addresses", addAddress);
router.delete("/addresses/:addressId", deleteAddress);

// Wishlist Rotaları
router.get("/wishlist", getWishlist);
router.post("/wishlist/toggle/:productId", toggleWishlist);

// ==========================================
// ADMIN ROTALARI
// ==========================================
router.use(restrictTo(UserRole.ADMIN));

router.get("/", getAllUsers);
router.get("/:id", getUserById);
router.patch("/:id/role", updateUserRole);
router.delete("/:id", deleteUser);

export const userRoutes = router;
