import { model, Schema, type Document } from "mongoose";
import type { IProduct } from "../types/productTypes.js";

export interface IProductDocument extends Omit<IProduct, "_id">, Document {
  name: string;
  price: number;
  stock: number;
  images: string[];
  isActive: boolean;
}

const productSchema = new Schema<IProductDocument>(
  {
    title: {
      type: String,
      required: [true, "Ürün adı zorunludur"],
      trim: true,
      maxlength: [120, "Ürün adı en fazla 120 karakter olabilir"],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, "Ürün açıklaması zorunludur."],
      maxlength: [2000, "Açıklama en fazla 2000 karakter olabilir."],
    },
    price: {
      type: Number,
      required: [true, "Ürün fiyatı zorunludur."],
      min: [0, "Fiyat 0'dan küçük olamaz."],
    },
    discountPrice: {
      type: Number,
      validate: {
        validator: function (this: IProductDocument, val: number): boolean {
          return val === undefined || val < this.price;
        },
        message: "İndirimli fiyat ({VALUE}) normal fiyattan düşük olmalıdır.",
      },
    },
    stock: {
      type: Number,
      required: [true, "Stok miktarı zorunludur."],
      min: [0, "Stok miktarı negatif olamaz."],
      default: 0,
    },
    category: {
      type: String,
      required: [true, "Kategori zorunludur."],
      trim: true,
      index: true,
    },
    seller: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Satıcı bilgisi zorunludur."],
      index: true,
    },
    images: {
      type: [String],
      validate: {
        validator: (val: string[]) => val.length > 0,
        message: "En az 1 ürün görseli yüklenmelidir.",
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, "Puan 1'den az olamaz."],
      max: [5, "Puan 5'ten fazla olamaz."],
      set: (val: number) => Math.round(val * 10) / 10,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    tags: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

productSchema.index({ title: "text", description: "text", tags: "text" });
productSchema.index({ price: 1, ratingsAverage: -1 });
productSchema.index({ category: 1, isActive: 1 });

productSchema.pre("save", function () {
  if (this.isModified("title") || !this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/ğ/g, "g")
      .replace(/ü/g, "u")
      .replace(/ş/g, "s")
      .replace(/ı/g, "i")
      .replace(/ö/g, "o")
      .replace(/ç/g, "c")
      .replace(/[^a-z0-9 -]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  }
});

export const Product = model<IProductDocument>("Product", productSchema);
