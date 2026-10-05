import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import {
  Check,
  Clock3,
  MapPinned,
  PackageCheck,
  ShoppingBag,
  Truck,
} from "lucide-react";
import { orderService } from "../services/orderService";
import { DeliveryMap } from "../components/DeliveryMap";

const statusLabels: Record<string, string> = {
  PENDING: "Sipariş alındı",
  PROCESSING: "Sipariş hazırlanıyor",
  SHIPPED: "Kurye yola çıktı",
  DELIVERED: "Teslim edildi",
  CANCELLED: "Sipariş iptal edildi",
};

const stages = [
  { status: "PENDING", label: "Alındı", icon: Check },
  { status: "PROCESSING", label: "Hazırlanıyor", icon: PackageCheck },
  { status: "SHIPPED", label: "Yolda", icon: Truck },
  { status: "DELIVERED", label: "Teslim edildi", icon: Check },
];

export const OrderTrackingPage = () => {
  const { id = "" } = useParams();
  const {
    data: order,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["order", id],
    queryFn: () => orderService.getOrder(id),
    enabled: Boolean(id),
    refetchInterval: 6000,
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 text-sm text-gray-600">
        Sipariş bilgisi yükleniyor...
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16">
        <h1 className="text-2xl font-semibold text-gray-900">
          Sipariş bulunamadı
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Sipariş bağlantısı geçersiz olabilir veya bu siparişi görme yetkiniz
          olmayabilir.
        </p>
        <Link
          className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-emerald-800"
          to="/products"
        >
          <ShoppingBag size={17} /> Alışverişe dön
        </Link>
      </div>
    );
  }

  const stageIndex = stages.findIndex((stage) => stage.status === order.status);
  const isCancelled = order.status === "CANCELLED";
  const courierName =
    typeof order.courier === "object" ? order.courier?.name : undefined;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase text-emerald-800">
            SİPARİŞ TAKİBİ
          </span>
          <h1 className="mt-2 text-3xl font-semibold text-gray-900">
            {statusLabels[order.status] ?? order.status}
          </h1>
          <p className="mt-2 text-sm text-gray-500">Sipariş no: {order._id}</p>
        </div>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-right">
          <p className="text-xs text-emerald-900">Demo ödeme</p>
          <p className="mt-1 text-sm font-semibold text-emerald-900">
            {order.isPaid ? "Simüle edildi · tahsilat yok" : "Beklemede"}
          </p>
        </div>
      </div>

      {!isCancelled && (
        <ol className="my-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stages.map((stage, index) => {
            const Icon = stage.icon;
            const complete = stageIndex >= index;
            return (
              <li
                key={stage.status}
                className={`flex items-center gap-3 border-t-2 pt-3 ${complete ? "border-emerald-700 text-emerald-900" : "border-gray-200 text-gray-400"}`}
              >
                <Icon size={18} />
                <span className="text-xs font-semibold">{stage.label}</span>
              </li>
            );
          })}
        </ol>
      )}

      {order.status === "SHIPPED" ? (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Kurye haritası
              </h2>
              <p className="mt-1 text-xs text-gray-500">
                Konum demo rotasıdır; gerçek GPS verisi değildir.
              </p>
            </div>
            <span className="inline-flex items-center gap-2 text-xs font-medium text-emerald-900">
              <span className="h-2 w-2 rounded-full bg-emerald-600" />{" "}
              Güncelleme:{" "}
              {order.courierLocation?.updatedAt
                ? new Date(order.courierLocation.updatedAt).toLocaleTimeString(
                    "tr-TR",
                  )
                : "bekleniyor"}
            </span>
          </div>
          {order.estimatedDeliveryAt && (
            <p className="text-sm font-medium text-gray-700">
              Tahmini teslim:{" "}
              {new Date(order.estimatedDeliveryAt).toLocaleTimeString("tr-TR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          )}
          <DeliveryMap
            city={order.shippingAddress.city}
            courierLocation={order.courierLocation}
          />
        </section>
      ) : order.status === "DELIVERED" ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-900">
          <PackageCheck className="mb-2" size={22} />
          Siparişiniz teslim edildi. Bu takip bilgisi demo akışı içindir.
        </div>
      ) : (
        <div className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-5 text-sm text-gray-700">
          <Clock3 className="mt-0.5 text-emerald-800" size={19} />
          <div>
            <p className="font-semibold">Kurye hazırlanıyor</p>
            <p className="mt-1 text-gray-500">
              Sipariş yola çıktığında simüle konum haritada görünecek.
            </p>
          </div>
        </div>
      )}

      {order.status !== "SHIPPED" &&
        order.status !== "DELIVERED" &&
        order.courier && (
          <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
            <Truck size={17} />
            Atanan kurye: {courierName || "Kurye"}
          </div>
        )}

      <section className="mt-8 grid gap-6 border-t border-gray-200 pt-6 md:grid-cols-2">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">
            Teslimat adresi
          </h2>
          <p className="mt-2 text-sm leading-6 text-gray-600">
            {order.shippingAddress.address}
            <br />
            {order.shippingAddress.city}, {order.shippingAddress.postalCode} ·{" "}
            {order.shippingAddress.country}
          </p>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Sipariş özeti</h2>
          <div className="mt-2 flex justify-between text-sm text-gray-600">
            <span>Ürünler toplamı</span>
            <span>
              {(order.itemsPrice + (order.couponDiscount ?? 0)).toLocaleString(
                "tr-TR",
              )}{" "}
              ₺
            </span>
          </div>
          {order.couponDiscount ? (
            <div className="mt-1 flex justify-between text-sm text-emerald-800">
              <span>{order.couponCode ?? "Kupon"} indirimi</span>
              <span>-{order.couponDiscount.toLocaleString("tr-TR")} ₺</span>
            </div>
          ) : null}
          <div className="mt-1 flex justify-between text-sm text-gray-600">
            <span>KDV ve kargo</span>
            <span>
              {(order.taxPrice + order.shippingPrice).toLocaleString("tr-TR")} ₺
            </span>
          </div>
          {order.couponDiscount ? (
            <div className="mt-1 flex justify-between text-sm text-emerald-800">
              <span>{order.couponCode ?? "Kupon"} indirimi</span>
              <span>-{order.couponDiscount.toLocaleString("tr-TR")} ₺</span>
            </div>
          ) : null}
          <div className="mt-3 flex justify-between border-t border-gray-200 pt-3 text-sm font-bold text-gray-900">
            <span>Toplam</span>
            <span>{order.totalPrice.toLocaleString("tr-TR")} ₺</span>
          </div>
        </div>
      </section>
      <section className="mt-8 border-t border-gray-200 pt-6">
        <h2 className="text-sm font-semibold text-gray-900">Durum geçmişi</h2>
        <ol className="mt-4 space-y-4">
          {(order.statusHistory?.length
            ? [...order.statusHistory].reverse()
            : [{ status: order.status, at: order.createdAt }]
          ).map((event, index) => (
            <li
              key={`${event.status}-${event.at}-${index}`}
              className="flex gap-3"
            >
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-emerald-700" />
              <div>
                <p className="text-sm font-medium text-gray-800">
                  {statusLabels[event.status] ?? event.status}
                </p>
                <time className="text-xs text-gray-500" dateTime={event.at}>
                  {new Date(event.at).toLocaleString("tr-TR", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </time>
                {event.note && (
                  <p className="mt-1 text-xs text-gray-600">{event.note}</p>
                )}
              </div>
            </li>
          ))}
        </ol>
      </section>
      <Link
        className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-emerald-800"
        to="/products"
      >
        <MapPinned size={17} /> Ürünlere dön
      </Link>
    </main>
  );
};
