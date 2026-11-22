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
    // Only a rejected session signs someone out. A slow or dropped request,
    // say on gate wifi, retries instead of sending an organizer to the login page.
    let cancelled = false;
    const check = async (attempt: number): Promise<void> => {
      try {
        const me = await authApi.getMe();
        if (!cancelled) setUser(me);
      } catch (err) {
        const status = (err as { status?: number }).status;
        if (status === 401 || status === 403) localStorage.removeItem(authApi.TOKEN_KEY);
        else if (attempt < 3 && !cancelled) {
          await new Promise((resolve) => setTimeout(resolve, 1500 * attempt));
          return check(attempt + 1);
        }
      }
    };
    check(1).finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
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
