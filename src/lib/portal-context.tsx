"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface PortalUser {
  id: string;
  name: string;
  phone: string | null;
  role: string;
  clientId: string;
  client?: { id: string; companyName: string; contactName: string };
}

interface PortalContextValue {
  user: PortalUser | null;
  token: string | null;
  isLoading: boolean;
  sendOtp: (phone: string) => Promise<void>;
  verifyOtpAndLogin: (phone: string, code: string) => Promise<void>;
  loginWithPassword: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const PortalContext = createContext<PortalContextValue | null>(null);

export function PortalProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<PortalUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("portal-token");
    if (!stored) { setIsLoading(false); return; }
    setToken(stored);

    fetch("/api/portal/auth/me", { headers: { Authorization: `Bearer ${stored}` } })
      .then(async (r) => {
        if (!r.ok) throw new Error("unauthorized");
        const d = await r.json();
        setUser(d.data);
      })
      .catch(() => {
        localStorage.removeItem("portal-token");
        setToken(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const sendOtp = async (phone: string) => {
    const res = await fetch("/api/portal/auth/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      throw new Error(d.error ?? "خطا در ارسال کد");
    }
  };

  const verifyOtpAndLogin = async (phone: string, code: string) => {
    const res = await fetch("/api/portal/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, code }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      throw new Error(d.error ?? "کد اشتباه است");
    }
    const d = await res.json();
    const { token: t, user: u } = d.data;
    localStorage.setItem("portal-token", t);
    setToken(t);
    setUser(u);
  };

  const loginWithPassword = async (email: string, password: string) => {
    const res = await fetch("/api/portal/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      throw new Error(d.error ?? "خطا در ورود");
    }
    const d = await res.json();
    const { token: t, user: u } = d.data;
    localStorage.setItem("portal-token", t);
    setToken(t);
    setUser(u);
  };

  const logout = () => {
    fetch("/api/portal/auth/logout", { method: "POST" }).catch((err) => console.error(err));
    localStorage.removeItem("portal-token");
    setToken(null);
    setUser(null);
    window.location.href = "/portal/login";
  };

  return (
    <PortalContext.Provider value={{ user, token, isLoading, sendOtp, verifyOtpAndLogin, loginWithPassword, logout }}>
      {children}
    </PortalContext.Provider>
  );
}

export function usePortal() {
  const ctx = useContext(PortalContext);
  if (!ctx) throw new Error("usePortal must be used within PortalProvider");
  return ctx;
}

export function portalFetch(path: string, options: RequestInit = {}, token?: string | null) {
  const stored = token ?? (typeof window !== "undefined" ? localStorage.getItem("portal-token") : null);
  return fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(stored ? { Authorization: `Bearer ${stored}` } : {}),
      ...(options.headers ?? {}),
    },
  });
}
