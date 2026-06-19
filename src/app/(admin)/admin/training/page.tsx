"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { GraduationCap, Plus, Edit2, Trash2, X, Users, Eye, EyeOff, Search } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Course {
  id: string;
  title: string;
  description: string | null;
  instructor: string | null;
  duration: string | null;
  category: string;
  fileUrl: string | null;
  isActive: boolean;
  createdAt: string;
  _count: { enrollments: number };
}

const CATEGORIES = [
  { value: "technical", label: "فنی" },
  { value: "soft_skills", label: "مهارت‌های نرم" },
  { value: "compliance", label: "انطباق" },
  { value: "leadership", label: "رهبری" },
  { value: "product", label: "محصول" },
];

const emptyForm = { title: "", description: "", instructor: "", duration: "", category: "technical", fileUrl: "" };

export default function AdminTrainingPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  const load = () => {
    setLoading(true);
    apiClient.get("/admin/training")
      .then(r => setCourses(r.data?.data ?? r.data ?? []))
      .catch(() => toast.error("خطا در دریافت دوره‌ها"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (c: Course) => {
    setEditing(c);
    setForm({ title: c.title, description: c.description ?? "", instructor: c.instructor ?? "", duration: c.duration ?? "", category: c.category, fileUrl: c.fileUrl ?? "" });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast.error("عنوان دوره الزامی است"); return; }
    setSaving(true);
    try {
      if (editing) {
        await apiClient.put(`/admin/training/${editing.id}`, form);
        toast.success("دوره به‌روزرسانی شد");
      } else {
        await apiClient.post("/admin/training", form);
        toast.success("دوره جدید اضافه شد");
      }
      setShowModal(false);
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.error ?? "خطا در ذخیره");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (course: Course) => {
    try {
      await apiClient.put(`/admin/training/${course.id}`, { isActive: !course.isActive });
      setCourses(prev => prev.map(c => c.id === course.id ? { ...c, isActive: !c.isActive } : c));
    } catch {
      toast.error("خطا");
    }
  };

  const deleteCourse = async (id: string) => {
    if (!confirm("آیا مطمئنید؟")) return;
    try {
      await apiClient.delete(`/admin/training/${id}`);
      setCourses(prev => prev.filter(c => c.id !== id));
      toast.success("دوره حذف شد");
    } catch {
      toast.error("خطا در حذف");
    }
  };

  const filtered = courses.filter(c => !search || c.title.includes(search) || c.instructor?.includes(search));
  const inputCls = "w-full bg-background/50 border border-border rounded-xl px-3 py-2.5 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-primary" />
            مدیریت آموزش
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">{courses.length} دوره آموزشی</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-brand text-black font-semibold text-sm">
          <Plus className="w-4 h-4" /> دوره جدید
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="جستجو..."
          className="w-full pe-10 ps-4 py-2.5 rounded-xl bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-card border border-border animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {["عنوان دوره", "مدرس", "دسته‌بندی", "مدت", "ثبت‌نام‌ها", "وضعیت", "عملیات"].map(h => (
                  <th key={h} className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(course => (
                <tr key={course.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{course.title}</p>
                    {course.description && <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{course.description}</p>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{course.instructor ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                      {CATEGORIES.find(c => c.value === course.category)?.label ?? course.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{course.duration ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1 text-muted-foreground text-xs">
                      <Users className="w-3 h-3" />{course._count.enrollments}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleActive(course)}
                      className={cn("flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full transition-colors", course.isActive ? "bg-emerald-500/10 text-emerald-400" : "bg-muted text-muted-foreground")}>
                      {course.isActive ? <><Eye className="w-3 h-3" />فعال</> : <><EyeOff className="w-3 h-3" />غیرفعال</>}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(course)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => deleteCourse(course.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-12 text-center text-muted-foreground text-sm">دوره‌ای وجود ندارد</div>
          )}
        </div>
      )}

      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={e => e.target === e.currentTarget && setShowModal(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl">
              <div className="p-5 border-b border-border flex items-center justify-between">
                <h3 className="font-bold text-foreground">{editing ? "ویرایش دوره" : "دوره آموزشی جدید"}</h3>
                <button onClick={() => setShowModal(false)} className="p-2 rounded-xl hover:bg-muted text-muted-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-5 space-y-3">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5">عنوان دوره *</label>
                  <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className={inputCls} placeholder="عنوان دوره آموزشی" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1.5">دسته‌بندی</label>
                    <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} className={inputCls}>
                      {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1.5">مدت دوره</label>
                    <input value={form.duration} onChange={e => setForm(p => ({ ...p, duration: e.target.value }))} className={inputCls} placeholder="مثلاً: ۸ ساعت" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5">مدرس</label>
                  <input value={form.instructor} onChange={e => setForm(p => ({ ...p, instructor: e.target.value }))} className={inputCls} placeholder="نام مدرس" />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5">لینک محتوا (ویدیو / فایل)</label>
                  <input value={form.fileUrl} onChange={e => setForm(p => ({ ...p, fileUrl: e.target.value }))} className={inputCls} dir="ltr" placeholder="https://..." />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5">توضیحات</label>
                  <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={3}
                    className={inputCls + " resize-none"} placeholder="شرح دوره..." />
                </div>
              </div>
              <div className="p-5 border-t border-border flex gap-3">
                <button onClick={handleSave} disabled={saving}
                  className="flex-1 py-2.5 rounded-xl gradient-brand text-black font-semibold text-sm disabled:opacity-50">
                  {saving ? "در حال ذخیره..." : editing ? "ذخیره تغییرات" : "ایجاد دوره"}
                </button>
                <button onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-border text-muted-foreground hover:text-foreground text-sm">
                  انصراف
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
