import type { Request, Response } from "express";
import { catchAsync } from "../utils/catchAsync.js";
import { Order, type IOrderDocument } from "../models/orderModel.js";
import { Cart } from "../models/cartModel.js";
import { Product } from "../models/productModel.js";
import { User } from "../models/userModel.js";
import {
  NotFoundError,
  BadRequestError,
  ForbiddenError,
  UnAuthorizedError,
} from "../utils/AppError.js";
import { OrderStatus, type IOrderItem } from "../types/orderTypes.js";
import { UserRole, type IUser } from "../types/userTypes.js";
import type {
  CreateOrderInput,
  UpdateOrderStatusInput,
} from "../validations/orderValidation.js";
import { getDemoDeliveryRoute } from "../utils/demoTracking.js";
import {
  findUsableCoupon,
  releaseCouponCodeUse,
  reserveCouponUse,
} from "../utils/couponRules.js";
import { calculateOrderAmounts } from "../utils/orderPricing.js";
import { reserveInventory, restoreInventory } from "../utils/inventory.js";
import type { InventoryGateway } from "../utils/inventory.js";

const productInventory: InventoryGateway = {
  updateOne: (filter, update) => Product.updateOne(filter as never, update),
};

const cancelOrderAndRestore = async (order: IOrderDocument) => {
  if ([OrderStatus.CANCELLED, OrderStatus.DELIVERED].includes(order.status)) {
    throw new BadRequestError("Bu sipariş artık iptal edilemez.");
  }

  const cancelledAt = new Date();
  const transition = await Order.updateOne(
    { _id: order._id, status: order.status },
    {
      $set: {
        status: OrderStatus.CANCELLED,
        isPaid: false,
        "paymentResult.status": "SIMULATED_REFUNDED",
        "paymentResult.updateTime": cancelledAt.toISOString(),
      },
      $unset: { estimatedDeliveryAt: 1 },
      $push: {
        statusHistory: {
          status: OrderStatus.CANCELLED,
          at: cancelledAt,
          note: "Demo sipariş iptal edildi; stoklar iade edildi.",
        },
      },
    },
  );
  if (transition.modifiedCount !== 1) {
    throw new BadRequestError(
      "Sipariş durumu eşzamanlı değişti; tekrar deneyin.",
    );
  }

  await restoreInventory(
    order.orderItems.map((item) => ({
      productId: item.product,
      quantity: item.quantity,
    })),
    productInventory,
  );
  if (order.couponCode) await releaseCouponCodeUse(order.couponCode);

  return Order.findById(order._id);
};

//* Sepetten Yeni Sipariş Oluştur
export const createOrder = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new UnAuthorizedError("Lütfen giriş yapın.");
  }
  const userId = req.user._id;
  const { shippingAddress, paymentMethod, couponCode } =
    req.body as CreateOrderInput;

  const cart = await Cart.findOne({ user: userId });
  if (!cart || cart.items.length === 0) {
    throw new BadRequestError(
      "Sipariş oluşturmak için sepetinizde ürün bulunmalıdır.",
    );
  }

  const orderItems: IOrderItem[] = [];
  let itemsPrice = 0;

  // Stok Kontrolü ve Sipariş Kalemlerinin Hazırlanması
  for (const item of cart.items) {
    const product = await Product.findById(item.product);

    if (!product || !product.isActive) {
      throw new BadRequestError(
        `Ürün (${item.product.toString()}) artık mevcut değil veya satışta değil.`,
      );
    }

    orderItems.push({
      product: product._id,
      name: product.title || "İsimsiz Ürün",
      image: product.images?.[0] || "",
      price: product.discountPrice ?? product.price,
      quantity: item.quantity,
    });

    itemsPrice += (product.discountPrice ?? product.price) * item.quantity;
  }

  let couponId: string | undefined;
  let couponDiscountRate = 0;
  if (couponCode) {
    const coupon = await findUsableCoupon(couponCode, itemsPrice);
    await reserveCouponUse(coupon);
    couponId = coupon._id.toString();
    couponDiscountRate = coupon.discountPercentage;
  }

  const amounts = calculateOrderAmounts(itemsPrice, couponDiscountRate);
  const courier = await User.findOne({ role: UserRole.COURIER });
  const deliveryRoute = getDemoDeliveryRoute(shippingAddress.city);
  const paymentTime = new Date();
  const initialStatus = courier ? OrderStatus.PROCESSING : OrderStatus.PENDING;

  try {
    await reserveInventory(
      orderItems.map((item) => ({
        productId: item.product,
        quantity: item.quantity,
        name: item.name,
      })),
      productInventory,
    );
  } catch (error) {
    if (couponCode) await releaseCouponCodeUse(couponCode);
    throw error;
  }

  // Sipariş oluşturma hatasında ayrılan stokları geri bırak.
  let order;
  try {
    order = await Order.create({
      user: userId,
      orderItems,
      shippingAddress,
      paymentMethod,
      ...(couponId && couponCode ? { coupon: couponId, couponCode } : {}),
      couponDiscount: amounts.couponDiscount,
      paymentResult: {
        id: `DEMO-${paymentTime.getTime()}`,
        status: "SIMULATED_APPROVED",
        updateTime: paymentTime.toISOString(),
      },
      isPaid: true,
      paidAt: paymentTime,
      status: initialStatus,
      statusHistory: [
        {
          status: initialStatus,
          at: paymentTime,
          note: "Demo ödeme onaylandı; sipariş kaydedildi.",
        },
      ],
      ...(courier && {
        courier: courier._id,
        courierLocation: { ...deliveryRoute.start, updatedAt: paymentTime },
        estimatedDeliveryAt: new Date(paymentTime.getTime() + 35 * 60 * 1000),
      }),
      trackingProgress: 0,
      itemsPrice: amounts.discountedItemsPrice,
      taxPrice: amounts.taxPrice,
      shippingPrice: amounts.shippingPrice,
      totalPrice: amounts.totalPrice,
    });
  } catch (error) {
    await restoreInventory(
      orderItems.map((item) => ({
        productId: item.product,
        quantity: item.quantity,
      })),
      productInventory,
    );
    if (couponCode) await releaseCouponCodeUse(couponCode);
    throw error;
  }

  // Sepeti Temizleme
  cart.items = [];
  await cart.save();

  res.status(201).json({
    success: true,
    data: { order },
  });
});

