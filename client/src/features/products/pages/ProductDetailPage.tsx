import { useParams, useNavigate } from "react-router-dom";

import {
  Loader2,
  ArrowLeft,
  ShoppingCart,
  ShieldCheck,
  Truck,
  Heart,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useProductDetail } from "../../../hooks/useProducts";
import { useCart } from "../../../hooks/useCart";
import { useAuth } from "../../../hooks/useAuth";
import { ProductReviews } from "../components/ProductReviews";
import ProductCard from "../components/ProductCard";
import { productService } from "../services/productService";
import { wishlistService } from "../../wishlist/services/wishlistService";

export const ProductDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: product, isLoading, error } = useProductDetail(id || "");
  const { addToCart } = useCart();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const image = product?.images?.[0] || product?.image;
  const isCustomer = user?.role === "customer";
  const { data: wishlist = [] } = useQuery({
    queryKey: ["wishlist"],
    queryFn: wishlistService.getWishlist,
    enabled: isCustomer,
  });
  const { data: relatedProducts = [] } = useQuery({
    queryKey: ["related-products", product?.category, product?._id],
    queryFn: () =>
      productService.getRelatedProducts(product!.category, product!._id),
    enabled: Boolean(product),
  });
  const favoriteMutation = useMutation({
    mutationFn: () => wishlistService.toggleWishlist(product!._id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      toast.success(
        isFavorite ? "Favorilerden çıkarıldı." : "Favorilere eklendi.",
      );
    },
    onError: () => toast.error("Favori güncellenemedi."),
  });
  const isFavorite = Boolean(
    product && wishlist.some((item) => item._id === product._id),
  );

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-indigo-600" size={40} />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 gap-4">
        <p className="text-red-500 font-medium">
          Ürün bulunamadı veya bir hata oluştu.
        </p>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors"
        >
          <ArrowLeft size={16} /> Geri Dön
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft size={18} /> Tüm Ürünlere Dön
        </button>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 rounded-2xl bg-white p-8 shadow-sm border border-gray-100">
          <div className="aspect-square w-full overflow-hidden rounded-xl bg-gray-100">
            <img
              src={
                image ||
                "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1000&q=85"
              }
              alt={product.title}
              className="h-full w-full object-cover object-center"
            />
          </div>

          <div className="flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
                {product.category}
              </span>
              {product.tags?.includes("seed-2026") && (
                <span className="ml-2 rounded bg-gray-100 px-2 py-1 text-[10px] font-semibold text-gray-700">
                  Demo ürün
                </span>
              )}
              <h1 className="mt-2 text-3xl font-bold text-gray-900">
                {product.title}
              </h1>
              <p className="mt-4 text-2xl font-bold text-indigo-600">
                {(product.discountPrice ?? product.price).toLocaleString(
                  "tr-TR",
                )}{" "}
                ₺
              </p>
              {product.discountPrice && (
                <p className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                  <del>{product.price.toLocaleString("tr-TR")} ₺</del>
                  <span className="rounded bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-800">
                    %
                    {Math.round(
                      (1 - product.discountPrice / product.price) * 100,
                    )}{" "}
                    indirim
                  </span>
                </p>
              )}
              <p className="mt-6 text-gray-600 leading-relaxed">
                {product.description}
              </p>

              <div className="mt-6 border-t border-gray-100 pt-6 space-y-3">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Truck size={18} className="text-indigo-600" />
                  <span>Hızlı Kargo & Güvenli Teslimat</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <ShieldCheck size={18} className="text-indigo-600" />
                  <span>
                    Stok Durumu:{" "}
                    <span className="font-semibold text-gray-900">
                      {product.stock} adet
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {isCustomer && (
              <div className="mt-8 flex gap-3">
                <button
                  type="button"
                  onClick={() => favoriteMutation.mutate()}
                  disabled={favoriteMutation.isPending}
                  className="grid h-12 w-12 shrink-0 place-items-center rounded border border-gray-300 text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                  aria-label={
                    isFavorite ? "Favorilerden çıkar" : "Favorilere ekle"
                  }
                  title={isFavorite ? "Favorilerden çıkar" : "Favorilere ekle"}
                >
                  <Heart
                    size={19}
                    className={isFavorite ? "fill-current" : ""}
                  />
                </button>
                <button
                  onClick={() => addToCart(product, 1)}
                  disabled={product.stock <= 0}
                  className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded bg-indigo-600 px-6 text-base font-semibold text-white shadow-md hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 transition-all disabled:opacity-50"
                >
                  <ShoppingCart size={20} />
                  {product.stock > 0 ? "Sepete Ekle" : "Tükendi"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <ProductReviews
        productId={product._id}
        average={product.ratingsAverage ?? 0}
        count={product.ratingsQuantity ?? 0}
      />
      {relatedProducts.length > 0 && (
        <section className="mx-auto mt-8 max-w-6xl border-t border-gray-200 px-4 py-9 sm:px-6 lg:px-8">
          <div className="mb-5 flex items-end justify-between">
            <div>
              <span className="text-xs font-bold uppercase text-emerald-800">
                AYNI KATEGORİDEN
              </span>
              <h2 className="mt-1 text-xl font-semibold text-gray-900">
                Bunlar da ilgini çekebilir
              </h2>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            {relatedProducts.map((relatedProduct) => (
              <ProductCard key={relatedProduct._id} product={relatedProduct} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
