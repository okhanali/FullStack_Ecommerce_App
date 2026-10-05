import { Trash2, Plus, Minus } from "lucide-react";
import type { ICartItem } from "../types/cartTypes";
import type { FC } from "react";
import { useCart } from "../../../hooks/useCart";

interface CartItemCardProps {
  item: ICartItem;
}

export const CartItemCard: FC<CartItemCardProps> = ({ item }) => {
  const { updateQuantity, removeFromCart } = useCart();
  const { product, quantity } = item;
  const image = product.images?.[0] || product.image;
  const effectivePrice = product.discountPrice ?? product.price;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl bg-white p-4 shadow-sm border border-gray-100">
      <div className="flex items-center gap-4 w-full sm:w-auto">
        <div className="aspect-square h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-gray-100">
          <img
            src={
              image ||
              "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=300&q=80"
            }
            alt={product.title}
            className="h-full w-full object-cover object-center"
          />
        </div>
        <div>
          <h3 className="text-base font-semibold text-gray-900 line-clamp-1">
            {product.title}
          </h3>
          <p className="mt-1 text-sm text-indigo-600 font-medium">
            {effectivePrice.toLocaleString("tr-TR")} ₺
          </p>
          {product.discountPrice && (
            <p className="text-xs text-gray-400">
              <del>{product.price.toLocaleString("tr-TR")} ₺</del>
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between w-full sm:w-auto gap-6">
        {/* Miktar Kontrolü */}
        <div className="flex items-center rounded-lg border border-gray-200 bg-gray-50 p-1">
          <button
            onClick={() => updateQuantity(product._id, quantity - 1)}
            className="rounded-md p-1 hover:bg-white text-gray-600 transition-colors"
          >
            <Minus size={16} />
          </button>
          <span className="px-3 text-sm font-semibold text-gray-900">
            {quantity}
          </span>
          <button
            onClick={() => updateQuantity(product._id, quantity + 1)}
            className="rounded-md p-1 hover:bg-white text-gray-600 transition-colors"
          >
            <Plus size={16} />
          </button>
        </div>

        {/* Toplam Fiyat */}
        <span className="text-base font-bold text-gray-900 min-w-22.5 text-right">
          {(effectivePrice * quantity).toLocaleString("tr-TR")} ₺
        </span>

        {/* Silme Butonu */}
        <button
          onClick={() => removeFromCart(product._id)}
          className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
};
