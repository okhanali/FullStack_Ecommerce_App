import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, LockKeyhole, Mail, ShoppingBag } from "lucide-react";
import { useAuth } from "../../../hooks/useAuth";
import { getPostAuthPath } from "../authNavigation";

export const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const authenticatedUser = await login({ email, password });
      navigate(getPostAuthPath(authenticatedUser.role), { replace: true });
    } catch (err) {
      const message = (err as { response?: { data?: { message?: string } } })
        .response?.data?.message;
      setError(message || "Giriş yapılamadı. Bilgilerinizi kontrol edin.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <section className="auth-story" aria-label="E-Ticaret">
        <Link to="/products" className="auth-brand">
          <span className="brand-mark">
            <ShoppingBag size={20} />
          </span>
          <span>
            iyi<span className="brand-dot">.</span>seçim
          </span>
        </Link>
        <div className="auth-story-copy">
          <span className="eyebrow">GÜNLÜK HAYATIN İYİ HALİ</span>
          <h1>
            İyi şeyler
            <br />
            burada başlar.
          </h1>
          <p>Sevdiğin ürünler, özenle seçilmiş bir yerde.</p>
        </div>
        <span className="auth-story-note">İyi seçim, iyi hissettirir.</span>
      </section>

      <section className="auth-panel">
        <div className="auth-form-wrap">
          <span className="eyebrow">TEKRAR HOŞ GELDİN</span>
          <h2>Hesabına giriş yap</h2>
          <p className="auth-description">
            Alışverişine kaldığın yerden devam et.
          </p>

          <form className="auth-form" onSubmit={handleSubmit}>
            <label htmlFor="email">E-posta adresi</label>
            <div className="auth-input-wrap">
              <Mail size={18} aria-hidden="true" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="ornek@mail.com"
                autoComplete="email"
                required
              />
            </div>

            <label htmlFor="password">Şifre</label>
            <div className="auth-input-wrap">
              <LockKeyhole size={18} aria-hidden="true" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Şifren"
                autoComplete="current-password"
                required
              />
            </div>

            {error && (
              <p className="auth-error" role="alert">
                {error}
              </p>
            )}
            <button
              className="auth-submit"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Giriş yapılıyor..." : "Giriş yap"}
              {!isSubmitting && <ArrowRight size={18} />}
            </button>
          </form>

          <p className="auth-switch">
            Henüz hesabın yok mu? <Link to="/register">Üye ol</Link>
          </p>
          <Link className="auth-back" to="/products">
            Mağazaya dön
          </Link>
        </div>
      </section>
    </main>
  );
};
