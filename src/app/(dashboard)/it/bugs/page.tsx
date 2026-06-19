"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Bug, Plus, Search, AlertCircle, CheckCircle2, Clock, X, Pencil, Trash2, MessageSquare, ChevronRight } from "lucide-react";
import { StatCard } from "@/components/common/StatCard";
import { toJalali } from "@/lib/utils";
import { apiClient } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface BugReport { id: string; title: string; description?: string; severity: "critical"|"high"|"medium"|"low"; status: "open"|"in_progress"|"resolved"|"closed"; project?: string; assignee?: string; reporter?: string; environment?: string; stepsToReproduce?: string; createdAt: string; }

const SEV = { critical: "text-red-400 bg-red-500/10", high: "text-orange-400 bg-orange-500/10", medium: "text-amber-400 bg-amber-500/10", low: "text-gray-400 bg-gray-500/10" };
const SEV_LABEL = { critical: "بحرانی", high: "زیاد", medium: "متوسط", low: "کم" };
const STATUS_CFG = { open: { label: "باز", color: "text-red-400 bg-red-500/10" }, in_progress: { label: "در حال بررسی", color: "text-amber-400 bg-amber-500/10" }, resolved: { label: "حل شده", color: "text-emerald-400 bg-emerald-500/10" }, closed: { label: "بسته", color: "text-gray-400 bg-gray-500/10" } };

