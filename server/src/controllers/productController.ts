import type { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync.js";
import { Product } from "../models/productModel.js";
import { NotFoundError, ForbiddenError } from "../utils/AppError.js";
import { UserRole } from "../types/userTypes.js";
import { APIFeatures } from "../utils/ApiFeatures.js";
import type {
  CreateProductInput,
  UpdateProductInput,
} from "../validations/productValidation.js";
import { uploadBufferToCloudinary } from "../utils/cloudinaryUpload.js";

//* Yeni Ürün Oluştur
export const createProduct = catchAsync(async (req: Request, res: Response) => {
  const body = req.body as CreateProductInput;
  let imageUrls: string[] = [];

  // Eğer Multer üzerinden dosyalar geldiyse Cloudinary'ye yükle
  if (req.files && Array.isArray(req.files) && req.files.length > 0) {
    const uploadPromises = req.files.map((file) =>
      uploadBufferToCloudinary(file.buffer, "products"),
    );
    const uploadResults = await Promise.all(uploadPromises);
    imageUrls = uploadResults.map((result) => result.secure_url);
  }

  const cleanBody = Object.fromEntries(
    Object.entries(body).filter(([_, v]) => v !== undefined),
  );

  const product = await Product.create({
    ...cleanBody,
    images: imageUrls.length > 0 ? imageUrls : body.images || [],
    seller: req.user!._id,
  });

  res.status(201).json({
    success: true,
    data: { product },
  });
});

//* Tüm Ürünleri Getir (APIFeatures ile Filtreleme, Arama, Sıralama, Sayfalama)
export const getAllProducts = catchAsync(
  async (req: Request, res: Response) => {
    // Toplam aktif ürün sayısı (sayfalama meta verisi için)
    const total = await Product.countDocuments({ isActive: true });

    // APIFeatures sınıfı ile sorguyu zincirleme yönetme
    const features = new APIFeatures(
      Product.find({ isActive: true }),
      req.query,
    )
      .search()
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const products = await features.query.populate(
      "seller",
      "name email storeInfo",
    );

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Number(req.query.limit) || 10);

    res.status(200).json({
      success: true,
      results: products.length,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
      },
      data: { products },
    });
  },
);

//* ID veya Slug ile Tek Ürün Getir
export const getProductById = catchAsync(
  async (req: Request, res: Response) => {
    const id = req.params.id as string;

    if (!id) {
      throw new NotFoundError("Ürün ID veya Slug bilgisi bulunamadı.");
    }

    const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
    const query = isObjectId ? { _id: id } : { slug: id };

    const product = await Product.findOne(query).populate(
      "seller",
      "name email storeInfo",
    );

    if (!product) {
      throw new NotFoundError("Ürün bulunamadı.");
    }

    res.status(200).json({
      success: true,
      data: { product },
    });
  },
);

//* Ürün Güncelle (Sadece Satıcı Sahibi veya Admin)
export const updateProduct = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const body = req.body as UpdateProductInput;

  const product = await Product.findById(id);

  if (!product) {
    throw new NotFoundError("Ürün bulunamadı.");
  }

  // Sahiplik Kontrolü (RBAC & ABAC)
  const isOwner = product.seller.toString() === req.user!._id.toString();
  const isAdmin = req.user!.role === UserRole.ADMIN;

  if (!isOwner && !isAdmin) {
    throw new ForbiddenError("Bu ürünü güncelleme yetkiniz bulunmuyor.");
  }

  // undefined değerleri süzerek Mongoose dokümanına aktar
  Object.entries(body).forEach(([key, value]) => {
    if (value !== undefined) {
      (product as unknown as Record<string, unknown>)[key] = value;
    }
  });

  await product.save();

  res.status(200).json({
    success: true,
    data: { product },
  });
});

//* Ürün Sil (Sadece Satıcı Sahibi veya Admin)
export const deleteProduct = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const product = await Product.findById(id);

  if (!product) {
    throw new NotFoundError("Ürün bulunamadı.");
  }

  const isOwner = product.seller.toString() === req.user!._id.toString();
  const isAdmin = req.user!.role === UserRole.ADMIN;

  if (!isOwner && !isAdmin) {
    throw new ForbiddenError("Bu ürünü silme yetkiniz bulunmuyor.");
  }

  await product.deleteOne();

  res.status(204).json({
    success: true,
    data: null,
  });
});
