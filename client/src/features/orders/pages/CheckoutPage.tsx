import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../../hooks/useCart";
import { orderService } from "../services/orderService";
import {
  MapPin,
  Building,
  CheckCircle,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import type { ICartItem } from "../../cart/types/cartTypes";
import { cartService } from "../../cart/services/cartService";
import toast from "react-hot-toast";

export const CheckoutPage = () => {
  const { cart, totalPrice, clearCart } = useCart();
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [appliedCoupon] = useState<{ code: string; rate: number } | null>(
    () => {
      try {
        const stored = sessionStorage.getItem("appliedCoupon");
        return stored
          ? (JSON.parse(stored) as { code: string; rate: number })
          : null;
      } catch {
        sessionStorage.removeItem("appliedCoupon");
        return null;
      }
    },
  );
  const [formData, setFormData] = useState({
    address: "",
    city: "",
    postalCode: "",
    country: "Türkiye",
    paymentMethod: "SIMULATED_CARD",
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (cart.length === 0) {
      toast.error("Sepetiniz boş!");
      return;
    }

    if (!token) {
      toast.error("Sipariş vermek için giriş yapmalısınız!");
      navigate("/login");
      return;
    }

    try {
      setLoading(true);

      await cartService.syncCart(cart);

      const orderPayload = {
        shippingAddress: {
          address: formData.address,
          city: formData.city,
          postalCode: formData.postalCode,
          country: formData.country,
        },
        paymentMethod: formData.paymentMethod,
        ...(appliedCoupon && { couponCode: appliedCoupon.code }),
      };

      const order = await orderService.createOrder(orderPayload);

      toast.success("Demo siparişiniz oluşturuldu.");
      clearCart();
      sessionStorage.removeItem("appliedCoupon");
      navigate(`/orders/${order._id}`);
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        "Sipariş oluşturulurken bir hata oluştu.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const couponDiscount = Number(
    ((totalPrice * (appliedCoupon?.rate ?? 0)) / 100).toFixed(2),
  );
  const discountedItemsTotal = totalPrice - couponDiscount;
  const taxPrice = Number((discountedItemsTotal * 0.2).toFixed(2));
  const shippingPrice = discountedItemsTotal > 500 ? 0 : 49.9;
  const estimatedTotal = Number(
    (discountedItemsTotal + taxPrice + shippingPrice).toFixed(2),
  );

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <button
          onClick={() => navigate("/cart")}
          className="mb-6 flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors"
        >
          <ArrowLeft size={18} /> Sepete Geri Dön
        </button>

        <h1 className="text-3xl font-bold tracking-tight text-gray-900 mb-8">
          Siparişi Tamamla
        </h1>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 gap-8 lg:grid-cols-3"
        >
          <div className="lg:col-span-2 space-y-6 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3">
              Teslimat Bilgileri
            </h2>

            <div className="space-y-4">
              <fieldset className="space-y-3">
                <legend className="text-sm font-semibold text-gray-800">
                  Demo ödeme yöntemi
                </legend>
                <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 p-3">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="SIMULATED_CARD"
                    checked={formData.paymentMethod === "SIMULATED_CARD"}
                    onChange={handleChange}
                  />
                  <span>
                    <span className="block text-sm font-medium text-gray-900">
                      Demo kart ödemesi
                    </span>
                    <span className="text-xs text-gray-500">
                      Gerçek kart bilgisi alınmaz, tahsilat yapılmaz.
                    </span>
                  </span>
                </label>
                <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 p-3">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="SIMULATED_CASH"
                    checked={formData.paymentMethod === "SIMULATED_CASH"}
                    onChange={handleChange}
                  />
                  <span>
                    <span className="block text-sm font-medium text-gray-900">
                      Demo kapıda ödeme
                    </span>
                    <span className="text-xs text-gray-500">
                      Yalnızca akış testi içindir.
                    </span>
                  </span>
                </label>
              </fieldset>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Şehir
                </label>
                <div className="relative">
                  <Building
                    className="absolute left-3 top-3 text-gray-400"
                    size={18}
                  />
                  <input
                    type="text"
                    name="city"
                    required
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="İstanbul"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label
                  className="mb-1 block text-sm font-medium text-gray-700"
                  htmlFor="postalCode"
                >
                  Posta kodu
                </label>
                <div className="relative">
                  <MapPin
                    className="absolute left-3 top-3 text-gray-400"
                    size={18}
                  />
                  <input
                    id="postalCode"
                    type="text"
                    name="postalCode"
                    required
                    value={formData.postalCode}
                    onChange={handleChange}
                    placeholder="34000"
                    autoComplete="postal-code"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Açık Adres
                </label>
                <div className="relative">
                  <MapPin
                    className="absolute left-3 top-3 text-gray-400"
                    size={18}
                  />
                  <textarea
                    name="address"
                    required
                    rows={3}
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Mahalle, sokak, bina no, daire..."
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 h-fit">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Sipariş Özeti
            </h2>

            <div className="space-y-3 text-sm text-gray-600 border-b border-gray-100 pb-4">
              {cart.map((item: ICartItem) => (
                <div key={item.product._id} className="flex justify-between">
                  <span className="line-clamp-1">
                    {item.product.title} (x{item.quantity})
                  </span>
                  <span className="font-semibold text-gray-900">
                    {(
                      (item.product.discountPrice ?? item.product.price) *
                      item.quantity
                    ).toLocaleString("tr-TR")}{" "}
                    ₺
                  </span>
                </div>
              ))}
              {couponDiscount > 0 && (
                <div className="flex justify-between border-t border-gray-100 pt-3 text-emerald-700">
                  <span>{appliedCoupon?.code} kupon indirimi</span>
                  <span>-{couponDiscount.toLocaleString("tr-TR")} ₺</span>
                </div>
              )}
              <div className="flex justify-between border-t border-gray-100 pt-3">
                <span>KDV (%20)</span>
                <span>{taxPrice.toLocaleString("tr-TR")} ₺</span>
              </div>
              <div className="flex justify-between">
                <span>Kargo</span>
                <span>
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
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3.5 px-6 text-base font-semibold text-white shadow-md hover:bg-indigo-500 transition-all disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <CheckCircle size={20} />
              )}
              {loading ? "İşleniyor..." : "Siparişi Onayla"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
