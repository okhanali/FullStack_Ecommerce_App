import type { Request, Response } from "express";
import { Order } from "../models/orderModel.js";
import { Product } from "../models/productModel.js";
import { User } from "../models/userModel.js";
import { catchAsync } from "../utils/catchAsync.js";

export const getDashboardAnalytics = catchAsync(
  async (_req: Request, res: Response) => {
    const [totalUsers, totalProducts, totalOrders, revenueResult] =
      await Promise.all([
        User.countDocuments(),
        Product.countDocuments({ isActive: true }),
        Order.countDocuments(),
        Order.aggregate([
          { $match: { isPaid: true } },
          { $group: { _id: null, totalRevenue: { $sum: "$totalPrice" } } },
        ]),
      ]);

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalProducts,
        totalOrders,
        totalRevenue: revenueResult[0]?.totalRevenue ?? 0,
      },
    });
  },
);
