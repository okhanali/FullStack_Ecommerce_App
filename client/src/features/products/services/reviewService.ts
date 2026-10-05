import { api } from "../../../services/api";

export interface IProductReview {
  _id: string;
  rating: number;
  comment: string;
  isDemo?: boolean;
  createdAt: string;
  user: {
    name: string;
    avatar?: string;
  };
}

export const reviewService = {
  async getProductReviews(productId: string) {
    const response = await api.get<{
      data: { reviews: IProductReview[] };
    }>("/reviews", { params: { productId } });
    return response.data.data.reviews;
  },

  async createReview(productId: string, rating: number, comment: string) {
    const response = await api.post<{ data: { review: IProductReview } }>(
      "/reviews",
      { product: productId, rating, comment },
    );
    return response.data.data.review;
  },
};
