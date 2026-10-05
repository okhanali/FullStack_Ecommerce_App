import mongoose from "mongoose";
import dotenv from "dotenv";
import { Coupon } from "../dist/models/couponModel.js";

dotenv.config();

const demoCoupons = [
  {
    code: "WELCOME10",
    discountPercentage: 10,
    minimumOrderAmount: 0,
    maxUses: 1000,
  },
  {
    code: "DEMO15",
    discountPercentage: 15,
    minimumOrderAmount: 1000,
    maxUses: 250,
  },
];

try {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Demo kuponları production ortamına eklenemez.");
  }
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI tanımlı değil.");
  await mongoose.connect(process.env.MONGO_URI);

  const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
  let created = 0;
  for (const coupon of demoCoupons) {
    const result = await Coupon.updateOne(
      { code: coupon.code },
      {
        $setOnInsert: {
          ...coupon,
          isActive: true,
          startsAt: new Date(),
          expiresAt,
          usedCount: 0,
        },
      },
      { upsert: true },
    );
    if (result.upsertedCount === 1) created += 1;
  }

  console.log(
    `${created} yeni demo kupon eklendi (${demoCoupons.map(({ code }) => code).join(", ")}).`,
  );
} catch (error) {
  console.error(
    error instanceof Error
      ? error.message
      : "Kupon seed işlemi başarısız oldu.",
  );
  process.exitCode = 1;
} finally {
  await mongoose.disconnect().catch(() => undefined);
}
