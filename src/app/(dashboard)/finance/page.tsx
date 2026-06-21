"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { DollarSign, TrendingUp, TrendingDown, Minus, FileBarChart, Download, RefreshCw } from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell,
} from "recharts";
import { formatPrice } from "@/lib/utils";
import { DATA_VIZ_COLORS } from "@/lib/constants";
import { StatCard } from "@/components/common/StatCard";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { apiClient } from "@/lib/api/client";
const fmtRial = (amount: number, short = false) => formatPrice(amount, short);

const TABS = ["داشبورد مالی", "سود و زیان (P&L)"] as const;
type Tab = typeof TABS[number];

interface FinanceData {
  summary: { totalRevenue: number; totalExpenses: number; teamShare: number; netProfit: number };
  monthlyChart: { month: string; revenue: number; expenses: number; profit: number }[];
  projectProfitData: { name: string; revenue: number; cost: number }[];
  teamShareData: { name: string; value: number }[];
  receivables: Array<{ id: string; invoiceNumber: string; total: number; status: string; dueDate: string; client: { companyName: string } }>;
}

export default function FinancePage() {
  const [activeTab, setActiveTab] = useState<Tab>("داشبورد مالی");
  const [data, setData] = useState<FinanceData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = () => {
    setLoading(true);
    apiClient.get("/finance")
      .then((r) => setData(r.data.data))
      .catch(() => toast.error("خطا در دریافت داده‌های مالی"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const s = data?.summary;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-primary" />مالی شرکت
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">فقط برای مدیر و حسابدار</p>
        </div>
        <button onClick={fetchData} disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted border border-border text-sm hover:bg-muted/80 transition-colors disabled:opacity-50">
          <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
        </button>
      </motion.div>

      <div className="flex gap-1 p-1 bg-muted rounded-xl w-fit">
        {TABS.map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-all",
              activeTab === tab ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}>
            {tab}
          </button>
        ))}
      </div>

      {loading && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-40 rounded-2xl bg-card border border-border animate-pulse" />
          ))}
        </div>
      )}

      {!loading && data && activeTab === "داشبورد مالی" && (
        <>
          {/* Net Profit Hero */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden p-8 rounded-2xl bg-card border border-border">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_50%,hsla(43,74%,56%,0.08),transparent_70%)]" />
            <div className="relative">
              <p className="text-muted-foreground text-sm mb-2">سود خالص تجمیعی</p>
              <p className="text-5xl font-extrabold text-primary tabular-nums mb-3">
                {fmtRial(s?.netProfit ?? 0, true)}
              </p>
              <div className="mt-4 pt-4 border-t border-border flex items-center gap-6 text-sm flex-wrap">
                <div className="flex items-center gap-2 text-muted-foreground">
                  درآمد: <span className="text-foreground font-semibold">{fmtRial(s?.totalRevenue ?? 0, true)}</span>
                </div>
                <Minus className="w-4 h-4 text-muted-foreground" />
                <div className="flex items-center gap-2 text-muted-foreground">
                  سهم تیم: <span className="text-foreground font-semibold">{fmtRial(s?.teamShare ?? 0, true)}</span>
                </div>
                <Minus className="w-4 h-4 text-muted-foreground" />
                <div className="flex items-center gap-2 text-muted-foreground">
                  هزینه‌ها: <span className="text-foreground font-semibold">{fmtRial(s?.totalExpenses ?? 0, true)}</span>
                </div>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard title="درآمد کل (تومان)" value={(s?.totalRevenue ?? 0)} icon={TrendingUp} gradient="gradient-brand" suffix=" تومان" />
            <StatCard title="هزینه‌ها (تومان)" value={(s?.totalExpenses ?? 0)} icon={TrendingDown} suffix=" تومان" />
            <StatCard title="سهم تیم (تومان)" value={(s?.teamShare ?? 0)} icon={DollarSign} suffix=" تومان" />
            <StatCard title="سود خالص (تومان)" value={(s?.netProfit ?? 0)} icon={TrendingUp} suffix=" تومان" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="p-6 rounded-2xl bg-card border border-border">
              <h2 className="font-semibold text-foreground mb-4">درآمد / هزینه / سود (میلیون ریال)</h2>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={data.monthlyChart} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 6% 14%)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(240 5% 65%)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(240 5% 65%)" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "hsl(240 10% 6%)", border: "1px solid hsl(240 6% 14%)", borderRadius: 12, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 16 }} />
                  <Line type="monotone" dataKey="revenue" name="درآمد" stroke="hsl(43 74% 56%)" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="expenses" name="هزینه" stroke="hsl(263 70% 60%)" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="profit" name="سود" stroke="hsl(142 71% 45%)" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="p-6 rounded-2xl bg-card border border-border">
              <h2 className="font-semibold text-foreground mb-4">سودآوری پروژه‌ها (میلیون ریال)</h2>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.projectProfitData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 6% 14%)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(240 5% 65%)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(240 5% 65%)" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "hsl(240 10% 6%)", border: "1px solid hsl(240 6% 14%)", borderRadius: 12, fontSize: 12 }} />
                  <Bar dataKey="revenue" name="درآمد" fill="hsl(43 74% 56%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="cost" name="هزینه" fill="hsl(263 70% 60%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="p-6 rounded-2xl bg-card border border-border">
              <h2 className="font-semibold text-foreground mb-4">توزیع سهام تیم</h2>
              <div className="flex items-center gap-6">
                <ResponsiveContainer width={150} height={150}>
                  <PieChart>
                    <Pie data={data.teamShareData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" paddingAngle={3}>
                      {data.teamShareData.map((_, i) => <Cell key={i} fill={DATA_VIZ_COLORS[i % DATA_VIZ_COLORS.length]} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 flex-1">
                  {data.teamShareData.map((item, i) => (
                    <div key={item.name} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: DATA_VIZ_COLORS[i % DATA_VIZ_COLORS.length] }} />{item.name}
                      </span>
                      <span className="font-medium text-foreground">{item.value}٪</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-card border border-border">
              <h2 className="font-semibold text-foreground mb-4">حساب‌های دریافتنی</h2>
              {data.receivables.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">فاکتور معوقی وجود ندارد</p>
              ) : (
                <div className="space-y-3">
                  {data.receivables.map((inv) => (
                    <div key={inv.id} className="flex items-center justify-between p-3 rounded-xl bg-muted">
                      <div>
                        <p className="text-sm font-medium text-foreground">{inv.client?.companyName}</p>
                        <p className="text-xs text-muted-foreground font-mono">{inv.invoiceNumber}</p>
                      </div>
                      <div className="text-left">
                        <p className={cn("text-sm font-semibold tabular-nums", inv.status === "overdue" ? "text-red-500" : "text-foreground")}>
                          {formatPrice(inv.total, true)}
                        </p>
                        <p className={cn("text-xs", inv.status === "overdue" ? "text-red-400" : "text-muted-foreground")}>
                          {inv.status === "overdue" ? "معوق" : "در انتظار"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {!loading && data && activeTab === "سود و زیان (P&L)" && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <FileBarChart className="w-5 h-5 text-primary" />صورت سود و زیان
            </h3>
            <button onClick={() => toast.success("PDF صادر شد")}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm text-foreground hover:bg-muted transition-colors">
              <Download className="w-4 h-4" />خروجی PDF
            </button>
          </div>

          <div className="rounded-2xl bg-card border border-border overflow-hidden">
            <div className="p-5 space-y-0">
              <div className="py-3 border-b border-border">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-foreground">درآمد کل</span>
                  <span className="font-bold text-foreground tabular-nums">{Math.round((s?.totalRevenue ?? 0) / 1_000_000)} م تومان</span>
                </div>
              </div>
              <div className="py-3 border-b border-border">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-foreground">کسر: سهم تیم</span>
                  <span className="font-bold text-red-400 tabular-nums">({Math.round((s?.teamShare ?? 0) / 1_000_000)} م)</span>
                </div>
              </div>
              <div className="py-3 border-b-2 border-primary/30 bg-primary/5">
                <div className="flex justify-between items-center px-2">
                  <span className="font-bold text-foreground">سود ناخالص</span>
                  <span className="font-bold tabular-nums text-lg text-emerald-400">
                    {Math.round(((s?.totalRevenue ?? 0) - (s?.teamShare ?? 0)) / 1_000_000)} م تومان
                  </span>
                </div>
              </div>
              <div className="py-3 border-b border-border">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-foreground">کسر: هزینه‌های عمومی</span>
                  <span className="font-bold text-red-400 tabular-nums">({Math.round((s?.totalExpenses ?? 0) / 1_000_000)} م)</span>
                </div>
              </div>
              <div className="py-4 bg-gradient-to-r from-primary/5 to-transparent">
                <div className="flex justify-between items-center px-2">
                  <span className="text-lg font-bold text-foreground">سود خالص</span>
                  <span className={cn("text-2xl font-extrabold tabular-nums", (s?.netProfit ?? 0) >= 0 ? "text-primary" : "text-red-400")}>
                    {Math.round((s?.netProfit ?? 0) / 1_000_000)} م تومان
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-card border border-border">
            <h3 className="font-semibold text-foreground mb-4">روند ماهانه سود و زیان (میلیون ریال)</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.monthlyChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                <Bar dataKey="revenue" name="درآمد" fill="hsl(43 74% 56%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" name="هزینه" fill="hsl(263 70% 60%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="profit" name="سود خالص" fill="hsl(142 71% 45%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
