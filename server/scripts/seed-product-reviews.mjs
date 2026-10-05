import mongoose from "mongoose";
import dotenv from "dotenv";
import { Product } from "../dist/models/productModel.js";
import { Review } from "../dist/models/reviewModel.js";
import { User } from "../dist/models/userModel.js";

dotenv.config();

const demoReviews = [
  {
    rating: 5,
    comment:
      "Demo değerlendirme: Ürün açıklamadaki özelliklerle uyumlu, günlük kullanımda memnun etti.",
  },
  {
    rating: 4,
    comment:
      "Demo değerlendirme: Tasarımı ve kullanım kolaylığı başarılı. Fiyat-performans dengesi iyi.",
  },
  {
    rating: 5,
    comment:
      "Demo değerlendirme: Kalitesi beklentimi karşıladı, yeniden tercih edebilirim.",
  },
];

try {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Demo yorumları production ortamına eklenemez.");
  }
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI tanımlı değil.");
  await mongoose.connect(process.env.MONGO_URI);

  const [products, customers] = await Promise.all([
    Product.find({ isActive: true }).select("_id title"),
    User.find({ role: "customer" }).sort("_id").select("_id"),
  ]);

  if (customers.length < demoReviews.length) {
    throw new Error(
      "Her ürüne üç farklı demo yorumu için en az üç müşteri hesabı gerekli.",
    );
  }

  let inserted = 0;
  for (const product of products) {
    const existingReviews = await Review.find({ product: product._id }).select(
      "user",
    );
    const existingUserIds = new Set(
      existingReviews.map((review) => review.user.toString()),
    );
    const availableCustomers = customers.filter(
      (customer) => !existingUserIds.has(customer._id.toString()),
    );
    const missingCount = Math.max(
      0,
      demoReviews.length - existingReviews.length,
    );

    for (let index = 0; index < missingCount; index += 1) {
      const customer = availableCustomers[index];
      if (!customer) break;

      await Review.create({
        product: product._id,
        user: customer._id,
        ...demoReviews[index],
        isDemo: true,
      });
      inserted += 1;
    }

    await Review.calcAverageRatings(product._id);
  }

  console.log(
    `${inserted} demo yorum eklendi; ürün puan ortalamaları güncellendi.`,
  );
} catch (error) {
  console.error(
    error instanceof Error
      ? error.message
      : "Demo yorum seed işlemi başarısız oldu.",
  );
  process.exitCode = 1;
} finally {
  await mongoose.disconnect().catch(() => undefined);
}
