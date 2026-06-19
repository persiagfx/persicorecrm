"use client";
import { useState, useEffect, useCallback } from "react";
import { motion } from "motion/react";
import { ClipboardCheck, CheckCircle2, XCircle, Clock, AlertCircle, Search, ChevronDown } from "lucide-react";
import { StatCard } from "@/components/common/StatCard";
import { apiClient } from "@/lib/api/client";
import { toJalali } from "@/lib/utils";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AttendanceRecord { id: string; sessionId: string; studentId: string; status: string; notes?: string; createdAt: string; session?: { date: string; topic?: string; schedule?: { course?: { title: string } } }; student?: { name: string; }; }

const STATUS_CFG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  present: { label: "حاضر", color: "text-emerald-400 bg-emerald-500/10", icon: CheckCircle2 },
  absent: { label: "غایب", color: "text-red-400 bg-red-500/10", icon: XCircle },
  late: { label: "تاخیر", color: "text-amber-400 bg-amber-500/10", icon: Clock },
  excused: { label: "غیبت موجه", color: "text-blue-400 bg-blue-500/10", icon: AlertCircle },
};

export default function AttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const load = useCallback(async () => {
    try {
      const r = await apiClient.get("/education/attendance");
      setRecords(r.data.data ?? []);
    } catch { toast.error("خطا در بارگذاری"); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const filtered = records.filter(r => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (search && !r.student?.name?.includes(search)) return false;
    return true;
  });

  const present = records.filter(r => r.status === "present").length;
  const absent = records.filter(r => r.status === "absent").length;
  const late = records.filter(r => r.status === "late").length;
  const attendanceRate = records.length ? Math.round((present / records.length) * 100) : 0;

  const inp = "w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary";

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold flex items-center gap-2"><ClipboardCheck className="w-6 h-6 text-primary" />حضور و غیاب</h1>

      <div className="grid grid-cols-4 gap-4">
        <StatCard title="کل رکوردها" value={records.length} icon={ClipboardCheck} color="violet" />
        <StatCard title="حاضر" value={present} icon={CheckCircle2} color="emerald" />
        <StatCard title="غایب" value={absent} icon={XCircle} color="red" />
        <StatCard title="نرخ حضور" value={`${attendanceRate}%`} icon={Clock} color="blue" />
      </div>

      <div className="glass rounded-2xl border border-border p-4">
        <div className="flex gap-3 mb-4">
          <div className="relative flex-1"><Search className="absolute right-3 top-2.5 w-4 h-4 text-muted-foreground" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="جستجوی دانش‌آموز..." className={`${inp} pr-9`} /></div>
          <div className="relative">
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className={`${inp} w-44 appearance-none pr-8`}>
              <option value="all">همه وضعیت‌ها</option>
              {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <ChevronDown className="absolute left-2 top-2.5 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        {loading ? <p className="text-center text-muted-foreground py-12">در حال بارگذاری...</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border text-muted-foreground text-right">
                <th className="pb-3 pr-2">دانش‌آموز</th><th className="pb-3">جلسه / تاریخ</th><th className="pb-3">درس</th><th className="pb-3">وضعیت</th><th className="pb-3">یادداشت</th>
              </tr></thead>
              <tbody className="divide-y divide-border">
                {filtered.map(r => {
                  const cfg = STATUS_CFG[r.status] ?? STATUS_CFG.present;
                  const Icon = cfg.icon;
                  return (
                    <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 pr-2 font-medium">{r.student?.name ?? "—"}</td>
                      <td className="py-3 text-muted-foreground">{r.session?.date ? toJalali(r.session.date) : "—"}</td>
                      <td className="py-3">{r.session?.schedule?.course?.title ?? "—"}</td>
                      <td className="py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
                          <Icon className="w-3 h-3" />{cfg.label}
                        </span>
                      </td>
                      <td className="py-3 text-muted-foreground text-xs">{r.notes ?? "—"}</td>
                    </tr>
                  );
                })}
                {!filtered.length && <tr><td colSpan={5} className="py-12 text-center text-muted-foreground">رکوردی یافت نشد</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
