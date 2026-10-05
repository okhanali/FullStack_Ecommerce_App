import { useState, type FC } from "react";
import { useAuth } from "../../../hooks/useAuth";
import { Link, useNavigate } from "react-router-dom";
import { useFormik } from "formik";
import toast from "react-hot-toast";
import { registerSchema } from "../validations/authValidation";
import {
  ArrowRight,
  Loader2,
  LockKeyhole,
  Mail,
  ShoppingBag,
  User,
} from "lucide-react";
import { getPostAuthPath } from "../authNavigation";

const RegisterPage: FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const formik = useFormik({
    initialValues: {
      name: "",
      email: "",
      password: "",
    },
    validationSchema: registerSchema,
    onSubmit: async (values) => {
      try {
        setIsSubmitting(true);
        const authenticatedUser = await register(values);
        navigate(getPostAuthPath(authenticatedUser.role), { replace: true });
      } catch (error: any) {
        const errorMsg =
          error.response?.data?.message || "Kayıt olurken bir hata oluştu.";
        toast.error(errorMsg);
      } finally {
        setIsSubmitting(false);
      }
    },
  });

  return (
    <main className="auth-page">
      <section className="auth-story" aria-label="İyi Seçim">
        <Link to="/products" className="auth-brand">
          <span className="brand-mark">
            <ShoppingBag size={20} />
          </span>
          <span>
            iyi<span className="brand-dot">.</span>seçim
          </span>
        </Link>
        <div className="auth-story-copy">
          <span className="eyebrow">İYİ SEÇİM, İYİ HİS</span>
          <h1>
            Güzel şeyler
            <br />
            biriktir.
          </h1>
          <p>Kendine ait bir yer aç, sevdiğin şeyleri keşfet.</p>
        </div>
        <span className="auth-story-note">İyi seçim, iyi hissettirir.</span>
      </section>

      <section className="auth-panel">
        <div className="auth-form-wrap">
          <span className="eyebrow">ARAMIZA KATIL</span>
          <h2>Hesabını oluştur</h2>
          <p className="auth-description">Birkaç adımda alışverişe hazır ol.</p>

          <form className="auth-form" onSubmit={formik.handleSubmit}>
            <label htmlFor="register-name">Ad Soyad</label>
            <div className="auth-input-wrap">
              <User size={18} aria-hidden="true" />
              <input
                id="register-name"
                type="text"
                name="name"
                value={formik.values.name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="Adın ve soyadın"
                autoComplete="name"
                required
              />
            </div>
            {formik.touched.name && formik.errors.name && (
              <p className="auth-error">{formik.errors.name}</p>
            )}

            <label htmlFor="register-email">E-posta adresi</label>
            <div className="auth-input-wrap">
              <Mail size={18} aria-hidden="true" />
              <input
                id="register-email"
                type="email"
                name="email"
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="ornek@mail.com"
                autoComplete="email"
                required
              />
            </div>
            {formik.touched.email && formik.errors.email && (
              <p className="auth-error">{formik.errors.email}</p>
            )}

            <label htmlFor="register-password">Şifre</label>
            <div className="auth-input-wrap">
              <LockKeyhole size={18} aria-hidden="true" />
              <input
                id="register-password"
                type="password"
                name="password"
                value={formik.values.password}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                placeholder="En az 6 karakter"
                autoComplete="new-password"
                required
              />
            </div>
            {formik.touched.password && formik.errors.password && (
              <p className="auth-error">{formik.errors.password}</p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="auth-submit"
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  Hesap oluştur <ArrowRight size={18} />
                </>
              )}
            </button>

            <p className="auth-switch">
              Zaten hesabın var mı? <Link to="/login">Giriş yap</Link>
            </p>
            <Link className="auth-back" to="/products">
              Mağazaya dön
            </Link>
          </form>
        </div>
      </section>
    </main>
  );
};

export default RegisterPage;
