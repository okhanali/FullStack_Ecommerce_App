import type { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync.js";
import { Review } from "../models/reviewModel.js";
import { Order } from "../models/orderModel.js";
import { Product } from "../models/productModel.js";
import {
  NotFoundError,
  BadRequestError,
  ForbiddenError,
  UnAuthorizedError,
} from "../utils/AppError.js";
import { UserRole } from "../types/userTypes.js";
import { OrderStatus } from "../types/orderTypes.js";
import type {
  CreateReviewInput,
  UpdateReviewInput,
} from "../types/reviewTypes.js";

//* Yeni Yorum Ekle (Sadece ürünü satın alıp teslim alan kullanıcılar)
export const createReview = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new UnAuthorizedError("Lütfen giriş yapın.");
  }

  const productId = (req.params.productId || req.body.product) as string;
  const userId = req.user._id;

  if (!productId) {
    throw new BadRequestError("Yorum yapılacak ürün ID'si belirtilmelidir.");
  }

  // 1. Ürün var mı kontrol et
  const product = await Product.findById(productId);
  if (!product) {
    throw new NotFoundError("Ürün bulunamadı.");
  }

  // 2. Kullanıcı ürünü satın alıp teslim aldı mı kontrol et
  const hasPurchasedAndDelivered = await Order.findOne({
    user: userId,
    status: OrderStatus.DELIVERED,
    "orderItems.product": productId,
  });

  if (!hasPurchasedAndDelivered) {
    throw new ForbiddenError(
      "Yalnızca ürünü satın alıp teslim almış olan kullanıcılar yorum yapabilir.",
    );
  }

  // 3. Daha önce yorum yapılmış mı kontrol et (DB kuralına ek olarak erken uyarı)
  const existingReview = await Review.findOne({
    product: productId,
    user: userId,
  });

  if (existingReview) {
    throw new BadRequestError("Bu ürüne zaten bir değerlendirme yaptınız.");
  }

  const { rating, comment } = req.body as CreateReviewInput;

  const review = await Review.create({
    product: productId,
    user: userId,
    rating,
    comment,
  });

  res.status(201).json({
    success: true,
    data: { review },
  });
});

//* Bir Ürüne Ait Yorumları Getir
export const getProductReviews = catchAsync(
  async (req: Request, res: Response) => {
    const productId = (req.params.productId || req.query.productId) as string;

    if (!productId) {
      throw new BadRequestError("Ürün ID'si gereklidir.");
    }

    const reviews = await Review.find({ product: productId })
      .populate("user", "name avatar")
      .sort("-createdAt");

    res.status(200).json({
      success: true,
      results: reviews.length,
      data: { reviews },
    });
  },
);

//* Yorum Güncelle (Sadece yorum sahibi)
export const updateReview = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new UnAuthorizedError("Lütfen giriş yapın.");
  }

  const { id } = req.params;
  const { rating, comment } = req.body as UpdateReviewInput;

  const review = await Review.findById(id);

  if (!review) {
    throw new NotFoundError("Yorum bulunamadı.");
  }

  if (review.user.toString() !== req.user._id.toString()) {
    throw new ForbiddenError("Bu yorumu güncelleme yetkiniz yok.");
  }

  if (rating !== undefined) review.rating = rating;
  if (comment !== undefined) review.comment = comment;

  await review.save();

  res.status(200).json({
    success: true,
    data: { review },
  });
});

//* Yorum Sil (Yorum sahibi veya Admin)
export const deleteReview = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new UnAuthorizedError("Lütfen giriş yapın.");
  }

  const { id } = req.params;
  const review = await Review.findById(id);

  if (!review) {
    throw new NotFoundError("Yorum bulunamadı.");
  }

  if (
    review.user.toString() !== req.user._id.toString() &&
    req.user.role !== UserRole.ADMIN
  ) {
    throw new ForbiddenError("Bu yorumu silme yetkiniz yok.");
  }

  await review.deleteOne();

  res.status(200).json({
    success: true,
    data: null,
  });
});
