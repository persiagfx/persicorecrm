"use client";
import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Factory, Activity, CheckSquare2, Wrench, Trash2, TrendingUp, AlertCircle, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { StatCard } from "@/components/common/StatCard";
import { apiClient } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import Link from "next/link";

const COLORS = ["#22c55e", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function ManufacturingDashboard() {
  const [stats, setStats] = useState({ activeOrders: 0, efficiency: 0, qualityPassRate: 0, equipmentUptime: 0 });
  const [orders, setOrders] = useState<{ name: string; status: string; progress: number }[]>([]);
  const [equipment, setEquipment] = useState<{ name: string; status: string; uptime: number }[]>([]);
  const [wasteData, setWasteData] = useState<{ name: string; value: number }[]>([]);
  const [qualityTrend, setQualityTrend] = useState<{ date: string; pass: number; fail: number }[]>([]);

  useEffect(() => {
    Promise.allSettled([
      apiClient.get("/manufacturing/orders"),
      apiClient.get("/manufacturing/equipment"),
      apiClient.get("/manufacturing/waste-records"),
      apiClient.get("/manufacturing/quality-checks"),
    ]).then(([or, eq, wr, qr]) => {
      const orderList = (or.status === "fulfilled" ? or.value.data.data : []) as { productName: string; status: string; quantityOrdered: number; quantityProduced: number }[];
      const eqList = (eq.status === "fulfilled" ? eq.value.data.data : []) as { name: string; status: string }[];
      const wrList = (wr.status === "fulfilled" ? wr.value.data.data : []) as { wasteType: string; quantityKg: number }[];
      const qrList = (qr.status === "fulfilled" ? qr.value.data.data : []) as { result: string; createdAt: string }[];

      const active = orderList.filter(o => o.status === "in_progress").length;
      const running = eqList.filter(e => e.status === "running").length;
      const uptime = eqList.length ? Math.round(running / eqList.length * 100) : 0;
      const passed = qrList.filter(q => q.result === "pass").length;
      const qRate = qrList.length ? Math.round(passed / qrList.length * 100) : 0;

      setStats({ activeOrders: active, efficiency: 85, qualityPassRate: qRate, equipmentUptime: uptime });
      setOrders(orderList.slice(0, 5).map(o => ({ name: o.productName, status: o.status, progress: o.quantityOrdered ? Math.round(o.quantityProduced / o.quantityOrdered * 100) : 0 })));
      setEquipment(eqList.slice(0, 6).map(e => ({ name: e.name, status: e.status, uptime: e.status === "running" ? 95 : e.status === "idle" ? 0 : 0 })));
      const wasteByType: Record<string, number> = {};
      wrList.forEach(w => { wasteByType[w.wasteType] = (wasteByType[w.wasteType] ?? 0) + w.quantityKg; });
      setWasteData(Object.entries(wasteByType).map(([name, value]) => ({ name, value })));
    });
  }, []);

  const EQ_STATUS = { running: { label: "در حال کار", color: "text-emerald-400 bg-emerald-500/10" }, idle: { label: "بیکار", color: "text-gray-400 bg-gray-500/10" }, maintenance: { label: "تعمیر", color: "text-amber-400 bg-amber-500/10" }, decommissioned: { label: "متوقف", color: "text-red-400 bg-red-500/10" } } as Record<string, { label: string; color: string }>;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold flex items-center gap-2"><Factory className="w-6 h-6 text-primary" />داشبورد تولید</h1></div>
        <div className="flex gap-2">
          <Link href="/manufacturing/orders" className="px-3 py-2 rounded-xl border border-border text-sm hover:bg-muted">دستور تولید</Link>
          <Link href="/manufacturing/quality" className="px-3 py-2 rounded-xl border border-border text-sm hover:bg-muted">کنترل کیفیت</Link>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <StatCard title="سفارش فعال" value={stats.activeOrders} icon={Factory} color="blue" />
        <StatCard title="بهره‌وری" value={`${stats.efficiency}%`} icon={TrendingUp} color="green" />
        <StatCard title="نرخ کیفیت" value={`${stats.qualityPassRate}%`} icon={CheckSquare2} color="violet" />
        <StatCard title="آپتایم تجهیزات" value={`${stats.equipmentUptime}%`} icon={Wrench} color="amber" />
      </div>

      <div className="grid grid-cols-2 gap-5">
        {/* Active orders */}
        <div className="glass rounded-2xl border border-border p-5">
          <h2 className="font-semibold mb-4 flex items-center gap-2"><Activity className="w-4 h-4 text-primary" />سفارش‌های فعال</h2>
          {orders.length === 0 ? <p className="text-muted-foreground text-sm text-center py-6">سفارشی وجود ندارد</p> : (
            <div className="space-y-3">
              {orders.map((o, i) => (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1"><span>{o.name}</span><span className="text-muted-foreground">{o.progress}%</span></div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${o.progress}%` }} /></div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Equipment status */}
        <div className="glass rounded-2xl border border-border p-5">
          <h2 className="font-semibold mb-4 flex items-center gap-2"><Wrench className="w-4 h-4 text-primary" />وضعیت تجهیزات</h2>
          {equipment.length === 0 ? <p className="text-muted-foreground text-sm text-center py-6">تجهیزاتی ثبت نشده</p> : (
            <div className="grid grid-cols-2 gap-3">
              {equipment.map((e, i) => (
                <div key={i} className="p-3 rounded-xl bg-muted/50 border border-border/50">
                  <p className="text-sm font-medium truncate">{e.name}</p>
                  <span className={cn("text-xs px-2 py-0.5 rounded-full", (EQ_STATUS[e.status] ?? EQ_STATUS["idle"]).color)}>{(EQ_STATUS[e.status] ?? EQ_STATUS["idle"]).label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5">
        {/* Waste chart */}
        <div className="glass rounded-2xl border border-border p-5">
          <h2 className="font-semibold mb-4 flex items-center gap-2"><Trash2 className="w-4 h-4 text-primary" />ضایعات بر اساس نوع</h2>
          {wasteData.length === 0 ? <p className="text-muted-foreground text-sm text-center py-6">داده‌ای وجود ندارد</p> : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart><Pie data={wasteData} cx="50%" cy="50%" outerRadius={80} dataKey="value" nameKey="name">
                {wasteData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie><Tooltip /></PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Quick links */}
        <div className="glass rounded-2xl border border-border p-5">
          <h2 className="font-semibold mb-4">دسترسی سریع</h2>
          <div className="grid grid-cols-2 gap-3">
            {[{ href: "/manufacturing/lines", label: "خطوط تولید", icon: Factory }, { href: "/manufacturing/orders", label: "دستور تولید", icon: BarChart3 }, { href: "/manufacturing/quality", label: "کنترل کیفیت", icon: CheckSquare2 }, { href: "/manufacturing/equipment", label: "ماشین‌آلات", icon: Wrench }, { href: "/manufacturing/waste", label: "ضایعات", icon: Trash2 }, { href: "/inventory", label: "انبار مواد اولیه", icon: Activity }].map(l => (
              <Link key={l.href} href={l.href} className="flex items-center gap-2 p-3 rounded-xl bg-muted/50 border border-border/50 hover:border-border transition-all text-sm">
                <l.icon className="w-4 h-4 text-primary" />{l.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
