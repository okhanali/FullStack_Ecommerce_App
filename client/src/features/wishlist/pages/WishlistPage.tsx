import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { wishlistService } from "../services/wishlistService";
import { Heart, Loader2, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ProductCard from "../../products/components/ProductCard";

export const WishlistPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    data: wishlist,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["wishlist"],
    queryFn: wishlistService.getWishlist,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-indigo-600" size={40} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-red-500 font-medium">
          Favoriler yüklenirken bir hata oluştu veya giriş yapmalısınız.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Favorilerim
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Beğendiğiniz ve kaydettiğiniz ürünler
            </p>
          </div>
          <button
            onClick={() => navigate("/products")}
            className="flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
          >
            <ArrowLeft size={16} /> Alışverişe Dön
          </button>
        </div>

        {!wishlist || wishlist.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="rounded-full bg-indigo-50 p-6 text-indigo-600 mb-4">
              <Heart size={48} />
            </div>
            <h3 className="text-xl font-bold text-gray-900">
              Favori Listeniz Boş
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              Henüz favorilere ürün eklemediniz.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {wishlist.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
