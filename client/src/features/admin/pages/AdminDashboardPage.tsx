import { useDeferredValue, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  adminService,
  type IAdminOrder,
  type IUserItem,
} from "../services/adminService";
import {
  Shield,
  Users,
  DollarSign,
  ShoppingBag,
  Loader2,
  UserCog,
  Download,
  Search,
} from "lucide-react";
import toast from "react-hot-toast";

export const AdminDashboardPage = () => {
  const queryClient = useQueryClient();
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatus, setOrderStatus] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const deferredOrderSearch = useDeferredValue(
    orderSearch.trim().toLocaleLowerCase("tr-TR"),
  );

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: adminService.getAllUsers,
  });

  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: adminService.getSystemStats,
  });

  const {
    data: orders,
    isLoading: ordersLoading,
    isError: ordersError,
  } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: adminService.getAllOrders,
  });

  const roleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      adminService.updateUserRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Kullanıcı rolü güncellendi!");
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || "Rol güncellenirken hata oluştu.",
      );
    },
  });

  const orderStatusMutation = useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: string }) =>
      adminService.updateOrderStatus(orderId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast.success("Sipariş durumu güncellendi.");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Durum güncellenemedi.");
    },
  });

  const handleRoleChange = (userId: string, newRole: string) => {
    roleMutation.mutate({ userId, role: newRole });
  };

  const filteredOrders = (orders ?? []).filter((order) => {
    const customer =
      typeof order.user === "string"
        ? ""
        : `${order.user.name} ${order.user.email}`;
    const searchable =
      `${customer} ${order._id} ${order.orderItems.map((item) => item.name).join(" ")}`.toLocaleLowerCase(
        "tr-TR",
      );
    const orderDate = new Date(order.createdAt);
    const start = fromDate ? new Date(`${fromDate}T00:00:00`) : null;
    const end = toDate ? new Date(`${toDate}T23:59:59.999`) : null;

    return (
      searchable.includes(deferredOrderSearch) &&
      (orderStatus === "all" || order.status === orderStatus) &&
      (!start || orderDate >= start) &&
      (!end || orderDate <= end)
    );
  });

  const exportOrders = () => {
    const escapeCsv = (value: string | number) => {
      const text = String(value);
      const safeText = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
      return `"${safeText.replaceAll('"', '""')}"`;
    };
    const rows = [
      ["Sipariş", "Tarih", "Müşteri", "E-posta", "Ürünler", "Toplam", "Durum"],
      ...filteredOrders.map((order) => {
        const customer = typeof order.user === "string" ? null : order.user;
        const items = order.orderItems
          .map((item) => `${item.name} x ${item.quantity}`)
          .join("; ");
        return [
          order._id,
          new Date(order.createdAt).toLocaleString("tr-TR"),
          customer?.name ?? "",
          customer?.email ?? "",
          items,
          order.totalPrice,
          order.status,
        ];
      }),
    ];
    const csv = `\uFEFF${rows.map((row) => row.map(escapeCsv).join(",")).join("\r\n")}`;
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "siparis-gecmisi.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  if (usersLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-indigo-600" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Başlık */}
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl">
            <Shield size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Admin Yönetim Paneli
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Sistem istatistikleri ve kullanıcı yetkilendirmeleri
            </p>
          </div>
        </div>

        {/* İstatistik Kartları */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Users size={24} />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">
                Toplam Kullanıcı
              </p>
              <p className="text-xl font-bold text-gray-900 mt-1">
                {stats?.totalUsers || users?.length || 0}
              </p>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <ShoppingBag size={24} />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">
                Toplam Sipariş
              </p>
              <p className="text-xl font-bold text-gray-900 mt-1">
                {stats?.totalOrders || 0}
              </p>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <DollarSign size={24} />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Toplam Ciro</p>
              <p className="text-xl font-bold text-gray-900 mt-1">
                {(stats?.totalRevenue || 0).toLocaleString("tr-TR")} ₺
              </p>
            </div>
          </div>
        </div>

        <section className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-gray-200 px-5 py-4 sm:px-6">
            <div>
              <span className="text-xs font-semibold uppercase text-emerald-800">
                SATIŞ GEÇMİŞİ
              </span>
              <h2 className="mt-1 text-lg font-semibold text-gray-900">
                Müşteri siparişleri
              </h2>
            </div>
            <span className="text-xs text-gray-500">
              {filteredOrders.length} / {orders?.length ?? 0} sipariş
            </span>
          </div>

          {ordersLoading ? (
            <p className="px-6 py-8 text-sm text-gray-500">
              Siparişler yükleniyor...
            </p>
          ) : ordersError ? (
            <p className="px-6 py-8 text-sm text-red-700" role="alert">
              Sipariş geçmişi yüklenemedi.
            </p>
          ) : orders?.length === 0 ? (
            <p className="px-6 py-8 text-sm text-gray-500">
              Henüz müşteri siparişi bulunmuyor.
            </p>
          ) : (
            <>
              <div className="grid gap-3 border-b border-gray-200 p-4 sm:grid-cols-2 lg:grid-cols-[minmax(220px,1fr)_150px_145px_145px_auto]">
                <label className="flex h-10 items-center gap-2 rounded border border-gray-300 px-3 text-gray-500">
                  <Search size={16} />
                  <span className="sr-only">Sipariş ara</span>
                  <input
                    className="min-w-0 flex-1 border-0 bg-transparent text-xs text-gray-900 outline-none"
                    value={orderSearch}
                    onChange={(event) => setOrderSearch(event.target.value)}
                    placeholder="Müşteri, ürün veya sipariş no"
                  />
                </label>
                <label className="flex h-10 items-center rounded border border-gray-300 px-3">
                  <span className="sr-only">Duruma göre filtrele</span>
                  <select
                    className="w-full bg-transparent text-xs text-gray-800 outline-none"
                    value={orderStatus}
                    onChange={(event) => setOrderStatus(event.target.value)}
                  >
                    <option value="all">Tüm durumlar</option>
                    <option value="PENDING">Sipariş alındı</option>
                    <option value="PROCESSING">Hazırlanıyor</option>
                    <option value="SHIPPED">Yolda</option>
                    <option value="DELIVERED">Teslim edildi</option>
                    <option value="CANCELLED">İptal edildi</option>
                  </select>
                </label>
                <label className="grid content-center gap-0.5 rounded border border-gray-300 px-2">
                  <span className="text-[9px] uppercase text-gray-500">
                    Başlangıç
                  </span>
                  <input
                    aria-label="Başlangıç tarihi"
                    type="date"
                    value={fromDate}
                    onChange={(event) => setFromDate(event.target.value)}
                    className="w-full border-0 bg-transparent text-[11px] text-gray-800 outline-none"
                  />
                </label>
                <label className="grid content-center gap-0.5 rounded border border-gray-300 px-2">
                  <span className="text-[9px] uppercase text-gray-500">
                    Bitiş
                  </span>
                  <input
                    aria-label="Bitiş tarihi"
                    type="date"
                    value={toDate}
                    onChange={(event) => setToDate(event.target.value)}
                    className="w-full border-0 bg-transparent text-[11px] text-gray-800 outline-none"
                  />
                </label>
                <button
                  type="button"
                  onClick={exportOrders}
                  disabled={filteredOrders.length === 0}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded bg-gray-900 px-3 text-xs font-semibold text-white hover:bg-emerald-900 disabled:opacity-50"
                >
                  <Download size={15} /> CSV indir
                </button>
              </div>
              {filteredOrders.length === 0 ? (
                <p className="px-6 py-8 text-sm text-gray-500">
                  Filtrelerle eşleşen sipariş yok.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-190 border-collapse text-left">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50 text-[11px] font-semibold uppercase text-gray-500">
                        <th className="px-5 py-3 sm:px-6">Alım zamanı</th>
                        <th className="px-5 py-3">Müşteri</th>
                        <th className="px-5 py-3">Alınan ürünler</th>
                        <th className="px-5 py-3">Toplam</th>
                        <th className="px-5 py-3 sm:px-6">Durum</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-sm">
                      {filteredOrders.map((order: IAdminOrder) => {
                        const customer =
                          typeof order.user === "string" ? null : order.user;

                        return (
                          <tr
                            key={order._id}
                            className="align-top hover:bg-gray-50/70"
                          >
                            <td className="whitespace-nowrap px-5 py-4 text-xs text-gray-600 sm:px-6">
                              {new Date(order.createdAt).toLocaleString(
                                "tr-TR",
                                {
                                  dateStyle: "medium",
                                  timeStyle: "short",
                                },
                              )}
                            </td>
                            <td className="px-5 py-4">
                              <p className="font-semibold text-gray-900">
                                {customer?.name ?? "Müşteri bilgisi yok"}
                              </p>
                              {customer?.email && (
                                <p className="mt-1 text-xs text-gray-500">
                                  {customer.email}
                                </p>
                              )}
                            </td>
                            <td className="max-w-sm px-5 py-4">
                              <ul className="space-y-1 text-xs text-gray-700">
                                {order.orderItems.map((item, index) => (
                                  <li key={`${order._id}-${index}`}>
                                    {item.name}{" "}
                                    <span className="text-gray-500">
                                      × {item.quantity}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </td>
                            <td className="whitespace-nowrap px-5 py-4 font-semibold text-gray-900">
                              {order.totalPrice.toLocaleString("tr-TR")} ₺
                            </td>
                            <td className="whitespace-nowrap px-5 py-4 sm:px-6">
                              <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-800">
                                {order.status === "DELIVERED"
                                  ? "Teslim edildi"
                                  : order.status === "SHIPPED"
                                    ? "Yolda"
                                    : order.status === "PROCESSING"
                                      ? "Hazırlanıyor"
                                      : order.status === "CANCELLED"
                                        ? "İptal edildi"
                                        : "Sipariş alındı"}
                              </span>
                              <span className="mt-1 block text-[10px] text-gray-500">
                                {order.isPaid
                                  ? "Demo ödeme onaylandı"
                                  : "Ödeme bekliyor"}
                              </span>
                              {!["DELIVERED", "CANCELLED"].includes(
                                order.status,
                              ) && (
                                <label className="mt-2 block">
                                  <span className="sr-only">
                                    Sipariş durumunu değiştir
                                  </span>
                                  <select
                                    aria-label={`Sipariş ${order._id.slice(-6)} durumunu değiştir`}
                                    value={order.status}
                                    disabled={orderStatusMutation.isPending}
                                    onChange={(event) =>
                                      orderStatusMutation.mutate({
                                        orderId: order._id,
                                        status: event.target.value,
                                      })
                                    }
                                    className="max-w-36 rounded border border-gray-300 bg-white px-2 py-1 text-[10px] text-gray-700 disabled:opacity-50"
                                  >
                                    <option value="PENDING">
                                      Sipariş alındı
                                    </option>
                                    <option value="PROCESSING">
                                      Hazırlanıyor
                                    </option>
                                    <option value="SHIPPED">Yolda</option>
                                    <option value="DELIVERED">
                                      Teslim edildi
                                    </option>
                                    <option value="CANCELLED">
                                      İptal et / stok iade
                                    </option>
                                  </select>
                                </label>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </section>

        {/* Kullanıcı Listesi ve Rol Yönetimi */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <UserCog size={20} className="text-indigo-600" /> Kullanıcılar ve
              Roller
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/70 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <th className="py-4 px-6">Ad Soyad</th>
                  <th className="py-4 px-6">E-posta</th>
                  <th className="py-4 px-6">Kayıt Tarihi</th>
                  <th className="py-4 px-6">Rol</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {users?.map((user: IUserItem) => (
                  <tr
                    key={user._id}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="py-4 px-6 font-semibold text-gray-900">
                      {user.name}
                    </td>
                    <td className="py-4 px-6 text-gray-600">{user.email}</td>
                    <td className="py-4 px-6 text-gray-400 text-xs">
                      {new Date(user.createdAt).toLocaleDateString("tr-TR")}
                    </td>
                    <td className="py-4 px-6">
                      <select
                        value={user.role}
                        onChange={(e) =>
                          handleRoleChange(user._id, e.target.value)
                        }
                        className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-700 focus:bg-white focus:ring-2 focus:ring-indigo-600 outline-none transition-all cursor-pointer"
                      >
                        <option value="customer">Müşteri (Customer)</option>
                        <option value="seller">Satıcı</option>
                        <option value="courier">Kurye (Courier)</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
