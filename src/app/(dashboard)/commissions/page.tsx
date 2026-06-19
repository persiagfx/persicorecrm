"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "motion/react";
import { DollarSign, Check, Clock, RefreshCw } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { formatPrice } from "@/lib/utils";
import { USER_ROLES } from "@/lib/constants";
import { RoleGuard } from "@/components/common/RoleGuard";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { UserRole } from "@/types";

interface Commission {
  id: string; userId: string; period: string;
  totalRevenue: number; percentage: number; amount: number;
  status: string; paidAt: string | null;
  user: { id: string; name: string; avatar: string | null; role: string };
}

export default function CommissionsPage() {
  const [period, setPeriod] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);

  const periods = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - i);
    const y = d.getFullYear(); const m = String(d.getMonth() + 1).padStart(2, "0");
    return { value: `${y}-${m}`, label: `${y}/${m}` };
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/commissions?period=${period}`);
      setCommissions(res.data?.data ?? []);
    } catch { toast.error("خطا در بارگذاری"); }
    finally { setLoading(false); }
  }, [period]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalCommission = commissions.reduce((s, c) => s + c.amount, 0);
  const paidCount = commissions.filter((c) => c.status === "paid").length;

  const handleMarkPaid = async (id: string) => {
    try {
      await apiClient.put(`/commissions/${id}`, { status: "paid" });
      setCommissions((p) => p.map((c) => c.id === id ? { ...c, status: "paid", paidAt: new Date().toISOString() } : c));
      toast.success("پورسانت پرداخت شد");
    } catch { toast.error("خطا"); }
  };

  const handleUpdatePercentage = async (id: string, percentage: number, totalRevenue: number) => {
    const amount = Math.round(totalRevenue * (percentage / 100));
    try {
      await apiClient.put(`/commissions/${id}`, { percentage, amount });
      setCommissions((p) => p.map((c) => c.id === id ? { ...c, percentage, amount } : c));
    } catch { toast.error("خطا در ذخیره"); }
  };

  return (
    <RoleGuard roles={["admin", "sales_manager", "accountant"]} fallback={<div className="p-12 text-center text-muted-foreground">دسترسی مجاز نیست.</div>}>
      <div className="space-y-6 max-w-4xl">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><DollarSign className="w-6 h-6 text-primary" />محاسبه پورسانت</h1>
            <p className="text-muted-foreground text-sm mt-0.5">مدیریت پورسانت کارشناسان فروش</p>
          </div>
          <div className="flex items-center gap-2">
            <select value={period} onChange={(e) => setPeriod(e.target.value)}
              className="px-4 py-2 rounded-xl bg-card border border-border text-sm text-foreground focus:outline-none">
              {periods.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
            <button onClick={fetchData} disabled={loading}
              className="p-2 rounded-xl bg-muted border border-border text-muted-foreground hover:text-foreground disabled:opacity-50">
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            </button>
          </div>
        </motion.div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "جمع پورسانت", value: `${(totalCommission / 1_000_000).toFixed(1)} م`, icon: DollarSign, color: "text-amber-400 bg-amber-500/10" },
            { label: "پرداخت شده", value: `${paidCount} نفر`, icon: Check, color: "text-emerald-400 bg-emerald-500/10" },
            { label: "در انتظار", value: `${commissions.length - paidCount} نفر`, icon: Clock, color: "text-blue-400 bg-blue-500/10" },
          ].map((c) => (
            <div key={c.label} className="p-5 rounded-2xl bg-card border border-border">
              <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mb-3", c.color)}><c.icon className="w-4 h-4" /></div>
              <p className="text-xl font-bold text-foreground">{c.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{c.label}</p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl bg-card border border-border overflow-hidden">
          <div className="p-4 border-b border-border"><h3 className="font-semibold text-foreground">دوره: {period}</h3></div>
          {loading ? (
            <div className="p-8 space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />)}</div>
          ) : commissions.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground text-sm"><DollarSign className="w-10 h-10 mx-auto mb-3 opacity-30" />پورسانتی برای این دوره وجود ندارد</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>{["کارشناس", "نقش", "درآمد پایه", "درصد پورسانت", "مبلغ پورسانت", "وضعیت", ""].map((h) => (
                    <th key={h} className="text-right px-4 py-3 text-muted-foreground font-medium">{h}</th>
                  ))}</tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {commissions.map((c) => (
                    <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full gradient-brand flex items-center justify-center text-xs font-bold text-black shrink-0">{c.user?.name?.slice(0, 1)}</div>
                          <span className="font-medium text-foreground">{c.user?.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{USER_ROLES[c.user?.role as UserRole]?.label ?? c.user?.role}</td>
                      <td className="px-4 py-3 text-muted-foreground">{(c.totalRevenue / 1_000_000).toFixed(1)} م</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <input type="number" min={0} max={20} defaultValue={c.percentage}
                            onBlur={(e) => {
                              const pct = Number(e.target.value);
                              if (pct !== c.percentage) handleUpdatePercentage(c.id, pct, c.totalRevenue);
                            }}
                            disabled={c.status === "paid"}
                            className="w-14 px-2 py-1 rounded-lg bg-background border border-border text-sm text-center focus:outline-none disabled:opacity-50" />
                          <span className="text-muted-foreground text-xs">%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-foreground">{(c.amount / 1_000_000).toFixed(1)} م</td>
                      <td className="px-4 py-3">
                        <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium",
                          c.status === "paid" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400")}>
                          {c.status === "paid" ? "✓ پرداخت شد" : "در انتظار"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {c.status === "pending" && (
                          <button onClick={() => handleMarkPaid(c.id)}
                            className="px-3 py-1.5 rounded-lg gradient-brand text-black text-xs font-semibold gold-glow">ثبت پرداخت</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </RoleGuard>
  );
}
