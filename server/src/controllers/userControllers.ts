import type { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync.js";
import { User } from "../models/userModel.js";
import {
  BadRequestError,
  NotFoundError,
  UnAuthorizedError,
} from "../utils/AppError.js";

import { uploadBufferToCloudinary } from "../utils/cloudinaryUpload.js";
import type {
  UpdateMeInput,
  UpdateUserRoleInput,
} from "../validations/userValidation.js";
import { generateToken } from "../utils/jwtUtils.js";

// ==========================================
// AUTH KONTROLCÜLERİ
// ==========================================

export const register = catchAsync(async (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new BadRequestError("Bu e-posta adresi zaten kullanımda.");
  }

  const user = await User.create({ name, email, password });
  const token = generateToken(user._id.toString(), user.role);

  res.status(201).json({
    success: true,
    message: "Kayıt işlemi başarılı.",
    data: {
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    },
  });
});

export const login = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new BadRequestError("Lütfen e-posta ve şifrenizi girin.");
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail }).select(
    "+password",
  );
  if (!user || !(await user.comparePassword(password))) {
    throw new UnAuthorizedError("Geçersiz e-posta veya şifre.");
  }

  const token = generateToken(user._id.toString(), user.role);

  res.status(200).json({
    success: true,
    message: "Giriş başarılı.",
    data: {
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    },
  });
});

// ==========================================
// KULLANICI PROFİL İŞLEMLERİ
// ==========================================

export const getMe = catchAsync(async (req: Request, res: Response) => {
  const user = await User.findById(req.user?._id).select("-__v");
  if (!user) throw new NotFoundError("Kullanıcı bulunamadı.");

  res.status(200).json({
    success: true,
    data: { user },
  });
});

export const updateMe = catchAsync(async (req: Request, res: Response) => {
  const body = req.body as UpdateMeInput;

  if ("password" in req.body || "role" in req.body) {
    throw new BadRequestError(
      "Bu endpoint üzerinden şifre veya rol güncellenemez.",
    );
  }

  const updatedUser = await User.findByIdAndUpdate(req.user?._id, body, {
    new: true,
    runValidators: true,
  });

  if (!updatedUser) throw new NotFoundError("Kullanıcı bulunamadı.");

  res.status(200).json({
    success: true,
    data: { user: updatedUser },
  });
});

export const updateAvatar = catchAsync(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new BadRequestError("Lütfen yüklenecek bir görsel seçin.");
  }

  const uploadResult = await uploadBufferToCloudinary(req.file.buffer, "users");

  const updatedUser = await User.findByIdAndUpdate(
    req.user?._id,
    { avatar: uploadResult.secure_url },
    { new: true, runValidators: true },
  );

  if (!updatedUser) throw new NotFoundError("Kullanıcı bulunamadı.");

  res.status(200).json({
    success: true,
    message: "Profil fotoğrafı başarıyla güncellendi.",
    data: { user: updatedUser },
  });
});

export const deleteMe = catchAsync(async (req: Request, res: Response) => {
  await User.findByIdAndDelete(req.user?._id);

  res.status(204).json({
    success: true,
    data: null,
  });
});

// ==========================================
// ADRES YÖNETİMİ (EMBEDDED)
// ==========================================

export const addAddress = catchAsync(async (req: Request, res: Response) => {
  const user = await User.findById(req.user?._id);
  if (!user) throw new NotFoundError("Kullanıcı bulunamadı.");

  if (req.body.isDefault) {
    user.addresses.forEach((addr) => (addr.isDefault = false));
  }

  user.addresses.push(req.body);
  await user.save();

  res.status(201).json({
    success: true,
    message: "Adres başarıyla eklendi.",
    data: { addresses: user.addresses },
  });
});

export const deleteAddress = catchAsync(async (req: Request, res: Response) => {
  const { addressId } = req.params;
  const user = await User.findById(req.user?._id);
  if (!user) throw new NotFoundError("Kullanıcı bulunamadı.");

  user.addresses = user.addresses.filter(
    (addr) => addr._id?.toString() !== addressId,
  );
  await user.save();

  res.status(200).json({
    success: true,
    message: "Adres silindi.",
    data: { addresses: user.addresses },
  });
});

// ==========================================
// WISHLIST (FAVORİLER) YÖNETİMİ
// ==========================================

export const toggleWishlist = catchAsync(
  async (req: Request, res: Response) => {
    const { productId } = req.params;
    const user = await User.findById(req.user?._id);
    if (!user) throw new NotFoundError("Kullanıcı bulunamadı.");

    const index = user.wishlist.indexOf(productId as any);

    if (index > -1) {
      user.wishlist.splice(index, 1);
    } else {
      user.wishlist.push(productId as any);
    }

    await user.save();

    res.status(200).json({
      success: true,
      data: { wishlist: user.wishlist },
    });
  },
);

export const getWishlist = catchAsync(async (req: Request, res: Response) => {
  const user = await User.findById(req.user?._id).populate("wishlist");
  if (!user) throw new NotFoundError("Kullanıcı bulunamadı.");

  res.status(200).json({
    success: true,
    data: { wishlist: user.wishlist },
  });
});

// ==========================================
// ADMIN KONTROLCÜLERİ
// ==========================================

export const getAllUsers = catchAsync(async (_req: Request, res: Response) => {
  const users = await User.find().select("-__v");

  res.status(200).json({
    success: true,
    results: users.length,
    data: { users },
  });
});

export const getUserById = catchAsync(async (req: Request, res: Response) => {
  const user = await User.findById(req.params.id).select("-__v");
  if (!user) throw new NotFoundError("Kullanıcı bulunamadı.");

  res.status(200).json({
    success: true,
    data: { user },
  });
});

export const updateUserRole = catchAsync(
  async (req: Request, res: Response) => {
    const { role } = req.body as UpdateUserRoleInput;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, runValidators: true },
    );

    if (!user) throw new NotFoundError("Kullanıcı bulunamadı.");

    res.status(200).json({
      success: true,
      data: { user },
    });
  },
);

export const deleteUser = catchAsync(async (req: Request, res: Response) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) throw new NotFoundError("Kullanıcı bulunamadı.");

  res.status(204).json({
    success: true,
    data: null,
  });
});
