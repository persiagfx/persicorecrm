"use client";
import { useState, useEffect, useCallback } from "react";
import { motion } from "motion/react";
import { MapPin, User, Phone, Clock, CheckCircle2, AlertCircle, Navigation } from "lucide-react";
import { StatCard } from "@/components/common/StatCard";
import { apiClient } from "@/lib/api/client";
import { toJalali } from "@/lib/utils";
import { toast } from "sonner";

interface TechSchedule { id: string; technicianId: string; date: string; startTime: string; endTime: string; requestId?: string; status: string; notes?: string; }

const STATUS_CFG: Record<string, { label: string; color: string; dot: string }> = {
  scheduled: { label: "برنامه‌ریزی شده", color: "text-blue-400 bg-blue-500/10", dot: "bg-blue-400" },
  in_progress: { label: "در حال انجام", color: "text-amber-400 bg-amber-500/10", dot: "bg-amber-400" },
  completed: { label: "تکمیل شد", color: "text-emerald-400 bg-emerald-500/10", dot: "bg-emerald-400" },
  cancelled: { label: "لغو شد", color: "text-red-400 bg-red-500/10", dot: "bg-red-400" },
};

export default function ServiceMapPage() {
  const [schedules, setSchedules] = useState<TechSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<TechSchedule | undefined>();

  const load = useCallback(async () => {
    try {
      const r = await apiClient.get("/service/schedules");
      setSchedules(r.data.data ?? []);
    } catch { toast.error("خطا در بارگذاری"); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const today = schedules.filter(s => {
    const d = new Date(s.date);
    const now = new Date();
    return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const active = schedules.filter(s => s.status === "in_progress");
  const uniqueTechs = new Set(schedules.map(s => s.technicianId)).size;

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold flex items-center gap-2"><MapPin className="w-6 h-6 text-primary" />نقشه تکنسین‌ها</h1>

      <div className="grid grid-cols-3 gap-4">
        <StatCard title="امروز" value={today.length} icon={Clock} color="blue" />
        <StatCard title="در حال انجام" value={active.length} icon={Navigation} color="amber" />
        <StatCard title="تکنسین‌های فعال" value={uniqueTechs} icon={User} color="violet" />
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 glass rounded-2xl border border-border overflow-hidden">
          <div className="p-4 border-b border-border flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            <span className="font-medium text-sm">نمای کلی موقعیت تکنسین‌ها</span>
          </div>
          <div className="relative bg-muted/20" style={{ height: 400 }}>
            <div className="absolute inset-0 flex items-center justify-center flex-col gap-3 text-muted-foreground">
              <MapPin className="w-16 h-16 opacity-20" />
              <p className="text-sm">برای فعال‌سازی نقشه زنده، API موقعیت را به تکنسین‌ها متصل کنید</p>
              <div className="flex flex-wrap gap-2 justify-center px-8">
                {active.map(s => (
                  <motion.div key={s.id} initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs">
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    تکنسین {s.technicianId.slice(0, 6)}
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="glass rounded-2xl border border-border p-4 space-y-2 overflow-y-auto" style={{ maxHeight: 480 }}>
          <h3 className="font-semibold text-sm mb-3">برنامه امروز ({today.length} مورد)</h3>
          {loading ? <p className="text-center text-muted-foreground text-sm py-8">در حال بارگذاری...</p> : today.length === 0 ? <p className="text-center text-muted-foreground text-sm py-8">برنامه‌ای برای امروز ثبت نشده</p> : (
            today.map(s => {
              const cfg = STATUS_CFG[s.status] ?? STATUS_CFG.scheduled;
              return (
                <motion.div key={s.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} onClick={() => setSelected(selected?.id === s.id ? undefined : s)} className={`p-3 rounded-xl border cursor-pointer transition-all ${selected?.id === s.id ? "border-primary/40 bg-primary/5" : "border-border hover:border-border/80 hover:bg-muted/30"}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium">{s.startTime} – {s.endTime}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${cfg.color}`}>{cfg.label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">تکنسین: {s.technicianId.slice(0, 8)}...</p>
                  {s.notes && <p className="text-xs text-muted-foreground mt-1 truncate">{s.notes}</p>}
                </motion.div>
              );
            })
          )}
          {!loading && schedules.length > 0 && today.length === 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold text-sm text-muted-foreground">کل برنامه‌ها ({schedules.length})</h3>
              {schedules.slice(0, 10).map(s => {
                const cfg = STATUS_CFG[s.status] ?? STATUS_CFG.scheduled;
                return (
                  <div key={s.id} className="p-3 rounded-xl border border-border">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium">{toJalali(s.date)}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${cfg.color}`}>{cfg.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{s.startTime} – {s.endTime}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
