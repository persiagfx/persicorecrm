"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { FileCheck, Plus, Search, Clock, CheckCircle2, AlertCircle, X, Pencil, Trash2, BarChart2 } from "lucide-react";
import { toJalali } from "@/lib/utils";
import { StatCard } from "@/components/common/StatCard";
import { apiClient } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Exam { id: string; examCode: string; title: string; courseId?: string; courseName?: string; examDate: string; durationMinutes: number; totalMarks: number; passingMarks: number; status: "draft"|"scheduled"|"ongoing"|"grading"|"completed"|"cancelled"; location?: string; submissionsCount?: number; avgScore?: number; passRate?: number; }

const STATUS_CFG = { draft: { label: "پیش‌نویس", color: "text-gray-400 bg-gray-500/10" }, scheduled: { label: "برنامه‌ریزی", color: "text-blue-400 bg-blue-500/10" }, ongoing: { label: "در حال برگزاری", color: "text-amber-400 bg-amber-500/10" }, grading: { label: "نمره‌دهی", color: "text-violet-400 bg-violet-500/10" }, completed: { label: "برگزار شد", color: "text-emerald-400 bg-emerald-500/10" }, cancelled: { label: "لغو", color: "text-red-400 bg-red-500/10" } };

export default function ExamsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [courses, setCourses] = useState<{ id: string; title: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<Exam | undefined>();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Exam | undefined>();
  const [form, setForm] = useState({ examCode: "", title: "", courseId: "", examDate: new Date().toISOString().slice(0, 10), durationMinutes: 90, totalMarks: 100, passingMarks: 60, status: "scheduled" as Exam["status"], location: "" });

  const load = useCallback(async () => {
    try { const [er, cr] = await Promise.all([apiClient.get("/education/exams"), apiClient.get("/education/courses")]); setExams(er.data.data ?? []); setCourses(cr.data.data ?? []); } catch { toast.error("خطا"); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    try {
      if (editing) await apiClient.put(`/education/exams/${editing.id}`, form); else await apiClient.post("/education/exams", form);
      toast.success("ذخیره شد"); setShowModal(false); setEditing(undefined); load();
    } catch { toast.error("خطا"); }
  };
  const del = async (id: string) => { if (!confirm("حذف؟")) return; try { await apiClient.delete(`/education/exams/${id}`); toast.success("حذف شد"); if (selected?.id === id) setSelected(undefined); load(); } catch { /**/ } };
  const open = (e?: Exam) => { setEditing(e); setForm(e ? { examCode: e.examCode, title: e.title, courseId: e.courseId ?? "", examDate: e.examDate, durationMinutes: e.durationMinutes, totalMarks: e.totalMarks, passingMarks: e.passingMarks, status: e.status, location: e.location ?? "" } : { examCode: `EX-${Date.now().toString().slice(-5)}`, title: "", courseId: "", examDate: new Date().toISOString().slice(0, 10), durationMinutes: 90, totalMarks: 100, passingMarks: 60, status: "scheduled", location: "" }); setShowModal(true); };

  const filtered = exams.filter(e => { if (statusFilter !== "all" && e.status !== statusFilter) return false; if (search && !e.title.includes(search) && !(e.courseName ?? "").includes(search) && !e.examCode.includes(search)) return false; return true; });

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold flex items-center gap-2"><FileCheck className="w-6 h-6 text-primary" />آزمون‌ها</h1></div>
        <button onClick={() => open()} className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-brand text-black text-sm font-semibold"><Plus className="w-4 h-4" /> آزمون جدید</button>
      </div>
      <div className="grid grid-cols-4 gap-4">
        <StatCard title="کل آزمون‌ها" value={exams.length} icon={FileCheck} color="blue" />
        <StatCard title="برنامه‌ریزی شده" value={exams.filter(e => e.status === "scheduled").length} icon={Clock} color="amber" />
        <StatCard title="برگزار شده" value={exams.filter(e => e.status === "completed").length} icon={CheckCircle2} color="green" />
        <StatCard title="لغو شده" value={exams.filter(e => e.status === "cancelled").length} icon={AlertCircle} color="red" />
      </div>
      <div className="flex gap-3">
        <div className="relative flex-1"><Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="جستجو..." className="w-full pe-10 ps-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" /></div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary">
          <option value="all">همه وضعیت‌ها</option>
          {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>
      <div className="flex gap-5">
        <div className="flex-1 glass rounded-2xl border border-border overflow-hidden">
          {loading ? <div className="p-12 text-center text-muted-foreground">در حال بارگذاری...</div> : filtered.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground"><FileCheck className="w-10 h-10 mx-auto mb-3 opacity-30" /><p>آزمونی یافت نشد</p></div>
          ) : (
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border">{["کد", "عنوان", "دوره", "تاریخ", "مدت", "نمره قبولی", "شرکت‌کنندگان", "وضعیت", ""].map(h => <th key={h} className="text-right p-4 text-muted-foreground font-medium whitespace-nowrap">{h}</th>)}</tr></thead>
              <tbody>
                {filtered.map(e => (
                  <tr key={e.id} onClick={() => setSelected(e)} className={cn("border-b border-border hover:bg-muted/30 transition-colors cursor-pointer", selected?.id === e.id && "bg-muted/50")}>
                    <td className="p-4 font-mono text-xs">{e.examCode}</td>
                    <td className="p-4 font-medium">{e.title}</td>
                    <td className="p-4 text-muted-foreground">{e.courseName ?? "—"}</td>
                    <td className="p-4 text-muted-foreground whitespace-nowrap">{toJalali(e.examDate)}</td>
                    <td className="p-4 text-muted-foreground">{e.durationMinutes} دقیقه</td>
                    <td className="p-4">{e.passingMarks}/{e.totalMarks}</td>
                    <td className="p-4 text-center">{e.submissionsCount ?? 0}</td>
                    <td className="p-4"><span className={cn("px-2.5 py-1 rounded-full text-xs font-medium", STATUS_CFG[e.status].color)}>{STATUS_CFG[e.status].label}</span></td>
                    <td className="p-4"><div className="flex gap-1"><button onClick={ev => { ev.stopPropagation(); open(e); }} className="p-1.5 rounded-lg hover:bg-muted"><Pencil className="w-3.5 h-3.5 text-muted-foreground" /></button><button onClick={ev => { ev.stopPropagation(); del(e.id); }} className="p-1.5 rounded-lg hover:bg-destructive/10"><Trash2 className="w-3.5 h-3.5 text-destructive" /></button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {selected && (
          <div className="w-72 shrink-0 glass rounded-2xl border border-border p-5 space-y-4">
            <div className="flex items-center justify-between"><p className="font-semibold text-sm">{selected.title}</p><button onClick={() => setSelected(undefined)}><X className="w-4 h-4 text-muted-foreground" /></button></div>
            <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium inline-block", STATUS_CFG[selected.status].color)}>{STATUS_CFG[selected.status].label}</span>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">کد</span><span className="font-mono text-xs">{selected.examCode}</span></div>
              {selected.courseName && <div className="flex justify-between"><span className="text-muted-foreground">دوره</span><span>{selected.courseName}</span></div>}
              <div className="flex justify-between"><span className="text-muted-foreground">تاریخ</span><span>{toJalali(selected.examDate)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">مدت</span><span>{selected.durationMinutes} دقیقه</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">نمره کل</span><span>{selected.totalMarks}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">نمره قبولی</span><span>{selected.passingMarks}</span></div>
              {selected.location && <div className="flex justify-between"><span className="text-muted-foreground">محل</span><span>{selected.location}</span></div>}
              {selected.submissionsCount !== undefined && <div className="flex justify-between"><span className="text-muted-foreground">شرکت‌کنندگان</span><span>{selected.submissionsCount}</span></div>}
              {selected.avgScore !== undefined && <div className="flex justify-between"><span className="text-muted-foreground">میانگین نمره</span><span className="font-medium">{selected.avgScore.toFixed(1)}</span></div>}
              {selected.passRate !== undefined && <div className="flex justify-between"><span className="text-muted-foreground">نرخ قبولی</span><span className={selected.passRate >= 60 ? "text-emerald-400" : "text-red-400"}>{selected.passRate}%</span></div>}
            </div>
          </div>
        )}
      </div>
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="glass rounded-2xl p-6 w-full max-w-lg border border-border max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5"><h2 className="text-lg font-bold">{editing ? "ویرایش آزمون" : "آزمون جدید"}</h2><button onClick={() => setShowModal(false)}><X className="w-4 h-4" /></button></div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input placeholder="کد آزمون" value={form.examCode} onChange={e => setForm(f => ({ ...f, examCode: e.target.value }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                  <select value={form.courseId} onChange={e => setForm(f => ({ ...f, courseId: e.target.value }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary">
                    <option value="">انتخاب دوره</option>
                    {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                </div>
                <input placeholder="عنوان آزمون *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                <div className="grid grid-cols-2 gap-3">
                  <input type="date" value={form.examDate} onChange={e => setForm(f => ({ ...f, examDate: e.target.value }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                  <input type="number" placeholder="مدت (دقیقه)" value={form.durationMinutes} onChange={e => setForm(f => ({ ...f, durationMinutes: Number(e.target.value) }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input type="number" placeholder="نمره کل" value={form.totalMarks} onChange={e => setForm(f => ({ ...f, totalMarks: Number(e.target.value) }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                  <input type="number" placeholder="نمره قبولی" value={form.passingMarks} onChange={e => setForm(f => ({ ...f, passingMarks: Number(e.target.value) }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input placeholder="محل برگزاری" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as Exam["status"] }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary">
                    {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-5"><button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl border border-border text-sm">انصراف</button><button onClick={save} className="flex-[2] py-2.5 rounded-xl gradient-brand text-black text-sm font-semibold">ذخیره</button></div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
