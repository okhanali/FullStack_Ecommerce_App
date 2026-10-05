import * as Yup from "yup";

export const loginSchema = Yup.object({
  email: Yup.string()
    .email("Geçerli bir e-posta adresi giriniz")
    .required("E-posta zorunludur"),
  password: Yup.string().required("Şifre zorunludur"),
});

export const registerSchema = Yup.object({
  name: Yup.string()
    .required("Ad Soyad zorunludur")
    .min(2, "Ad en az 2 karakter olmalıdır."),
  email: Yup.string()
    .email("Geçerli bir e-posta adresi giriniz")
    .required("E-posta zorunludur"),
  password: Yup.string()
    .required("Şifre zorunludur.")
    .min(6, "Şifre en az 6 karakter olmalıdır."),
});
