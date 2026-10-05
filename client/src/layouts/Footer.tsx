import { Link } from "react-router-dom";
import { ArrowUpRight, ShoppingBag } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <Link to="/products" className="footer-brand">
          <span className="brand-mark">
            <ShoppingBag size={17} />
          </span>
          <span>
            iyi<span className="brand-dot">.</span>seçim
          </span>
        </Link>
        <p>Günlük hayatın iyi hali.</p>
        <div className="footer-links">
          <Link to="/products">
            Ürünlere göz at <ArrowUpRight size={14} />
          </Link>
          <a href="mailto:merhaba@iyisecim.com">Bize ulaş</a>
        </div>
        <span className="footer-copyright">
          © {new Date().getFullYear()} İyi Seçim
        </span>
      </div>
    </footer>
  );
};
