"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import type { User } from "@/types";
import { apiClient } from "@/lib/api/client";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  sendOtp: (phone: string, purpose?: "login" | "register") => Promise<void>;
  verifyOtpAndLogin: (phone: string, code: string) => Promise<{ token: string; user: User }>;
  loginWithPassword: (email: string, password: string) => Promise<{ token: string; user: User }>;
  setSession: (token: string, userData: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("crm-token");
    if (!token) { setIsLoading(false); return; }

    apiClient.get("/auth/me")
      .then((res) => setUser(res.data.data))
      .catch(() => localStorage.removeItem("crm-token"))
      .finally(() => setIsLoading(false));
  }, []);

  const sendOtp = async (phone: string, purpose: "login" | "register" = "login") => {
    await apiClient.post("/auth/send-otp", { phone, purpose });
  };

  const verifyOtpAndLogin = async (phone: string, code: string) => {
    const res = await apiClient.post("/auth/verify-otp", { phone, code });
    const { token, user: userData } = res.data.data;
    localStorage.setItem("crm-token", token);
    setUser(userData);
    return { token, user: userData };
  };

  const loginWithPassword = async (email: string, password: string) => {
    const res = await apiClient.post("/auth/login", { email, password });
    const { token, user: userData } = res.data.data;
    localStorage.setItem("crm-token", token);
    setUser(userData);
    return { token, user: userData };
  };

  const setSession = (token: string, userData: User) => {
    localStorage.setItem("crm-token", token);
    setUser(userData);
  };

  const refreshUser = async () => {
    try {
      const res = await apiClient.get("/auth/me");
      setUser(res.data.data);
    } catch { /* silent */ }
  };

  const logout = async () => {
    await apiClient.post("/auth/logout").catch(() => null);
    localStorage.removeItem("crm-token");
    setUser(null);
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, sendOtp, verifyOtpAndLogin, loginWithPassword, setSession, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
