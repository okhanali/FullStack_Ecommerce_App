import type { Types } from "mongoose";

export interface ICategory {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parent?: Types.ObjectId | string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
