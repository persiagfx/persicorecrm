"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Factory, TrendingUp, Wrench, CheckSquare2, Trash2, BarChart2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from "recharts";
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
const PIE_COLORS = ["#22c55e","#f59e0b","#ef4444","#8b5cf6","#06b6d4"];

interface Analytics {
  oee: number; qualityRate: number; availability: number; performance: number;
  totalOrders: number; activeOrders: number;
  ordersByStatus: Record<string, number>;
  monthlyOutput: { month: string; produced: number; rejected: number }[];
  wasteBreakdown: { type: string; qty: number; cost: number }[];
  totalWasteCost: number;
  eqByStatus: Record<string, number>;
  totalEquipment: number;
  maintenanceCost: number;
}

function OEEGauge({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="text-center p-4 rounded-xl bg-muted/50">
      <div className={cn("text-3xl font-black", color)}>{value}%</div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
      <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
        <div className={cn("h-full rounded-full transition-all", color.replace("text-", "bg-"))} style={{ width: `${Math.min(value, 100)}%` }} />
      </div>
    </div>
  );
}

export default function ManufacturingAnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get("/manufacturing/analytics")
      .then(r => setData(r.data.data))
      .catch(() => toast.error("خطا در بارگذاری"))
      .finally(() => setLoading(false));
  }, []);

  const labelMonth = (key: string) => MONTH_LABELS[key.slice(5)] ?? key;

  return (
    <div className="space-y-6 max-w-6xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <BarChart2 className="w-6 h-6 text-primary" />آنالیتیکس تولید
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">OEE، بهره‌وری، کیفیت و گزارش ضایعات</p>
      </motion.div>

      {loading ? (
        <div className="grid grid-cols-4 gap-4">{[1,2,3,4].map(i => <div key={i} className="h-28 rounded-2xl bg-card animate-pulse border border-border" />)}</div>
      ) : data ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard title="سفارشات فعال" value={data.activeOrders} icon={Factory} color="blue" />
            <StatCard title="نرخ کیفیت" value={`${data.qualityRate}%`} icon={CheckSquare2} color="green" />
            <StatCard title="آپتایم تجهیزات" value={`${data.availability}%`} icon={Wrench} color="violet" />
            <StatCard title="هزینه نگهداری" value={formatPrice(data.maintenanceCost)} icon={Wrench} color="amber" />
          </div>

          {/* OEE Panel */}
          <div className="p-5 rounded-2xl bg-card border border-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />OEE (کارایی کلی تجهیزات)
              </h3>
              <div className="text-4xl font-black text-primary">{data.oee}%</div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <OEEGauge value={data.availability} label="دسترس‌پذیری" color="text-emerald-400" />
              <OEEGauge value={data.performance} label="عملکرد" color="text-blue-400" />
              <OEEGauge value={data.qualityRate} label="کیفیت" color="text-violet-400" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {/* Monthly production output */}
            <div className="col-span-2 p-5 rounded-2xl bg-card border border-border">
              <h3 className="font-semibold text-foreground mb-4">تولید ماهانه (۶ ماه اخیر)</h3>
              {data.monthlyOutput.length === 0 ? (
                <p className="text-center text-muted-foreground py-8 text-sm">داده‌ای موجود نیست</p>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={data.monthlyOutput.map(m => ({ ...m, label: labelMonth(m.month) }))}>
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="produced" name="تولیدشده" fill="hsl(var(--primary))" radius={[4,4,0,0]} />
                    <Bar dataKey="rejected" name="مردودی" fill="#ef4444" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Equipment status */}
            <div className="p-5 rounded-2xl bg-card border border-border">
              <h3 className="font-semibold text-foreground mb-4">وضعیت تجهیزات</h3>
              {data.totalEquipment === 0 ? (
                <p className="text-center text-muted-foreground py-8 text-sm">تجهیزاتی ثبت نشده</p>
              ) : (
                <ResponsiveContainer width="100%" height={170}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: "عملیاتی", value: data.eqByStatus.operational ?? 0 },
                        { name: "در تعمیر", value: data.eqByStatus.maintenance ?? 0 },
                        { name: "خراب", value: data.eqByStatus.broken ?? 0 },
                        { name: "بازنشسته", value: data.eqByStatus.retired ?? 0 },
                      ].filter(d => d.value > 0)}
                      cx="50%" cy="50%" outerRadius={65} dataKey="value" nameKey="name"
                    >
                      {PIE_COLORS.map((c, i) => <Cell key={i} fill={c} />)}
                    </Pie>
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Waste breakdown */}
          <div className="rounded-2xl bg-card border border-border overflow-hidden">
            <div className="p-5 border-b border-border flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-foreground">تحلیل ضایعات</h3>
              <span className="mr-auto text-sm text-muted-foreground">کل هزینه: {formatPrice(data.totalWasteCost)}</span>
            </div>
            {data.wasteBreakdown.length === 0 ? (
              <p className="text-center text-muted-foreground py-8 text-sm">ضایعاتی ثبت نشده</p>
            ) : (
              <div className="divide-y divide-border">
                {data.wasteBreakdown.map((w, i) => {
                  const maxCost = data.wasteBreakdown[0]?.cost ?? 1;
                  const pct = Math.round((w.cost / maxCost) * 100);
                  return (
                    <div key={w.type} className="flex items-center gap-4 px-5 py-3">
                      <span className="w-6 text-center text-xs font-bold text-muted-foreground">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-foreground">{w.type}</span>
                          <span className="text-xs text-muted-foreground">{w.qty.toFixed(1)} کیلوگرم</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full bg-red-400 transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-red-400 w-24 text-left">{formatPrice(w.cost)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Order status summary */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { key: "planned", label: "برنامه‌ریزی‌شده", color: "text-blue-400 bg-blue-500/10" },
              { key: "in_progress", label: "در حال تولید", color: "text-amber-400 bg-amber-500/10" },
              { key: "completed", label: "تکمیل‌شده", color: "text-emerald-400 bg-emerald-500/10" },
              { key: "cancelled", label: "لغو‌شده", color: "text-gray-400 bg-gray-500/10" },
            ].map(s => (
              <div key={s.key} className={cn("p-4 rounded-2xl border border-border", s.color.split(" ")[1])}>
                <p className={cn("text-2xl font-black", s.color.split(" ")[0])}>{data.ordersByStatus[s.key] ?? 0}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
