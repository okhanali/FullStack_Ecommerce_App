import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { courierService, type ICourierOrder } from "../services/courierService";
import {
  Truck,
  CheckCircle2,
  Clock,
  PackageCheck,
  Loader2,
  MapPin,
} from "lucide-react";
import toast from "react-hot-toast";

export const CourierDashboardPage = () => {
  const queryClient = useQueryClient();

  const { data: orders, isLoading } = useQuery({
    queryKey: ["courier-orders"],
    queryFn: courierService.getAssignedOrders,
  });

  const statusMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
      courierService.updateOrderStatus(orderId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courier-orders"] });
      toast.success("Sipariş durumu güncellendi!");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Durum güncellenirken hata oluştu.",
      );
    },
  });

  const locationMutation = useMutation({
    mutationFn: courierService.advanceLocation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courier-orders"] });
      toast.success("Demo konumu ilerletildi.");
    },
    onError: () => toast.error("Kurye konumu ilerletilemedi."),
  });

  const handleStatusChange = (orderId: string, newStatus: string) => {
    statusMutation.mutate({ orderId, status: newStatus });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-indigo-600" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl">
            <Truck size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Kurye Teslimat Paneli
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Aktif siparişleri takip edin ve teslimat durumlarını yönetin
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {orders?.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-gray-100">
              <PackageCheck className="mx-auto text-gray-400 mb-2" size={48} />
              <p className="text-gray-500 font-medium">
                Şu an atanmış aktif sipariş bulunmuyor.
              </p>
            </div>
          ) : (
            orders?.map((order: ICourierOrder) => (
              <div
                key={order._id}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg">
                      ID: {order._id.slice(-6).toUpperCase()}
                    </span>
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${
                        order.status === "SHIPPED"
                          ? "bg-amber-100 text-amber-800"
                          : order.status === "DELIVERED"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                  <div className="flex items-start gap-2 text-gray-600 text-sm">
                    <MapPin
                      size={16}
                      className="mt-0.5 text-gray-400 shrink-0"
                    />
                    <span>
                      {order.shippingAddress.address},{" "}
                      {order.shippingAddress.city}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">
                    Müşteri: {order.user?.name || "Bilinmiyor"}
                  </p>
                  {order.estimatedDeliveryAt && order.status === "SHIPPED" && (
                    <p className="text-xs font-medium text-emerald-800">
                      Tahmini teslim:{" "}
                      {new Date(order.estimatedDeliveryAt).toLocaleTimeString(
                        "tr-TR",
                        { hour: "2-digit", minute: "2-digit" },
                      )}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3 border-t md:border-t-0 pt-4 md:pt-0 border-gray-100">
                  <div className="text-right mr-2 hidden md:block">
                    <p className="text-xs text-gray-500">Tutar</p>
                    <p className="text-sm font-bold text-gray-900">
                      {order.totalPrice.toLocaleString("tr-TR")} ₺
                    </p>
                  </div>
                  {order.status === "PROCESSING" && (
                    <button
                      onClick={() => handleStatusChange(order._id, "SHIPPED")}
                      className="flex items-center gap-1.5 px-4 py-2 bg-amber-600 text-white text-sm font-semibold rounded-xl hover:bg-amber-500 transition-colors shadow-sm"
                    >
                      <Clock size={16} /> Yola Çıkar
                    </button>
                  )}
                  {order.status === "SHIPPED" && (
                    <button
                      onClick={() => locationMutation.mutate(order._id)}
                      disabled={locationMutation.isPending}
                      className="flex items-center gap-1.5 rounded-xl border border-emerald-700 px-4 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-50 disabled:opacity-60"
                    >
                      <MapPin size={16} /> Konumu ilerlet
                    </button>
                  )}
                  {order.status === "SHIPPED" && (
                    <button
                      onClick={() => handleStatusChange(order._id, "DELIVERED")}
                      className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-500 transition-colors shadow-sm"
                    >
                      <CheckCircle2 size={16} /> Teslim Edildi
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
