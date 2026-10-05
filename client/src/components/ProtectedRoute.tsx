import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface ProtectedRouteProps {
  children?: React.ReactNode;
  allowedRole?: string | string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRole,
}) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div>Yükleniyor...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const isAllowed = Array.isArray(allowedRole)
    ? allowedRole.includes(user.role)
    : !allowedRole || user.role === allowedRole;

  if (!isAllowed) {
    return <Navigate to="/products" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};
