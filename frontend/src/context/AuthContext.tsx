import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, UserRole } from "../types";
import * as authApi from "../api/auth";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("blockpass_token");
    if (!token) {
      setLoading(false);
      return;
    }
    authApi
      .getMe()
      .then(setUser)
      .catch(() => localStorage.removeItem("blockpass_token"))
      .finally(() => setLoading(false));
  }, []);

  async function login(email: string, password: string) {
    const { token, user: loggedInUser } = await authApi.login(email, password);
    localStorage.setItem("blockpass_token", token);
    setUser(loggedInUser);
  }

  async function register(name: string, email: string, password: string, role: UserRole) {
    const { token, user: newUser } = await authApi.register(name, email, password, role);
    localStorage.setItem("blockpass_token", token);
    setUser(newUser);
  }

  function logout() {
    localStorage.removeItem("blockpass_token");
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
