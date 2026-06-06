"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  login as apiLogin,
  logout as apiLogout,
  getMe,
  getStoredUser,
  setStoredUser,
  setTokens,
  clearTokens,
} from "@/utils/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const hydrate = useCallback(async () => {
    const stored = getStoredUser();
    if (!stored) {
      setLoading(false);
      return;
    }
    setUser(stored);
    try {
      const profile = await getMe();
      setUser(profile);
      setStoredUser(profile);
    } catch {
      clearTokens();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const login = async (credentials) => {
    const res = await apiLogin(credentials);
    setTokens(res.token, res.refresh_token);
    setStoredUser(res.user);
    setUser(res.user);
    return res.user;
  };

  const logout = async () => {
    try {
      await apiLogout();
    } catch {
      /* ignore */
    }
    clearTokens();
    setUser(null);
    router.push("/login");
  };

  const updateUser = (data) => {
    setUser(data);
    setStoredUser(data);
  };

  const clearSession = () => {
    clearTokens();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, clearSession, updateUser, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
