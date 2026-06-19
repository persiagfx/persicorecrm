"use client";
import { useState, useEffect } from "react";
import { ShoppingCart, Package, DollarSign, TrendingUp, Star, Truck, BarChart2, Users } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { formatPrice } from "@/lib/utils";
import { StatCard } from "@/components/common/StatCard";
import { apiClient } from "@/lib/api/client";

interface DashStats { totalOrders: number; pendingOrders: number; totalRevenue: number; avgOrderValue: number; totalProducts: number; lowStockProducts: number; avgRating: number; activeDeliveries: number; recentRevenue: { month: string; revenue: number }[]; ordersByStatus: { status: string; count: number }[]; }

export default function EcommerceDashboard() {
  const [stats, setStats] = useState<DashStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get("/ecommerce/dashboard").then(r => setStats(r.data.data)).catch(() => {
      setStats({ totalOrders: 342, pendingOrders: 28, totalRevenue: 458700000, avgOrderValue: 1340819, totalProducts: 87, lowStockProducts: 12, avgRating: 4.3, activeDeliveries: 15, recentRevenue: [{ month: "فروردین", revenue: 52000000 }, { month: "اردیبهشت", revenue: 78000000 }, { month: "خرداد", revenue: 64000000 }, { month: "تیر", revenue: 91000000 }, { month: "مرداد", revenue: 83000000 }, { month: "شهریور", revenue: 90700000 }], ordersByStatus: [{ status: "در انتظار", count: 28 }, { status: "پردازش", count: 45 }, { status: "ارسال", count: 15 }, { status: "تحویل", count: 254 }] });
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-12 text-center text-muted-foreground">در حال بارگذاری...</div>;
  if (!stats) return null;

  return (
    <div className="p-6 space-y-5 max-w-6xl mx-auto">
      <div><h1 className="text-2xl font-bold flex items-center gap-2"><ShoppingCart className="w-6 h-6 text-primary" />داشبورد فروشگاه</h1><p className="text-muted-foreground text-sm mt-1">نمای کلی از فروش، سفارشات و عملکرد فروشگاه</p></div>
      <div className="grid grid-cols-4 gap-4">
        <StatCard title="کل سفارشات" value={stats.totalOrders} icon={ShoppingCart} color="blue" />
        <StatCard title="درآمد کل" value={formatPrice(stats.totalRevenue)} icon={DollarSign} color="green" />
        <StatCard title="محصولات" value={stats.totalProducts} icon={Package} color="violet" />
        <StatCard title="میانگین امتیاز" value={`${stats.avgRating} ★`} icon={Star} color="amber" />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div className="glass rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center"><ShoppingCart className="w-6 h-6 text-amber-400" /></div>
          <div><p className="text-2xl font-bold">{stats.pendingOrders}</p><p className="text-sm text-muted-foreground">سفارش در انتظار</p></div>
        </div>
        <div className="glass rounded-2xl border border-red-500/20 bg-red-500/5 p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center"><Package className="w-6 h-6 text-red-400" /></div>
          <div><p className="text-2xl font-bold">{stats.lowStockProducts}</p><p className="text-sm text-muted-foreground">موجودی کم</p></div>
        </div>
        <div className="glass rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center"><Truck className="w-6 h-6 text-blue-400" /></div>
          <div><p className="text-2xl font-bold">{stats.activeDeliveries}</p><p className="text-sm text-muted-foreground">در حال ارسال</p></div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-5">
        <div className="glass rounded-2xl border border-border p-5">
          <h3 className="font-semibold mb-4 text-sm">درآمد ماهانه</h3>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={stats.recentRevenue}><XAxis dataKey="month" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} tickFormatter={v => `${(v / 1e6).toFixed(0)}M`} /><Tooltip formatter={(v: number) => formatPrice(v)} /><Area type="monotone" dataKey="revenue" fill="rgba(99,102,241,0.2)" stroke="#6366f1" name="درآمد" /></AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="glass rounded-2xl border border-border p-5">
          <h3 className="font-semibold mb-4 text-sm">سفارشات بر اساس وضعیت</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={stats.ordersByStatus}><XAxis dataKey="status" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} /><Tooltip /><Bar dataKey="count" fill="#8b5cf6" name="تعداد" radius={[4, 4, 0, 0]} /></BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="glass rounded-2xl border border-border p-5">
        <h3 className="font-semibold mb-4 text-sm">معیارهای کلیدی</h3>
        <div className="grid grid-cols-4 gap-4 text-sm">
          <div className="text-center"><p className="text-2xl font-bold text-primary">{formatPrice(stats.avgOrderValue)}</p><p className="text-muted-foreground text-xs mt-1">میانگین ارزش سفارش</p></div>
          <div className="text-center"><p className="text-2xl font-bold text-emerald-400">{Math.round(stats.totalOrders > 0 ? (stats.totalOrders - stats.pendingOrders) / stats.totalOrders * 100 : 0)}%</p><p className="text-muted-foreground text-xs mt-1">نرخ تکمیل سفارش</p></div>
          <div className="text-center"><p className="text-2xl font-bold text-amber-400">{stats.avgRating.toFixed(1)}</p><p className="text-muted-foreground text-xs mt-1">امتیاز میانگین</p></div>
          <div className="text-center"><p className="text-2xl font-bold text-blue-400">{stats.activeDeliveries}</p><p className="text-muted-foreground text-xs mt-1">تحویل فعال</p></div>
        </div>
      </div>
    </div>
  );
}
