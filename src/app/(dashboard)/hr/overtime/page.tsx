"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "motion/react";
import { Clock, TrendingUp, AlertTriangle, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface OvertimeRecord {
  userId: string; name: string; avatar: string | null; department: string | null;
  overtimeMinutes: number; lateMinutes: number; earlyLeaveMinutes: number; presentDays: number;
}

const fmt = (mins: number) => {
  if (mins <= 0) return "—";
  const h = Math.floor(mins / 60); const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

export default function OvertimePage() {
  const [records, setRecords] = useState<OvertimeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - i);
    const y = d.getFullYear(); const m = String(d.getMonth() + 1).padStart(2, "0");
    return { value: `${y}-${m}`, label: `${y}/${m}` };
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/hr/overtime?month=${month}`);
      setRecords(res.data.data ?? []);
    } catch { toast.error("خطا در بارگذاری"); }
    finally { setLoading(false); }
  }, [month]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalOvertime = records.reduce((s, r) => s + r.overtimeMinutes, 0);
  const totalLate = records.reduce((s, r) => s + r.lateMinutes, 0);
  const lateCount = records.filter(r => r.lateMinutes > 0).length;

  const stats = [
    { label: "جمع اضافه‌کاری", value: fmt(totalOvertime), icon: TrendingUp, color: "text-emerald-400 bg-emerald-500/10" },
    { label: "جمع تاخیر", value: fmt(totalLate), icon: AlertTriangle, color: "text-amber-400 bg-amber-500/10" },
    { label: "نفر دارای تاخیر", value: `${lateCount} نفر`, icon: Clock, color: "text-red-400 bg-red-500/10" },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><Clock className="w-6 h-6 text-primary" />اضافه‌کاری و تاخیر</h1>
          <p className="text-muted-foreground text-sm mt-0.5">تحلیل ساعات اضافه‌کاری و تاخیر پرسنل</p>
        </div>
        <select value={month} onChange={e => setMonth(e.target.value)}
          className="px-4 py-2 rounded-xl bg-card border border-border text-sm text-foreground focus:outline-none">
          {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
      </motion.div>

      <div className="grid grid-cols-3 gap-4">
        {stats.map(s => (
          <div key={s.label} className="p-5 rounded-2xl bg-card border border-border">
            <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mb-3", s.color)}><s.icon className="w-4 h-4" /></div>
            <p className="text-xl font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl bg-card border border-border overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold text-foreground">جزئیات پرسنل — {month}</h3>
        </div>
        {loading ? (
          <div className="p-6 space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-12 rounded-xl bg-muted animate-pulse" />)}</div>
        ) : records.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground text-sm"><Clock className="w-10 h-10 mx-auto mb-3 opacity-30" />داده‌ای برای این ماه وجود ندارد</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>{["پرسنل", "دپارتمان", "روزهای حضور", "اضافه‌کاری", "تاخیر ورود", "خروج زود"].map(h => (
                  <th key={h} className="text-right px-4 py-3 text-muted-foreground font-medium">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-border">
                {records.map(r => (
                  <motion.tr key={r.userId} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full gradient-brand flex items-center justify-center text-xs font-bold text-black shrink-0">{r.name.slice(0,1)}</div>
                        <span className="font-medium text-foreground">{r.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{r.department ?? "—"}</td>
                    <td className="px-4 py-3 text-foreground">{r.presentDays} روز</td>
                    <td className="px-4 py-3">
                      {r.overtimeMinutes > 0 ? (
                        <span className="flex items-center gap-1 text-emerald-400 font-medium">
                          <ArrowUpRight className="w-3.5 h-3.5" />{fmt(r.overtimeMinutes)}
                        </span>
                      ) : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      {r.lateMinutes > 0 ? (
                        <span className="flex items-center gap-1 text-amber-400 font-medium">
                          <AlertTriangle className="w-3.5 h-3.5" />{fmt(r.lateMinutes)}
                        </span>
                      ) : <span className="text-emerald-400 text-xs">✓ بدون تاخیر</span>}
                    </td>
                    <td className="px-4 py-3">
                      {r.earlyLeaveMinutes > 0 ? (
                        <span className="flex items-center gap-1 text-red-400 font-medium">
                          <ArrowDownLeft className="w-3.5 h-3.5" />{fmt(r.earlyLeaveMinutes)}
                        </span>
                      ) : <span className="text-muted-foreground">—</span>}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
