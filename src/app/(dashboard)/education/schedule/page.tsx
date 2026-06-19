"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CalendarDays, Plus, Clock, BookOpen, X, Pencil, Trash2, Video, MapPin } from "lucide-react";
import { StatCard } from "@/components/common/StatCard";
import { apiClient } from "@/lib/api/client";
import { toast } from "sonner";

interface ClassSchedule { id: string; courseId: string; title?: string; dayOfWeek: number; startTime: string; endTime: string; room?: string; isOnline: boolean; meetingUrl?: string; isActive: boolean; createdAt: string; course?: { title: string }; }

const DAYS = ["یکشنبه","دوشنبه","سه‌شنبه","چهارشنبه","پنج‌شنبه","جمعه","شنبه"];

export default function EducationSchedulePage() {
  const [schedules, setSchedules] = useState<ClassSchedule[]>([]);
  const [courses, setCourses] = useState<{ id: string; title: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<ClassSchedule | undefined>();
  const [form, setForm] = useState({ courseId: "", title: "", dayOfWeek: 0, startTime: "08:00", endTime: "10:00", room: "", isOnline: false, meetingUrl: "", isActive: true });

  const load = useCallback(async () => {
    try {
      const [sr, cr] = await Promise.all([apiClient.get("/education/schedules"), apiClient.get("/education/courses")]);
      setSchedules(sr.data.data ?? []);
      setCourses(cr.data.data ?? []);
    } catch { toast.error("خطا در بارگذاری"); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    try {
      if (editing) await apiClient.put(`/education/schedules/${editing.id}`, form);
      else await apiClient.post("/education/schedules", form);
      toast.success("ذخیره شد"); setShowModal(false); setEditing(undefined); load();
    } catch { toast.error("خطا"); }
  };

  const del = async (id: string) => {
    if (!confirm("حذف؟")) return;
    try { await apiClient.delete(`/education/schedules/${id}`); toast.success("حذف شد"); load(); } catch { /**/ }
  };

  const open = (s?: ClassSchedule) => {
    setEditing(s);
    setForm(s ? { courseId: s.courseId, title: s.title ?? "", dayOfWeek: s.dayOfWeek, startTime: s.startTime, endTime: s.endTime, room: s.room ?? "", isOnline: s.isOnline, meetingUrl: s.meetingUrl ?? "", isActive: s.isActive } : { courseId: courses[0]?.id ?? "", title: "", dayOfWeek: 0, startTime: "08:00", endTime: "10:00", room: "", isOnline: false, meetingUrl: "", isActive: true });
    setShowModal(true);
  };

  const active = schedules.filter(s => s.isActive).length;
  const online = schedules.filter(s => s.isOnline).length;

  const inp = "w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary";

  const byDay = DAYS.map((day, idx) => ({ day, items: schedules.filter(s => s.dayOfWeek === idx) }));

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2"><CalendarDays className="w-6 h-6 text-primary" />برنامه کلاس‌ها</h1>
        <button onClick={() => open()} className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-brand text-black text-sm font-semibold"><Plus className="w-4 h-4" /> برنامه جدید</button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard title="کل برنامه‌ها" value={schedules.length} icon={CalendarDays} color="violet" />
        <StatCard title="فعال" value={active} icon={BookOpen} color="emerald" />
        <StatCard title="آنلاین" value={online} icon={Video} color="blue" />
      </div>

      {loading ? <p className="text-center text-muted-foreground py-12">در حال بارگذاری...</p> : (
        <div className="grid grid-cols-7 gap-3">
          {byDay.map(({ day, items }) => (
            <div key={day} className="glass rounded-2xl border border-border p-3 min-h-[200px]">
              <h3 className="text-xs font-semibold text-center text-muted-foreground mb-3 pb-2 border-b border-border">{day}</h3>
              <div className="space-y-2">
                {items.map(s => (
                  <motion.div key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-2 rounded-xl bg-primary/5 border border-primary/10 group relative">
                    <p className="text-xs font-medium truncate">{s.course?.title ?? s.title ?? "بدون نام"}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{s.startTime}–{s.endTime}</p>
                    {s.isOnline ? <span className="text-xs text-blue-400 flex items-center gap-1 mt-0.5"><Video className="w-3 h-3" />آنلاین</span> : s.room ? <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" />{s.room}</span> : null}
                    <div className="absolute top-1 left-1 hidden group-hover:flex gap-0.5">
                      <button onClick={() => open(s)} className="p-0.5 rounded bg-muted/80 text-muted-foreground hover:text-foreground"><Pencil className="w-2.5 h-2.5" /></button>
                      <button onClick={() => del(s.id)} className="p-0.5 rounded bg-muted/80 text-red-400 hover:text-red-300"><Trash2 className="w-2.5 h-2.5" /></button>
                    </div>
                  </motion.div>
                ))}
                {items.length === 0 && <p className="text-center text-muted-foreground/40 text-xs py-4">—</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="glass rounded-2xl border border-border w-full max-w-lg p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">{editing ? "ویرایش برنامه" : "برنامه جدید"}</h2>
                <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2"><label className="text-xs text-muted-foreground mb-1 block">درس</label>
                  <select value={form.courseId} onChange={e => setForm({ ...form, courseId: e.target.value })} className={inp}>
                    {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                </div>
                <div><label className="text-xs text-muted-foreground mb-1 block">روز هفته</label>
                  <select value={form.dayOfWeek} onChange={e => setForm({ ...form, dayOfWeek: +e.target.value })} className={inp}>
                    {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                  </select>
                </div>
                <div><label className="text-xs text-muted-foreground mb-1 block">عنوان (اختیاری)</label><input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className={inp} /></div>
                <div><label className="text-xs text-muted-foreground mb-1 block">ساعت شروع</label><input type="time" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} className={inp} /></div>
                <div><label className="text-xs text-muted-foreground mb-1 block">ساعت پایان</label><input type="time" value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })} className={inp} /></div>
                <div><label className="text-xs text-muted-foreground mb-1 block">کلاس / اتاق</label><input value={form.room} onChange={e => setForm({ ...form, room: e.target.value })} className={inp} placeholder="مثلاً: کلاس ۳" /></div>
                <div className="flex items-center gap-2 mt-4">
                  <input type="checkbox" id="online" checked={form.isOnline} onChange={e => setForm({ ...form, isOnline: e.target.checked })} className="w-4 h-4" />
                  <label htmlFor="online" className="text-sm cursor-pointer">برگزاری آنلاین</label>
                </div>
                {form.isOnline && <div className="col-span-2"><label className="text-xs text-muted-foreground mb-1 block">لینک جلسه</label><input value={form.meetingUrl} onChange={e => setForm({ ...form, meetingUrl: e.target.value })} className={inp} placeholder="https://..." /></div>}
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={save} className="flex-1 py-2.5 rounded-xl gradient-brand text-black text-sm font-semibold">ذخیره</button>
                <button onClick={() => setShowModal(false)} className="px-4 py-2.5 rounded-xl border border-border text-sm">انصراف</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
