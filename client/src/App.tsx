import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";

import { ProductsPage } from "./features/products/pages/ProductsPage";
import { ProductDetailPage } from "./features/products/pages/ProductDetailPage";
import { CartPage } from "./features/cart/pages/CartPage";
import { WishlistPage } from "./features/wishlist/pages/WishlistPage";
import { CheckoutPage } from "./features/orders/pages/CheckoutPage";
import { MyOrdersPage } from "./features/orders/pages/MyOrdersPage";
import { VendorDashboardPage } from "./features/vendor/pages/VendorDashboardPage";
import { CourierDashboardPage } from "./features/courier/pages/CourierDashboardPage";
import { AdminDashboardPage } from "./features/admin/pages/AdminDashboardPage";
import { CartProvider } from "./context/CartContext";

import RegisterPage from "./features/auth/pages/RegisterPage";
import { Layout } from "./layouts/Layout";
import { LoginPage } from "./features/auth/pages/LoginPage";
import { AuthProvider } from "./context/AuthProvider";
import { ProtectedRoute } from "./components/ProtectedRoute";

const OrderTrackingPage = lazy(() =>
  import("./features/orders/pages/OrderTrackingPage").then((module) => ({
    default: module.OrderTrackingPage,
  })),
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <BrowserRouter>
            <Routes>
              {/* Auth Rotaları */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Genel Layout İçindeki Rotalar */}
              <Route element={<Layout />}>
                <Route path="/products" element={<ProductsPage />} />
                <Route path="/products/:id" element={<ProductDetailPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/wishlist" element={<WishlistPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route
                  path="/account/orders"
                  element={
                    <ProtectedRoute allowedRole="customer">
                      <MyOrdersPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/orders/:id"
                  element={
                    <ProtectedRoute>
                      <Suspense
                        fallback={
                          <div className="p-8 text-sm text-gray-600">
                            Takip ekranı yükleniyor...
                          </div>
                        }
                      >
                        <OrderTrackingPage />
                      </Suspense>
                    </ProtectedRoute>
                  }
                />

                {/* Rol Korumalı Paneller */}
                <Route
                  path="/vendor/dashboard"
                  element={
                    <ProtectedRoute allowedRole={["seller", "vendor"]}>
                      <VendorDashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/courier/dashboard"
                  element={
                    <ProtectedRoute allowedRole="courier">
                      <CourierDashboardPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/dashboard"
                  element={
                    <ProtectedRoute allowedRole="admin">
                      <AdminDashboardPage />
                    </ProtectedRoute>
                  }
                />
              </Route>

              {/* Kök ve Bulunamayan Sayfalar İçin Yönlendirme */}
              <Route path="/" element={<Navigate to="/products" replace />} />
              <Route path="*" element={<Navigate to="/products" replace />} />
            </Routes>
          </BrowserRouter>
          <Toaster position="top-right" />
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
