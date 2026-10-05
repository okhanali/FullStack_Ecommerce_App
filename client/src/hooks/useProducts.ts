import { useQuery } from "@tanstack/react-query";
import { productService } from "../features/products/services/productService";

export const useProducts = () => {
  return useQuery({
    queryKey: ["products"],
    queryFn: productService.getAllProducts,
    staleTime: 1000 * 60 * 5,
  });
};

export const useProductDetail = (id: string) => {
  return useQuery({
    queryKey: ["product", id],
    queryFn: () => productService.getProductById(id),
    enabled: !!id,
  });
};
