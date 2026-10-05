import { useDeferredValue, useState } from "react";
import {
  ArrowDownWideNarrow,
  ArrowRight,
  Loader2,
  Search,
  Sparkles,
} from "lucide-react";
import { useProducts } from "../../../hooks/useProducts";
import ProductCard from "../components/ProductCard";

export const ProductsPage = () => {
  const { data: products, isLoading, error } = useProducts();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
  const deferredSearch = useDeferredValue(
    searchTerm.trim().toLocaleLowerCase("tr-TR"),
  );

  if (isLoading) {
    return (
      <div
        className="catalog-loading"
        role="status"
        aria-label="Ürünler yükleniyor"
      >
        <Loader2 className="animate-spin" size={28} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="catalog-message" role="alert">
        <h1>Ürünlere ulaşılamadı</h1>
        <p>Bağlantını kontrol edip sayfayı yenilemeyi deneyebilirsin.</p>
      </div>
    );
  }

  const categories = [
    "all",
    ...(products ? Array.from(new Set(products.map((p) => p.category))) : []),
  ];

  const filteredProducts = [...(products ?? [])]
    .filter(
      (product) =>
        selectedCategory === "all" || product.category === selectedCategory,
    )
    .filter((product) => {
      const searchableText =
        `${product.title} ${product.description} ${product.category}`.toLocaleLowerCase(
          "tr-TR",
        );
      return searchableText.includes(deferredSearch);
    })
    .sort((first, second) => {
      if (sortOrder === "price-ascending") return first.price - second.price;
      if (sortOrder === "price-descending") return second.price - first.price;
      return (
        new Date(second.createdAt).getTime() -
        new Date(first.createdAt).getTime()
      );
    });

  return (
    <div className="catalog-page">
      <section className="catalog-hero">
        <div className="catalog-hero-shade" />
        <div className="catalog-hero-content">
          <span className="hero-kicker">
            <Sparkles size={14} /> İYİ SEÇİLMİŞ, GÜNÜNDE
          </span>
          <h1>
            İyi seçimler
            <br />
            iyi hissettirir.
          </h1>
          <p>Her gün kullanacağın, uzun süre seveceğin parçalar.</p>
          <a href="#urunler" className="hero-link">
            Seçkini keşfet <ArrowRight size={16} />
          </a>
        </div>
        <span className="hero-index">
          01 <span /> GÜNCEL SEÇKİ
        </span>
      </section>

      <section className="catalog-content" id="urunler">
        <div className="catalog-heading">
          <div>
            <span className="eyebrow">BUGÜNÜN SEÇKİSİ</span>
            <h2>Göz at, içinden geçeni seç.</h2>
          </div>
          <span className="catalog-count">{filteredProducts.length} ürün</span>
        </div>

        <div className="catalog-toolbar">
          <div className="catalog-search">
            <Search size={18} aria-hidden="true" />
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Ürün veya kategori ara"
              aria-label="Ürün veya kategori ara"
            />
          </div>
          <label className="catalog-sort">
            <ArrowDownWideNarrow size={17} aria-hidden="true" />
            <span className="sr-only">Sıralama</span>
            <select
              value={sortOrder}
              onChange={(event) => setSortOrder(event.target.value)}
            >
              <option value="newest">En yeni</option>
              <option value="price-ascending">Fiyat: artan</option>
              <option value="price-descending">Fiyat: azalan</option>
            </select>
          </label>
        </div>

        <div
          className="category-tabs"
          role="group"
          aria-label="Kategori filtresi"
        >
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`category-tab ${
                selectedCategory === category ? "is-active" : ""
              }`}
              aria-pressed={selectedCategory === category}
            >
              {category === "all" ? "Tümü" : category}
            </button>
          ))}
        </div>

        {filteredProducts.length === 0 ? (
          <div className="catalog-empty">
            <p>Bu aramayla eşleşen ürün bulunamadı.</p>
          </div>
        ) : (
          <div className="product-grid">
            {filteredProducts.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
