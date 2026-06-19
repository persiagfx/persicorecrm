"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Users, Plus, Search, BookOpen, Award, X, Pencil, Trash2, Phone, Mail } from "lucide-react";
import { toJalali } from "@/lib/utils";
import { StatCard } from "@/components/common/StatCard";
import { apiClient } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Student { id: string; studentCode: string; firstName: string; lastName: string; phone?: string; email?: string; nationalId?: string; enrollmentDate?: string; status: "active"|"inactive"|"graduated"|"suspended"; enrollmentCount?: number; certificateCount?: number; notes?: string; }

const STATUS_CFG = { active: { label: "فعال", color: "text-emerald-400 bg-emerald-500/10" }, inactive: { label: "غیرفعال", color: "text-gray-400 bg-gray-500/10" }, graduated: { label: "فارغ‌التحصیل", color: "text-blue-400 bg-blue-500/10" }, suspended: { label: "تعلیق", color: "text-red-400 bg-red-500/10" } };

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<Student | undefined>();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Student | undefined>();
  const [form, setForm] = useState({ studentCode: "", firstName: "", lastName: "", phone: "", email: "", nationalId: "", enrollmentDate: new Date().toISOString().slice(0, 10), status: "active" as Student["status"], notes: "" });

  const load = useCallback(async () => { try { const r = await apiClient.get("/education/students"); setStudents(r.data.data ?? []); } catch { toast.error("خطا"); } finally { setLoading(false); } }, []);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    try {
      if (editing) await apiClient.put(`/education/students/${editing.id}`, form); else await apiClient.post("/education/students", form);
      toast.success("ذخیره شد"); setShowModal(false); setEditing(undefined); load();
    } catch { toast.error("خطا"); }
  };
  const del = async (id: string) => { if (!confirm("حذف؟")) return; try { await apiClient.delete(`/education/students/${id}`); toast.success("حذف شد"); if (selected?.id === id) setSelected(undefined); load(); } catch { /**/ } };
  const open = (s?: Student) => { setEditing(s); setForm(s ? { studentCode: s.studentCode, firstName: s.firstName, lastName: s.lastName, phone: s.phone ?? "", email: s.email ?? "", nationalId: s.nationalId ?? "", enrollmentDate: s.enrollmentDate ?? new Date().toISOString().slice(0, 10), status: s.status, notes: s.notes ?? "" } : { studentCode: `STD-${Date.now().toString().slice(-5)}`, firstName: "", lastName: "", phone: "", email: "", nationalId: "", enrollmentDate: new Date().toISOString().slice(0, 10), status: "active", notes: "" }); setShowModal(true); };

  const filtered = students.filter(s => { if (statusFilter !== "all" && s.status !== statusFilter) return false; if (search && !`${s.firstName} ${s.lastName}`.includes(search) && !s.studentCode.includes(search) && !(s.phone ?? "").includes(search)) return false; return true; });

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold flex items-center gap-2"><Users className="w-6 h-6 text-primary" />مدیریت دانشجویان</h1></div>
        <button onClick={() => open()} className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-brand text-black text-sm font-semibold"><Plus className="w-4 h-4" /> دانشجو جدید</button>
      </div>
      <div className="grid grid-cols-4 gap-4">
        <StatCard title="کل دانشجویان" value={students.length} icon={Users} color="blue" />
        <StatCard title="فعال" value={students.filter(s => s.status === "active").length} icon={Users} color="green" />
        <StatCard title="فارغ‌التحصیل" value={students.filter(s => s.status === "graduated").length} icon={Award} color="violet" />
        <StatCard title="تعلیق" value={students.filter(s => s.status === "suspended").length} icon={Users} color="red" />
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
            <div className="p-12 text-center text-muted-foreground"><Users className="w-10 h-10 mx-auto mb-3 opacity-30" /><p>دانشجویی یافت نشد</p></div>
          ) : (
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border">{["کد", "نام", "تلفن", "دوره‌ها", "گواهی", "وضعیت", ""].map(h => <th key={h} className="text-right p-4 text-muted-foreground font-medium">{h}</th>)}</tr></thead>
              <tbody>
                {filtered.map(s => (
                  <tr key={s.id} onClick={() => setSelected(s)} className={cn("border-b border-border hover:bg-muted/30 transition-colors cursor-pointer", selected?.id === s.id && "bg-muted/50")}>
                    <td className="p-4 font-mono text-xs">{s.studentCode}</td>
                    <td className="p-4 font-medium">{s.firstName} {s.lastName}</td>
                    <td className="p-4 text-muted-foreground" dir="ltr">{s.phone ?? "—"}</td>
                    <td className="p-4 text-center">{s.enrollmentCount ?? 0}</td>
                    <td className="p-4 text-center">{s.certificateCount ?? 0}</td>
                    <td className="p-4"><span className={cn("px-2.5 py-1 rounded-full text-xs font-medium", STATUS_CFG[s.status].color)}>{STATUS_CFG[s.status].label}</span></td>
                    <td className="p-4"><div className="flex gap-1"><button onClick={e => { e.stopPropagation(); open(s); }} className="p-1.5 rounded-lg hover:bg-muted"><Pencil className="w-3.5 h-3.5 text-muted-foreground" /></button><button onClick={e => { e.stopPropagation(); del(s.id); }} className="p-1.5 rounded-lg hover:bg-destructive/10"><Trash2 className="w-3.5 h-3.5 text-destructive" /></button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {selected && (
          <div className="w-72 shrink-0 glass rounded-2xl border border-border p-5 space-y-4">
            <div className="flex items-center justify-between"><p className="font-semibold">{selected.firstName} {selected.lastName}</p><button onClick={() => setSelected(undefined)}><X className="w-4 h-4 text-muted-foreground" /></button></div>
            <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">{selected.firstName.charAt(0)}</div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">کد</span><span className="font-mono">{selected.studentCode}</span></div>
              {selected.phone && <div className="flex justify-between items-center"><span className="text-muted-foreground">تلفن</span><span dir="ltr" className="flex items-center gap-1"><Phone className="w-3 h-3" />{selected.phone}</span></div>}
              {selected.email && <div className="flex justify-between items-center"><span className="text-muted-foreground">ایمیل</span><span className="flex items-center gap-1 text-xs truncate"><Mail className="w-3 h-3" />{selected.email}</span></div>}
              {selected.nationalId && <div className="flex justify-between"><span className="text-muted-foreground">کد ملی</span><span>{selected.nationalId}</span></div>}
              <div className="flex justify-between"><span className="text-muted-foreground">وضعیت</span><span className={cn("px-2 py-0.5 rounded-full text-xs", STATUS_CFG[selected.status].color)}>{STATUS_CFG[selected.status].label}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">دوره‌ها</span><span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" />{selected.enrollmentCount ?? 0}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">گواهی</span><span className="flex items-center gap-1"><Award className="w-3.5 h-3.5" />{selected.certificateCount ?? 0}</span></div>
              {selected.enrollmentDate && <div className="flex justify-between"><span className="text-muted-foreground">ثبت‌نام</span><span>{toJalali(selected.enrollmentDate)}</span></div>}
            </div>
            {selected.notes && <div className="text-xs text-muted-foreground border-t border-border pt-3">{selected.notes}</div>}
          </div>
        )}
      </div>
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="glass rounded-2xl p-6 w-full max-w-lg border border-border max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5"><h2 className="text-lg font-bold">{editing ? "ویرایش دانشجو" : "دانشجوی جدید"}</h2><button onClick={() => setShowModal(false)}><X className="w-4 h-4" /></button></div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input placeholder="نام *" value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                  <input placeholder="نام خانوادگی *" value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input placeholder="تلفن" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} dir="ltr" className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                  <input placeholder="ایمیل" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} dir="ltr" className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input placeholder="کد ملی" value={form.nationalId} onChange={e => setForm(f => ({ ...f, nationalId: e.target.value }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                  <input placeholder="کد دانشجویی" value={form.studentCode} onChange={e => setForm(f => ({ ...f, studentCode: e.target.value }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-xs text-muted-foreground mb-1">تاریخ ثبت‌نام</label><input type="date" value={form.enrollmentDate} onChange={e => setForm(f => ({ ...f, enrollmentDate: e.target.value }))} className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" /></div>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as Student["status"] }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary self-end">
                    {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
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
