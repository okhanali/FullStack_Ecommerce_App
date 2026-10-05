import { Link, useNavigate } from "react-router-dom";
import {
  ArrowUpRight,
  Heart,
  LogOut,
  Shield,
  ShoppingBag,
  Store,
  Truck,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useCart } from "../hooks/useCart";

export const Header = () => {
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const role = user?.role ? String(user.role).toLowerCase() : "";

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link
          to="/products"
          className="site-brand"
          aria-label="İyi Seçim ana sayfa"
        >
          <span className="brand-mark">
            <ShoppingBag size={19} />
          </span>
          <span>
            iyi<span className="brand-dot">.</span>seçim
          </span>
        </Link>

        <nav className="header-nav" aria-label="Ana menü">
          <Link to="/products" className="header-nav-link">
            Keşfet
          </Link>
          {user?.role === "customer" && (
            <Link to="/wishlist" className="header-nav-link">
              Favoriler
            </Link>
          )}
        </nav>

        <div className="header-actions">
          {user ? (
            <>
              {role === "admin" && (
                <Link className="role-link" to="/admin/dashboard">
                  <Shield size={16} /> Yönetim
                </Link>
              )}
              {(role === "vendor" || role === "seller") && (
                <Link className="role-link" to="/vendor/dashboard">
                  <Store size={16} /> Mağazam
                </Link>
              )}
              {role === "courier" && (
                <Link className="role-link" to="/courier/dashboard">
                  <Truck size={16} /> Teslimatlar
                </Link>
              )}
              {role === "customer" && (
                <>
                  <Link to="/account/orders" className="header-nav-link">
                    Siparişlerim
                  </Link>
                  <Link
                    to="/wishlist"
                    className="icon-link"
                    aria-label="Favorilerim"
                    title="Favorilerim"
                  >
                    <Heart size={19} />
                  </Link>
                  <Link
                    to="/cart"
                    className="icon-link cart-link"
                    aria-label={`Sepetim, ${totalItems} ürün`}
                    title="Sepetim"
                  >
                    <ShoppingBag size={19} />
                    {totalItems > 0 && (
                      <span className="cart-count">
                        {totalItems > 99 ? "99+" : totalItems}
                      </span>
                    )}
                  </Link>
                </>
              )}
              <span className="header-user">{user.name}</span>
              <button
                onClick={handleLogout}
                className="icon-link"
                title="Çıkış yap"
                aria-label="Çıkış yap"
              >
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <>
              <Link
                to="/cart"
                className="icon-link"
                aria-label="Sepetim"
                title="Sepetim"
              >
                <ShoppingBag size={19} />
              </Link>
              <Link to="/login" className="login-link">
                Giriş yap
              </Link>
              <Link to="/register" className="join-link">
                Üye ol <ArrowUpRight size={15} />
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