//* Giriş Yapan Kullanıcının Siparişlerini Getir
export const getMyOrders = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new UnAuthorizedError("Lütfen giriş yapın.");
  }
  const orders = await Order.find({ user: req.user._id }).sort("-createdAt");

  res.status(200).json({
    success: true,
    results: orders.length,
    data: { orders },
  });
});

export const cancelMyOrder = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) throw new UnAuthorizedError("Lütfen giriş yapın.");

  const order = await Order.findOne({
    _id: req.params.id as string,
    user: req.user._id,
  });
  if (!order) throw new NotFoundError("Sipariş bulunamadı.");
  if (
    order.status !== OrderStatus.PENDING &&
    order.status !== OrderStatus.PROCESSING
  ) {
    throw new BadRequestError(
      "Sipariş yola çıktıktan sonra müşteri tarafından iptal edilemez.",
    );
  }

  const cancelledOrder = await cancelOrderAndRestore(order);
  res.status(200).json({ success: true, data: { order: cancelledOrder } });
});

//* ID ile Sipariş Detayı Getir
export const getOrderById = catchAsync(async (req: Request, res: Response) => {
  if (!req.user) {
    throw new UnAuthorizedError("Lütfen giriş yapın.");
  }
  const id = req.params.id as string;
  const order = await Order.findById(id)
    .populate("user", "name email")
    .populate("courier", "name");

  if (!order) {
    throw new NotFoundError("Sipariş bulunamadı.");
  }

  // Populated user tipini güvenli şekilde çözümlüyoruz
  const populatedUser = order.user as unknown as IUser;
  const orderUserId = populatedUser._id
    ? populatedUser._id.toString()
    : order.user.toString();

  // Yetki Kontrolü (Sadece sipariş sahibi veya Admin görebilir)
  if (
    orderUserId !== req.user._id.toString() &&
    req.user.role !== UserRole.ADMIN
  ) {
    throw new ForbiddenError("Bu siparişi görüntüleme yetkiniz yok.");
  }

  res.status(200).json({
    success: true,
    data: { order },
  });
});

//* Tüm Siparişleri Getir (Admin)
export const getAllOrders = catchAsync(async (req: Request, res: Response) => {
  const orders = await Order.find()
    .populate("user", "id name email")
    .sort("-createdAt");

  res.status(200).json({
    success: true,
    results: orders.length,
    data: { orders },
  });
});

//* Sipariş Durumunu Güncelle (Admin)
export const updateOrderStatus = catchAsync(
  async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const { status } = req.body as UpdateOrderStatusInput;

    const order = await Order.findById(id);
    if (!order) {
      throw new NotFoundError("Sipariş bulunamadı.");
    }

    if (order.status === OrderStatus.DELIVERED) {
      throw new BadRequestError("Teslim edilmiş bir sipariş güncellenemez.");
    }

    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestError(
        "İptal edilmiş bir sipariş tekrar değiştirilemez.",
      );
    }

    if (status === OrderStatus.CANCELLED) {
      const cancelledOrder = await cancelOrderAndRestore(order);
      res.status(200).json({ success: true, data: { order: cancelledOrder } });
      return;
    }

    order.status = status;
    order.statusHistory.push({
      status,
      at: new Date(),
      note:
        status === OrderStatus.DELIVERED
          ? "Sipariş admin tarafından teslim edildi olarak işaretlendi."
          : "Sipariş durumu admin tarafından güncellendi.",
    });

    if (status === OrderStatus.DELIVERED) {
      order.isDelivered = true;
      order.deliveredAt = new Date();
    }

    await order.save();

    res.status(200).json({
      success: true,
      data: { order },
    });
  },
);

// Admin veya sistem tarafından kurye atama
export const assignCourierToOrder = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params; // Order ID
    const { courierId } = req.body as { courierId?: string };

    if (!courierId) {
      throw new BadRequestError("Kurye seçilmelidir.");
    }

    const courier = await User.findOne({
      _id: courierId,
      role: UserRole.COURIER,
    });
    if (!courier) {
      throw new BadRequestError(
        "Seçilen kullanıcı kurye olarak kayıtlı değil.",
      );
    }

    const order = await Order.findById(id);
    if (!order) {
      throw new NotFoundError("Sipariş bulunamadı.");
    }
    if ([OrderStatus.CANCELLED, OrderStatus.DELIVERED].includes(order.status)) {
      throw new BadRequestError(
        "Tamamlanmış veya iptal edilmiş siparişe kurye atanamaz.",
      );
    }

    order.courier = courierId;
    const route = getDemoDeliveryRoute(order.shippingAddress.city);
    order.courierLocation = { ...route.start, updatedAt: new Date() };
    order.estimatedDeliveryAt = new Date(Date.now() + 35 * 60 * 1000);
    order.trackingProgress = 0;
    order.status = OrderStatus.PROCESSING;
    order.statusHistory.push({
      status: OrderStatus.PROCESSING,
      at: new Date(),
      note: "Kurye siparişe atandı.",
    });
    await order.save();

    res.status(200).json({
      success: true,
      message: "Siparişe kurye başarıyla atandı.",
      data: { order },
    });
  },
);
