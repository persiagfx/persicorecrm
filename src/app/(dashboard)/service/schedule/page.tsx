"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Calendar, Plus, Search, Clock, User, MapPin, X, Pencil, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { toJalali } from "@/lib/utils";
import { StatCard } from "@/components/common/StatCard";
import { apiClient } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Schedule { id: string; title: string; customerName: string; customerAddress?: string; serviceType: string; technicianName: string; scheduledDate: string; scheduledTime: string; estimatedDurationMin: number; status: "scheduled"|"en_route"|"in_progress"|"completed"|"cancelled"|"rescheduled"; notes?: string; }

const STATUS_CFG = { scheduled: { label: "برنامه‌ریزی شده", color: "text-blue-400 bg-blue-500/10" }, en_route: { label: "در راه", color: "text-violet-400 bg-violet-500/10" }, in_progress: { label: "در حال انجام", color: "text-amber-400 bg-amber-500/10" }, completed: { label: "تکمیل", color: "text-emerald-400 bg-emerald-500/10" }, cancelled: { label: "لغو", color: "text-red-400 bg-red-500/10" }, rescheduled: { label: "تغییر زمان", color: "text-orange-400 bg-orange-500/10" } };
const SERVICE_TYPES = ["تعمیر", "نصب", "نگهداری پیشگیرانه", "بازرسی", "مشاوره", "سایر"];

