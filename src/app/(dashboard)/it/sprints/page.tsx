"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Layers, Plus, User, AlertCircle, CheckCircle2, Clock, X, Pencil, Trash2, ChevronDown, Zap } from "lucide-react";
import { StatCard } from "@/components/common/StatCard";
import { apiClient } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Sprint { id: string; name: string; goal?: string; startDate: string; endDate: string; status: "planning"|"active"|"completed"; }
interface SprintTask { id: string; title: string; description?: string; assignee?: string; priority: "low"|"medium"|"high"|"urgent"; storyPoints: number; status: "todo"|"in_progress"|"review"|"done"; sprintId: string; }

const PRIORITY_CFG = { low: { label: "کم", color: "text-gray-400 bg-gray-500/10" }, medium: { label: "متوسط", color: "text-blue-400 bg-blue-500/10" }, high: { label: "زیاد", color: "text-amber-400 bg-amber-500/10" }, urgent: { label: "فوری", color: "text-red-400 bg-red-500/10" } };
const COLUMNS: { key: SprintTask["status"]; label: string }[] = [{ key: "todo", label: "انجام نشده" }, { key: "in_progress", label: "در حال انجام" }, { key: "review", label: "بررسی" }, { key: "done", label: "تمام شده" }];

export default function SprintsPage() {
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [tasks, setTasks] = useState<SprintTask[]>([]);
  const [activeSprint, setActiveSprint] = useState<Sprint | null>(null);
  const [showSprintModal, setShowSprintModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<SprintTask | undefined>();
  const [sprintForm, setSprintForm] = useState({ name: "", goal: "", startDate: "", endDate: "" });
  const [taskForm, setTaskForm] = useState({ title: "", description: "", assignee: "", priority: "medium" as SprintTask["priority"], storyPoints: 1 });

  const load = useCallback(async () => {
    try {
      const [sr, tr] = await Promise.all([apiClient.get("/it/sprints"), activeSprint ? apiClient.get(`/it/sprint-tasks?sprintId=${activeSprint.id}`) : Promise.resolve({ data: { data: [] } })]);
      const list: Sprint[] = sr.data.data ?? [];
      setSprints(list);
      if (!activeSprint && list.length) setActiveSprint(list.find(s => s.status === "active") ?? list[0]);
      setTasks(tr.data.data ?? []);
    } catch { toast.error("خطا در بارگذاری"); }
  }, [activeSprint?.id]);

  useEffect(() => { load(); }, []);

  const loadTasks = async (sprintId: string) => {
    try { const r = await apiClient.get(`/it/sprint-tasks?sprintId=${sprintId}`); setTasks(r.data.data ?? []); } catch { /**/ }
  };

  const saveSprint = async () => {
    try { await apiClient.post("/it/sprints", sprintForm); toast.success("اسپرینت ایجاد شد"); setShowSprintModal(false); load(); } catch { toast.error("خطا"); }
  };

  const saveTask = async () => {
    try {
      const data = { ...taskForm, sprintId: activeSprint?.id };
      if (editingTask) await apiClient.put(`/it/sprint-tasks/${editingTask.id}`, data);
      else await apiClient.post("/it/sprint-tasks", data);
      toast.success("ذخیره شد"); setShowTaskModal(false); setEditingTask(undefined);
      if (activeSprint) loadTasks(activeSprint.id);
    } catch { toast.error("خطا"); }
  };

  const changeStatus = async (task: SprintTask, status: SprintTask["status"]) => {
    try { await apiClient.put(`/it/sprint-tasks/${task.id}`, { ...task, status }); if (activeSprint) loadTasks(activeSprint.id); } catch { /**/ }
  };

  const totalPoints = tasks.reduce((a, t) => a + t.storyPoints, 0);
  const donePoints = tasks.filter(t => t.status === "done").reduce((a, t) => a + t.storyPoints, 0);

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold flex items-center gap-2"><Layers className="w-6 h-6 text-primary" />Sprint Board</h1><p className="text-muted-foreground text-sm mt-1">مدیریت اسپرینت‌ها و وظایف</p></div>
        <div className="flex gap-2">
          <button onClick={() => setShowSprintModal(true)} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border text-sm hover:bg-muted"><Plus className="w-4 h-4" /> اسپرینت جدید</button>
          <button onClick={() => { setEditingTask(undefined); setTaskForm({ title: "", description: "", assignee: "", priority: "medium", storyPoints: 1 }); setShowTaskModal(true); }} disabled={!activeSprint} className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-brand text-black text-sm font-semibold disabled:opacity-40"><Plus className="w-4 h-4" /> تسک جدید</button>
        </div>
      </div>

      {/* Sprint selector */}
      {sprints.length > 0 && (
        <div className="flex items-center gap-3 flex-wrap">
          {sprints.map(s => (
            <button key={s.id} onClick={() => { setActiveSprint(s); loadTasks(s.id); }}
              className={cn("px-3 py-1.5 rounded-lg text-sm border transition-all", activeSprint?.id === s.id ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted text-muted-foreground")}>
              {s.name}
            </button>
          ))}
        </div>
      )}

      {/* Stats */}
      {activeSprint && (
        <div className="grid grid-cols-4 gap-4">
          <StatCard title="کل تسک‌ها" value={tasks.length} icon={Layers} color="blue" />
          <StatCard title="در حال انجام" value={tasks.filter(t => t.status === "in_progress").length} icon={Clock} color="amber" />
          <StatCard title="تکمیل شده" value={tasks.filter(t => t.status === "done").length} icon={CheckCircle2} color="green" />
          <StatCard title={`امتیاز (${donePoints}/${totalPoints})`} value={`${totalPoints ? Math.round(donePoints / totalPoints * 100) : 0}%`} icon={Zap} color="violet" />
        </div>
      )}

      {/* Kanban */}
      {activeSprint ? (
        <div className="grid grid-cols-4 gap-4">
          {COLUMNS.map(col => (
            <div key={col.key} className="glass rounded-2xl border border-border p-3">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold">{col.label}</h3>
                <span className="text-xs bg-muted px-2 py-0.5 rounded-full">{tasks.filter(t => t.status === col.key).length}</span>
              </div>
              <div className="space-y-2">
                {tasks.filter(t => t.status === col.key).map(task => (
                  <motion.div key={task.id} layout className="bg-muted/50 rounded-xl p-3 border border-border/50 hover:border-border transition-all cursor-pointer"
                    onClick={() => { setEditingTask(task); setTaskForm({ title: task.title, description: task.description ?? "", assignee: task.assignee ?? "", priority: task.priority, storyPoints: task.storyPoints }); setShowTaskModal(true); }}>
                    <p className="text-sm font-medium mb-2">{task.title}</p>
                    <div className="flex items-center justify-between">
                      <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium", PRIORITY_CFG[task.priority].color)}>{PRIORITY_CFG[task.priority].label}</span>
                      <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{task.storyPoints}pt</span>
                    </div>
                    {task.assignee && <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1"><User className="w-3 h-3" />{task.assignee}</p>}
                    <div className="flex gap-1 mt-2">
                      {COLUMNS.filter(c => c.key !== col.key).map(c => (
                        <button key={c.key} onClick={e => { e.stopPropagation(); changeStatus(task, c.key); }}
                          className="text-[9px] px-1.5 py-0.5 rounded bg-muted hover:bg-primary/10 hover:text-primary transition-colors">→{c.label}</button>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass rounded-2xl border border-border p-12 text-center text-muted-foreground">
          <Layers className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>اسپرینتی وجود ندارد. یک اسپرینت جدید بسازید.</p>
        </div>
      )}

      {/* Sprint Modal */}
      <AnimatePresence>
        {showSprintModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setShowSprintModal(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="glass rounded-2xl p-6 w-full max-w-md border border-border">
              <div className="flex items-center justify-between mb-5"><h2 className="text-lg font-bold">اسپرینت جدید</h2><button onClick={() => setShowSprintModal(false)}><X className="w-4 h-4" /></button></div>
              <div className="space-y-3">
                <input placeholder="نام اسپرینت *" value={sprintForm.name} onChange={e => setSprintForm(f => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                <input placeholder="هدف اسپرینت" value={sprintForm.goal} onChange={e => setSprintForm(f => ({ ...f, goal: e.target.value }))} className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                <div className="grid grid-cols-2 gap-3">
                  <input type="date" value={sprintForm.startDate} onChange={e => setSprintForm(f => ({ ...f, startDate: e.target.value }))} className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                  <input type="date" value={sprintForm.endDate} onChange={e => setSprintForm(f => ({ ...f, endDate: e.target.value }))} className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                </div>
              </div>
              <div className="flex gap-3 mt-5"><button onClick={() => setShowSprintModal(false)} className="flex-1 py-2.5 rounded-xl border border-border text-sm">انصراف</button><button onClick={saveSprint} className="flex-[2] py-2.5 rounded-xl gradient-brand text-black text-sm font-semibold">ایجاد</button></div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Task Modal */}
      <AnimatePresence>
        {showTaskModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setShowTaskModal(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="glass rounded-2xl p-6 w-full max-w-md border border-border">
              <div className="flex items-center justify-between mb-5"><h2 className="text-lg font-bold">{editingTask ? "ویرایش تسک" : "تسک جدید"}</h2><button onClick={() => setShowTaskModal(false)}><X className="w-4 h-4" /></button></div>
              <div className="space-y-3">
                <input placeholder="عنوان *" value={taskForm.title} onChange={e => setTaskForm(f => ({ ...f, title: e.target.value }))} className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                <textarea placeholder="توضیحات" value={taskForm.description} onChange={e => setTaskForm(f => ({ ...f, description: e.target.value }))} rows={2} className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary resize-none" />
                <input placeholder="مسئول" value={taskForm.assignee} onChange={e => setTaskForm(f => ({ ...f, assignee: e.target.value }))} className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                <div className="grid grid-cols-2 gap-3">
                  <select value={taskForm.priority} onChange={e => setTaskForm(f => ({ ...f, priority: e.target.value as SprintTask["priority"] }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary">
                    {Object.entries(PRIORITY_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                  <input type="number" min={1} max={21} placeholder="امتیاز" value={taskForm.storyPoints} onChange={e => setTaskForm(f => ({ ...f, storyPoints: Number(e.target.value) }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                </div>
              </div>
              <div className="flex gap-3 mt-5"><button onClick={() => setShowTaskModal(false)} className="flex-1 py-2.5 rounded-xl border border-border text-sm">انصراف</button><button onClick={saveTask} className="flex-[2] py-2.5 rounded-xl gradient-brand text-black text-sm font-semibold">ذخیره</button></div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
