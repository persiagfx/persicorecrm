"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Ship, TrendingUp, TrendingDown, Globe, Package, DollarSign, BarChart2, ArrowUpRight, ArrowDownLeft } from "lucide-react";
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
  totalShipments: number; activeShipments: number;
  shipByStatus: Record<string, number>; totalShipCost: number;
  totalImports: number; totalExports: number;
  totalImportValue: number; totalExportValue: number;
  totalDuties: number; tradeBalance: number;
  topCountries: { country: string; value: number }[];
  monthlyTrend: { month: string; sent: number; delivered: number }[];
  activePricingTiers: number;
}

const SHIP_STATUS_CFG: Record<string, { label: string; color: string }> = {
  preparing:  { label: "آماده‌سازی", color: "text-blue-400" },
  in_transit: { label: "در حمل",     color: "text-amber-400" },
  customs:    { label: "گمرک",       color: "text-violet-400" },
  delivered:  { label: "تحویل",      color: "text-emerald-400" },
  returned:   { label: "مرجوعی",     color: "text-red-400" },
};

export default function TradingDashboardPage() {
  const [data, setData] = useState<DashData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get("/trading/dashboard")
      .then(r => setData(r.data.data))
      .catch(() => toast.error("خطا در بارگذاری"))
      .finally(() => setLoading(false));
  }, []);

  const labelMonth = (key: string) => MONTH_LABELS[key.slice(5)] ?? key;
  const fmt = (n: number) => (n / 1_000_000).toFixed(1) + " م";

  return (
    <div className="space-y-6 max-w-6xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Ship className="w-6 h-6 text-primary" />داشبورد بازرگانی
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">نمای کلی محموله‌ها، واردات/صادرات و تراز تجاری</p>
      </motion.div>

      {loading ? (
        <div className="grid grid-cols-4 gap-4">{[1,2,3,4].map(i => <div key={i} className="h-28 rounded-2xl bg-card animate-pulse border border-border" />)}</div>
      ) : data ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard title="کل محموله‌ها" value={data.totalShipments} icon={Ship} color="blue" />
            <StatCard title="در حال حمل" value={data.activeShipments} icon={Package} color="amber" />
            <StatCard title="هزینه حمل‌ونقل" value={formatPrice(data.totalShipCost)} icon={DollarSign} color="violet" />
            <StatCard title="تراز تجاری" value={fmt(data.tradeBalance)} icon={data.tradeBalance >= 0 ? TrendingUp : TrendingDown} color={data.tradeBalance >= 0 ? "green" : "red"} />
          </div>

          {/* Import/Export balance */}
          <div className="grid grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-card border border-border">
              <div className="flex items-center gap-2 mb-3">
                <ArrowDownLeft className="w-5 h-5 text-red-400" />
                <h3 className="font-semibold text-foreground">واردات</h3>
              </div>
              <p className="text-3xl font-black text-red-400">{fmt(data.totalImportValue)}</p>
              <p className="text-xs text-muted-foreground mt-1">{data.totalImports} رکورد</p>
            </div>
            <div className="p-5 rounded-2xl bg-card border border-border">
              <div className="flex items-center gap-2 mb-3">
                <ArrowUpRight className="w-5 h-5 text-emerald-400" />
                <h3 className="font-semibold text-foreground">صادرات</h3>
              </div>
              <p className="text-3xl font-black text-emerald-400">{fmt(data.totalExportValue)}</p>
              <p className="text-xs text-muted-foreground mt-1">{data.totalExports} رکورد</p>
            </div>
            <div className="p-5 rounded-2xl bg-card border border-border">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="w-5 h-5 text-amber-400" />
                <h3 className="font-semibold text-foreground">حقوق گمرکی</h3>
              </div>
              <p className="text-3xl font-black text-amber-400">{fmt(data.totalDuties)}</p>
              <p className="text-xs text-muted-foreground mt-1">کل عوارض پرداختی</p>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-4">
            {/* Monthly shipment trend */}
            <div className="col-span-3 p-5 rounded-2xl bg-card border border-border">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />روند ماهانه محموله‌ها
              </h3>
              {data.monthlyTrend.length === 0 ? (
                <p className="text-center text-muted-foreground py-12 text-sm">داده‌ای موجود نیست</p>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={data.monthlyTrend.map(m => ({ ...m, label: labelMonth(m.month) }))}>
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="sent" name="ارسال‌شده" fill="hsl(var(--primary))" radius={[4,4,0,0]} />
                    <Bar dataKey="delivered" name="تحویل‌داده‌شده" fill="#22c55e" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Top countries */}
            <div className="col-span-2 p-5 rounded-2xl bg-card border border-border">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Globe className="w-4 h-4 text-primary" />کشورهای برتر
              </h3>
              {data.topCountries.length === 0 ? (
                <p className="text-center text-muted-foreground py-8 text-sm">داده‌ای موجود نیست</p>
              ) : (
                <div className="space-y-3">
                  {data.topCountries.map((c, i) => {
                    const pct = Math.round((c.value / data.topCountries[0].value) * 100);
                    return (
                      <div key={c.country}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-foreground">{c.country}</span>
                          <span className="text-xs text-muted-foreground">{fmt(c.value)}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Shipment status breakdown */}
          <div className="rounded-2xl bg-card border border-border overflow-hidden">
            <div className="p-4 border-b border-border">
              <h3 className="font-semibold text-foreground">وضعیت محموله‌ها</h3>
            </div>
            <div className="grid grid-cols-5 divide-x divide-border rtl:divide-x-reverse">
              {Object.entries(SHIP_STATUS_CFG).map(([key, cfg]) => (
                <div key={key} className="p-4 text-center">
                  <p className={cn("text-2xl font-black", cfg.color)}>{data.shipByStatus[key] ?? 0}</p>
                  <p className="text-xs text-muted-foreground mt-1">{cfg.label}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