export default function SchedulePage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewDate, setViewDate] = useState(new Date().toISOString().slice(0, 10));
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Schedule | undefined>();
  const [form, setForm] = useState({ title: "", customerName: "", customerAddress: "", serviceType: SERVICE_TYPES[0], technicianName: "", scheduledDate: new Date().toISOString().slice(0, 10), scheduledTime: "09:00", estimatedDurationMin: 60, status: "scheduled" as Schedule["status"], notes: "" });

  const load = useCallback(async () => { try { const r = await apiClient.get("/service/schedules"); setSchedules(r.data.data ?? []); } catch { toast.error("خطا"); } finally { setLoading(false); } }, []);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    try {
      if (editing) await apiClient.put(`/service/schedules/${editing.id}`, form); else await apiClient.post("/service/schedules", form);
      toast.success("ذخیره شد"); setShowModal(false); setEditing(undefined); load();
    } catch { toast.error("خطا"); }
  };
  const del = async (id: string) => { if (!confirm("حذف؟")) return; try { await apiClient.delete(`/service/schedules/${id}`); toast.success("حذف شد"); load(); } catch { /**/ } };
  const open = (s?: Schedule) => { setEditing(s); setForm(s ? { title: s.title, customerName: s.customerName, customerAddress: s.customerAddress ?? "", serviceType: s.serviceType, technicianName: s.technicianName, scheduledDate: s.scheduledDate, scheduledTime: s.scheduledTime, estimatedDurationMin: s.estimatedDurationMin, status: s.status, notes: s.notes ?? "" } : { title: "", customerName: "", customerAddress: "", serviceType: SERVICE_TYPES[0], technicianName: "", scheduledDate: viewDate, scheduledTime: "09:00", estimatedDurationMin: 60, status: "scheduled", notes: "" }); setShowModal(true); };

  const daySchedules = schedules.filter(s => s.scheduledDate === viewDate);
  const todayCount = schedules.filter(s => s.scheduledDate === new Date().toISOString().slice(0, 10)).length;
  const filtered = schedules.filter(s => !search || s.title.includes(search) || s.customerName.includes(search) || s.technicianName.includes(search));

  const HOURS = Array.from({ length: 10 }, (_, i) => `${(i + 8).toString().padStart(2, "0")}:00`);

  const prevDay = () => { const d = new Date(viewDate); d.setDate(d.getDate() - 1); setViewDate(d.toISOString().slice(0, 10)); };
  const nextDay = () => { const d = new Date(viewDate); d.setDate(d.getDate() + 1); setViewDate(d.toISOString().slice(0, 10)); };

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold flex items-center gap-2"><Calendar className="w-6 h-6 text-primary" />برنامه خدمات</h1></div>
        <button onClick={() => open()} className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-brand text-black text-sm font-semibold"><Plus className="w-4 h-4" /> برنامه‌ریزی جدید</button>
      </div>
      <div className="grid grid-cols-4 gap-4">
        <StatCard title="امروز" value={todayCount} icon={Calendar} color="blue" />
        <StatCard title="این هفته" value={schedules.filter(s => { const d = new Date(s.scheduledDate); const now = new Date(); const weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay()); return d >= weekStart; }).length} icon={Clock} color="amber" />
        <StatCard title="تکمیل شده" value={schedules.filter(s => s.status === "completed").length} icon={Calendar} color="green" />
        <StatCard title="لغو شده" value={schedules.filter(s => s.status === "cancelled").length} icon={Calendar} color="red" />
      </div>
      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 space-y-4">
          <div className="glass rounded-2xl border border-border p-4">
            <div className="flex items-center justify-between mb-4">
              <button onClick={prevDay} className="p-2 rounded-lg hover:bg-muted"><ChevronRight className="w-4 h-4" /></button>
              <div className="text-center">
                <p className="font-semibold">{toJalali(viewDate)}</p>
                <p className="text-xs text-muted-foreground">{daySchedules.length} برنامه</p>
              </div>
              <button onClick={nextDay} className="p-2 rounded-lg hover:bg-muted"><ChevronLeft className="w-4 h-4" /></button>
            </div>
            <div className="space-y-0.5 max-h-[400px] overflow-y-auto">
              {HOURS.map(hour => {
                const slotSchedules = daySchedules.filter(s => s.scheduledTime.startsWith(hour.slice(0, 2)));
                return (
                  <div key={hour} className="flex gap-3 min-h-[52px]">
                    <div className="w-14 text-xs text-muted-foreground pt-2 shrink-0">{hour}</div>
                    <div className="flex-1 border-t border-border pt-1">
                      {slotSchedules.map(s => (
                        <div key={s.id} onClick={() => open(s)} className={cn("rounded-lg px-3 py-2 mb-1 cursor-pointer text-xs", STATUS_CFG[s.status].color.replace("text-", "bg-").replace("bg-", "bg-").split(" ")[1] ?? "bg-muted")}>
                          <p className="font-medium">{s.title}</p>
                          <p className="opacity-80">{s.technicianName} · {s.customerName}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="relative"><Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="جستجو در همه..." className="w-full pe-10 ps-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" /></div>
          <div className="glass rounded-2xl border border-border overflow-hidden max-h-[450px] overflow-y-auto">
            {loading ? <div className="p-8 text-center text-muted-foreground text-sm">در حال بارگذاری...</div> : (
              <div className="divide-y divide-border">
                {(search ? filtered : daySchedules).map(s => (
                  <div key={s.id} className="p-3 hover:bg-muted/30 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{s.title}</p>
                        <p className="text-xs text-muted-foreground">{s.scheduledTime} · {s.technicianName}</p>
                        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground"><MapPin className="w-3 h-3" /><span className="truncate">{s.customerName}</span></div>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className={cn("px-2 py-0.5 rounded-full text-xs", STATUS_CFG[s.status].color)}>{STATUS_CFG[s.status].label}</span>
                        <div className="flex gap-1"><button onClick={() => open(s)} className="p-1 rounded hover:bg-muted"><Pencil className="w-3 h-3 text-muted-foreground" /></button><button onClick={() => del(s.id)} className="p-1 rounded hover:bg-destructive/10"><Trash2 className="w-3 h-3 text-destructive" /></button></div>
                      </div>
                    </div>
                  </div>
                ))}
                {!loading && (search ? filtered : daySchedules).length === 0 && <div className="p-8 text-center text-muted-foreground text-sm">برنامه‌ای وجود ندارد</div>}
              </div>
            )}
          </div>
        </div>
      </div>
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="glass rounded-2xl p-6 w-full max-w-lg border border-border max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5"><h2 className="text-lg font-bold">{editing ? "ویرایش برنامه" : "برنامه‌ریزی جدید"}</h2><button onClick={() => setShowModal(false)}><X className="w-4 h-4" /></button></div>
              <div className="space-y-3">
                <input placeholder="عنوان *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                <div className="grid grid-cols-2 gap-3">
                  <input placeholder="نام مشتری *" value={form.customerName} onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                  <input placeholder="تکنیسین *" value={form.technicianName} onChange={e => setForm(f => ({ ...f, technicianName: e.target.value }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                </div>
                <input placeholder="آدرس" value={form.customerAddress} onChange={e => setForm(f => ({ ...f, customerAddress: e.target.value }))} className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                <select value={form.serviceType} onChange={e => setForm(f => ({ ...f, serviceType: e.target.value }))} className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary">
                  {SERVICE_TYPES.map(s => <option key={s}>{s}</option>)}
                </select>
                <div className="grid grid-cols-3 gap-3">
                  <input type="date" value={form.scheduledDate} onChange={e => setForm(f => ({ ...f, scheduledDate: e.target.value }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                  <input type="time" value={form.scheduledTime} onChange={e => setForm(f => ({ ...f, scheduledTime: e.target.value }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                  <input type="number" placeholder="مدت (دقیقه)" value={form.estimatedDurationMin} onChange={e => setForm(f => ({ ...f, estimatedDurationMin: Number(e.target.value) }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                </div>
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as Schedule["status"] }))} className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary">
                  {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
                <textarea placeholder="یادداشت" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary resize-none" />
              </div>
              <div className="flex gap-3 mt-5"><button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl border border-border text-sm">انصراف</button><button onClick={save} className="flex-[2] py-2.5 rounded-xl gradient-brand text-black text-sm font-semibold">ذخیره</button></div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
