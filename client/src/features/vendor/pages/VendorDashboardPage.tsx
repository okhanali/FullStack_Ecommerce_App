import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Trash2,
  Edit,
  Package,
  DollarSign,
  Store,
  ShoppingBag,
  MessageSquareText,
  Star,
} from "lucide-react";
import toast from "react-hot-toast";
import { vendorService, type IVendorProduct } from "../services/vendorService";
import { useAuth } from "../../../hooks/useAuth";

export const VendorDashboardPage = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [salesFrom, setSalesFrom] = useState("");
  const [salesTo, setSalesTo] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<IVendorProduct | null>(
    null,
  );

  // Form State
  const [formData, setFormData] = useState<IVendorProduct>({
    title: "",
    description: "",
    price: 0,
    stock: 0,
    category: "",
    imageUrl: "",
  });

  // 1. Ürünleri TanStack Query ile Çek (useEffect ve set-state-in-effect hatası kökten çözülür)
  const { data: products = [], isLoading: loading } = useQuery({
    queryKey: ["vendor-products"],
    queryFn: () => vendorService.getMyProducts(user!._id),
    enabled: Boolean(user?._id),
  });

  const { data: sales = [], isLoading: salesLoading } = useQuery({
    queryKey: ["vendor-sales"],
    queryFn: vendorService.getMySales,
    enabled: Boolean(user?._id),
  });

  const { data: reviews = [], isLoading: reviewsLoading } = useQuery({
    queryKey: ["vendor-reviews"],
    queryFn: vendorService.getMyReviews,
    enabled: Boolean(user?._id),
  });

  const filteredSales = sales.filter((sale) => {
    const saleDate = new Date(sale.createdAt);
    const start = salesFrom ? new Date(`${salesFrom}T00:00:00`) : null;
    const end = salesTo ? new Date(`${salesTo}T23:59:59.999`) : null;
    return (!start || saleDate >= start) && (!end || saleDate <= end);
  });
  const activeSales = filteredSales.filter(
    (sale) => sale.status !== "CANCELLED",
  );
  const salesRevenue = activeSales.reduce(
    (total, sale) => total + sale.subtotal,
    0,
  );
  const cancelledSalesCount = filteredSales.filter(
    (sale) => sale.status === "CANCELLED",
  ).length;
  const unitsSold = activeSales.reduce(
    (total, sale) =>
      total +
      sale.items.reduce((itemTotal, item) => itemTotal + item.quantity, 0),
    0,
  );
  const averageSale = activeSales.length
    ? salesRevenue / activeSales.length
    : 0;
  const productSales = new Map<string, number>();
  activeSales.forEach((sale) => {
    sale.items.forEach((item) => {
      productSales.set(
        item.name,
        (productSales.get(item.name) ?? 0) + item.quantity,
      );
    });
  });
  const bestSellingProduct = [...productSales.entries()].sort(
    (first, second) => second[1] - first[1],
  )[0];
  const lowStockProducts = products.filter((product) => product.stock <= 5);

  // 2. Ekleme / Güncelleme Mutation
  const saveMutation = useMutation({
    mutationFn: async (data: IVendorProduct) => {
      const productId = editingProduct?._id || editingProduct?.id;
      if (productId) {
        return vendorService.updateProduct(productId, data);
      }
      return vendorService.createProduct(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-products"] });
      toast.success(
        editingProduct
          ? "Ürün başarıyla güncellendi."
          : "Ürün başarıyla eklendi.",
      );
      setIsModalOpen(false);
      setEditingProduct(null);
      setFormData({
        title: "",
        description: "",
        price: 0,
        stock: 0,
        category: "",
        imageUrl: "",
      });
    },
    onError: () => {
      toast.error("İşlem başarısız oldu.");
    },
  });

  // 3. Silme Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => vendorService.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-products"] });
      toast.success("Ürün silindi.");
    },
    onError: () => {
      toast.error("Ürün silinemedi.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  const handleDelete = (id?: string) => {
    if (!id) return;
    if (!window.confirm("Bu ürünü silmek istediğinize emin misiniz?")) return;
    deleteMutation.mutate(id);
  };

  const handleEditClick = (product: IVendorProduct) => {
    setEditingProduct(product);
    setFormData({
      title: product.title,
      description: product.description,
      price: product.price,
      discountPrice: product.discountPrice,
      stock: product.stock,
      category: product.category,
      imageUrl: product.imageUrl || "",
    });
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-gray-50/50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-amber-600 font-semibold mb-1">
              <Store size={20} /> Satıcı Yönetim Paneli
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              Mağaza Ürünlerim
            </h1>
            <p className="text-sm text-gray-500">
              Mağazanıza ait ürünleri ekleyin, güncelleyin ve stokları yönetin.
            </p>
          </div>
          <button
            onClick={() => {
              setEditingProduct(null);
              setFormData({
                title: "",
                description: "",
                price: 0,
                stock: 0,
                category: "",
                imageUrl: "",
              });
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-500 transition-colors"
          >
            <Plus size={18} /> Yeni Ürün Ekle
          </button>
        </div>

        {/* Ürün Listesi */}
        {loading ? (
          <div className="text-center py-12 text-gray-500">Yükleniyor...</div>
        ) : products.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center">
            <Package className="mx-auto h-12 w-12 text-gray-400 mb-3" />
            <h3 className="text-lg font-medium text-gray-900">
              Henüz ürün eklemediniz
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Mağazanızı büyütmek için hemen ilk ürününüzü ekleyin.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => {
              const prodId = product._id || product.id;
              return (
                <div
                  key={prodId}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col justify-between"
                >
                  <div>
                    {product.imageUrl && (
                      <img
                        src={product.imageUrl}
                        alt={product.title}
                        className="w-full h-48 object-cover"
                      />
                    )}
                    <div className="p-5">
                      <span className="inline-block px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 text-xs font-medium mb-2">
                        {product.category}
                      </span>
                      <h3 className="text-lg font-bold text-gray-900 mb-1">
                        {product.title}
                      </h3>
                      <p className="text-sm text-gray-500 line-clamp-2 mb-4">
                        {product.description}
                      </p>

                      <div className="flex items-center justify-between text-sm font-semibold text-gray-900">
                        <span className="flex items-center text-emerald-600">
                          <DollarSign size={16} />
                          {product.price} ₺
                        </span>
                        <span className="text-gray-500 text-xs">
                          Stok: {product.stock}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-100 px-5 py-3 bg-gray-50/50 flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleEditClick(product)}
                      className="p-2 text-gray-600 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                      title="Düzenle"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(prodId)}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Sil"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {lowStockProducts.length > 0 && (
          <section
            className="mt-6 rounded-lg border border-amber-300 bg-amber-50 px-5 py-4"
            role="status"
          >
            <h2 className="text-sm font-semibold text-amber-950">
              Düşük stok uyarısı
            </h2>
            <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-amber-900">
              {lowStockProducts.map((product) => (
                <li key={product._id ?? product.id}>
                  {product.title}: {product.stock} adet kaldı
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mt-10 overflow-hidden rounded-lg border border-gray-200 bg-white">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-gray-200 px-5 py-4 sm:px-6">
            <div>
              <span className="text-xs font-semibold uppercase text-amber-700">
                MAĞAZA HAREKETLERİ
              </span>
              <h2 className="mt-1 flex items-center gap-2 text-lg font-semibold text-gray-900">
                <ShoppingBag size={19} className="text-amber-700" /> Satışlarım
              </h2>
            </div>
            <span className="text-xs text-gray-500">
              {filteredSales.length} / {sales.length} sipariş
            </span>
          </div>

          <div className="grid gap-3 border-b border-gray-200 p-4 sm:grid-cols-2 lg:grid-cols-3">
            <label className="flex h-10 items-center rounded border border-gray-300 px-3">
              <span className="sr-only">Satış başlangıç tarihi</span>
              <input
                aria-label="Satış başlangıç tarihi"
                type="date"
                value={salesFrom}
                onChange={(event) => setSalesFrom(event.target.value)}
                className="w-full bg-transparent text-xs text-gray-800 outline-none"
              />
            </label>
            <label className="flex h-10 items-center rounded border border-gray-300 px-3">
              <span className="sr-only">Satış bitiş tarihi</span>
              <input
                aria-label="Satış bitiş tarihi"
                type="date"
                value={salesTo}
                onChange={(event) => setSalesTo(event.target.value)}
                className="w-full bg-transparent text-xs text-gray-800 outline-none"
              />
            </label>
            <div className="flex h-10 items-center justify-between rounded bg-amber-50 px-3 text-xs">
              <span className="text-amber-900">Dönem cirosu</span>
              <strong className="text-gray-900">
                {salesRevenue.toLocaleString("tr-TR")} ₺
              </strong>
            </div>
            <div className="flex h-10 items-center justify-between rounded bg-gray-50 px-3 text-xs">
              <span className="text-gray-600">En çok satan</span>
              <strong
                className="max-w-[55%] truncate text-gray-900"
                title={bestSellingProduct?.[0]}
              >
                {bestSellingProduct
                  ? `${bestSellingProduct[0]} (${bestSellingProduct[1]})`
                  : "Henüz satış yok"}
              </strong>
            </div>
            <div className="flex h-10 items-center justify-between rounded bg-gray-50 px-3 text-xs">
              <span className="text-gray-600">Satılan adet</span>
              <strong className="text-gray-900">{unitsSold}</strong>
            </div>
            <div className="flex h-10 items-center justify-between rounded bg-gray-50 px-3 text-xs">
              <span className="text-gray-600">Ortalama sipariş</span>
              <strong className="text-gray-900">
                {averageSale.toLocaleString("tr-TR", {
                  maximumFractionDigits: 2,
                })}{" "}
                ₺
              </strong>
            </div>
            <div className="flex h-10 items-center justify-between rounded bg-rose-50 px-3 text-xs">
              <span className="text-rose-800">İptal</span>
              <strong className="text-rose-900">{cancelledSalesCount}</strong>
            </div>
          </div>

          {salesLoading ? (
            <p className="px-6 py-8 text-sm text-gray-500">
              Satışlar yükleniyor...
            </p>
          ) : filteredSales.length === 0 ? (
            <p className="px-6 py-8 text-sm text-gray-500">
              Bu tarih aralığında satış bulunmuyor.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-190 border-collapse text-left">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 text-[11px] font-semibold uppercase text-gray-500">
                    <th className="px-5 py-3 sm:px-6">Alım zamanı</th>
                    <th className="px-5 py-3">Müşteri</th>
                    <th className="px-5 py-3">Alınan ürünler</th>
                    <th className="px-5 py-3">Satış toplamı</th>
                    <th className="px-5 py-3 sm:px-6">Sipariş</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {filteredSales.map((sale) => (
                    <tr
                      key={sale.orderId}
                      className="align-top hover:bg-gray-50/70"
                    >
                      <td className="whitespace-nowrap px-5 py-4 text-xs text-gray-600 sm:px-6">
                        {new Date(sale.createdAt).toLocaleString("tr-TR", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-gray-900">
                          {sale.buyer?.name ?? "Müşteri"}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          {sale.buyer?.email}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <ul className="space-y-1 text-xs text-gray-700">
                          {sale.items.map((item, index) => (
                            <li key={`${sale.orderId}-${index}`}>
                              {item.name}{" "}
                              <span className="text-gray-500">
                                × {item.quantity}
                              </span>
                              <span className="ml-2 text-gray-500">
                                {item.subtotal.toLocaleString("tr-TR")} ₺
                              </span>
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 font-semibold text-gray-900">
                        {sale.subtotal.toLocaleString("tr-TR")} ₺
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-xs text-gray-600 sm:px-6">
                        {sale.status === "CANCELLED"
                          ? "İptal edildi"
                          : sale.status === "DELIVERED"
                            ? "Teslim edildi"
                            : sale.status === "SHIPPED"
                              ? "Yolda"
                              : sale.status === "PROCESSING"
                                ? "Hazırlanıyor"
                                : "Sipariş alındı"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="mt-8 overflow-hidden rounded-lg border border-gray-200 bg-white">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-gray-200 px-5 py-4 sm:px-6">
            <div>
              <span className="text-xs font-semibold uppercase text-amber-700">
                MÜŞTERİ GERİ BİLDİRİMİ
              </span>
              <h2 className="mt-1 flex items-center gap-2 text-lg font-semibold text-gray-900">
                <MessageSquareText size={19} className="text-amber-700" /> Ürün
                yorumları
              </h2>
            </div>
            <span className="text-xs text-gray-500">
              {reviews.length} yorum
            </span>
          </div>

          {reviewsLoading ? (
            <p className="px-6 py-8 text-sm text-gray-500">
              Yorumlar yükleniyor...
            </p>
          ) : reviews.length === 0 ? (
            <p className="px-6 py-8 text-sm text-gray-500">
              Ürünlerinize henüz yorum yapılmamış.
            </p>
          ) : (
            <div className="divide-y divide-gray-100">
              {reviews.map((review) => (
                <article
                  key={review._id}
                  className="flex flex-wrap items-start justify-between gap-4 px-5 py-4 sm:px-6"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900">
                        {review.user?.name ?? "Müşteri"}
                      </p>
                      <span className="text-xs text-gray-400">
                        ürününe yorum yaptı:
                      </span>
                      <span className="text-sm font-medium text-gray-800">
                        {review.product?.title ?? "Ürün"}
                      </span>
                      {review.isDemo && (
                        <span className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-900">
                          Demo
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-sm leading-6 text-gray-700">
                      {review.comment}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 text-xs text-gray-500">
                    <span className="inline-flex items-center gap-1 font-semibold text-amber-700">
                      <Star size={14} className="fill-current" />{" "}
                      {review.rating}/5
                    </span>
                    <time dateTime={review.createdAt}>
                      {new Date(review.createdAt).toLocaleDateString("tr-TR")}
                    </time>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {/* Ürün Ekleme / Düzenleme Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {editingProduct ? "Ürünü Güncelle" : "Yeni Ürün Ekle"}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Ürün Adı
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Fiyat (₺)
                    </label>
                    <input
                      type="number"
                      required
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          price: Number(e.target.value),
                        })
                      }
                      className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      İndirimli Fiyat (₺)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={
                        formData.price > 0 ? formData.price - 0.01 : undefined
                      }
                      value={formData.discountPrice ?? ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          discountPrice: e.target.value
                            ? Number(e.target.value)
                            : undefined,
                        })
                      }
                      className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Stok Adedi
                    </label>
                    <input
                      type="number"
                      required
                      value={formData.stock}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          stock: Number(e.target.value),
                        })
                      }
                      className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Kategori
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Görsel URL (Opsiyonel)
                  </label>
                  <input
                    type="text"
                    value={formData.imageUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, imageUrl: e.target.value })
                    }
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Açıklama
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="rounded-xl px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    disabled={saveMutation.isPending}
                    className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-500 disabled:opacity-50"
                  >
                    {saveMutation.isPending
                      ? "Kaydediliyor..."
                      : editingProduct
                        ? "Güncelle"
                        : "Ekle"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
