"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Headphones, Clock, CheckCircle2, AlertTriangle, Star, Calendar, TrendingUp, DollarSign } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from "recharts";
import { apiClient } from "@/lib/api/client";
import { StatCard } from "@/components/common/StatCard";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const MONTH_LABELS: Record<string, string> = {
  "01": "فروردین","02": "اردیبهشت","03": "خرداد","04": "تیر",
  "05": "مرداد","06": "شهریور","07": "مهر","08": "آبان",
  "09": "آذر","10": "دی","11": "بهمن","12": "اسفند",
};

interface DashData {
  total: number; open: number; inProgress: number; resolved: number;
  slaBreached: number; avgFeedback: number | null; totalFeedbacks: number;
  avgResolutionHrs: number | null; todaySchedules: number; weekSchedules: number;
  byPriority: Record<string, number>; monthlyTrend: { month: string; new: number; resolved: number }[];
  totalRevenue: number;
}

function Stars({ score }: { score: number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} className={`w-4 h-4 ${i <= Math.round(score) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/20"}`} />
      ))}
    </div>
  );
}

export default function ServiceDashboardPage() {
  const [data, setData] = useState<DashData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get("/service/dashboard")
      .then(r => setData(r.data.data))
      .catch(() => toast.error("خطا در بارگذاری"))
      .finally(() => setLoading(false));
  }, []);

  const labelMonth = (key: string) => MONTH_LABELS[key.slice(5)] ?? key;

  return (
    <div className="space-y-6 max-w-6xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Headphones className="w-6 h-6 text-primary" />داشبورد خدمات
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">نمای کلی درخواست‌ها، رضایت مشتری و برنامه تکنسین‌ها</p>
      </motion.div>

      {loading ? (
        <div className="grid grid-cols-4 gap-4">{[1,2,3,4].map(i => <div key={i} className="h-28 rounded-2xl bg-card animate-pulse border border-border" />)}</div>
      ) : data ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard title="کل درخواست‌ها" value={data.total} icon={Headphones} color="blue" />
            <StatCard title="در صف / باز" value={data.open + data.inProgress} icon={Clock} color="amber" />
            <StatCard title="حل‌شده" value={data.resolved} icon={CheckCircle2} color="green" />
            <StatCard title="نقض SLA" value={data.slaBreached} icon={AlertTriangle} color="red" />
          </div>

          <div className="grid grid-cols-3 gap-4">
            {/* KPI cards */}
            <div className="space-y-3">
              {data.avgFeedback !== null && (
                <div className="p-5 rounded-2xl bg-card border border-border">
                  <p className="text-xs text-muted-foreground mb-2">میانگین رضایت مشتری</p>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl font-black text-amber-400">{data.avgFeedback.toFixed(1)}</span>
                    <div>
                      <Stars score={data.avgFeedback} />
                      <p className="text-xs text-muted-foreground mt-1">{data.totalFeedbacks} نظر</p>
                    </div>
                  </div>
                </div>
              )}
              {data.avgResolutionHrs !== null && (
                <div className="p-5 rounded-2xl bg-card border border-border">
                  <p className="text-xs text-muted-foreground mb-1">میانگین زمان حل</p>
                  <p className="text-3xl font-black text-primary">{data.avgResolutionHrs}<span className="text-sm font-normal text-muted-foreground"> ساعت</span></p>
                </div>
              )}
              <div className="p-5 rounded-2xl bg-card border border-border">
                <p className="text-xs text-muted-foreground mb-1">درآمد کل خدمات</p>
                <p className="text-xl font-bold text-foreground">{formatPrice(data.totalRevenue)}</p>
              </div>
              <div className="p-5 rounded-2xl bg-card border border-border flex items-center gap-4">
                <Calendar className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold text-foreground">{data.todaySchedules}</p>
                  <p className="text-xs text-muted-foreground">برنامه امروز</p>
                  <p className="text-xs text-muted-foreground">{data.weekSchedules} این هفته</p>
                </div>
              </div>
            </div>

            {/* Trend chart */}
            <div className="col-span-2 p-5 rounded-2xl bg-card border border-border">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />روند درخواست‌ها (۶ ماه اخیر)
              </h3>
              {data.monthlyTrend.length === 0 ? (
                <p className="text-center text-muted-foreground py-12 text-sm">داده‌ای موجود نیست</p>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={data.monthlyTrend.map(m => ({ ...m, label: labelMonth(m.month) }))}>
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line type="monotone" dataKey="new" name="جدید" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="resolved" name="حل‌شده" stroke="#22c55e" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Priority breakdown */}
          <div className="rounded-2xl bg-card border border-border overflow-hidden">
            <div className="p-5 border-b border-border">
              <h3 className="font-semibold text-foreground">توزیع اولویت درخواست‌ها</h3>
            </div>
            <div className="grid grid-cols-4 divide-x divide-border rtl:divide-x-reverse">
              {[
                { key: "urgent", label: "بحرانی", color: "text-red-400 bg-red-500/10" },
                { key: "high", label: "زیاد", color: "text-amber-400 bg-amber-500/10" },
                { key: "medium", label: "متوسط", color: "text-blue-400 bg-blue-500/10" },
                { key: "low", label: "کم", color: "text-gray-400 bg-gray-500/10" },
              ].map(p => (
                <div key={p.key} className={cn("p-5 text-center", p.color.split(" ")[1])}>
                  <p className={cn("text-3xl font-black", p.color.split(" ")[0])}>{data.byPriority[p.key] ?? 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">{p.label}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
