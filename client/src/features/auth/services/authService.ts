import { api } from "../../../services/api";
import type {
  User,
  AuthResponse,
  LoginCredentials,
  RegisterCredentials,
} from "../types/authTypes";

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post<{ data: AuthResponse }>(
      "/users/login",
      credentials,
    );
    return response.data.data;
  },

  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    const response = await api.post<{ data: AuthResponse }>(
      "/users/register",
      credentials,
    );
    return response.data.data;
  },

  async getCurrentUser(): Promise<User> {
    const response = await api.get<{ data: { user: User } }>("/users/me");
    return response.data.data.user;
  },
};
