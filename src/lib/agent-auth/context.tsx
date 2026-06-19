"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface AgentUser {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  plan: "FREE" | "STARTER" | "PRO" | "ENTERPRISE";
  isCrmUser?: boolean;
}

interface AgentAuthContextValue {
  user: AgentUser | null;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  register: (name: string, identifier: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AgentAuthContext = createContext<AgentAuthContextValue | null>(null);

const API = "/api/agent";

async function apiFetch(path: string, options?: RequestInit) {
  const token = typeof window !== "undefined" ? localStorage.getItem("agent-token") : null;
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.headers ?? {}),
    },
  });
  return res;
}

export function AgentAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AgentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMe = async () => {
    const token = localStorage.getItem("agent-token") || localStorage.getItem("crm-token");
    if (!token) { setIsLoading(false); return; }

    if (!localStorage.getItem("agent-token") && token) {
      localStorage.setItem("agent-token", token);
    }

    try {
      const res = await apiFetch("/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUser(data.data);
      } else {
        localStorage.removeItem("agent-token");
      }
    } catch {
      localStorage.removeItem("agent-token");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const ssoToken = params.get("sso");
      if (ssoToken) {
        localStorage.setItem("agent-token", ssoToken);
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
    localStorage.setItem("agent-token", data.data.token);
    setUser(data.data.user);
  };

  const register = async (name: string, identifier: string, password: string) => {
    const res = await apiFetch("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, identifier, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "خطا در ثبت‌نام");
    localStorage.setItem("agent-token", data.data.token);
    setUser(data.data.user);
  };

  const logout = () => {
    localStorage.removeItem("agent-token");
    setUser(null);
    window.location.href = "/agent/login";
  };

  const refreshUser = async () => { await fetchMe(); };

  return (
    <AgentAuthContext.Provider value={{ user, isLoading, login, register, logout, refreshUser }}>
      {children}
    </AgentAuthContext.Provider>
  );
}

export function useAgentAuth() {
  const ctx = useContext(AgentAuthContext);
  if (!ctx) throw new Error("useAgentAuth must be used within AgentAuthProvider");
  return ctx;
}
