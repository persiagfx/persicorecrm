"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Clock, Plus, Users, CheckCircle2, X, Pencil, Trash2, CalendarDays, Timer, Play, Square } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Shift {
  id: string; staffName: string; role: string; date: string;
  startTime: string; endTime: string; notes?: string;
  status: "scheduled" | "active" | "completed";
}

const ROLES = ["گارسون", "آشپز", "صندوقدار", "مدیر", "پیک", "سایر"];
const STATUS_CFG = {
  scheduled: { label: "برنامه‌ریزی شده", color: "text-blue-400 bg-blue-500/10" },
  active: { label: "فعال", color: "text-emerald-400 bg-emerald-500/10" },
  completed: { label: "پایان یافته", color: "text-gray-400 bg-gray-500/10" },
};

function Modal({ shift, onClose, onSave }: { shift?: Shift; onClose: () => void; onSave: (d: Partial<Shift>) => void }) {
  const [form, setForm] = useState({
    staffName: shift?.staffName ?? "", role: shift?.role ?? ROLES[0],
    date: shift?.date ?? new Date().toISOString().slice(0, 10),
    startTime: shift?.startTime ?? "08:00", endTime: shift?.endTime ?? "16:00",
    notes: shift?.notes ?? "",
  });
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }}
        className="glass rounded-2xl p-6 w-full max-w-md border border-border">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold">{shift ? "ویرایش شیفت" : "شیفت جدید"}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-muted-foreground mb-1">نام کارمند *</label>
            <input value={form.staffName} onChange={set("staffName")} placeholder="علی محمدی"
              className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">نقش</label>
            <select value={form.role} onChange={set("role")}
              className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary">
              {ROLES.map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">تاریخ</label>
            <input type="date" value={form.date} onChange={set("date")}
              className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">شروع</label>
              <input type="time" value={form.startTime} onChange={set("startTime")}
                className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">پایان</label>
              <input type="time" value={form.endTime} onChange={set("endTime")}
                className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">یادداشت</label>
            <textarea value={form.notes} onChange={set("notes")} rows={2}
              className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary resize-none" />
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-sm hover:bg-muted">انصراف</button>
          <button onClick={() => onSave(form)} className="flex-[2] py-2.5 rounded-xl gradient-brand text-black text-sm font-semibold">ذخیره</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function ShiftsPage() {
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Shift | undefined>();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));

  const load = useCallback(async () => {
    try {
      const res = await apiClient.get("/restaurant/shifts");
      setShifts(res.data.data ?? []);
    } catch { toast.error("خطا در بارگذاری شیفت‌ها"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async (data: Partial<Shift>) => {
    try {
      if (editing) {
        await apiClient.put(`/restaurant/shifts/${editing.id}`, data);
        toast.success("شیفت ویرایش شد");
      } else {
        await apiClient.post("/restaurant/shifts", data);
        toast.success("شیفت اضافه شد");
      }
      setShowModal(false); setEditing(undefined); load();
    } catch { toast.error("خطا در ذخیره"); }
  };

  const del = async (id: string) => {
    if (!confirm("حذف شود?")) return;
    try { await apiClient.delete(`/restaurant/shifts/${id}`); toast.success("حذف شد"); load(); }
    catch { toast.error("خطا در حذف"); }
  };

  const changeStatus = async (s: Shift, status: Shift["status"]) => {
    try { await apiClient.put(`/restaurant/shifts/${s.id}`, { ...s, status }); load(); }
    catch { toast.error("خطا"); }
  };

  const todayShifts = shifts.filter(s => s.date === selectedDate);
  const activeCount = shifts.filter(s => s.status === "active").length;
  const todayCount = shifts.filter(s => s.date === new Date().toISOString().slice(0, 10)).length;

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Clock className="w-6 h-6 text-primary" />مدیریت شیفت</h1>
          <p className="text-muted-foreground text-sm mt-1">برنامه‌ریزی و مدیریت شیفت کاری کارمندان</p>
        </div>
        <button onClick={() => { setEditing(undefined); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-brand text-black text-sm font-semibold">
          <Plus className="w-4 h-4" /> شیفت جدید
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "شیفت‌های امروز", value: todayCount, icon: CalendarDays, color: "text-blue-400" },
          { label: "در حال کار", value: activeCount, icon: Timer, color: "text-emerald-400" },
          { label: "کل کارمندان", value: new Set(shifts.map(s => s.staffName)).size, icon: Users, color: "text-violet-400" },
        ].map(s => (
          <div key={s.label} className="glass rounded-2xl p-4 border border-border">
            <div className="flex items-center gap-3">
              <div className={cn("p-2.5 rounded-xl bg-muted", s.color)}><s.icon className="w-5 h-5" /></div>
              <div><p className="text-2xl font-bold">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></div>
            </div>
          </div>
        ))}
      </div>

      {/* Date selector */}
      <div className="flex items-center gap-4">
        <label className="text-sm text-muted-foreground">تاریخ:</label>
        <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
          className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
        <span className="text-sm text-muted-foreground">{todayShifts.length} شیفت</span>
      </div>

      {/* Shifts list */}
      <div className="glass rounded-2xl border border-border overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-muted-foreground">در حال بارگذاری...</div>
        ) : todayShifts.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <Clock className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>شیفتی برای این تاریخ ثبت نشده</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {todayShifts.map(s => (
              <motion.div key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex items-center gap-4 px-5 py-4 hover:bg-muted/30 transition-colors">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                  {s.staffName.slice(0, 1)}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{s.staffName}</p>
                  <p className="text-xs text-muted-foreground">{s.role} · {s.startTime} تا {s.endTime}</p>
                </div>
                <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium", STATUS_CFG[s.status].color)}>
                  {STATUS_CFG[s.status].label}
                </span>
                <div className="flex items-center gap-1">
                  {s.status === "scheduled" && (
                    <button onClick={() => changeStatus(s, "active")} title="شروع شیفت"
                      className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-emerald-400"><Play className="w-4 h-4" /></button>
                  )}
                  {s.status === "active" && (
                    <button onClick={() => changeStatus(s, "completed")} title="پایان شیفت"
                      className="p-1.5 rounded-lg hover:bg-gray-500/10 text-gray-400"><Square className="w-4 h-4" /></button>
                  )}
                  <button onClick={() => { setEditing(s); setShowModal(true); }}
                    className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => del(s.id)}
                    className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showModal && <Modal shift={editing} onClose={() => { setShowModal(false); setEditing(undefined); }} onSave={save} />}
      </AnimatePresence>
    </div>
  );
}
