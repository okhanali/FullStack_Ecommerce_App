import { api } from "../../../services/api";
import type {
  ProductResponse,
  SignleProductResponse,
} from "../types/productTypes";

export const productService = {
  getAllProducts: async () => {
    const response = await api.get<ProductResponse>("/products", {
      params: { limit: 100 },
    });
    return response.data.data.products;
  },

  getProductById: async (id: string) => {
    const response = await api.get<SignleProductResponse>(`/products/${id}`);
    return response.data.data.product;
  },

  getRelatedProducts: async (category: string, excludeId: string) => {
    const response = await api.get<ProductResponse>("/products", {
      params: { category, limit: 100 },
    });
    return response.data.data.products
      .filter((product) => product._id !== excludeId)
      .slice(0, 4);
  },
};
