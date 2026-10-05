import type { Request, Response } from "express";
import { Order } from "../models/orderModel.js";
import { Product } from "../models/productModel.js";
import { Review } from "../models/reviewModel.js";
import { ForbiddenError } from "../utils/AppError.js";
import { catchAsync } from "../utils/catchAsync.js";

export const getVendorSales = catchAsync(
  async (req: Request, res: Response) => {
    if (!req.user) throw new ForbiddenError("Satıcı oturumu gerekli.");

    const products = await Product.find({ seller: req.user._id }).select("_id");
    const productIds = products.map((product) => product._id);
    if (productIds.length === 0) {
      res.status(200).json({ success: true, results: 0, data: { sales: [] } });
      return;
    }

    const ownedProductIds = new Set(productIds.map((id) => id.toString()));
    const orders = await Order.find({
      "orderItems.product": { $in: productIds },
    })
      .populate("user", "name email")
      .sort("-createdAt")
      .lean();

    const sales = orders.map((order) => {
      const items = order.orderItems
        .filter((item) => ownedProductIds.has(item.product.toString()))
        .map((item) => ({
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.price,
          subtotal: item.price * item.quantity,
        }));

      return {
        orderId: order._id,
        buyer: order.user,
        createdAt: order.createdAt,
        status: order.status,
        items,
        subtotal: items.reduce((total, item) => total + item.subtotal, 0),
      };
    });

    res.status(200).json({
      success: true,
      results: sales.length,
      data: { sales },
    });
  },
);

export const getVendorReviews = catchAsync(
  async (req: Request, res: Response) => {
    if (!req.user) throw new ForbiddenError("Satıcı oturumu gerekli.");

    const products = await Product.find({ seller: req.user._id }).select("_id");
    const reviews = await Review.find({
      product: { $in: products.map((product) => product._id) },
    })
      .populate("user", "name")
      .populate("product", "title")
      .sort("-createdAt");

    res.status(200).json({
      success: true,
      results: reviews.length,
      data: { reviews },
    });
  },
);
