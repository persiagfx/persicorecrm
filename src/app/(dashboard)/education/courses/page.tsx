"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { BookOpen, Plus, Search, Users, Clock, Star, X, Pencil, Trash2, Eye } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { StatCard } from "@/components/common/StatCard";
import { apiClient } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Course { id: string; courseCode: string; title: string; description?: string; instructorName: string; category: string; level: "beginner"|"intermediate"|"advanced"; durationHours: number; maxStudents?: number; price?: number; isActive: boolean; enrollmentCount?: number; }

const LEVEL_CFG = { beginner: { label: "مقدماتی", color: "text-emerald-400 bg-emerald-500/10" }, intermediate: { label: "متوسط", color: "text-blue-400 bg-blue-500/10" }, advanced: { label: "پیشرفته", color: "text-violet-400 bg-violet-500/10" } };
const CATEGORIES = ["برنامه‌نویسی", "طراحی", "مدیریت", "مالی", "بازاریابی", "زبان", "فناوری", "هنر", "سایر"];

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Course | undefined>();
  const [form, setForm] = useState({ courseCode: "", title: "", description: "", instructorName: "", category: CATEGORIES[0], level: "beginner" as Course["level"], durationHours: 20, maxStudents: 30, price: 0, isActive: true });

  const load = useCallback(async () => { try { const r = await apiClient.get("/education/courses"); setCourses(r.data.data ?? []); } catch { toast.error("خطا"); } finally { setLoading(false); } }, []);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    try {
      if (editing) await apiClient.put(`/education/courses/${editing.id}`, form); else await apiClient.post("/education/courses", form);
      toast.success("ذخیره شد"); setShowModal(false); setEditing(undefined); load();
    } catch { toast.error("خطا"); }
  };
  const del = async (id: string) => { if (!confirm("حذف؟")) return; try { await apiClient.delete(`/education/courses/${id}`); toast.success("حذف شد"); load(); } catch { /**/ } };
  const open = (c?: Course) => { setEditing(c); setForm(c ? { courseCode: c.courseCode, title: c.title, description: c.description ?? "", instructorName: c.instructorName, category: c.category, level: c.level, durationHours: c.durationHours, maxStudents: c.maxStudents ?? 30, price: c.price ?? 0, isActive: c.isActive } : { courseCode: `CRS-${Date.now().toString().slice(-5)}`, title: "", description: "", instructorName: "", category: CATEGORIES[0], level: "beginner", durationHours: 20, maxStudents: 30, price: 0, isActive: true }); setShowModal(true); };

  const filtered = courses.filter(c => { if (catFilter !== "all" && c.category !== catFilter) return false; if (search && !c.title.includes(search) && !c.instructorName.includes(search) && !c.courseCode.includes(search)) return false; return true; });

  return (
    <div className="p-6 space-y-5 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold flex items-center gap-2"><BookOpen className="w-6 h-6 text-primary" />دوره‌های آموزشی</h1></div>
        <button onClick={() => open()} className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-brand text-black text-sm font-semibold"><Plus className="w-4 h-4" /> دوره جدید</button>
      </div>
      <div className="grid grid-cols-4 gap-4">
        <StatCard title="کل دوره‌ها" value={courses.length} icon={BookOpen} color="blue" />
        <StatCard title="فعال" value={courses.filter(c => c.isActive).length} icon={BookOpen} color="green" />
        <StatCard title="کل ساعت‌ها" value={courses.reduce((a, c) => a + c.durationHours, 0)} icon={Clock} color="amber" />
        <StatCard title="کل ثبت‌نام" value={courses.reduce((a, c) => a + (c.enrollmentCount ?? 0), 0)} icon={Users} color="violet" />
      </div>
      <div className="flex gap-3">
        <div className="relative flex-1"><Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="جستجو..." className="w-full pe-10 ps-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" /></div>
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary">
          <option value="all">همه دسته‌ها</option>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {loading ? <div className="col-span-3 p-12 text-center text-muted-foreground">در حال بارگذاری...</div> : filtered.length === 0 ? (
          <div className="col-span-3 p-12 text-center text-muted-foreground glass rounded-2xl border border-border"><BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" /><p>دوره‌ای یافت نشد</p></div>
        ) : filtered.map(c => (
          <div key={c.id} className={cn("glass rounded-2xl border p-5 flex flex-col gap-3 transition-all", c.isActive ? "border-border" : "border-border opacity-70")}>
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs text-muted-foreground">{c.courseCode}</span>
                  <span className={cn("px-2 py-0.5 rounded-full text-xs", LEVEL_CFG[c.level].color)}>{LEVEL_CFG[c.level].label}</span>
                  {!c.isActive && <span className="px-2 py-0.5 rounded-full text-xs text-gray-400 bg-gray-500/10">غیرفعال</span>}
                </div>
                <p className="font-semibold truncate">{c.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{c.instructorName}</p>
              </div>
              <div className="flex gap-1 shrink-0"><button onClick={() => open(c)} className="p-1.5 rounded-lg hover:bg-muted"><Pencil className="w-3.5 h-3.5 text-muted-foreground" /></button><button onClick={() => del(c.id)} className="p-1.5 rounded-lg hover:bg-destructive/10"><Trash2 className="w-3.5 h-3.5 text-destructive" /></button></div>
            </div>
            {c.description && <p className="text-xs text-muted-foreground line-clamp-2">{c.description}</p>}
            <div className="flex items-center justify-between text-sm pt-2 border-t border-border">
              <div className="flex items-center gap-3 text-muted-foreground">
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{c.durationHours}h</span>
                <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{c.enrollmentCount ?? 0}{c.maxStudents ? `/${c.maxStudents}` : ""}</span>
              </div>
              <span className="font-medium text-primary">{c.price ? formatPrice(c.price) : "رایگان"}</span>
            </div>
          </div>
        ))}
      </div>
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="glass rounded-2xl p-6 w-full max-w-lg border border-border max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5"><h2 className="text-lg font-bold">{editing ? "ویرایش دوره" : "دوره جدید"}</h2><button onClick={() => setShowModal(false)}><X className="w-4 h-4" /></button></div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input placeholder="کد دوره" value={form.courseCode} onChange={e => setForm(f => ({ ...f, courseCode: e.target.value }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary">
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <input placeholder="عنوان دوره *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                <input placeholder="نام مدرس *" value={form.instructorName} onChange={e => setForm(f => ({ ...f, instructorName: e.target.value }))} className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                <textarea placeholder="توضیحات" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary resize-none" />
                <div className="grid grid-cols-3 gap-3">
                  <select value={form.level} onChange={e => setForm(f => ({ ...f, level: e.target.value as Course["level"] }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary">
                    {Object.entries(LEVEL_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                  <input type="number" placeholder="ساعت" value={form.durationHours || ""} onChange={e => setForm(f => ({ ...f, durationHours: Number(e.target.value) }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                  <input type="number" placeholder="حداکثر دانشجو" value={form.maxStudents || ""} onChange={e => setForm(f => ({ ...f, maxStudents: Number(e.target.value) }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                </div>
                <input type="number" placeholder="شهریه (تومان)" value={form.price || ""} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))} className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                <label className="flex items-center gap-2 cursor-pointer text-sm"><input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} /><span>دوره فعال است</span></label>
              </div>
              <div className="flex gap-3 mt-5"><button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl border border-border text-sm">انصراف</button><button onClick={save} className="flex-[2] py-2.5 rounded-xl gradient-brand text-black text-sm font-semibold">ذخیره</button></div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
