"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  Users, Building2, DollarSign, TrendingUp, TrendingDown, Briefcase,
  FileSignature, Receipt, CheckSquare, Ticket, Activity, BarChart3,
  ArrowUpRight, ArrowDownRight, Clock, Circle, RefreshCw,
} from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { formatPrice, toJalali, timeAgo } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import { USER_ROLES } from "@/lib/constants";
import type { UserRole } from "@/types";

interface OverviewData {
  overview: {
    users: { total: number; active: number };
    clients: { total: number; active: number };
    projects: { total: number; active: number };
    leads: { total: number; open: number };
    revenue: { total: number; pending: number; thisMonth: number; growth: number };
    contracts: { total: number; signed: number };
    expenses: { total: number; amount: number };
    tasks: { total: number; open: number };
    tickets: { open: number };
    tenants: { total: number; active: number };
  };
  usersByRole: { role: string; count: number }[];
  revenueChart: { month: string; revenue: number }[];
  userGrowth: { month: string; count: number }[];
  recentActivity: {
    id: string; action: string; entityType: string; entityName: string;
    description: string; createdAt: string;
    actor: { id: string; name: string; avatar: string | null; role: string };
  }[];
  recentUsers: { id: string; name: string; email: string; role: string; createdAt: string; isActive: boolean }[];
  topClients: { id: string; companyName: string; totalRevenue: number; status: string; projectCount: number }[];
}

const ACTION_COLOR: Record<string, string> = {
  create: "bg-emerald-500/20 text-emerald-400",
  update: "bg-blue-500/20 text-blue-400",
  delete: "bg-red-500/20 text-red-400",
  login: "bg-violet-500/20 text-violet-400",
  contract_sent: "bg-amber-500/20 text-amber-400",
};

