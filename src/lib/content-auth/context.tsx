"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface ContentUser {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  plan: "FREE" | "PRO" | "PLUS" | "UNLIMITED";
  usedThisMonth: number;
  isCrmUser?: boolean;
}

interface ContentAuthContextValue {
  user: ContentUser | null;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  register: (name: string, identifier: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const ContentAuthContext = createContext<ContentAuthContextValue | null>(null);

const CONTENT_API = "/api/content";

async function apiFetch(path: string, options?: RequestInit) {
  const token = typeof window !== "undefined" ? localStorage.getItem("content-token") : null;
  const res = await fetch(`${CONTENT_API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.headers ?? {}),
    },
  });
  return res;
}

export function ContentAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<ContentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMe = async () => {
    const token = localStorage.getItem("content-token") || localStorage.getItem("crm-token");
    if (!token) { setIsLoading(false); return; }

    // store whichever token we find
    if (!localStorage.getItem("content-token") && token) {
      localStorage.setItem("content-token", token);
    }

    try {
      const res = await apiFetch("/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.data);
      } else {
        localStorage.removeItem("content-token");
      }
    } catch {
      localStorage.removeItem("content-token");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Check for SSO token from CRM in URL params
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const ssoToken = params.get("sso");
      if (ssoToken) {
        localStorage.setItem("content-token", ssoToken);
        params.delete("sso");
        const newUrl = window.location.pathname + (params.toString() ? `?${params}` : "");
        window.history.replaceState({}, "", newUrl);
      }
    }
    fetchMe();
  }, []);

  const login = async (identifier: string, password: string) => {
    const res = await apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ identifier, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "خطا در ورود");
    localStorage.setItem("content-token", data.data.token);
    setUser(data.data.user);
  };

  const register = async (name: string, identifier: string, password: string) => {
    const res = await apiFetch("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, identifier, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "خطا در ثبت‌نام");
    localStorage.setItem("content-token", data.data.token);
    setUser(data.data.user);
  };

  const logout = () => {
    localStorage.removeItem("content-token");
    setUser(null);
    window.location.href = "/content/login";
  };

  const refreshUser = async () => {
    await fetchMe();
  };

  return (
    <ContentAuthContext.Provider value={{ user, isLoading, login, register, logout, refreshUser }}>
      {children}
    </ContentAuthContext.Provider>
  );
}

export function useContentAuth() {
  const ctx = useContext(ContentAuthContext);
  if (!ctx) throw new Error("useContentAuth must be used within ContentAuthProvider");
  return ctx;
}
