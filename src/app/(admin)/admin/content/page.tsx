"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { useAdminAuth } from "@/lib/admin-auth/context";
import { Sparkles, Users, FileText, TrendingUp, DollarSign, Settings, RefreshCw, BarChart3 } from "lucide-react";
import Link from "next/link";

interface Stats {
  totalUsers: number;
  totalGenerations: number;
  todayGenerations: number;
  monthGenerations: number;
  byPlan: { plan: string; _count: { id: number } }[];
  totalRevenue: number;
}

export default function AdminContentPage() {
  const { admin } = useAdminAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const token = typeof window !== "undefined" ? localStorage.getItem("admin-token") || localStorage.getItem("crm-token") : null;

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/content/stats", { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setStats(data.data);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetchStats(); }, []);

  const planLabels: Record<string, string> = { FREE: "رایگان", PRO: "پرو", PLUS: "پلاس" };
  const planColors: Record<string, string> = { FREE: "text-white/50", PRO: "text-violet-400", PLUS: "text-amber-400" };

  const statCards = [
    { label: "کل کاربران", value: stats?.totalUsers ?? 0, icon: Users, color: "from-blue-500 to-indigo-600" },
    { label: "کل تولیدها", value: stats?.totalGenerations ?? 0, icon: FileText, color: "from-violet-500 to-purple-600" },
    { label: "تولید امروز", value: stats?.todayGenerations ?? 0, icon: TrendingUp, color: "from-emerald-500 to-teal-600" },
    { label: "تولید این ماه", value: stats?.monthGenerations ?? 0, icon: BarChart3, color: "from-amber-500 to-orange-600" },
  ];

  return (
    <div className="p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">مدیریت تولید محتوا</h1>
            <p className="text-white/40 text-sm">content.persicore.ir</p>
          </div>
        </div>
        <button onClick={fetchStats} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-white/50 hover:bg-white/5 hover:text-white/80 transition-all text-sm">
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> بروزرسانی
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div key={card.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              className="bg-white/3 border border-white/8 rounded-2xl p-5">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-3`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div className="text-2xl font-bold text-white">{loading ? "—" : card.value.toLocaleString("fa-IR")}</div>
              <div className="text-white/40 text-sm mt-1">{card.label}</div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Plan distribution */}
        <div className="bg-white/3 border border-white/8 rounded-2xl p-5">
          <h3 className="text-white/70 font-medium mb-4 flex items-center gap-2"><Users className="w-4 h-4" /> توزیع پلن‌ها</h3>
          {loading ? (
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-8 bg-white/5 rounded-lg animate-pulse" />)}</div>
          ) : (
            <div className="space-y-3">
              {["FREE", "PRO", "PLUS"].map((plan) => {
                const count = stats?.byPlan.find((p) => p.plan === plan)?._count.id ?? 0;
                const total = stats?.totalUsers ?? 1;
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <div key={plan}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm font-medium ${planColors[plan]}`}>{planLabels[plan]}</span>
                      <span className="text-white/40 text-xs">{count} ({pct}%)</span>
                    </div>
                    <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: "easeOut" }}
                        className={`h-full rounded-full ${plan === "PLUS" ? "bg-amber-400" : plan === "PRO" ? "bg-violet-400" : "bg-white/20"}`} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Revenue */}
        <div className="bg-white/3 border border-white/8 rounded-2xl p-5">
          <h3 className="text-white/70 font-medium mb-4 flex items-center gap-2"><DollarSign className="w-4 h-4" /> درآمد کل</h3>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold text-emerald-400">
              {loading ? "—" : (stats?.totalRevenue ?? 0).toLocaleString("fa-IR")}
            </span>
            <span className="text-white/30 text-sm mb-1">تومان</span>
          </div>
          <p className="text-white/30 text-sm mt-2">از اشتراک‌های فعال</p>
        </div>

        {/* Quick actions */}
        <div className="bg-white/3 border border-white/8 rounded-2xl p-5">
          <h3 className="text-white/70 font-medium mb-4 flex items-center gap-2"><Settings className="w-4 h-4" /> دسترسی سریع</h3>
          <div className="space-y-2">
            {[
              { href: "/admin/content/users", label: "مدیریت کاربران", icon: Users },
              { href: "/admin/content/generations", label: "تاریخچه تولیدها", icon: FileText },
              { href: "/admin/content/settings", label: "تنظیمات محصول", icon: Settings },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/3 border border-white/8 hover:bg-white/6 hover:border-white/12 transition-all text-white/60 hover:text-white/85 text-sm">
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
