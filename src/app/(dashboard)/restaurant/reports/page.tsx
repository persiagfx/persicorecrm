"use client";
import { useState, useEffect, useCallback } from "react";
import { motion } from "motion/react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { BarChart3, ShoppingBag, DollarSign, Users, TrendingUp } from "lucide-react";
import { StatCard } from "@/components/common/StatCard";
import { apiClient } from "@/lib/api/client";
import { toast } from "sonner";

interface RestOrder { id: string; total: number; type: string; status: string; createdAt: string; }

const COLORS = ["#8b5cf6","#3b82f6","#10b981","#f59e0b","#ef4444"];
const ORDER_TYPES = { dine_in: "حضوری", takeaway: "بیرون‌بر", delivery: "پیک" };

export default function RestaurantReportsPage() {
  const [orders, setOrders] = useState<RestOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const r = await apiClient.get("/restaurant/orders");
      setOrders(r.data.data ?? []);
    } catch { toast.error("خطا در بارگذاری"); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const totalRevenue = orders.filter(o => o.status === "paid").reduce((a, o) => a + o.total, 0);
  const paidOrders = orders.filter(o => o.status === "paid");
  const avgOrder = paidOrders.length ? Math.round(totalRevenue / paidOrders.length) : 0;

  const byType = Object.entries(ORDER_TYPES).map(([k, v]) => ({
    name: v, value: orders.filter(o => o.type === k).length,
  })).filter(e => e.value > 0);

  const byDay = (() => {
    const map: Record<string, number> = {};
    orders.forEach(o => {
      const d = new Date(o.createdAt);
      const key = `${d.getMonth() + 1}/${d.getDate()}`;
      map[key] = (map[key] ?? 0) + o.total;
    });
    return Object.entries(map).slice(-14).map(([name, total]) => ({ name, total }));
  })();

  const byStatus = [
    { name: "پرداخت شده", value: orders.filter(o => o.status === "paid").length },
    { name: "در انتظار", value: orders.filter(o => o.status === "new").length },
    { name: "در آماده‌سازی", value: orders.filter(o => o.status === "preparing").length },
    { name: "لغو شده", value: orders.filter(o => o.status === "cancelled").length },
  ].filter(e => e.value > 0);

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold flex items-center gap-2"><BarChart3 className="w-6 h-6 text-primary" />گزارش رستوران</h1>

      <div className="grid grid-cols-4 gap-4">
        <StatCard title="کل سفارشات" value={orders.length} icon={ShoppingBag} color="violet" />
        <StatCard title="درآمد کل (ریال)" value={totalRevenue.toLocaleString()} icon={DollarSign} color="emerald" />
        <StatCard title="میانگین سفارش" value={avgOrder.toLocaleString()} icon={TrendingUp} color="blue" />
        <StatCard title="سفارشات پرداخت‌شده" value={paidOrders.length} icon={Users} color="amber" />
      </div>

      {loading ? <p className="text-center text-muted-foreground py-16">در حال بارگذاری...</p> : (
        <div className="grid grid-cols-3 gap-5">
          <div className="col-span-2 glass rounded-2xl border border-border p-5">
            <h3 className="font-semibold mb-4">درآمد ۱۴ روز اخیر (ریال)</h3>
            {byDay.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={byDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => v.toLocaleString() + " ریال"} />
                  <Bar dataKey="total" fill="#8b5cf6" radius={[4,4,0,0]} name="درآمد" />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-center text-muted-foreground py-12">داده‌ای وجود ندارد</p>}
          </div>

          <div className="space-y-4">
            <div className="glass rounded-2xl border border-border p-5">
              <h3 className="font-semibold mb-4 text-sm">نوع سفارش</h3>
              {byType.length > 0 ? (
                <ResponsiveContainer width="100%" height={140}>
                  <PieChart>
                    <Pie data={byType} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={55} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                      {byType.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : <p className="text-center text-muted-foreground text-sm py-8">داده‌ای وجود ندارد</p>}
            </div>

            <div className="glass rounded-2xl border border-border p-4">
              <h3 className="font-semibold mb-3 text-sm">وضعیت سفارشات</h3>
              <div className="space-y-2">
                {byStatus.map((s, i) => (
                  <div key={s.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }} />{s.name}</div>
                    <span className="font-semibold">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
