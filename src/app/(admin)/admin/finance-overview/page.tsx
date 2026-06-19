"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  DollarSign, TrendingUp, TrendingDown, RefreshCw, CreditCard,
  AlertTriangle, CheckCircle2, Clock,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import { apiClient } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface FinanceData {
  totalRevenue: number;
  thisMonthRevenue: number;
  lastMonthRevenue: number;
  pendingPayments: number;
  totalExpenses: number;
  totalPaidInvoices: number;
  totalPendingInvoices: number;
  totalOverdueInvoices: number;
  revenueByMonth: { month: string; revenue: number; expenses: number }[];
  revenueByPlan: { plan: string; amount: number }[];
  topClients: { name: string; total: number }[];
}

const PLAN_COLORS: Record<string, string> = {
  trial: "#f59e0b",
  starter: "#3b82f6",
  pro: "#8b5cf6",
  enterprise: "#10b981",
};

const formatAmount = (v: number) =>
  v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1_000 ? `${(v / 1_000).toFixed(0)}K` : String(v);

const StatCard = ({ label, value, icon: Icon, color, sub, trend }: {
  label: string; value: string; icon: typeof DollarSign;
  color: string; sub?: string; trend?: "up" | "down" | "neutral";
}) => (
  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] space-y-2">
    <div className="flex items-center justify-between">
      <span className="text-xs text-white/40">{label}</span>
      <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", color)}>
        <Icon className="w-3.5 h-3.5" />
      </div>
    </div>
    <p className="text-xl font-bold text-white">{value}</p>
    {sub && (
      <p className={cn("text-xs flex items-center gap-1",
        trend === "up" ? "text-emerald-400" : trend === "down" ? "text-red-400" : "text-white/30")}>
        {trend === "up" && <TrendingUp className="w-3 h-3" />}
        {trend === "down" && <TrendingDown className="w-3 h-3" />}
        {sub}
      </p>
    )}
  </div>
);

export default function AdminFinancePage() {
  const [data, setData] = useState<FinanceData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/admin/finance");
      setData(res.data.data);
    } catch { toast.error("خطا در بارگذاری داده‌های مالی"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const growth = data
    ? data.lastMonthRevenue > 0
      ? (((data.thisMonthRevenue - data.lastMonthRevenue) / data.lastMonthRevenue) * 100).toFixed(1)
      : "—"
    : "—";

  const pieData = data?.revenueByPlan.filter(d => d.amount > 0) ?? [];

  return (
    <div className="p-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-amber-400" />نمای مالی کل
          </h1>
          <p className="text-sm text-white/35 mt-0.5">گزارش درآمد و هزینه تمام workspace‌ها</p>
        </div>
        <button onClick={fetchData} disabled={loading}
          className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/50 hover:text-white disabled:opacity-40">
          <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
        </button>
      </motion.div>

      {/* KPI Cards */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-white/[0.03] animate-pulse" />
          ))}
        </div>
      ) : data && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label="کل درآمد" value={formatAmount(data.totalRevenue)}
            icon={DollarSign} color="bg-emerald-500/15 text-emerald-400" />
          <StatCard label="درآمد این ماه" value={formatAmount(data.thisMonthRevenue)}
            icon={TrendingUp} color="bg-blue-500/15 text-blue-400"
            sub={growth !== "—" ? `${Number(growth) >= 0 ? "+" : ""}${growth}% نسبت به ماه قبل` : undefined}
            trend={Number(growth) >= 0 ? "up" : "down"} />
          <StatCard label="پرداخت معلق" value={formatAmount(data.pendingPayments)}
            icon={Clock} color="bg-amber-500/15 text-amber-400" />
          <StatCard label="کل هزینه‌ها" value={formatAmount(data.totalExpenses)}
            icon={TrendingDown} color="bg-red-500/15 text-red-400" />
          <StatCard label="فاکتورهای پرداخت‌شده" value={String(data.totalPaidInvoices)}
            icon={CheckCircle2} color="bg-emerald-500/15 text-emerald-400" />
          <StatCard label="فاکتورهای معلق" value={String(data.totalPendingInvoices)}
            icon={CreditCard} color="bg-amber-500/15 text-amber-400" />
          <StatCard label="فاکتورهای سررسیدگذشته" value={String(data.totalOverdueInvoices)}
            icon={AlertTriangle} color="bg-red-500/15 text-red-400" />
          <StatCard label="خالص درآمد" value={formatAmount(data.totalRevenue - data.totalExpenses)}
            icon={DollarSign} color="bg-violet-500/15 text-violet-400" />
        </div>
      )}

      {/* Charts */}
      {!loading && data && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Revenue vs Expenses Chart */}
          <div className="lg:col-span-2 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
            <h3 className="text-sm font-semibold text-white/70 mb-4">درآمد vs هزینه — ۶ ماه اخیر</h3>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={data.revenueByMonth}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickFormatter={formatAmount} />
                <Tooltip
                  contentStyle={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }}
                  labelStyle={{ color: "rgba(255,255,255,0.6)", fontSize: 11 }}
                  itemStyle={{ fontSize: 11 }}
                  formatter={(v: number) => [formatAmount(v), ""]}
                />
                <Area type="monotone" dataKey="revenue" name="درآمد" stroke="#10b981" fill="url(#revGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="expenses" name="هزینه" stroke="#ef4444" fill="url(#expGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Revenue by Plan Pie */}
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
            <h3 className="text-sm font-semibold text-white/70 mb-4">درآمد بر اساس پلن</h3>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={pieData} dataKey="amount" nameKey="plan" cx="50%" cy="50%"
                    innerRadius={50} outerRadius={80} paddingAngle={3}>
                    {pieData.map((entry) => (
                      <Cell key={entry.plan} fill={PLAN_COLORS[entry.plan] ?? "#6b7280"} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }}
                    formatter={(v: number) => [formatAmount(v), ""]}
                  />
                  <Legend formatter={(v) => <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 11 }}>{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center">
                <p className="text-white/20 text-sm">داده‌ای موجود نیست</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Top Clients */}
      {!loading && data && data.topClients.length > 0 && (
        <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
          <h3 className="text-sm font-semibold text-white/70 mb-4">مشتریان برتر بر اساس ارزش فاکتور</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.topClients} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
              <XAxis type="number" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }} axisLine={false} tickFormatter={formatAmount} />
              <YAxis type="category" dataKey="name" tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 10 }} axisLine={false} width={100} />
              <Tooltip
                contentStyle={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }}
                formatter={(v: number) => [formatAmount(v), "مجموع"]}
              />
              <Bar dataKey="total" fill="#8b5cf6" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