export default function BugsPage() {
  const [bugs, setBugs] = useState<BugReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sevFilter, setSevFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<BugReport | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<BugReport | undefined>();
  const [form, setForm] = useState({ title: "", description: "", severity: "medium" as BugReport["severity"], project: "", assignee: "", environment: "dev", stepsToReproduce: "" });

  const load = useCallback(async () => {
    try { const r = await apiClient.get("/it/bugs"); setBugs(r.data.data ?? []); } catch { toast.error("خطا"); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    try {
      if (editing) await apiClient.put(`/it/bugs/${editing.id}`, form); else await apiClient.post("/it/bugs", form);
      toast.success("ذخیره شد"); setShowModal(false); setEditing(undefined); load();
    } catch { toast.error("خطا"); }
  };

  const del = async (id: string) => { if (!confirm("حذف؟")) return; try { await apiClient.delete(`/it/bugs/${id}`); toast.success("حذف شد"); load(); } catch { /**/ } };

  const filtered = bugs.filter(b => {
    if (sevFilter !== "all" && b.severity !== sevFilter) return false;
    if (statusFilter !== "all" && b.status !== statusFilter) return false;
    if (search && !b.title.includes(search) && !(b.project ?? "").includes(search)) return false;
    return true;
  });

  const open = (b?: BugReport) => { setEditing(b); setForm(b ? { title: b.title, description: b.description ?? "", severity: b.severity, project: b.project ?? "", assignee: b.assignee ?? "", environment: b.environment ?? "dev", stepsToReproduce: b.stepsToReproduce ?? "" } : { title: "", description: "", severity: "medium", project: "", assignee: "", environment: "dev", stepsToReproduce: "" }); setShowModal(true); };

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold flex items-center gap-2"><Bug className="w-6 h-6 text-primary" />باگ تراکر</h1><p className="text-muted-foreground text-sm mt-1">ثبت و پیگیری باگ‌ها</p></div>
        <button onClick={() => open()} className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-brand text-black text-sm font-semibold"><Plus className="w-4 h-4" /> باگ جدید</button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <StatCard title="باز" value={bugs.filter(b => b.status === "open").length} icon={AlertCircle} color="red" />
        <StatCard title="در حال بررسی" value={bugs.filter(b => b.status === "in_progress").length} icon={Clock} color="amber" />
        <StatCard title="حل شده" value={bugs.filter(b => b.status === "resolved").length} icon={CheckCircle2} color="green" />
        <StatCard title="بحرانی" value={bugs.filter(b => b.severity === "critical").length} icon={Bug} color="red" />
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="جستجو..." className="w-full pe-10 ps-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
        </div>
        <select value={sevFilter} onChange={e => setSevFilter(e.target.value)} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary">
          <option value="all">همه شدت‌ها</option>
          {Object.entries(SEV_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary">
          <option value="all">همه وضعیت‌ها</option>
          {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      <div className="glass rounded-2xl border border-border overflow-hidden">
        {loading ? <div className="p-12 text-center text-muted-foreground">در حال بارگذاری...</div> : filtered.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground"><Bug className="w-10 h-10 mx-auto mb-3 opacity-30" /><p>باگی یافت نشد</p></div>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border"><th className="text-right p-4 text-muted-foreground font-medium">عنوان</th><th className="text-right p-4 text-muted-foreground font-medium">پروژه</th><th className="text-right p-4 text-muted-foreground font-medium">شدت</th><th className="text-right p-4 text-muted-foreground font-medium">وضعیت</th><th className="text-right p-4 text-muted-foreground font-medium">تاریخ</th><th className="p-4"></th></tr></thead>
            <tbody>
              {filtered.map(b => (
                <tr key={b.id} className="border-b border-border hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => setSelected(b)}>
                  <td className="p-4"><p className="font-medium">{b.title}</p>{b.assignee && <p className="text-xs text-muted-foreground">{b.assignee}</p>}</td>
                  <td className="p-4 text-muted-foreground">{b.project ?? "—"}</td>
                  <td className="p-4"><span className={cn("px-2.5 py-1 rounded-full text-xs font-medium", SEV[b.severity])}>{SEV_LABEL[b.severity]}</span></td>
                  <td className="p-4"><span className={cn("px-2.5 py-1 rounded-full text-xs font-medium", STATUS_CFG[b.status].color)}>{STATUS_CFG[b.status].label}</span></td>
                  <td className="p-4 text-muted-foreground">{toJalali(b.createdAt)}</td>
                  <td className="p-4">
                    <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                      <button onClick={() => open(b)} className="p-1.5 rounded-lg hover:bg-muted"><Pencil className="w-3.5 h-3.5 text-muted-foreground" /></button>
                      <button onClick={() => del(b.id)} className="p-1.5 rounded-lg hover:bg-destructive/10"><Trash2 className="w-3.5 h-3.5 text-destructive" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Detail panel */}
      <AnimatePresence>
        {selected && (
          <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }}
            className="fixed top-0 left-0 h-full w-[420px] glass border-r border-border z-40 overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold">جزئیات باگ</h2>
              <button onClick={() => setSelected(null)}><X className="w-5 h-5" /></button>
            </div>
            <h3 className="font-semibold text-base mb-2">{selected.title}</h3>
            <div className="flex gap-2 mb-4">
              <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium", SEV[selected.severity])}>{SEV_LABEL[selected.severity]}</span>
              <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium", STATUS_CFG[selected.status].color)}>{STATUS_CFG[selected.status].label}</span>
            </div>
            {selected.description && <p className="text-sm text-muted-foreground mb-4">{selected.description}</p>}
            {selected.stepsToReproduce && <div className="mb-4"><p className="text-xs font-semibold text-muted-foreground mb-1">مراحل بازتولید:</p><p className="text-sm bg-muted rounded-xl p-3">{selected.stepsToReproduce}</p></div>}
            <div className="space-y-2 text-sm">
              {selected.project && <div className="flex justify-between"><span className="text-muted-foreground">پروژه</span><span>{selected.project}</span></div>}
              {selected.assignee && <div className="flex justify-between"><span className="text-muted-foreground">مسئول</span><span>{selected.assignee}</span></div>}
              {selected.environment && <div className="flex justify-between"><span className="text-muted-foreground">محیط</span><span>{selected.environment}</span></div>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="glass rounded-2xl p-6 w-full max-w-lg border border-border max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5"><h2 className="text-lg font-bold">{editing ? "ویرایش باگ" : "باگ جدید"}</h2><button onClick={() => setShowModal(false)}><X className="w-4 h-4" /></button></div>
              <div className="space-y-3">
                <input placeholder="عنوان *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                <textarea placeholder="توضیحات" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary resize-none" />
                <textarea placeholder="مراحل بازتولید" value={form.stepsToReproduce} onChange={e => setForm(f => ({ ...f, stepsToReproduce: e.target.value }))} rows={2} className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary resize-none" />
                <div className="grid grid-cols-2 gap-3">
                  <select value={form.severity} onChange={e => setForm(f => ({ ...f, severity: e.target.value as BugReport["severity"] }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary">
                    {Object.entries(SEV_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                  <select value={form.environment} onChange={e => setForm(f => ({ ...f, environment: e.target.value }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary">
                    <option value="dev">توسعه</option><option value="staging">استیجینگ</option><option value="prod">پروداکشن</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input placeholder="پروژه" value={form.project} onChange={e => setForm(f => ({ ...f, project: e.target.value }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                  <input placeholder="مسئول" value={form.assignee} onChange={e => setForm(f => ({ ...f, assignee: e.target.value }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
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
