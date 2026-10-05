import type { FC } from "react";
import type { IProduct } from "../types/productTypes";
import { Link } from "react-router-dom";
import { ArrowUpRight, PackageOpen } from "lucide-react";

interface Props {
  product: IProduct;
}

const ProductCard: FC<Props> = ({ product }) => {
  const image = product.images?.[0] || product.image;
  const effectivePrice = product.discountPrice ?? product.price;
  const discountPercent = product.discountPrice
    ? Math.round((1 - product.discountPrice / product.price) * 100)
    : 0;
  return (
    <article className="product-card">
      <Link
        to={`/products/${product._id}`}
        aria-label={`${product.title} ürününü incele`}
      >
        <div className="product-card-media">
          {image ? (
            <img src={image} alt={product.title} loading="lazy" />
          ) : (
            <PackageOpen size={34} />
          )}
          <span className="product-card-category">{product.category}</span>
          {product.tags?.includes("seed-2026") && (
            <span className="absolute bottom-3 left-3 rounded bg-gray-900/85 px-2 py-1 text-[9px] font-semibold text-white">
              Demo ürün
            </span>
          )}
          {discountPercent > 0 && (
            <span className="absolute right-3 top-3 rounded bg-rose-700 px-2 py-1 text-[10px] font-bold text-white">
              -%{discountPercent}
            </span>
          )}
        </div>
        <div className="product-card-body">
          <h3>{product.title}</h3>
          <p className="product-card-description">{product.description}</p>
          <div className="product-card-bottom">
            <span className="flex items-baseline gap-2">
              <span className="product-card-price">
                {effectivePrice.toLocaleString("tr-TR")} ₺
              </span>
              {product.discountPrice && (
                <del className="text-xs text-gray-400">
                  {product.price.toLocaleString("tr-TR")} ₺
                </del>
              )}
            </span>
            <span className="product-card-arrow" aria-hidden="true">
              <ArrowUpRight size={17} />
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
};

export default ProductCard;
