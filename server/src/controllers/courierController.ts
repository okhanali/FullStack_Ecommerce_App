import type { Request, Response } from "express";
import { Order } from "../models/orderModel.js";
import {
  BadRequestError,
  NotFoundError,
  UnAuthorizedError,
} from "../utils/AppError.js";
import { catchAsync } from "../utils/catchAsync.js";
import { OrderStatus } from "../types/orderTypes.js";
import type { CourierOrderStatusInput } from "../validations/courierValidation.js";
import {
  getDemoDeliveryRoute,
  getRoutePosition,
} from "../utils/demoTracking.js";

export const getAssignedCourierOrders = catchAsync(
  async (req: Request, res: Response) => {
    if (!req.user) throw new UnAuthorizedError("Lütfen giriş yapın.");

    const orders = await Order.find({ courier: req.user._id })
      .populate("user", "name email")
      .sort("-createdAt");

    res.status(200).json({
      success: true,
      results: orders.length,
      data: { orders },
    });
  },
);

export const updateCourierOrderStatus = catchAsync(
  async (req: Request, res: Response) => {
    if (!req.user) throw new UnAuthorizedError("Lütfen giriş yapın.");

    const order = await Order.findOne({
      _id: req.params.id as string,
      courier: req.user._id,
    });
    if (!order) throw new NotFoundError("Kurye siparişi bulunamadı.");

    const { status } = req.body as CourierOrderStatusInput;
    if (status === OrderStatus.SHIPPED) {
      if (order.status !== OrderStatus.PROCESSING) {
        throw new BadRequestError(
          "Yalnızca hazırlanan sipariş yola çıkarılabilir.",
        );
      }
      const route = getDemoDeliveryRoute(order.shippingAddress.city);
      order.status = OrderStatus.SHIPPED;
      order.trackingProgress = 0;
      order.courierLocation = { ...route.start, updatedAt: new Date() };
      order.estimatedDeliveryAt = new Date(Date.now() + 35 * 60 * 1000);
      order.statusHistory.push({
        status: OrderStatus.SHIPPED,
        at: new Date(),
        note: "Kurye demo rotasında yola çıktı.",
      });
    } else {
      if (order.status !== OrderStatus.SHIPPED) {
        throw new BadRequestError("Önce sipariş yola çıkarılmalıdır.");
      }
      const route = getDemoDeliveryRoute(order.shippingAddress.city);
      order.status = OrderStatus.DELIVERED;
      order.trackingProgress = 1;
      order.courierLocation = {
        ...route.destination,
        updatedAt: new Date(),
      };
      order.estimatedDeliveryAt = new Date();
      order.isDelivered = true;
      order.deliveredAt = new Date();
      order.statusHistory.push({
        status: OrderStatus.DELIVERED,
        at: new Date(),
        note: "Demo teslimat tamamlandı.",
      });
    }

    await order.save();
    res.status(200).json({ success: true, data: { order } });
  },
);

export const advanceDemoCourierLocation = catchAsync(
  async (req: Request, res: Response) => {
    if (!req.user) throw new UnAuthorizedError("Lütfen giriş yapın.");

    const order = await Order.findOne({
      _id: req.params.id as string,
      courier: req.user._id,
    });
    if (!order) throw new NotFoundError("Kurye siparişi bulunamadı.");
    if (order.status !== OrderStatus.SHIPPED) {
      throw new BadRequestError(
        "Kurye yalnızca yoldaki sipariş için ilerletilebilir.",
      );
    }

    const route = getDemoDeliveryRoute(order.shippingAddress.city);
    const progress = Math.min((order.trackingProgress ?? 0) + 0.12, 1);
    order.trackingProgress = progress;
    order.courierLocation = {
      ...getRoutePosition(route.start, route.destination, progress),
      updatedAt: new Date(),
    };
    order.estimatedDeliveryAt = new Date(
      Date.now() + (1 - progress) * 35 * 60 * 1000,
    );

    if (progress >= 1) {
      order.status = OrderStatus.DELIVERED;
      order.isDelivered = true;
      order.deliveredAt = new Date();
      order.statusHistory.push({
        status: OrderStatus.DELIVERED,
        at: new Date(),
        note: "Demo teslimat tamamlandı.",
      });
    }

    await order.save();
    res.status(200).json({ success: true, data: { order } });
  },
);
