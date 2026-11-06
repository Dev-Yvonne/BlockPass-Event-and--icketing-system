"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, UserRole } from "../types";
import * as authApi from "../lib/api";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string, role: UserRole) => Promise<User>;
  logout: () => void;
  becomeOrganizer: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(authApi.TOKEN_KEY);
    if (!token) {
      setLoading(false);
      return;
    }
    authApi
      .getMe()
      .then(setUser)
      .catch(() => localStorage.removeItem(authApi.TOKEN_KEY))
      .finally(() => setLoading(false));
  }, []);

  async function login(email: string, password: string) {
    const { token, user: loggedInUser } = await authApi.login(email, password);
    localStorage.setItem(authApi.TOKEN_KEY, token);
    setUser(loggedInUser);
    return loggedInUser;
  }

  async function register(name: string, email: string, password: string, role: UserRole) {
    const { token, user: newUser } = await authApi.register(name, email, password, role);
    localStorage.setItem(authApi.TOKEN_KEY, token);
    setUser(newUser);
    return newUser;
  }

  async function becomeOrganizer() {
    setUser(await authApi.becomeOrganizer());
  }

  function logout() {
    localStorage.removeItem(authApi.TOKEN_KEY);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, becomeOrganizer }}>
      {children}
    </AuthContext.Provider>
  );
}

/** Where each role lands after signing in. */
export function homeFor(role: UserRole) {
  if (role === "admin") return "/admin";
  return role === "organizer" ? "/organizer" : "/dashboard";
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
