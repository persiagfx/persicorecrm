"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAgentAuth } from "@/lib/agent-auth/context";
import Link from "next/link";

interface Agent {
  id: string;
  name: string;
  businessType: string;
  status: string;
  totalMessages: number;
  totalConversations: number;
  totalLeads: number;
  createdAt: string;
  customization?: { primaryColor: string; avatarEmoji?: string };
}

function apiFetch(path: string) {
  const token = typeof window !== "undefined" ? localStorage.getItem("agent-token") || localStorage.getItem("crm-token") : null;
  return fetch(`/api/agent${path}`, {
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
}

const PLAN_LABELS: Record<string, string> = {
  FREE: "رایگان", STARTER: "پایه", PRO: "حرفه‌ای", ENTERPRISE: "سازمانی",
};
const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "text-green-400 bg-green-400/10",
  DRAFT: "text-yellow-400 bg-yellow-400/10",
  PAUSED: "text-orange-400 bg-orange-400/10",
};
const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "فعال", DRAFT: "پیش‌نویس", PAUSED: "متوقف",
};
const BT_ICONS: Record<string, string> = {
  ecommerce: "🛒", restaurant: "🍽️", clinic: "🏥", education: "📚",
  legal: "⚖️", travel: "✈️", beauty: "💄", construction: "🏗️",
  insurance: "🛡️", software: "💻", b2b: "🤝", other: "🏢",
};

export default function AgentDashboardPage() {
  const { user, isLoading, logout } = useAgentAuth();
  const router = useRouter();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) router.push("/agent/login");
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user) {
      apiFetch("/agents").then((r) => r.json()).then((d) => {
        setAgents(d.data ?? []);
        setLoading(false);
      });
    }
  }, [user]);

  const totalMessages = agents.reduce((s, a) => s + a.totalMessages, 0);
  const totalLeads = agents.reduce((s, a) => s + a.totalLeads, 0);

  return (
    <div className="min-h-screen bg-[#07071a] text-white" dir="rtl">
      {/* Navbar */}
      <div className="border-b border-white/10 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-lg">
            <span>🤖</span> ایجنت‌ساز
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-white/50">{user?.name}</span>
            <Link href="/agent/plans" className="text-xs px-2.5 py-1 rounded-full bg-[#5b6cff]/20 text-[#5b6cff] hover:bg-[#5b6cff]/30 transition-colors">
              {PLAN_LABELS[user?.plan ?? "FREE"]} ↑
            </Link>
            <button onClick={logout} className="text-white/40 hover:text-white text-sm transition-colors">
              خروج
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: "ایجنت‌های فعال", value: agents.filter((a) => a.status === "ACTIVE").length, icon: "🤖" },
            { label: "کل مکالمات", value: agents.reduce((s, a) => s + a.totalConversations, 0), icon: "💬" },
            { label: "کل پیام‌ها", value: totalMessages, icon: "✉️" },
            { label: "لیدهای ایجاد‌شده", value: totalLeads, icon: "🎯" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white/3 border border-white/10 rounded-2xl p-5">
              <div className="text-2xl mb-2">{stat.icon}</div>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-sm text-white/50 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Agents list */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold">ایجنت‌های من</h2>
          <Link
            href="/agent/new"
            className="bg-[#5b6cff] hover:bg-[#4a5ae8] text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
          >
            + ایجنت جدید
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-20 text-white/40">در حال بارگذاری...</div>
        ) : agents.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🤖</div>
            <p className="text-white/50 mb-6">هنوز هیچ ایجنتی نساختید</p>
            <Link href="/agent/new" className="bg-[#5b6cff] hover:bg-[#4a5ae8] text-white px-6 py-3 rounded-xl font-medium transition-colors">
              ساخت اولین ایجنت
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {agents.map((agent) => (
              <div key={agent.id} className="bg-white/3 border border-white/10 hover:border-white/20 rounded-2xl p-5 transition-all">
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{ background: (agent.customization?.primaryColor ?? "#5b6cff") + "22" }}
                  >
                    {BT_ICONS[agent.businessType] ?? "🤖"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-semibold">{agent.name}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[agent.status] ?? "text-white/40 bg-white/5"}`}>
                        {STATUS_LABELS[agent.status] ?? agent.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-white/40">
                      <span>💬 {agent.totalConversations} مکالمه</span>
                      <span>✉️ {agent.totalMessages} پیام</span>
                      <span>🎯 {agent.totalLeads} لید</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Link href={`/agent/agents/${agent.id}`} className="px-4 py-2 rounded-xl border border-white/15 hover:border-white/30 text-sm text-white/70 hover:text-white transition-all">
                      داشبورد
                    </Link>
                    <Link href={`/agent/agents/${agent.id}/embed`} className="px-4 py-2 rounded-xl bg-[#5b6cff]/15 hover:bg-[#5b6cff]/25 border border-[#5b6cff]/30 text-sm text-[#5b6cff] transition-all">
                      کد نصب
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
