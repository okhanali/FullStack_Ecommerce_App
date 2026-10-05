export interface IProduct {
  _id: string;
  title: string;
  description: string;
  price: number;
  discountPrice?: number;
  category: string;
  image?: string;
  images?: string[];
  stock: number;
  ratingsAverage?: number;
  ratingsQuantity?: number;
  tags?: string[];
  createdAt: string;
}

export interface ProductResponse {
  status: string;
  results: number;
  data: {
    products: IProduct[];
  };
}

export interface SignleProductResponse {
  status: string;
  data: {
    product: IProduct;
  };
}
