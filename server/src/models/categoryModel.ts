import { model, Schema, type Document } from "mongoose";
import type { ICategory } from "../types/categoryTypes.js";

export interface ICategoryDocument extends Omit<ICategory, "_id">, Document {}

const categorySchema = new Schema<ICategoryDocument>(
  {
    name: {
      type: String,
      required: [true, "Kategori adı zorunludur."],
      unique: true,
      trim: true,
      maxlength: [80, "Kategori adı en fazla 80 karakter olabilir."],
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true,
      index: true,
    },
    description: {
      type: String,
      maxlength: [500, "Açıklama en fazla 500 karakter olabilir."],
    },
    image: {
      type: String,
      default: "",
    },
    parent: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      default: null,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

categorySchema.index({ name: 1, isActive: 1 });

//* Pre-save Hook: Slug Oluşturma
categorySchema.pre("save", function () {
  if (this.isModified("name") || !this.slug) {
    this.slug = this.name
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

export const Category = model<ICategoryDocument>("Category", categorySchema);
