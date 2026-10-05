import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShoppingCart,
  ArrowLeft,
  Trash2,
  CheckCircle,
  Tag,
} from "lucide-react";
import { useCart } from "../../../hooks/useCart";
import { CartItemCard } from "./CartItemCard";
import type { ICartItem } from "../types/cartTypes";
import { couponService } from "../services/couponService";
import { cartService } from "../services/cartService";
import toast from "react-hot-toast";

export const CartPage = () => {
  const { cart, totalPrice, clearCart, totalItems } = useCart();
  const navigate = useNavigate();
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    rate: number;
  } | null>(() => {
    try {
      const stored = sessionStorage.getItem("appliedCoupon");
      return stored
        ? (JSON.parse(stored) as { code: string; rate: number })
        : null;
    } catch {
      sessionStorage.removeItem("appliedCoupon");
      return null;
    }
  });
  const [couponCode, setCouponCode] = useState(() => appliedCoupon?.code ?? "");
  const [couponLoading, setCouponLoading] = useState(false);

  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error("Kupon kodu girin.");
      return;
    }
    try {
      setCouponLoading(true);
      await cartService.syncCart(cart);
      const coupon = await couponService.applyCoupon(couponCode);
      const applied = { code: coupon.code, rate: coupon.discountPercentage };
      setAppliedCoupon(applied);
      sessionStorage.setItem("appliedCoupon", JSON.stringify(applied));
      toast.success(`%${coupon.discountPercentage} kupon indirimi uygulandı.`);
    } catch (error) {
      const message = (error as { response?: { data?: { message?: string } } })
        .response?.data?.message;
      toast.error(message || "Kupon doğrulanamadı.");
    } finally {
      setCouponLoading(false);
    }
  };

  const couponDiscount = Number(
    ((totalPrice * (appliedCoupon?.rate ?? 0)) / 100).toFixed(2),
  );
  const discountedItemsTotal = totalPrice - couponDiscount;
  const shippingPrice = discountedItemsTotal > 500 ? 0 : 49.9;
  const taxPrice = Number((discountedItemsTotal * 0.2).toFixed(2));
  const estimatedTotal = Number(
    (discountedItemsTotal + taxPrice + shippingPrice).toFixed(2),
  );

  if (cart.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
        <div className="rounded-full bg-indigo-50 p-6 text-indigo-600 mb-4">
          <ShoppingCart size={48} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Sepetiniz Boş</h2>
        <p className="mt-2 text-sm text-gray-600 text-center max-w-sm">
          Sepetinizde henüz ürün bulunmuyor. Alışverişe başlamak için ürünleri
          inceleyebilirsiniz.
        </p>
        <button
          onClick={() => navigate("/products")}
          className="mt-6 flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-indigo-500 transition-all"
        >
          Alışverişe Başla
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Alışveriş Sepeti
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Sepetinizde {totalItems} ürün bulunmaktadır.
            </p>
          </div>
          <button
            onClick={clearCart}
            className="flex items-center gap-1.5 text-sm font-medium text-red-600 hover:text-red-500 transition-colors"
          >
            <Trash2 size={16} /> Sepeti Temizle
          </button>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Sepet Ürünleri Listesi */}
          <div className="lg:col-span-2 space-y-4">
            {cart.map((item: ICartItem) => (
              <CartItemCard key={item.product._id} item={item} />
            ))}

            <button
              onClick={() => navigate("/products")}
              className="mt-4 flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
            >
              <ArrowLeft size={16} /> Alışverişe Devam Et
            </button>
          </div>

          {/* Sipariş Özeti */}
          <div className="space-y-6">
            <section className="rounded-lg border border-gray-200 bg-white p-5">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
                <Tag size={16} /> Kupon kodu
              </h2>
              <div className="flex gap-2">
                <input
                  value={couponCode}
                  onChange={(event) =>
                    setCouponCode(event.target.value.toUpperCase())
                  }
                  placeholder="Örn. WELCOME10"
                  aria-label="Kupon kodu"
                  className="min-w-0 flex-1 rounded border border-gray-300 px-3 py-2 text-xs uppercase outline-none focus:border-emerald-700"
                />
                <button
                  type="button"
                  onClick={applyCoupon}
                  disabled={couponLoading}
                  className="rounded bg-gray-900 px-3 text-xs font-semibold text-white disabled:opacity-50"
                >
                  {couponLoading ? "Kontrol..." : "Uygula"}
                </button>
              </div>
              {appliedCoupon && (
                <p className="mt-2 text-xs font-medium text-emerald-800">
                  {appliedCoupon.code}: %{appliedCoupon.rate} indirim{" "}
                  <button
                    type="button"
                    className="ml-2 underline"
                    onClick={() => {
                      setAppliedCoupon(null);
                      sessionStorage.removeItem("appliedCoupon");
                    }}
                  >
                    Kaldır
                  </button>
                </p>
              )}
            </section>
            {/* Sipariş Özeti */}
            <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 h-fit">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                Sipariş Özeti
              </h2>

              <div className="space-y-3 text-sm text-gray-600 border-b border-gray-100 pb-4">
                <div className="flex justify-between">
                  <span>Ürünler Toplamı</span>
                  <span className="font-semibold text-gray-900">
                    {totalPrice.toLocaleString("tr-TR")} ₺
                  </span>
                </div>
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Kupon indirimi</span>
                    <span>-{couponDiscount.toLocaleString("tr-TR")} ₺</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>KDV (%20)</span>
                  <span className="font-semibold text-gray-900">
                    {taxPrice.toLocaleString("tr-TR")} ₺
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Kargo</span>
                  <span className="font-semibold text-green-700">
                    {shippingPrice === 0
                      ? "Ücretsiz"
                      : `${shippingPrice.toLocaleString("tr-TR")} ₺`}
                  </span>
                </div>
              </div>

              <div className="flex justify-between text-base font-bold text-gray-900 py-4">
                <span>Genel Toplam</span>
                <span className="text-indigo-600 text-xl">
                  {estimatedTotal.toLocaleString("tr-TR")} ₺
                </span>
              </div>

              <button
                onClick={() => navigate("/checkout")}
                className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 px-6 text-base font-semibold text-white shadow-md hover:bg-indigo-500 transition-all"
              >
                <CheckCircle size={20} /> Siparişi Tamamla
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
