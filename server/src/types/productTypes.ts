import type { Types } from "mongoose";

export interface IProduct {
  _id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  discountPrice?: number;
  stock: number;
  category: string;
  seller: Types.ObjectId | string;
  images: string[];
  ratingsAverage: number;
  ratingsQuantity: number;
  isFeatured: boolean;
  isActive: boolean;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}
