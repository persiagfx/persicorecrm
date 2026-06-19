"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "motion/react";
import {
  BarChart3, TrendingUp, Download, Filter, Users, DollarSign,
  FolderKanban, Clock, ArrowUpRight, ArrowDownRight, FileSpreadsheet,
  RefreshCw,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell,
} from "recharts";
import { formatPrice } from "@/lib/utils";
import { DATA_VIZ_COLORS } from "@/lib/constants";
import { apiClient } from "@/lib/api/client";

type Range = "month" | "quarter" | "year";
type ReportType = "overview" | "sales" | "team" | "projects";

const REPORT_TYPES: { id: ReportType; label: string; icon: typeof BarChart3 }[] = [
  { id: "overview", label: "خلاصه کلی", icon: BarChart3 },
  { id: "sales", label: "فروش و درآمد", icon: DollarSign },
  { id: "team", label: "عملکرد تیم", icon: Users },
  { id: "projects", label: "پروژه‌ها", icon: FolderKanban },
];

interface ReportsData {
  kpis: {
    revenue: number;
    revenueChange: number;
    newLeads: number;
    leadsChange: number;
    activeProjects: number;
    workHours: number;
    hoursChange: number;
  };
  monthlyChart: { month: string; revenue: number; expenses: number }[];
  leadsSourceData: { name: string; value: number }[];
  projectStatusData: { name: string; value: number }[];
  teamPerformance: {
    id: string;
    name: string;
    avatar: string | null;
    color: string;
    hours: number;
    tasks: number;
    revenue: number;
  }[];
  topClients: { id: string; companyName: string; totalRevenue: number; status: string }[];
}

