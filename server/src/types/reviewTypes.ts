import type { Types } from "mongoose";

export interface IReview {
  _id: Types.ObjectId;
  product: Types.ObjectId | string;
  user: Types.ObjectId | string;
  rating: number;
  comment: string;
  isDemo?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateReviewInput {
  rating: number;
  comment: string;
}

export interface UpdateReviewInput {
  rating?: number;
  comment?: string;
}
