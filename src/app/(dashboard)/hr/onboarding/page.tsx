"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { UserPlus, Plus, X, Check, ChevronDown, ChevronUp, Trash2, LogIn, LogOut } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface OnboardingTask { id: string; title: string; done: boolean; }
interface OnboardingRecord {
  id: string; type: "onboarding" | "offboarding"; status: string;
  tasks: OnboardingTask[]; notes: string | null; createdAt: string;
  user: { id: string; name: string; avatar: string | null; };
}
interface TeamUser { id: string; name: string; }

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: "در انتظار", color: "bg-muted text-muted-foreground" },
  in_progress: { label: "در جریان", color: "bg-blue-500/10 text-blue-400" },
  completed: { label: "تکمیل", color: "bg-emerald-500/10 text-emerald-400" },
};

export default function OnboardingPage() {
  const [records, setRecords] = useState<OnboardingRecord[]>([]);
  const [users, setUsers] = useState<TeamUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"onboarding" | "offboarding">("onboarding");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newForm, setNewForm] = useState({ userId: "", type: "onboarding" as "onboarding" | "offboarding", notes: "" });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [rRes, uRes] = await Promise.all([apiClient.get("/hr/onboarding"), apiClient.get("/users")]);
      setRecords(rRes.data.data ?? []);
      setUsers(uRes.data.data ?? []);
    } catch { toast.error("خطا در بارگذاری"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = records.filter(r => r.type === tab);
  const doneCount = filtered.filter(r => r.status === "completed").length;

  const handleToggleTask = async (record: OnboardingRecord, taskId: string) => {
    const updatedTasks = record.tasks.map(t => t.id === taskId ? { ...t, done: !t.done } : t);
    const allDone = updatedTasks.every(t => t.done);
    const newStatus = allDone ? "completed" : updatedTasks.some(t => t.done) ? "inProgress" : "pending";
    try {
      await apiClient.put(`/hr/onboarding/${record.id}`, { tasks: updatedTasks, status: newStatus });
      setRecords(p => p.map(r => r.id === record.id ? { ...r, tasks: updatedTasks, status: newStatus as OnboardingRecord["status"] } : r));
    } catch { toast.error("خطا در ذخیره"); }
  };

  const handleCreate = async () => {
    if (!newForm.userId) { toast.error("کارمند را انتخاب کنید"); return; }
    setSaving(true);
    try {
      const res = await apiClient.post("/hr/onboarding", newForm);
      setRecords(p => [res.data.data, ...p]);
      setShowModal(false);
      setNewForm({ userId: "", type: "onboarding", notes: "" });
      toast.success("فرآیند ایجاد شد");
    } catch { toast.error("خطا"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("حذف شود؟")) return;
    try {
      await apiClient.delete(`/hr/onboarding/${id}`);
      setRecords(p => p.filter(r => r.id !== id));
      toast.success("حذف شد");
    } catch { toast.error("خطا"); }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><UserPlus className="w-6 h-6 text-primary" />ورود و خروج پرسنل</h1>
          <p className="text-muted-foreground text-sm mt-0.5">مدیریت فرآیند Onboarding / Offboarding</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-brand text-black text-sm font-semibold gold-glow">
          <Plus className="w-4 h-4" />فرآیند جدید
        </button>
      </motion.div>

      <div className="flex gap-1 p-1 rounded-xl bg-card border border-border w-fit">
        {([["onboarding", "ورود", LogIn], ["offboarding", "خروج", LogOut]] as const).map(([val, label, Icon]) => (
          <button key={val} onClick={() => setTab(val)}
            className={cn("flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all", tab === val ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "کل فرآیندها", value: filtered.length, color: "text-blue-400 bg-blue-500/10" },
          { label: "تکمیل شده", value: doneCount, color: "text-emerald-400 bg-emerald-500/10" },
          { label: "در جریان", value: filtered.filter(r => r.status === "in_progress").length, color: "text-amber-400 bg-amber-500/10" },
        ].map(s => (
          <div key={s.label} className="p-5 rounded-2xl bg-card border border-border">
            <p className={cn("text-xl font-bold", s.color.split(" ")[0])}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 rounded-2xl bg-card animate-pulse border border-border" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center text-muted-foreground"><UserPlus className="w-10 h-10 mx-auto mb-3 opacity-30" />فرآیندی وجود ندارد</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(record => {
            const doneTasks = record.tasks.filter(t => t.done).length;
            const progress = record.tasks.length > 0 ? (doneTasks / record.tasks.length) * 100 : 0;
            const isExpanded = expandedId === record.id;
            return (
              <motion.div key={record.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="rounded-2xl bg-card border border-border overflow-hidden">
                <div className="p-4 flex items-center gap-4 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : record.id)}>
                  <div className="w-10 h-10 rounded-full gradient-brand flex items-center justify-center text-sm font-bold text-black shrink-0">{record.user.name.slice(0,1)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-foreground">{record.user.name}</span>
                      <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium mr-auto", STATUS_MAP[record.status].color)}>{STATUS_MAP[record.status].label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">{doneTasks}/{record.tasks.length}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={e => { e.stopPropagation(); handleDelete(record.id); }} className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </div>
                </div>
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      className="border-t border-border overflow-hidden">
                      <div className="p-4 space-y-2">
                        {record.tasks.map(task => (
                          <div key={task.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/30 cursor-pointer group"
                            onClick={() => handleToggleTask(record, task.id)}>
                            <div className={cn("w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all",
                              task.done ? "bg-primary border-primary" : "border-border group-hover:border-primary/50")}>
                              {task.done && <Check className="w-3 h-3 text-primary-foreground" />}
                            </div>
                            <span className={cn("text-sm", task.done ? "line-through text-muted-foreground" : "text-foreground")}>{task.title}</span>
                          </div>
                        ))}
                        {record.notes && <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border">یادداشت: {record.notes}</p>}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-sm bg-card border border-border rounded-2xl p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between"><h3 className="font-bold text-foreground">فرآیند جدید</h3><button onClick={() => setShowModal(false)}><X className="w-4 h-4 text-muted-foreground" /></button></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">کارمند *</label>
              <select value={newForm.userId} onChange={e => setNewForm(p => ({ ...p, userId: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-foreground text-sm">
                <option value="">انتخاب کنید</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">نوع فرآیند</label>
              <div className="flex gap-2">
                {([["onboarding", "ورود جدید", LogIn], ["offboarding", "خروج از سازمان", LogOut]] as const).map(([val, label, Icon]) => (
                  <button key={val} onClick={() => setNewForm(p => ({ ...p, type: val }))}
                    className={cn("flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium border transition-all",
                      newForm.type === val ? "border-primary bg-primary/10 text-primary" : "border-border bg-muted text-muted-foreground hover:text-foreground")}>
                    <Icon className="w-4 h-4" />{label}
                  </button>
                ))}
              </div>
            </div>
            <div><label className="text-xs text-muted-foreground mb-1 block">یادداشت</label>
              <textarea value={newForm.notes} onChange={e => setNewForm(p => ({ ...p, notes: e.target.value }))} rows={2}
                className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-foreground text-sm resize-none" /></div>
            <div className="flex gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl border border-border bg-muted text-foreground text-sm">انصراف</button>
              <button onClick={handleCreate} disabled={saving} className="flex-1 py-2.5 rounded-xl gradient-brand text-black font-semibold text-sm gold-glow disabled:opacity-60">{saving ? "ثبت..." : "ثبت"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
