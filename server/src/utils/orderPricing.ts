export interface OrderAmounts {
  itemsPrice: number;
  couponDiscount: number;
  discountedItemsPrice: number;
  shippingPrice: number;
  taxPrice: number;
  totalPrice: number;
}

export const calculateOrderAmounts = (
  itemsPrice: number,
  discountPercentage = 0,
): OrderAmounts => {
  if (!Number.isFinite(itemsPrice) || itemsPrice < 0) {
    throw new RangeError("Ürün toplamı negatif olmayan bir sayı olmalıdır.");
  }
  if (
    !Number.isFinite(discountPercentage) ||
    discountPercentage < 0 ||
    discountPercentage > 100
  ) {
    throw new RangeError("İndirim oranı 0 ile 100 arasında olmalıdır.");
  }

  const couponDiscount = Number(
    ((itemsPrice * discountPercentage) / 100).toFixed(2),
  );
  const discountedItemsPrice = Number((itemsPrice - couponDiscount).toFixed(2));
  const shippingPrice = discountedItemsPrice > 500 ? 0 : 49.9;
  const taxPrice = Number((discountedItemsPrice * 0.2).toFixed(2));

  return {
    itemsPrice,
    couponDiscount,
    discountedItemsPrice,
    shippingPrice,
    taxPrice,
    totalPrice: Number(
      (discountedItemsPrice + shippingPrice + taxPrice).toFixed(2),
    ),
  };
};
