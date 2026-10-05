import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowUpRight, PackageCheck, ShoppingBag } from "lucide-react";
import { orderService } from "../services/orderService";
import toast from "react-hot-toast";

const statusLabels: Record<string, string> = {
  PENDING: "Sipariş alındı",
  PROCESSING: "Hazırlanıyor",
  SHIPPED: "Kurye yolda",
  DELIVERED: "Teslim edildi",
  CANCELLED: "İptal edildi",
};

export const MyOrdersPage = () => {
  const queryClient = useQueryClient();
  const {
    data: orders = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["my-orders"],
    queryFn: orderService.getMyOrders,
  });
  const cancelMutation = useMutation({
    mutationFn: orderService.cancelMyOrder,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["my-orders"] });
      toast.success(
        "Sipariş iptal edildi; stok ve kupon kullanımı iade edildi.",
      );
    },
    onError: (error: unknown) => {
      const message = (error as { response?: { data?: { message?: string } } })
        .response?.data?.message;
      toast.error(message || "Sipariş iptal edilemedi.");
    },
  });

  return (
    <main className="mx-auto min-h-[60vh] max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <span className="text-xs font-bold uppercase text-emerald-800">
            HESABIM
          </span>
          <h1 className="mt-2 text-3xl font-semibold text-gray-900">
            Siparişlerim
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Sipariş geçmişin ve teslimat durumların.
          </p>
        </div>
        <span className="text-xs text-gray-500">{orders.length} sipariş</span>
      </div>

      {isLoading ? (
        <p className="py-10 text-sm text-gray-500">Siparişler yükleniyor...</p>
      ) : isError ? (
        <p className="py-10 text-sm text-red-700" role="alert">
          Sipariş geçmişi yüklenemedi.
        </p>
      ) : orders.length === 0 ? (
        <div className="grid justify-items-center gap-3 py-16 text-center">
          <ShoppingBag size={34} className="text-emerald-800" />
          <h2 className="text-lg font-semibold text-gray-900">
            Henüz siparişin yok
          </h2>
          <p className="max-w-sm text-sm text-gray-500">
            İlk siparişini verdiğinde durumu ve ayrıntıları burada
            görebileceksin.
          </p>
          <Link
            to="/products"
            className="mt-2 inline-flex items-center gap-2 rounded bg-emerald-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900"
          >
            Ürünleri keşfet <ArrowUpRight size={16} />
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-gray-200">
          {orders.map((order) => (
            <article
              key={order._id}
              className="grid gap-4 py-6 sm:grid-cols-[1fr_auto] sm:items-center"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-sm font-semibold text-gray-900">
                    Sipariş {order._id.slice(-8).toUpperCase()}
                  </h2>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-900">
                    {statusLabels[order.status] ?? order.status}
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  {new Date(order.createdAt).toLocaleString("tr-TR", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                  {order.isPaid &&
                    " · Demo ödeme onaylandı, tahsilat yapılmadı"}
                </p>
                <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-gray-700">
                  {order.orderItems.map((item, index) => (
                    <li
                      key={`${order._id}-${index}`}
                      className="inline-flex items-center gap-1.5"
                    >
                      <PackageCheck size={14} className="text-gray-400" />
                      {item.name} × {item.quantity}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex items-center justify-between gap-4 sm:justify-end">
                <span className="whitespace-nowrap text-sm font-bold text-gray-900">
                  {order.totalPrice.toLocaleString("tr-TR")} ₺
                </span>
                <Link
                  to={`/orders/${order._id}`}
                  className="inline-flex min-h-9 items-center gap-2 rounded border border-gray-300 px-3 text-xs font-semibold text-gray-800 hover:border-emerald-800 hover:text-emerald-900"
                >
                  Takip et <ArrowUpRight size={15} />
                </Link>
                {(order.status === "PENDING" ||
                  order.status === "PROCESSING") && (
                  <button
                    type="button"
                    disabled={cancelMutation.isPending}
                    onClick={() => {
                      if (
                        window.confirm(
                          "Siparişi iptal edip stoğu iade etmek istiyor musunuz?",
                        )
                      ) {
                        cancelMutation.mutate(order._id);
                      }
                    }}
                    className="min-h-9 rounded border border-rose-200 px-3 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                  >
                    İptal et
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
};
