import { api } from "./client";
import { User, UserRole } from "../types";

interface AuthResponse {
  token: string;
  user: User;
}

export function register(name: string, email: string, password: string, role: UserRole) {
  return api
    .post<AuthResponse>("/auth/register", { name, email, password, role })
    .then((res) => res.data);
}

export function login(email: string, password: string) {
  return api.post<AuthResponse>("/auth/login", { email, password }).then((res) => res.data);
}

export function getMe() {
  return api.get<User>("/auth/me").then((res) => res.data);
}