function StatBox({ label, value, sub, icon: Icon, color, trend }: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; color: string; trend?: number;
}) {
  return (
    <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.15 }}
      className="p-5 rounded-2xl bg-white/[0.04] border border-white/[0.07] hover:border-white/15 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", color)}>
          <Icon className="w-4.5 h-4.5" />
        </div>
        {trend !== undefined && (
          <span className={cn("flex items-center gap-0.5 text-xs font-medium",
            trend >= 0 ? "text-emerald-400" : "text-red-400")}>
            {trend >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {Math.abs(trend)}٪
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-white tabular-nums">{value}</p>
      <p className="text-xs text-white/40 mt-0.5">{label}</p>
      {sub && <p className="text-[10px] text-white/25 mt-1">{sub}</p>}
    </motion.div>
  );
}

export default function SuperAdminDashboard() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    setLoading(true);
    apiClient.get("/admin/overview")
      .then(r => setData(r.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const o = data?.overview;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">داشبورد ناظر کل</h1>
          <p className="text-sm text-white/35 mt-0.5">نمای کلی از تمام سیستم</p>
        </div>
        <button onClick={fetchData} disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white/50 hover:text-white text-xs transition-colors disabled:opacity-40">
          <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />بروزرسانی
        </button>
      </motion.div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-white/[0.04] animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* KPIs — Row 1: کسب‌وکار */}
          <div>
            <p className="text-[11px] font-semibold text-white/30 uppercase tracking-widest mb-3">کسب‌وکارهای ثبت‌شده</p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatBox label="کل کسب‌وکارها" value={o?.tenants.total ?? 0}
                sub={`${o?.tenants.active ?? 0} فعال`} icon={Building2} color="bg-violet-500/20 text-violet-400" />
              <StatBox label="کل کاربران" value={o?.users.total ?? 0}
                sub={`${o?.users.active ?? 0} فعال`} icon={Users} color="bg-blue-500/20 text-blue-400" />
              <StatBox label="کل مشتریان" value={o?.clients.total ?? 0}
                sub={`${o?.clients.active ?? 0} فعال`} icon={Briefcase} color="bg-cyan-500/20 text-cyan-400" />
              <StatBox label="لیدهای باز" value={o?.leads.open ?? 0}
                sub={`از ${o?.leads.total ?? 0} کل`} icon={Activity} color="bg-amber-500/20 text-amber-400" />
            </div>
          </div>

          {/* KPIs — Row 2: مالی */}
          <div>
            <p className="text-[11px] font-semibold text-white/30 uppercase tracking-widest mb-3">مالی و درآمد</p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatBox label="درآمد کل (پرداخت‌شده)" value={formatPrice(o?.revenue.total ?? 0, true)}
                icon={DollarSign} color="bg-emerald-500/20 text-emerald-400" trend={o?.revenue.growth} />
              <StatBox label="این ماه" value={formatPrice(o?.revenue.thisMonth ?? 0, true)}
                icon={TrendingUp} color="bg-green-500/20 text-green-400" />
              <StatBox label="در انتظار وصول" value={formatPrice(o?.revenue.pending ?? 0, true)}
                icon={Clock} color="bg-orange-500/20 text-orange-400" />
              <StatBox label="کل هزینه‌ها" value={formatPrice(o?.expenses.amount ?? 0, true)}
                sub={`${o?.expenses.total ?? 0} تراکنش`} icon={TrendingDown} color="bg-red-500/20 text-red-400" />
            </div>
          </div>

          {/* KPIs — Row 3: عملیات */}
          <div>
            <p className="text-[11px] font-semibold text-white/30 uppercase tracking-widest mb-3">عملیات</p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatBox label="پروژه‌های فعال" value={o?.projects.active ?? 0}
                sub={`از ${o?.projects.total ?? 0} کل`} icon={Briefcase} color="bg-purple-500/20 text-purple-400" />
              <StatBox label="وظایف باز" value={o?.tasks.open ?? 0}
                sub={`از ${o?.tasks.total ?? 0} کل`} icon={CheckSquare} color="bg-pink-500/20 text-pink-400" />
              <StatBox label="قراردادهای امضاشده" value={o?.contracts.signed ?? 0}
                sub={`از ${o?.contracts.total ?? 0} کل`} icon={FileSignature} color="bg-teal-500/20 text-teal-400" />
              <StatBox label="تیکت‌های باز" value={o?.tickets.open ?? 0}
                icon={Ticket} color="bg-rose-500/20 text-rose-400" />
            </div>
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Revenue chart */}
            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
              <h3 className="text-sm font-semibold text-white/70 mb-4">روند درآمد (میلیون تومان)</h3>
              {(data?.revenueChart.length ?? 0) > 0 ? (
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={data!.revenueChart} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.3)" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "rgba(255,255,255,0.3)" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 11 }} labelStyle={{ color: "rgba(255,255,255,0.6)" }} />
                    <Area type="monotone" dataKey="revenue" stroke="#7c3aed" strokeWidth={2} fill="url(#revenueGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-44 flex items-center justify-center text-white/20 text-sm">بدون داده</div>
              )}
            </div>

            {/* User growth */}
            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
              <h3 className="text-sm font-semibold text-white/70 mb-4">رشد کاربران جدید</h3>
              {(data?.userGrowth.length ?? 0) > 0 ? (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={data!.userGrowth} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: "rgba(255,255,255,0.3)" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "rgba(255,255,255,0.3)" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 11 }} labelStyle={{ color: "rgba(255,255,255,0.6)" }} />
                    <Bar dataKey="count" name="کاربر جدید" fill="#0ea5e9" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-44 flex items-center justify-center text-white/20 text-sm">بدون داده</div>
              )}
            </div>
          </div>

          {/* Bottom row: Activity + Users + Clients */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Activity */}
            <div className="lg:col-span-1 p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
              <h3 className="text-sm font-semibold text-white/70 mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-violet-400" />فعالیت‌های اخیر
              </h3>
              <div className="space-y-3">
                {data?.recentActivity.slice(0, 8).map(log => {
                  const colorClass = ACTION_COLOR[log.action] ?? "bg-white/10 text-white/40";
                  return (
                    <div key={log.id} className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold text-white/50">
                        {log.actor.name.slice(0, 1)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-white/70 truncate">{log.description}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[9px] text-white/30">{timeAgo(log.createdAt)}</span>
                          <span className={cn("text-[9px] px-1.5 py-0.5 rounded-md", colorClass)}>{log.action}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {(data?.recentActivity.length ?? 0) === 0 && (
                  <p className="text-xs text-white/20 text-center py-4">فعالیتی ثبت نشده</p>
                )}
              </div>
            </div>

            {/* Recent users */}
            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
              <h3 className="text-sm font-semibold text-white/70 mb-4 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-400" />کاربران جدید
              </h3>
              <div className="space-y-3">
                {data?.recentUsers.map(u => (
                  <div key={u.id} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                      {u.name.slice(0, 1)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-white/80 truncate">{u.name}</p>
                      <p className="text-[10px] text-white/30 truncate">{u.email}</p>
                    </div>
                    <div className="text-left shrink-0">
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-white/40">
                        {USER_ROLES[u.role as UserRole]?.label ?? u.role}
                      </span>
                      <p className="text-[9px] text-white/20 mt-0.5 text-right">{toJalali(u.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top clients */}
            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
              <h3 className="text-sm font-semibold text-white/70 mb-4 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-cyan-400" />مشتریان برتر
              </h3>
              <div className="space-y-3">
                {data?.topClients.map((c, i) => (
                  <div key={c.id} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-white/20 w-4 tabular-nums">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-white/80 truncate">{c.companyName}</p>
                      <p className="text-[10px] text-white/30">{c.projectCount} پروژه</p>
                    </div>
                    <span className="text-xs font-semibold text-emerald-400 tabular-nums shrink-0">
                      {formatPrice(c.totalRevenue, true)}
                    </span>
                  </div>
                ))}
                {(data?.topClients.length ?? 0) === 0 && (
                  <p className="text-xs text-white/20 text-center py-4">داده‌ای وجود ندارد</p>
                )}
              </div>
            </div>
          </div>

          {/* Role distribution */}
          {(data?.usersByRole.length ?? 0) > 0 && (
            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
              <h3 className="text-sm font-semibold text-white/70 mb-4">توزیع نقش‌های کاربری</h3>
              <div className="flex items-center gap-3 flex-wrap">
                {data!.usersByRole.map(r => (
                  <div key={r.role} className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/[0.07]">
                    <Circle className="w-2 h-2 text-violet-400 fill-violet-400" />
                    <span className="text-xs text-white/60">{USER_ROLES[r.role as UserRole]?.label ?? r.role}</span>
                    <span className="text-xs font-bold text-white">{r.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
