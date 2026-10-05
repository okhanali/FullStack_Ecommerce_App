import assert from "node:assert/strict";
import test from "node:test";
import {
  reserveInventory,
  restoreInventory,
  type InventoryGateway,
} from "../utils/inventory.js";
import { calculateOrderAmounts } from "../utils/orderPricing.js";
import { assertCouponUsable } from "../utils/couponRules.js";

class FakeInventory implements InventoryGateway {
  readonly stocks = new Map<string, number>();
  readonly active = new Set<string>();

  async updateOne(
    filter: Record<string, unknown>,
    update: { $inc: { stock: number } },
  ): Promise<{ modifiedCount: number }> {
    const id = String(filter._id);
    const current = this.stocks.get(id);
    if (current === undefined) return { modifiedCount: 0 };
    if (filter.isActive === true && !this.active.has(id)) {
      return { modifiedCount: 0 };
    }

    const stockFilter = filter.stock as { $gte?: number } | undefined;
    if (stockFilter?.$gte !== undefined && current < stockFilter.$gte) {
      return { modifiedCount: 0 };
    }

    this.stocks.set(id, current + update.$inc.stock);
    return { modifiedCount: 1 };
  }
}

test("order totals apply coupon before tax and free-shipping threshold", () => {
  assert.deepEqual(calculateOrderAmounts(1000), {
    itemsPrice: 1000,
    couponDiscount: 0,
    discountedItemsPrice: 1000,
    shippingPrice: 0,
    taxPrice: 200,
    totalPrice: 1200,
  });

  assert.deepEqual(calculateOrderAmounts(400, 10), {
    itemsPrice: 400,
    couponDiscount: 40,
    discountedItemsPrice: 360,
    shippingPrice: 49.9,
    taxPrice: 72,
    totalPrice: 481.9,
  });
});

test("invalid order discount percentages are rejected", () => {
  assert.throws(() => calculateOrderAmounts(100, 101), RangeError);
  assert.throws(() => calculateOrderAmounts(-1), RangeError);
});

test("a failed multi-item reservation compensates stock already reserved", async () => {
  const inventory = new FakeInventory();
  inventory.stocks.set("first", 5);
  inventory.stocks.set("second", 1);
  inventory.active.add("first");
  inventory.active.add("second");

  await assert.rejects(
    reserveInventory(
      [
        { productId: "first", quantity: 2, name: "İlk ürün" },
        { productId: "second", quantity: 2, name: "İkinci ürün" },
      ],
      inventory,
    ),
    /yeterli stok kalmadı/i,
  );

  assert.equal(inventory.stocks.get("first"), 5);
  assert.equal(inventory.stocks.get("second"), 1);
});

test("concurrent reservations cannot oversell the last unit", async () => {
  const inventory = new FakeInventory();
  inventory.stocks.set("last-unit", 1);
  inventory.active.add("last-unit");

  const attempts = await Promise.allSettled([
    reserveInventory([{ productId: "last-unit", quantity: 1 }], inventory),
    reserveInventory([{ productId: "last-unit", quantity: 1 }], inventory),
  ]);

  assert.equal(
    attempts.filter((attempt) => attempt.status === "fulfilled").length,
    1,
  );
  assert.equal(inventory.stocks.get("last-unit"), 0);
});

test("cancellation stock restoration returns every line quantity", async () => {
  const inventory = new FakeInventory();
  inventory.stocks.set("shirt", 3);
  inventory.stocks.set("bag", 8);

  await restoreInventory(
    [
      { productId: "shirt", quantity: 2 },
      { productId: "bag", quantity: 1 },
    ],
    inventory,
  );

  assert.equal(inventory.stocks.get("shirt"), 5);
  assert.equal(inventory.stocks.get("bag"), 9);
});

test("coupon rules reject expired, exhausted and below-minimum coupons", () => {
  const now = new Date("2026-09-26T12:00:00.000Z");
  const coupon = {
    isActive: true,
    startsAt: new Date("2026-09-01T00:00:00.000Z"),
    expiresAt: new Date("2026-10-01T00:00:00.000Z"),
    minimumOrderAmount: 500,
    maxUses: 2,
    usedCount: 1,
  };

  assert.doesNotThrow(() => assertCouponUsable(coupon, 500, now));
  assert.throws(
    () => assertCouponUsable({ ...coupon, expiresAt: now }, 500, now),
    /süresi dolmuş/i,
  );
  assert.throws(
    () => assertCouponUsable({ ...coupon, usedCount: 2 }, 500, now),
    /limiti dolmuş/i,
  );
  assert.throws(() => assertCouponUsable(coupon, 499, now), /en az 500/i);
});
