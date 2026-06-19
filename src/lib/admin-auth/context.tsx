"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface AdminUser {
  id: string;
  phone: string;
  role: string;
  name: string;
}

interface AdminAuthContextValue {
  admin: AdminUser | null;
  isLoading: boolean;
  login: (phone: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

const STORAGE_KEY = "admin-token";
const CRM_STORAGE_KEY = "crm-token";

async function apiFetch(path: string, opts?: RequestInit, token?: string | null) {
  return fetch(`/api/admin/auth${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...opts?.headers,
    },
  });
}

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(STORAGE_KEY);
    if (!token) { setIsLoading(false); return; }

    apiFetch("/me", undefined, token)
      .then(r => r.ok ? r.json() : null)
      .then(data => data?.data ? setAdmin(data.data) : localStorage.removeItem(STORAGE_KEY))
      .catch(() => localStorage.removeItem(STORAGE_KEY))
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (phone: string, password: string) => {
    const res = await apiFetch("/login", {
      method: "POST",
      body: JSON.stringify({ phone, password }),
    });
    if (!res.ok) {
      const body = await res.json();
      throw new Error(body.error ?? "خطا در ورود");
    }
    const body = await res.json();
    const { token, user } = body.data;
    localStorage.setItem(STORAGE_KEY, token);
    localStorage.setItem(CRM_STORAGE_KEY, token);
    setAdmin(user);
  };

  const logout = async () => {
    const token = localStorage.getItem(STORAGE_KEY);
    await apiFetch("/logout", { method: "POST" }, token).catch(() => null);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(CRM_STORAGE_KEY);
    setAdmin(null);
    window.location.href = "/admin/login";
  };

  return (
    <AdminAuthContext.Provider value={{ admin, isLoading, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used inside AdminAuthProvider");
  return ctx;
}