export default function ReportsPage() {
  const [range, setRange] = useState<Range>("month");
  const [reportType, setReportType] = useState<ReportType>("overview");
  const [data, setData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/api/reports?range=${range}`);
      setData(res.data);
    } catch {
      // keep previous data on error
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const kpis = data
    ? [
        {
          label: range === "month" ? "درآمد ماه" : range === "quarter" ? "درآمد فصل" : "درآمد سال",
          value: formatPrice(data.kpis.revenue),
          change: data.kpis.revenueChange,
          icon: TrendingUp,
          color: "text-emerald-400",
        },
        {
          label: "لیدهای جدید",
          value: String(data.kpis.newLeads),
          change: data.kpis.leadsChange,
          icon: Users,
          color: "text-blue-400",
        },
        {
          label: "پروژه‌های فعال",
          value: String(data.kpis.activeProjects),
          change: 0,
          icon: FolderKanban,
          color: "text-purple-400",
        },
        {
          label: "ساعات کاری",
          value: String(data.kpis.workHours),
          change: data.kpis.hoursChange,
          icon: Clock,
          color: "text-amber-400",
        },
      ]
    : [];

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary" />گزارش‌ها و آنالیتیکس
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">داده‌های واقعی کسب‌وکار به‌صورت تصویری</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchData} disabled={loading}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted border border-border text-sm text-foreground hover:bg-muted/80 transition-colors disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted border border-border text-sm text-foreground hover:bg-muted/80 transition-colors">
            <FileSpreadsheet className="w-4 h-4" />اکسل
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-brand text-black font-semibold text-sm gold-glow">
            <Download className="w-4 h-4" />PDF گزارش
          </button>
        </div>
      </motion.div>

      {/* Controls */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-1 p-1 rounded-xl bg-muted">
          {REPORT_TYPES.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setReportType(id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all ${reportType === id ? "bg-card text-foreground shadow-sm font-medium" : "text-muted-foreground hover:text-foreground"}`}>
              <Icon className="w-3.5 h-3.5" />{label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 p-1 rounded-xl bg-muted">
          {(["month", "quarter", "year"] as Range[]).map((r) => (
            <button key={r} onClick={() => setRange(r)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-all ${range === r ? "bg-card text-foreground shadow-sm font-medium" : "text-muted-foreground hover:text-foreground"}`}>
              {r === "month" ? "ماه" : r === "quarter" ? "فصل" : "سال"}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-5 rounded-2xl bg-card border border-border animate-pulse h-28" />
            ))
          : kpis.map((kpi) => (
              <motion.div key={kpi.label} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="p-5 rounded-2xl bg-card border border-border">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
                  <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                </div>
                <p className="text-2xl font-bold text-foreground tabular-nums">{kpi.value}</p>
                <div className={`flex items-center gap-1 mt-2 text-xs ${kpi.change > 0 ? "text-emerald-400" : kpi.change < 0 ? "text-red-400" : "text-muted-foreground"}`}>
                  {kpi.change > 0 ? <ArrowUpRight className="w-3 h-3" /> : kpi.change < 0 ? <ArrowDownRight className="w-3 h-3" /> : null}
                  <span>{kpi.change > 0 ? `+${kpi.change}٪` : kpi.change < 0 ? `${kpi.change}٪` : "بدون تغییر"}</span>
                  <span className="text-muted-foreground">نسبت به قبل</span>
                </div>
              </motion.div>
            ))}
      </div>

      {/* Charts Grid */}
      {!loading && data && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Revenue & Expenses — نمایش در overview و sales */}
          {(reportType === "overview" || reportType === "sales") && (
            <div className="lg:col-span-2 p-6 rounded-2xl bg-card border border-border">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-foreground">روند درآمد و هزینه (میلیون تومان)</h2>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Filter className="w-3 h-3" />داده‌های واقعی
                </span>
              </div>
              {data.monthlyChart.length > 0 ? (
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={data.monthlyChart} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(43 74% 56%)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(43 74% 56%)" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(263 70% 60%)" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="hsl(263 70% 60%)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 6% 14%)" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(240 5% 65%)" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(240 5% 65%)" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: "hsl(240 10% 6%)", border: "1px solid hsl(240 6% 14%)", borderRadius: 12, fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 12, paddingTop: 16 }} />
                    <Area type="monotone" dataKey="revenue" name="درآمد" stroke="hsl(43 74% 56%)" strokeWidth={2} fill="url(#colorRevenue)" />
                    <Area type="monotone" dataKey="expenses" name="هزینه" stroke="hsl(263 70% 60%)" strokeWidth={2} fill="url(#colorExpenses)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[240px] flex items-center justify-center text-muted-foreground text-sm">هنوز داده‌ای ثبت نشده</div>
              )}
            </div>
          )}

          {/* Leads Source Pie — overview و sales */}
          {(reportType === "overview" || reportType === "sales") && (
            <div className="p-6 rounded-2xl bg-card border border-border">
              <h2 className="font-semibold text-foreground mb-4">منابع جذب لید</h2>
              <div className="flex items-center gap-4">
                <ResponsiveContainer width={160} height={160}>
                  <PieChart>
                    <Pie data={data.leadsSourceData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                      {data.leadsSourceData.map((_, i) => <Cell key={i} fill={DATA_VIZ_COLORS[i % DATA_VIZ_COLORS.length]} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 flex-1">
                  {data.leadsSourceData.map((item, i) => (
                    <div key={item.name} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 text-muted-foreground text-xs">
                        <span className="w-2 h-2 rounded-full" style={{ background: DATA_VIZ_COLORS[i % DATA_VIZ_COLORS.length] }} />
                        {item.name}
                      </span>
                      <span className="font-medium text-foreground text-xs">{item.value}٪</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Project Status — overview و projects */}
          {(reportType === "overview" || reportType === "projects") && (
            <div className="p-6 rounded-2xl bg-card border border-border">
              <h2 className="font-semibold text-foreground mb-4">وضعیت پروژه‌ها</h2>
              {data.projectStatusData.length > 0 ? (
                <div className="flex items-center gap-4">
                  <ResponsiveContainer width={160} height={160}>
                    <PieChart>
                      <Pie data={data.projectStatusData} cx="50%" cy="50%" outerRadius={70} dataKey="value" paddingAngle={3}>
                        {data.projectStatusData.map((_, i) => <Cell key={i} fill={DATA_VIZ_COLORS[i % DATA_VIZ_COLORS.length]} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-3 flex-1">
                    {data.projectStatusData.map((item, i) => (
                      <div key={item.name} className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: DATA_VIZ_COLORS[i % DATA_VIZ_COLORS.length] }} />
                        <span className="text-xs text-muted-foreground flex-1">{item.name}</span>
                        <span className="font-semibold text-foreground text-sm">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-[160px] flex items-center justify-center text-muted-foreground text-sm">پروژه‌ای ثبت نشده</div>
              )}
            </div>
          )}

          {/* Top Clients — sales */}
          {reportType === "sales" && (
            <div className="p-6 rounded-2xl bg-card border border-border">
              <h2 className="font-semibold text-foreground mb-4">مشتریان برتر (درآمد)</h2>
              <div className="space-y-3">
                {data.topClients.map((c, i) => (
                  <div key={c.id} className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full gradient-brand flex items-center justify-center text-black text-[10px] font-bold">{i + 1}</span>
                    <span className="flex-1 text-sm text-foreground">{c.companyName}</span>
                    <span className="text-xs font-semibold text-primary">{formatPrice(c.totalRevenue)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Team Performance Bar — overview و team */}
          {(reportType === "overview" || reportType === "team") && data.teamPerformance.length > 0 && (
            <div className="lg:col-span-2 p-6 rounded-2xl bg-card border border-border">
              <h2 className="font-semibold text-foreground mb-4">عملکرد تیم</h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data.teamPerformance} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 6% 14%)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(240 5% 65%)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(240 5% 65%)" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "hsl(240 10% 6%)", border: "1px solid hsl(240 6% 14%)", borderRadius: 12, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 16 }} />
                  <Bar dataKey="tasks" name="تسک‌ها" fill="hsl(43 74% 56%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="hours" name="ساعات کاری" fill="hsl(263 70% 60%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Team Table */}
      {!loading && data && (reportType === "overview" || reportType === "team") && data.teamPerformance.length > 0 && (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold text-foreground">جزئیات عملکرد تیم</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {["نام", "تسک‌های تکمیل شده", "ساعات کاری", "درآمد ایجادشده", "بهره‌وری"].map((h) => (
                  <th key={h} className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.teamPerformance.map((member) => {
                const productivity = member.hours > 0 ? Math.min(Math.round((member.tasks / member.hours) * 100), 100) : 0;
                return (
                  <tr key={member.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        {member.avatar ? (
                          <img src={member.avatar} className="w-8 h-8 rounded-full object-cover" alt={member.name} />
                        ) : (
                          <div className="w-8 h-8 rounded-full gradient-brand flex items-center justify-center text-xs font-bold text-black">
                            {member.name.slice(0, 1)}
                          </div>
                        )}
                        <span className="font-medium text-foreground">{member.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 font-medium text-foreground tabular-nums">{member.tasks}</td>
                    <td className="px-5 py-3 text-muted-foreground tabular-nums">{member.hours}h</td>
                    <td className="px-5 py-3 font-medium text-foreground tabular-nums">{member.revenue > 0 ? `${member.revenue}M تومان` : "—"}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden max-w-[80px]">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${productivity}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground tabular-nums">{productivity}٪</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {loading && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-48 rounded-2xl bg-card border border-border animate-pulse" />
          ))}
        </div>
      )}
    </div>
  );
}
