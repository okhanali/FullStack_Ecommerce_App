import { api } from "../../../services/api";

export interface IVendorProduct {
  _id?: string;
  id?: string;
  title: string;
  description: string;
  price: number;
  discountPrice?: number | undefined;
  stock: number;
  category: string;
  imageUrl?: string;
  images?: string[];
  seller?: string | { _id: string };
}

export interface IVendorSale {
  orderId: string;
  buyer: { name: string; email: string };
  createdAt: string;
  status: string;
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }>;
  subtotal: number;
}

export interface IVendorReview {
  _id: string;
  user: { name: string };
  product: { title: string };
  rating: number;
  comment: string;
  isDemo: boolean;
  createdAt: string;
}

export const vendorService = {
  getMyProducts: async (userId: string): Promise<IVendorProduct[]> => {
    const response = await api.get<{
      data: { products: IVendorProduct[] };
    }>("/products", { params: { limit: 100 } });

    return response.data.data.products.filter((product) => {
      const sellerId =
        typeof product.seller === "string"
          ? product.seller
          : product.seller?._id;
      return sellerId === userId;
    });
  },

  getMySales: async (): Promise<IVendorSale[]> => {
    const response = await api.get<{ data: { sales: IVendorSale[] } }>(
      "/vendor/sales",
    );
    return response.data.data.sales;
  },

  getMyReviews: async (): Promise<IVendorReview[]> => {
    const response = await api.get<{ data: { reviews: IVendorReview[] } }>(
      "/vendor/reviews",
    );
    return response.data.data.reviews;
  },

  createProduct: async (
    productData: IVendorProduct,
  ): Promise<IVendorProduct> => {
    const response = await api.post<{ data: { product: IVendorProduct } }>(
      "/products",
      {
        title: productData.title,
        description: productData.description,
        price: productData.price,
        discountPrice: productData.discountPrice,
        stock: productData.stock,
        category: productData.category,
        images: productData.imageUrl
          ? [productData.imageUrl]
          : productData.images,
      },
    );
    return response.data.data.product;
  },

  updateProduct: async (
    id: string,
    productData: Partial<IVendorProduct>,
  ): Promise<IVendorProduct> => {
    const { imageUrl, ...fields } = productData;
    const response = await api.patch<{ data: { product: IVendorProduct } }>(
      `/products/${id}`,
      {
        ...fields,
        ...(imageUrl !== undefined && { images: imageUrl ? [imageUrl] : [] }),
      },
    );
    return response.data.data.product;
  },

  deleteProduct: async (id: string): Promise<void> => {
    await api.delete(`/products/${id}`);
  },
};
