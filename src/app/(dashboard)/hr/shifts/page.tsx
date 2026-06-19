"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "motion/react";
import { AlarmClock, Plus, X, Trash2, Users, Clock, Check } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface WorkShift {
  id: string; name: string; startTime: string; endTime: string;
  breakMins: number; workDays: number[]; color: string; isActive: boolean;
  _count: { assignments: number };
}
interface TeamUser { id: string; name: string; avatar: string | null; department: string | null; }
interface ShiftAssignment {
  id: string; userId: string; shiftId: string; startDate: string; endDate: string | null;
  user: { id: string; name: string; avatar: string | null; };
  shift: { id: string; name: string; startTime: string; endTime: string; color: string; };
}

const DAY_LABELS = ["ش", "ی", "د", "س", "چ", "پ", "ج"];
const COLORS = ["#6366f1", "#f59e0b", "#10b981", "#ef4444", "#3b82f6", "#8b5cf6", "#ec4899"];

export default function ShiftsPage() {
  const [shifts, setShifts] = useState<WorkShift[]>([]);
  const [users, setUsers] = useState<TeamUser[]>([]);
  const [assignments, setAssignments] = useState<ShiftAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [editShift, setEditShift] = useState<WorkShift | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", startTime: "08:00", endTime: "17:00", breakMins: 60, workDays: [1,2,3,4,5], color: "#6366f1", isActive: true });
  const [assignForm, setAssignForm] = useState({ userId: "", shiftId: "", startDate: "", endDate: "" });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [sRes, uRes, aRes] = await Promise.all([
        apiClient.get("/hr/shifts"),
        apiClient.get("/users"),
        apiClient.get("/hr/shift-assignments"),
      ]);
      setShifts(sRes.data.data ?? []);
      setUsers(uRes.data.data ?? []);
      setAssignments(aRes.data.data ?? []);
    } catch { toast.error("خطا در بارگذاری"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openCreate = () => { setEditShift(null); setForm({ name: "", startTime: "08:00", endTime: "17:00", breakMins: 60, workDays: [1,2,3,4,5], color: "#6366f1", isActive: true }); setShowShiftModal(true); };
  const openEdit = (s: WorkShift) => { setEditShift(s); setForm({ name: s.name, startTime: s.startTime, endTime: s.endTime, breakMins: s.breakMins, workDays: s.workDays, color: s.color, isActive: s.isActive }); setShowShiftModal(true); };

  const handleSaveShift = async () => {
    if (!form.name.trim()) { toast.error("نام شیفت الزامی است"); return; }
    setSaving(true);
    try {
      if (editShift) {
        const res = await apiClient.put(`/hr/shifts/${editShift.id}`, form);
        setShifts(p => p.map(s => s.id === editShift.id ? { ...s, ...res.data.data } : s));
        toast.success("ذخیره شد");
      } else {
        const res = await apiClient.post("/hr/shifts", form);
        setShifts(p => [...p, res.data.data]);
        toast.success("شیفت ایجاد شد");
      }
      setShowShiftModal(false);
    } catch { toast.error("خطا در ذخیره"); }
    finally { setSaving(false); }
  };

  const handleDeleteShift = async (id: string) => {
    if (!confirm("شیفت حذف شود؟")) return;
    try {
      await apiClient.delete(`/hr/shifts/${id}`);
      setShifts(p => p.filter(s => s.id !== id));
      toast.success("حذف شد");
    } catch { toast.error("خطا در حذف"); }
  };

  const handleAssign = async () => {
    if (!assignForm.userId || !assignForm.shiftId || !assignForm.startDate) { toast.error("اطلاعات الزامی وارد کنید"); return; }
    setSaving(true);
    try {
      const res = await apiClient.post("/hr/shift-assignments", assignForm);
      setAssignments(p => [res.data.data, ...p]);
      setShowAssignModal(false);
      setAssignForm({ userId: "", shiftId: "", startDate: "", endDate: "" });
      toast.success("تخصیص انجام شد");
    } catch { toast.error("خطا"); }
    finally { setSaving(false); }
  };

  const handleRemoveAssignment = async (id: string) => {
    try {
      await apiClient.delete(`/hr/shift-assignments/${id}`);
      setAssignments(p => p.filter(a => a.id !== id));
      toast.success("حذف شد");
    } catch { toast.error("خطا"); }
  };

  const toggleDay = (d: number) => setForm(p => ({ ...p, workDays: p.workDays.includes(d) ? p.workDays.filter(x => x !== d) : [...p.workDays, d] }));

  return (
    <div className="space-y-6 max-w-5xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><AlarmClock className="w-6 h-6 text-primary" />مدیریت شیفت کاری</h1>
          <p className="text-muted-foreground text-sm mt-0.5">تعریف شیفت‌ها و تخصیص به پرسنل</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowAssignModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-card text-foreground text-sm hover:bg-muted">
            <Users className="w-4 h-4" />تخصیص شیفت
          </button>
          <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-brand text-black text-sm font-semibold gold-glow">
            <Plus className="w-4 h-4" />شیفت جدید
          </button>
        </div>
      </motion.div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{[1,2,3].map(i => <div key={i} className="h-36 rounded-2xl bg-card animate-pulse border border-border" />)}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {shifts.map(shift => (
            <motion.div key={shift.id} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
              className="p-5 rounded-2xl bg-card border border-border hover:border-white/20 transition-all group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: shift.color + "22" }}>
                    <AlarmClock className="w-5 h-5" style={{ color: shift.color }} />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{shift.name}</p>
                    <p className="text-xs text-muted-foreground">{shift.startTime} — {shift.endTime}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(shift)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"><Clock className="w-4 h-4" /></button>
                  <button onClick={() => handleDeleteShift(shift.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="flex items-center gap-1 mb-3">
                {DAY_LABELS.map((d, i) => (
                  <span key={i} className={cn("w-7 h-7 rounded-lg text-xs font-medium flex items-center justify-center",
                    shift.workDays.includes(i) ? "text-white" : "bg-muted text-muted-foreground")}
                    style={shift.workDays.includes(i) ? { backgroundColor: shift.color } : {}}>
                    {d}
                  </span>
                ))}
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>استراحت: {shift.breakMins} دقیقه</span>
                <span className={cn("px-2 py-0.5 rounded-full", shift.isActive ? "bg-emerald-500/10 text-emerald-400" : "bg-muted text-muted-foreground")}>
                  {shift.isActive ? "فعال" : "غیرفعال"}
                </span>
                <span className="flex items-center gap-1"><Users className="w-3 h-3" />{shift._count.assignments} نفر</span>
              </div>
            </motion.div>
          ))}
          {shifts.length === 0 && (
            <div className="col-span-2 p-12 text-center text-muted-foreground"><AlarmClock className="w-10 h-10 mx-auto mb-3 opacity-30" />شیفتی تعریف نشده</div>
          )}
        </div>
      )}

      <div className="rounded-2xl bg-card border border-border overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="font-semibold text-foreground">تخصیص‌های فعال</h3>
        </div>
        {assignments.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">تخصیصی ثبت نشده</div>
        ) : (
          <div className="divide-y divide-border">
            {assignments.slice(0, 20).map(a => (
              <div key={a.id} className="flex items-center justify-between px-4 py-3 hover:bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full gradient-brand flex items-center justify-center text-xs font-bold text-black">{a.user.name.slice(0,1)}</div>
                  <span className="text-sm text-foreground">{a.user.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium text-white" style={{ backgroundColor: a.shift.color }}>{a.shift.name}</span>
                  <span className="text-xs text-muted-foreground">{new Date(a.startDate).toLocaleDateString("fa-IR")}</span>
                  <button onClick={() => handleRemoveAssignment(a.id)} className="p-1 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400"><X className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showShiftModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowShiftModal(false)}>
          <div className="w-full max-w-md bg-card border border-border rounded-2xl p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between"><h3 className="font-bold text-foreground">{editShift ? "ویرایش شیفت" : "شیفت جدید"}</h3><button onClick={() => setShowShiftModal(false)}><X className="w-4 h-4 text-muted-foreground" /></button></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">نام شیفت *</label>
              <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="مثلاً: شیفت صبح"
                className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-foreground text-sm" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-muted-foreground mb-1 block">ساعت شروع</label>
                <input type="time" value={form.startTime} onChange={e => setForm(p => ({ ...p, startTime: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-foreground text-sm" /></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">ساعت پایان</label>
                <input type="time" value={form.endTime} onChange={e => setForm(p => ({ ...p, endTime: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-foreground text-sm" /></div>
            </div>
            <div><label className="text-xs text-muted-foreground mb-1 block">استراحت (دقیقه)</label>
              <input type="number" value={form.breakMins} onChange={e => setForm(p => ({ ...p, breakMins: Number(e.target.value) }))}
                className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-foreground text-sm" /></div>
            <div>
              <label className="text-xs text-muted-foreground mb-2 block">روزهای کاری</label>
              <div className="flex gap-1.5">
                {DAY_LABELS.map((d, i) => (
                  <button key={i} onClick={() => toggleDay(i)} className={cn("w-9 h-9 rounded-xl text-sm font-medium transition-all",
                    form.workDays.includes(i) ? "text-white shadow" : "bg-muted text-muted-foreground hover:bg-muted/70")}
                    style={form.workDays.includes(i) ? { backgroundColor: form.color } : {}}>
                    {d}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-2 block">رنگ</label>
              <div className="flex gap-2">
                {COLORS.map(c => (
                  <button key={c} onClick={() => setForm(p => ({ ...p, color: c }))}
                    className={cn("w-7 h-7 rounded-full transition-transform", form.color === c ? "scale-125 ring-2 ring-white/40" : "hover:scale-110")}
                    style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <div onClick={() => setForm(p => ({ ...p, isActive: !p.isActive }))}
                className={cn("w-10 h-6 rounded-full transition-colors relative", form.isActive ? "bg-primary" : "bg-muted")}>
                <div className={cn("absolute top-1 w-4 h-4 rounded-full bg-white transition-transform", form.isActive ? "translate-x-1" : "translate-x-5")} />
              </div>
              <span className="text-sm text-foreground">شیفت فعال</span>
            </label>
            <div className="flex gap-3">
              <button onClick={() => setShowShiftModal(false)} className="flex-1 py-2.5 rounded-xl border border-border bg-muted text-foreground text-sm">انصراف</button>
              <button onClick={handleSaveShift} disabled={saving} className="flex-1 py-2.5 rounded-xl gradient-brand text-black font-semibold text-sm gold-glow disabled:opacity-60">{saving ? "ذخیره..." : "ذخیره"}</button>
            </div>
          </div>
        </div>
      )}

      {showAssignModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowAssignModal(false)}>
          <div className="w-full max-w-sm bg-card border border-border rounded-2xl p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between"><h3 className="font-bold text-foreground">تخصیص شیفت</h3><button onClick={() => setShowAssignModal(false)}><X className="w-4 h-4 text-muted-foreground" /></button></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">کارمند *</label>
              <select value={assignForm.userId} onChange={e => setAssignForm(p => ({ ...p, userId: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-foreground text-sm">
                <option value="">انتخاب کنید</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">شیفت *</label>
              <select value={assignForm.shiftId} onChange={e => setAssignForm(p => ({ ...p, shiftId: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-foreground text-sm">
                <option value="">انتخاب کنید</option>
                {shifts.filter(s => s.isActive).map(s => <option key={s.id} value={s.id}>{s.name} ({s.startTime}–{s.endTime})</option>)}
              </select></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-muted-foreground mb-1 block">از تاریخ *</label>
                <input type="date" value={assignForm.startDate} onChange={e => setAssignForm(p => ({ ...p, startDate: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-foreground text-sm" /></div>
              <div><label className="text-xs text-muted-foreground mb-1 block">تا تاریخ</label>
                <input type="date" value={assignForm.endDate} onChange={e => setAssignForm(p => ({ ...p, endDate: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-foreground text-sm" /></div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowAssignModal(false)} className="flex-1 py-2.5 rounded-xl border border-border bg-muted text-foreground text-sm">انصراف</button>
              <button onClick={handleAssign} disabled={saving} className="flex-1 py-2.5 rounded-xl gradient-brand text-black font-semibold text-sm gold-glow disabled:opacity-60">{saving ? "ثبت..." : "ثبت"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
