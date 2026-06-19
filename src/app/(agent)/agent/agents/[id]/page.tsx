"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAgentAuth } from "@/lib/agent-auth/context";
import Link from "next/link";

interface Agent {
  id: string; name: string; businessType: string; status: string;
  totalMessages: number; totalConversations: number; totalLeads: number;
  welcomeMessage: string; fallbackMessage: string; tone: string;
  languages: string[]; createdAt: string;
  knowledge: { id: string; title: string; type: string; tokens: number }[];
  customization?: { primaryColor: string; avatarEmoji?: string; position: string };
}

function apiFetch(path: string, options?: RequestInit) {
  const token = typeof window !== "undefined" ? localStorage.getItem("agent-token") || localStorage.getItem("crm-token") : null;
  return fetch(`/api/agent${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.headers ?? {}),
    },
  });
}

const NAV = [
  { key: "overview", label: "نمای کلی" },
  { key: "conversations", label: "مکالمات", href: "conversations" },
  { key: "knowledge", label: "دانش‌پایه", href: "knowledge" },
  { key: "customize", label: "شخصی‌سازی", href: "customize" },
  { key: "embed", label: "کد نصب", href: "embed" },
];

export default function AgentDetailPage() {
  const { user, isLoading } = useAgentAuth();
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) router.push("/agent/login");
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user && id) {
      apiFetch(`/agents/${id}`).then((r) => r.json()).then((d) => {
        setAgent(d.data);
        setLoading(false);
      });
    }
  }, [user, id]);

  const toggleStatus = async () => {
    if (!agent) return;
    setToggling(true);
    const newStatus = agent.status === "ACTIVE" ? "PAUSED" : "ACTIVE";
    const res = await apiFetch(`/agents/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: newStatus }),
    });
    const d = await res.json();
    setAgent((prev) => prev ? { ...prev, status: d.data.status } : null);
    setToggling(false);
  };

  if (loading) return <div className="min-h-screen bg-[#07071a] flex items-center justify-center text-white/40">در حال بارگذاری...</div>;
  if (!agent) return <div className="min-h-screen bg-[#07071a] flex items-center justify-center text-white/40">ایجنت یافت نشد</div>;

  const color = agent.customization?.primaryColor ?? "#5b6cff";

  return (
    <div className="min-h-screen bg-[#07071a] text-white" dir="rtl">
      {/* Header */}
      <div className="border-b border-white/10 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <Link href="/agent/dashboard" className="text-white/40 hover:text-white text-sm transition-colors">
            ← داشبورد
          </Link>
          <span className="text-white/20">/</span>
          <span className="font-medium">{agent.name}</span>
          <div className="mr-auto flex items-center gap-3">
            <span className={`text-xs px-2.5 py-1 rounded-full ${agent.status === "ACTIVE" ? "bg-green-400/15 text-green-400" : "bg-yellow-400/15 text-yellow-400"}`}>
              {agent.status === "ACTIVE" ? "فعال" : "متوقف"}
            </span>
            <button
              onClick={toggleStatus}
              disabled={toggling}
              className="text-sm px-4 py-2 rounded-xl border border-white/15 hover:border-white/30 text-white/60 hover:text-white transition-all disabled:opacity-50"
            >
              {agent.status === "ACTIVE" ? "توقف ایجنت" : "فعال‌سازی"}
            </button>
          </div>
        </div>
      </div>

      {/* Sub nav */}
      <div className="border-b border-white/8 px-6">
        <div className="max-w-5xl mx-auto flex gap-1">
          {NAV.map((n) => (
            <div key={n.key}>
              {n.href ? (
                <Link
                  href={`/agent/agents/${id}/${n.href}`}
                  className="block px-4 py-3 text-sm text-white/50 hover:text-white border-b-2 border-transparent hover:border-white/20 transition-all"
                >
                  {n.label}
                </Link>
              ) : (
                <span className="block px-4 py-3 text-sm text-white border-b-2 border-[#5b6cff]">
                  {n.label}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "مکالمات", value: agent.totalConversations, icon: "💬" },
            { label: "پیام‌ها", value: agent.totalMessages, icon: "✉️" },
            { label: "لیدهای ایجادشده", value: agent.totalLeads, icon: "🎯" },
          ].map((s) => (
            <div key={s.label} className="bg-white/3 border border-white/10 rounded-2xl p-5">
              <div className="text-2xl mb-2">{s.icon}</div>
              <div className="text-2xl font-bold">{s.value}</div>
              <div className="text-sm text-white/50 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* Settings overview */}
          <div className="bg-white/3 border border-white/10 rounded-2xl p-5">
            <h3 className="font-semibold mb-4">تنظیمات ایجنت</h3>
            <div className="space-y-3 text-sm">
              {[
                { label: "لحن", value: { friendly: "صمیمی", formal: "رسمی", professional: "حرفه‌ای" }[agent.tone] ?? agent.tone },
                { label: "زبان‌ها", value: (agent.languages as string[]).join("، ") },
                { label: "پیام خوش‌آمد", value: agent.welcomeMessage?.slice(0, 60) + "..." },
              ].map((row) => (
                <div key={row.label} className="flex gap-2">
                  <span className="text-white/40 w-24 flex-shrink-0">{row.label}</span>
                  <span className="text-white/80">{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Knowledge summary */}
          <div className="bg-white/3 border border-white/10 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">دانش‌پایه</h3>
              <Link href={`/agent/agents/${id}/knowledge`} className="text-sm text-[#5b6cff] hover:underline">
                مدیریت
              </Link>
            </div>
            <div className="space-y-2">
              {agent.knowledge?.slice(0, 4).map((k) => (
                <div key={k.id} className="flex items-center gap-2 text-sm">
                  <span className="text-white/30">
                    {{ TEXT: "📝", FILE: "📎", URL: "🔗" }[k.type] ?? "📄"}
                  </span>
                  <span className="text-white/70 truncate">{k.title}</span>
                  <span className="text-white/30 text-xs mr-auto">{k.tokens} توکن</span>
                </div>
              ))}
              {(!agent.knowledge || agent.knowledge.length === 0) && (
                <p className="text-white/40 text-sm">هیچ دانشی اضافه نشده</p>
              )}
            </div>
          </div>

          {/* Quick links */}
          <div className="col-span-2 grid grid-cols-3 gap-3">
            {[
              { href: `conversations`, label: "مشاهده مکالمات", icon: "💬", desc: "تاریخچه گفتگوها" },
              { href: `customize`, label: "شخصی‌سازی ظاهر", icon: "🎨", desc: "رنگ، آواتار، موقعیت" },
              { href: `embed`, label: "دریافت کد نصب", icon: "🔗", desc: "نصب روی سایت" },
            ].map((item) => (
              <Link
                key={item.href}
                href={`/agent/agents/${id}/${item.href}`}
                className="bg-white/3 border border-white/10 hover:border-[#5b6cff]/40 rounded-2xl p-4 transition-all group"
              >
                <div className="text-2xl mb-2">{item.icon}</div>
                <div className="font-medium text-sm group-hover:text-[#5b6cff] transition-colors">{item.label}</div>
                <div className="text-white/40 text-xs mt-1">{item.desc}</div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
