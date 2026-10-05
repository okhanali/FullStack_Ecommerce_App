import type { User } from "./types/authTypes";

export const getPostAuthPath = (role: User["role"]): string => {
  if (role === "admin") return "/admin/dashboard";
  if (role === "seller" || role === "vendor") return "/vendor/dashboard";
  if (role === "courier") return "/courier/dashboard";
  return "/products";
};
