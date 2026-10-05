import { Schema, model, type Document, type Model, Types } from "mongoose";
import type { IReview } from "../types/reviewTypes.js";
import { Product } from "./productModel.js";

export interface IReviewDocument extends Omit<IReview, "_id">, Document {}

export interface IReviewModel extends Model<IReviewDocument> {
  calcAverageRatings(productId: Types.ObjectId | string): Promise<void>;
}

const reviewSchema = new Schema<IReviewDocument, IReviewModel>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Review must belong to a product."],
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Review must belong to a user."],
    },
    rating: {
      type: Number,
      min: [1, "Rating must be at least 1.0"],
      max: [5, "Rating cannot exceed 5.0"],
      required: [true, "Rating is required."],
    },
    comment: {
      type: String,
      trim: true,
      required: [true, "Review comment cannot be empty."],
      maxlength: [1000, "Comment cannot exceed 1000 characters."],
    },
    isDemo: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Prevent duplicate reviews from the same user on the same product
reviewSchema.index({ product: 1, user: 1 }, { unique: true });

// Static method to aggregate ratings and update Product
reviewSchema.statics.calcAverageRatings = async function (
  productId: Types.ObjectId | string,
): Promise<void> {
  const stats = await this.aggregate([
    {
      $match: { product: new Types.ObjectId(productId) },
    },
    {
      $group: {
        _id: "$product",
        nRating: { $sum: 1 },
        avgRating: { $avg: "$rating" },
      },
    },
  ]);

  if (stats.length > 0) {
    await Product.findByIdAndUpdate(productId, {
      ratingsQuantity: stats[0].nRating,
      ratingsAverage: Math.round(stats[0].avgRating * 10) / 10,
    });
  } else {
    await Product.findByIdAndUpdate(productId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5, // Default baseline rating
    });
  }
};

// Recalculate average ratings post save
reviewSchema.post("save", function () {
  (this.constructor as IReviewModel).calcAverageRatings(this.product);
});

// Recalculate average ratings post update or delete
reviewSchema.post(/^findOneAnd/, async function (doc: IReviewDocument | null) {
  if (doc) {
    await (doc.constructor as IReviewModel).calcAverageRatings(doc.product);
  }
});

export const Review = model<IReviewDocument, IReviewModel>(
  "Review",
  reviewSchema,
);
