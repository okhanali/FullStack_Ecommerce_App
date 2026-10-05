import type { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync.js";
import { Category } from "../models/categoryModel.js";
import {
  NotFoundError,
  BadRequestError,
  ConflictError,
} from "../utils/AppError.js";
import type {
  CreateCategoryInput,
  UpdateCategoryInput,
  CategoryQueryInput,
} from "../validations/categoryValidation.js";

//* Yeni Kategori Oluştur (Yalnızca Admin)
export const createCategory = catchAsync(
  async (req: Request, res: Response) => {
    const body = req.body as CreateCategoryInput;

    const existingCategory = await Category.findOne({ name: body.name });
    if (existingCategory) {
      throw new ConflictError("Bu kategori adı zaten kullanılmaktadır.");
    }

    if (body.parent) {
      const parentExists = await Category.findById(body.parent);
      if (!parentExists) {
        throw new NotFoundError("Belirtilen üst kategori bulunamadı.");
      }
    }

    const cleanBody = Object.fromEntries(
      Object.entries(body).filter(([_, v]) => v !== undefined),
    );

    const category = await Category.create(cleanBody);

    res.status(201).json({
      success: true,
      data: { category },
    });
  },
);

//* Tüm Kategorileri Getir (Filtreleme, Arama, Sayfalama)
export const getAllCategories = catchAsync(
  async (req: Request, res: Response) => {
    const queryParams = req.query as unknown as CategoryQueryInput;
    const page = Number(queryParams.page) || 1;
    const limit = Number(queryParams.limit) || 20;
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};

    if (queryParams.isActive !== undefined) {
      filter.isActive = queryParams.isActive;
    }

    if (queryParams.parent !== undefined) {
      filter.parent = queryParams.parent === "null" ? null : queryParams.parent;
    }

    if (queryParams.search) {
      filter.name = { $regex: queryParams.search, $options: "i" };
    }

    const [categories, total] = await Promise.all([
      Category.find(filter)
        .sort("name")
        .skip(skip)
        .limit(limit)
        .populate("parent", "name slug"),
      Category.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      results: categories.length,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit,
      },
      data: { categories },
    });
  },
);

//* ID veya Slug ile Tek Kategori Getir
export const getCategoryById = catchAsync(
  async (req: Request, res: Response) => {
    const id = req.params.id as string;

    if (!id) {
      throw new NotFoundError("Kategori ID veya Slug bilgisi bulunamadı.");
    }

    const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);
    const query = isObjectId ? { _id: id } : { slug: id };

    const category = await Category.findOne(query).populate(
      "parent",
      "name slug",
    );

    if (!category) {
      throw new NotFoundError("Kategori bulunamadı.");
    }

    res.status(200).json({
      success: true,
      data: { category },
    });
  },
);

//* Kategori Güncelle (Yalnızca Admin)
export const updateCategory = catchAsync(
  async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const body = req.body as UpdateCategoryInput;

    const category = await Category.findById(id);

    if (!category) {
      throw new NotFoundError("Kategori bulunamadı.");
    }

    // Döngüsel referans engelleme
    if (body.parent && body.parent === id) {
      throw new BadRequestError(
        "Bir kategori kendisinin üst kategorisi olamaz.",
      );
    }

    if (body.parent) {
      const parentExists = await Category.findById(body.parent);
      if (!parentExists) {
        throw new NotFoundError("Belirtilen üst kategori bulunamadı.");
      }
    }

    Object.entries(body).forEach(([key, value]) => {
      if (value !== undefined) {
        (category as unknown as Record<string, unknown>)[key] = value;
      }
    });

    await category.save();

    res.status(200).json({
      success: true,
      data: { category },
    });
  },
);

//* Kategori Sil (Yalnızca Admin)
export const deleteCategory = catchAsync(
  async (req: Request, res: Response) => {
    const id = req.params.id as string;

    const category = await Category.findById(id);

    if (!category) {
      throw new NotFoundError("Kategori bulunamadı.");
    }

    // Alt kategori varlığı kontrolü
    const subCategoriesCount = await Category.countDocuments({ parent: id });
    if (subCategoriesCount > 0) {
      throw new BadRequestError(
        "Bu kategoriye bağlı alt kategoriler bulunmaktadır. Önce alt kategorileri silmeli veya taşımalısınız.",
      );
    }

    await category.deleteOne();

    res.status(204).json({
      success: true,
      data: null,
    });
  },
);
