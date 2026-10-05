import mongoose from "mongoose";
import dotenv from "dotenv";
import { Product } from "../dist/models/productModel.js";
import { User } from "../dist/models/userModel.js";

dotenv.config();

const catalogBySellerName = {
  "Can Satıcı": [
    [
      "Can Dokulu Keten Gömlek",
      "Tekstil",
      1249,
      "photo-1598033129183-c4f50c736f10",
    ],
    [
      "Can Pamuklu Günlük Sweatshirt",
      "Tekstil",
      899,
      "photo-1551488831-00ddcb6c6bd3",
    ],
    [
      "Can El Dokuması Omuz Çantası",
      "Tekstil",
      1090,
      "photo-1548036328-c9fa89d128fa",
    ],
    [
      "Can El Yapımı Seramik Vazo",
      "Ev & Dekorasyon",
      690,
      "photo-1578749556568-bc2c40e68b61",
    ],
    [
      "Can Paslanmaz Spor Matarası",
      "Spor",
      420,
      "photo-1602143407151-7111542de6e8",
    ],
  ],
  "Zeynep Teknoloji": [
    [
      "Zeynep Kablosuz Stüdyo Kulaklığı",
      "Elektronik",
      2490,
      "photo-1505740420928-5e560c06d30e",
    ],
    [
      "Zeynep Akıllı Saat Lite",
      "Elektronik",
      3190,
      "photo-1523275335684-37898b6baf30",
    ],
    [
      "Zeynep Oversize Pamuklu Tişört",
      "Tekstil",
      590,
      "photo-1521572163474-6864f9cf17ab",
    ],
    [
      "Zeynep Ayarlanabilir Masa Lambası",
      "Ev & Dekorasyon",
      780,
      "photo-1507473885765-e6ed057f782c",
    ],
    [
      "Zeynep Günlük Koşu Ayakkabısı",
      "Spor",
      1890,
      "photo-1542291026-7eec264c27ff",
    ],
  ],
  "Ahmet Teknoloji": [
    [
      "Ahmet Mekanik Klavye 75",
      "Elektronik",
      2190,
      "photo-1587829741301-dc798b83add3",
    ],
    [
      "Ahmet Kompakt Ev Blenderı",
      "Ev Aletleri",
      1690,
      "photo-1570222094114-d054a817e56b",
    ],
    [
      "Ahmet Dokuma Kırlent Kılıfı",
      "Tekstil",
      460,
      "photo-1616486338812-3dadae4b4ace",
    ],
    ["Ahmet Denge Yoga Matı", "Spor", 890, "photo-1592432678016-e910b452f9a2"],
    [
      "Ahmet Masif Ahşap Duvar Rafı",
      "Mobilya",
      1390,
      "photo-1600210492486-724fe5c67fb0",
    ],
  ],
};

const descriptions = {
  Tekstil:
    "Günlük kullanıma uygun, özenli dokusu ve zamansız tasarımıyla uzun süre keyifle kullanabileceğin bir parça.",
  Elektronik:
    "Pratik kullanım, güvenilir performans ve yalın tasarımı bir arada sunan seçkin bir teknoloji ürünü.",
  "Ev & Dekorasyon":
    "Yaşam alanına doğal bir dokunuş katan, işlev ve sadeliği buluşturan özenle seçilmiş bir tasarım.",
  Spor: "Hareketli günlerinde konfor ve dayanıklılık sunmak için tasarlanmış kullanışlı bir spor ürünü.",
  "Ev Aletleri":
    "Günlük işleri kolaylaştıran, kompakt ve kullanımı rahat bir ev yardımcısı.",
  Mobilya:
    "Doğal malzeme görünümü ve kullanışlı ölçüleriyle evinde uzun süre yer bulacak bir tasarım.",
};

const discountedDemoProducts = new Set([
  "Can Dokulu Keten Gömlek",
  "Zeynep Kablosuz Stüdyo Kulaklığı",
  "Zeynep Günlük Koşu Ayakkabısı",
  "Ahmet Denge Yoga Matı",
  "Ahmet Masif Ahşap Duvar Rafı",
]);

try {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Demo ürünler production ortamına eklenemez.");
  }
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI tanımlı değil.");
  await mongoose.connect(process.env.MONGO_URI);

  const sellers = await User.find({
    role: { $in: ["seller", "vendor"] },
  }).select("name");
  if (sellers.length === 0)
    throw new Error("Ürün eklenecek satıcı bulunamadı.");

  let inserted = 0;
  for (const seller of sellers) {
    const catalog =
      catalogBySellerName[seller.name] ?? catalogBySellerName["Can Satıcı"];
    let sellerInserted = 0;

    for (const [title, category, price, photo] of catalog) {
      const existing = await Product.findOne({ seller: seller._id, title });
      if (existing) {
        if (discountedDemoProducts.has(title) && !existing.discountPrice) {
          existing.discountPrice = Math.round(existing.price * 0.9);
          await existing.save();
        }
        continue;
      }

      await Product.create({
        title,
        description: descriptions[category],
        price,
        ...(discountedDemoProducts.has(title) && {
          discountPrice: Math.round(price * 0.9),
        }),
        stock: 12,
        category,
        images: [
          `https://images.unsplash.com/${photo}?auto=format&fit=crop&w=1000&q=85`,
        ],
        seller: seller._id,
        isActive: true,
        isFeatured: true,
        tags: ["demo", "seed-2026", category.toLowerCase()],
      });
      sellerInserted += 1;
      inserted += 1;
    }

    console.log(`${seller.name}: ${sellerInserted} demo ürün eklendi.`);
  }

  console.log(`Toplam ${inserted} yeni demo ürün eklendi.`);
} catch (error) {
  console.error(
    error instanceof Error ? error.message : "Ürün seed işlemi başarısız oldu.",
  );
  process.exitCode = 1;
} finally {
  await mongoose.disconnect().catch(() => undefined);
}
