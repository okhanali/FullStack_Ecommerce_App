import type { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync.js";
import { Cart } from "../models/cartModel.js";
import { Product } from "../models/productModel.js";
import {
  NotFoundError,
  BadRequestError,
  UnAuthorizedError,
} from "../utils/AppError.js";
import type {
  AddToCartInput,
  UpdateCartItemInput,
} from "../validations/cartValidation.js";

//* Kullanıcının Sepetini Getir
export const getCart = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new UnAuthorizedError("Lütfen giriş yapın.");
  }
  const userId = req.user._id;

  let cart = await Cart.findOne({ user: userId }).populate(
    "items.product",
    "title description price discountPrice images stock slug category",
  );

  if (!cart) {
    cart = await Cart.create({ user: userId, items: [], totalPrice: 0 });
  }

  res.status(200).json({
    success: true,
    data: { cart },
  });
});

//* Sepete Ürün Ekle
export const addToCart = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new UnAuthorizedError("Lütfen giriş yapın.");
  }
  const userId = req.user._id;
  const { productId, quantity } = req.body as AddToCartInput;

  const product = await Product.findById(productId);
  if (!product || !product.isActive) {
    throw new NotFoundError("Ürün bulunamadı veya satışta değil.");
  }

  if (product.stock < quantity) {
    throw new BadRequestError(`Yetersiz stok. Mevcut stok: ${product.stock}`);
  }

  const effectivePrice = product.discountPrice ?? product.price;

  let cart = await Cart.findOne({ user: userId });

  if (!cart) {
    cart = new Cart({
      user: userId,
      items: [{ product: productId, quantity, price: effectivePrice }],
    });
  } else {
    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId,
    );

    if (itemIndex > -1) {
      const existingItem = cart.items[itemIndex];
      if (!existingItem) throw new BadRequestError("Sepet öğesi bulunamadı.");

      const newQuantity = existingItem.quantity + quantity;
      if (product.stock < newQuantity) {
        throw new BadRequestError(
          `Stok sınırını aşıyorsunuz. Toplam ekleyebileceğiniz miktar: ${product.stock}`,
        );
      }
      existingItem.quantity = newQuantity;
      existingItem.price = effectivePrice;
    } else {
      cart.items.push({ product: productId, quantity, price: effectivePrice });
    }
  }

  await cart.save();

  res.status(200).json({
    success: true,
    data: { cart },
  });
});

//* Sepetteki Ürün Miktarını Güncelle
export const updateCartItemQuantity = catchAsync(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new UnAuthorizedError("Lütfen giriş yapın.");
    }
    const userId = req.user._id;
    const productId = req.params.productId as string;
    const { quantity } = req.body as UpdateCartItemInput;

    const cart = await Cart.findOne({ user: userId });
    if (!cart) throw new NotFoundError("Sepet bulunamadı.");

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId,
    );

    if (itemIndex === -1) {
      throw new NotFoundError("Ürün sepette bulunamadı.");
    }

    if (quantity === 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      const product = await Product.findById(productId);
      if (!product || product.stock < quantity) {
        throw new BadRequestError("İstenen miktar için yetersiz stok.");
      }
      const targetItem = cart.items[itemIndex];
      if (targetItem) {
        targetItem.quantity = quantity;
        targetItem.price = product.discountPrice ?? product.price;
      }
    }

    await cart.save();

    res.status(200).json({
      success: true,
      data: { cart },
    });
  },
);

//* Sepetten Ürün Sil
export const removeFromCart = catchAsync(
  async (req: Request, res: Response) => {
    if (!req.user) {
      throw new UnAuthorizedError("Lütfen giriş yapın.");
    }
    const userId = req.user._id;
    const productId = req.params.productId as string;

    const cart = await Cart.findOne({ user: userId });
    if (!cart) throw new NotFoundError("Sepet bulunamadı.");

    cart.items = cart.items.filter(
      (item) => item.product.toString() !== productId,
    );

    await cart.save();

    res.status(200).json({
      success: true,
      data: { cart },
    });
  },
);

//* Sepeti Tamamen Temizle
export const clearCart = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new UnAuthorizedError("Lütfen giriş yapın.");
  }
  const userId = req.user._id;

  const cart = await Cart.findOne({ user: userId });
  if (cart) {
    cart.items = [];
    await cart.save();
  }

  res.status(200).json({
    success: true,
    message: "Sepet başarıyla temizlendi.",
    data: { cart },
  });
});
