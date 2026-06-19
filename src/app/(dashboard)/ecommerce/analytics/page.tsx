"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { BarChart2, TrendingUp, ShoppingBag, Star, Package, ArrowUpRight } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { apiClient } from "@/lib/api/client";
import { StatCard } from "@/components/common/StatCard";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";

interface AnalyticsData {
  totalRevenue: number; totalOrders: number; avgOrderValue: number;
  avgRating: number; totalReviews: number; conversionRate: number; ordersLast30: number;
  monthlyRevenue: { month: string; revenue: number }[];
  topProducts: { id: string; name: string; unitsSold: number; revenue: number }[];
}

const MONTH_LABELS: Record<string, string> = {
  "01": "فروردین", "02": "اردیبهشت", "03": "خرداد", "04": "تیر",
  "05": "مرداد", "06": "شهریور", "07": "مهر", "08": "آبان",
  "09": "آذر", "10": "دی", "11": "بهمن", "12": "اسفند",
};

export default function EcommerceAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get("/ecommerce/analytics")
      .then(r => setData(r.data.data))
      .catch(() => toast.error("خطا در بارگذاری"))
      .finally(() => setLoading(false));
  }, []);

  const fmt = (n: number) => (n / 1_000_000).toFixed(1) + " م";
  const labelMonth = (key: string) => MONTH_LABELS[key.slice(5)] ?? key;

  return (
    <div className="space-y-6 max-w-6xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <BarChart2 className="w-6 h-6 text-primary" />آنالیتیکس فروشگاه
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">تحلیل عملکرد فروش، محصولات پرفروش و روند درآمد</p>
      </motion.div>

      {loading ? (
        <div className="grid grid-cols-4 gap-4">{[1,2,3,4].map(i => <div key={i} className="h-28 rounded-2xl bg-card animate-pulse border border-border" />)}</div>
      ) : data ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard title="درآمد کل" value={formatPrice(data.totalRevenue)} icon={TrendingUp} color="green" />
            <StatCard title="کل سفارشات" value={data.totalOrders} icon={ShoppingBag} color="blue" />
            <StatCard title="میانگین سبد خرید" value={formatPrice(data.avgOrderValue)} icon={Package} color="violet" />
            <StatCard title="نرخ تبدیل" value={`${data.conversionRate}%`} icon={ArrowUpRight} color="amber" />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 p-5 rounded-2xl bg-card border border-border">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />روند درآمد ۶ ماه اخیر
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={data.monthlyRevenue.map(m => ({ ...m, label: labelMonth(m.month) }))}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={v => fmt(v)} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(v: number) => [formatPrice(v), "درآمد"]} labelStyle={{ direction: "rtl" }} />
                  <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="url(#revGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="p-5 rounded-2xl bg-card border border-border flex flex-col gap-4">
              <h3 className="font-semibold text-foreground">آمار کلی</h3>
              {[
                { label: "امتیاز میانگین محصولات", value: data.avgRating.toFixed(1), sub: `${data.totalReviews} نظر`, icon: Star, color: "text-amber-400" },
                { label: "سفارشات ۳۰ روز اخیر", value: data.ordersLast30, sub: "سفارش", icon: ShoppingBag, color: "text-blue-400" },
                { label: "نرخ تبدیل", value: `${data.conversionRate}%`, sub: "تحویل / کل", icon: ArrowUpRight, color: "text-emerald-400" },
              ].map(s => (
                <div key={s.label} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                  <s.icon className={`w-8 h-8 ${s.color}`} />
                  <div>
                    <p className="text-lg font-bold text-foreground">{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-card border border-border overflow-hidden">
            <div className="p-5 border-b border-border flex items-center gap-2">
              <Package className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-foreground">محصولات پرفروش</h3>
            </div>
            <div className="p-5">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.topProducts.slice(0, 7)} layout="vertical">
                  <XAxis type="number" tickFormatter={v => fmt(v)} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={100} />
                  <Tooltip formatter={(v: number) => [formatPrice(v), "درآمد"]} />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="border-t border-border">
              {data.topProducts.map((p, i) => (
                <div key={p.id} className="flex items-center gap-4 px-5 py-3 border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <span className="w-6 text-center text-sm font-bold text-muted-foreground">{i + 1}</span>
                  <div className="flex-1 text-sm font-medium text-foreground">{p.name}</div>
                  <span className="text-xs text-muted-foreground">{p.unitsSold} عدد</span>
                  <span className="text-sm font-semibold text-primary">{fmt(p.revenue)}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
