"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, notFound } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowRight, LayoutList, Columns, Calendar, BarChart2,
  Clock, DollarSign, CheckSquare, Play, Square,
  Plus, Flag, Code2, Server, GitBranch, CheckSquare2, X, Loader2,
} from "lucide-react";
import Link from "next/link";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import { TaskStatusBadge, PriorityBadge } from "@/components/common/StatusBadge";
import { GanttView } from "@/components/projects/GanttView";
import { formatPrice, formatDuration, toJalali } from "@/lib/utils";
import { useTimerStore } from "@/lib/store";
import { useAuth } from "@/lib/auth/context";
import { apiClient } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Task, TaskStatus, Milestone, ServerInfo, DeployChecklist, DeployChecklistItem, TechDoc } from "@/types";

function ProjectCalendarView({ tasks }: { tasks: Task[] }) {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const firstDay = (new Date(year, month, 1).getDay() + 1) % 7;
  const totalDays = new Date(year, month + 1, 0).getDate();
  const monthName = new Intl.DateTimeFormat("fa-IR", { month: "long", year: "numeric", calendar: "persian" }).format(new Date(year, month, 1));
  const DAYS = ["ش", "ی", "د", "س", "چ", "پ", "ج"];

  const getTasksForDay = (day: number) =>
    tasks.filter((t) => {
      if (!t.dueDate) return false;
      const d = new Date(t.dueDate);
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
    });

  return (
    <div>
      <h3 className="font-semibold text-foreground mb-4 text-center">{monthName}</h3>
      <div className="grid grid-cols-7 mb-2">
        {DAYS.map((d) => <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-2">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
        {Array.from({ length: totalDays }).map((_, i) => {
          const day = i + 1;
          const dayTasks = getTasksForDay(day);
          const isToday = day === today.getDate();
          return (
            <div key={day} className={cn("min-h-[60px] p-1.5 rounded-xl border transition-colors",
              isToday ? "border-primary/40 bg-primary/5" : "border-border/50 hover:bg-muted/30")}>
              <p className={cn("text-xs font-medium mb-1", isToday ? "text-primary" : "text-muted-foreground")}>{day}</p>
              {dayTasks.slice(0, 2).map((t) => (
                <div key={t.id} className="text-[9px] px-1 py-0.5 rounded bg-primary/20 text-primary truncate mb-0.5">{t.title}</div>
              ))}
              {dayTasks.length > 2 && <div className="text-[9px] text-muted-foreground">+{dayTasks.length - 2}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const TASK_COLUMNS = [
  { id: "backlog", title: "بک‌لاگ", order: 0, color: "#64748b" },
  { id: "todo", title: "در انتظار", order: 1, color: "#3b82f6" },
  { id: "in_progress", title: "در حال انجام", order: 2, color: "#f59e0b" },
  { id: "review", title: "بررسی", order: 3, color: "#8b5cf6" },
  { id: "done", title: "تکمیل شده", order: 4, color: "#10b981" },
];

const DEFAULT_DEPLOY_ITEMS: DeployChecklistItem[] = [
  { id: "d1", title: "تست‌های unit پاس شده", isChecked: false },
  { id: "d2", title: "بررسی کد توسط همتا", isChecked: false },
  { id: "d3", title: "به‌روزرسانی مستندات", isChecked: false },
  { id: "d4", title: "تست در محیط staging", isChecked: false },
  { id: "d5", title: "پشتیبان‌گیری از دیتابیس", isChecked: false },
  { id: "d6", title: "اطلاع‌رسانی به تیم", isChecked: false },
];

type ViewMode = "list" | "kanban" | "gantt" | "calendar" | "milestones" | "tech";

interface ProjectData {
  id: string;
  name: string;
  description: string | null;
  status: string;
  progress: number;
  budget: number;
  spent: number;
  startDate: string;
  deadline: string;
  colorHash: string;
  memberIds: string[];
  repoUrl: string | null;
  techDocs: TechDoc[];
  servers: ServerInfo[];
  client: { id: string; companyName: string };
  tasks: Task[];
  milestones: Milestone[];
  deployChecklists: DeployChecklist[];
}

interface TeamMember { id: string; name: string; avatar: string | null; color: string; }

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [view, setView] = useState<ViewMode>("kanban");
  const [project, setProject] = useState<ProjectData | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const { startTimer, taskId: runningTaskId } = useTimerStore();
  const { user } = useAuth();

  const [showMilestoneForm, setShowMilestoneForm] = useState(false);
  const [newMilestone, setNewMilestone] = useState({ title: "", dueDate: "", description: "" });
  const [savingMilestone, setSavingMilestone] = useState(false);

  const [showTaskForm, setShowTaskForm] = useState(false);
  const [newTask, setNewTask] = useState({ title: "", priority: "medium", dueDate: "", assigneeIds: [] as string[] });
  const [savingTask, setSavingTask] = useState(false);

  const [repoUrl, setRepoUrl] = useState("");
  const [servers, setServers] = useState<ServerInfo[]>([]);
  const [techDocs, setTechDocs] = useState<TechDoc[]>([]);
  const [deployChecklists, setDeployChecklists] = useState<DeployChecklist[]>([]);
  const [savingTech, setSavingTech] = useState(false);

  const fetchProject = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [projRes, usersRes] = await Promise.all([
        apiClient.get(`/projects/${id}`),
        apiClient.get("/users"),
      ]);
      const p: ProjectData = projRes.data;
      setProject(p);
      setRepoUrl(p.repoUrl ?? "");
      setServers(Array.isArray(p.servers) && p.servers.length > 0 ? p.servers as ServerInfo[] : [
        { id: "s1", environment: "development", url: "", username: "", notes: "" },
        { id: "s2", environment: "staging", url: "", username: "", notes: "" },
        { id: "s3", environment: "production", url: "", username: "", notes: "" },
      ]);
      setTechDocs(Array.isArray(p.techDocs) && p.techDocs.length > 0 ? p.techDocs as TechDoc[] : [
        { id: "td1", category: "tech_stack", title: "Tech Stack", content: "", updatedAt: new Date().toISOString() },
        { id: "td2", category: "env", title: "متغیرهای محیطی", content: "", updatedAt: new Date().toISOString() },
        { id: "td3", category: "architecture", title: "معماری سیستم", content: "", updatedAt: new Date().toISOString() },
      ]);
      setDeployChecklists(p.deployChecklists.length > 0 ? p.deployChecklists : [
        { id: "dc1", projectId: id, environment: "staging", items: DEFAULT_DEPLOY_ITEMS.map(i => ({ ...i })) },
        { id: "dc2", projectId: id, environment: "production", items: DEFAULT_DEPLOY_ITEMS.map(i => ({ ...i, id: i.id + "p" })) },
      ]);
      const allUsers: TeamMember[] = usersRes.data?.data ?? usersRes.data ?? [];
      setMembers(allUsers.filter((u) => (p.memberIds as string[]).includes(u.id)));
    } catch {
      toast.error("خطا در بارگذاری پروژه");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchProject(); }, [fetchProject]);

  const handleAddMilestone = async () => {
    if (!newMilestone.title || !newMilestone.dueDate) { toast.error("عنوان و تاریخ الزامی است"); return; }
    setSavingMilestone(true);
    try {
      const res = await apiClient.post("/milestones", { ...newMilestone, projectId: id });
      setProject((p) => p ? { ...p, milestones: [...p.milestones, res.data] } : p);
      setNewMilestone({ title: "", dueDate: "", description: "" });
      setShowMilestoneForm(false);
      toast.success("نقطه عطف اضافه شد");
    } catch { toast.error("خطا در ثبت نقطه عطف"); }
    finally { setSavingMilestone(false); }
  };

  const handleCompleteMilestone = async (milestoneId: string) => {
    try {
      await apiClient.patch(`/milestones/${milestoneId}`, { completedAt: new Date().toISOString() });
      setProject((p) => p ? {
        ...p,
        milestones: p.milestones.map((m) => m.id === milestoneId ? { ...m, completedAt: new Date().toISOString() } : m),
      } : p);
      toast.success("نقطه عطف تکمیل شد");
    } catch { toast.error("خطا"); }
  };

  const handleAddTask = async () => {
    if (!newTask.title) { toast.error("عنوان تسک الزامی است"); return; }
    setSavingTask(true);
    try {
      const res = await apiClient.post("/tasks", { ...newTask, projectId: id, status: "backlog" });
      setProject((p) => p ? { ...p, tasks: [...p.tasks, res.data] } : p);
      setNewTask({ title: "", priority: "medium", dueDate: "", assigneeIds: [] });
      setShowTaskForm(false);
      toast.success("تسک اضافه شد");
    } catch { toast.error("خطا در افزودن تسک"); }
    finally { setSavingTask(false); }
  };

  const handleTaskStatusChange = async (taskId: string, status: TaskStatus) => {
    try {
      await apiClient.put(`/tasks/${taskId}`, { status });
      setProject((p) => p ? {
        ...p,
        tasks: p.tasks.map((t) => t.id === taskId ? { ...t, status } : t),
      } : p);
    } catch { toast.error("خطا در تغییر وضعیت"); }
  };

  const handleSaveTech = async () => {
    setSavingTech(true);
    try {
      await apiClient.put(`/projects/${id}`, { repoUrl, servers, techDocs });
      toast.success("اطلاعات فنی ذخیره شد");
    } catch { toast.error("خطا در ذخیره"); }
    finally { setSavingTech(false); }
  };

  const handleDeployChecklistChange = async (checklistId: string, items: DeployChecklistItem[]) => {
    setDeployChecklists((p) => p.map((c) => c.id === checklistId ? { ...c, items } : c));
    try {
      await apiClient.put(`/deploy-checklists/${checklistId}`, { items });
    } catch { toast.error("خطا در ذخیره چک‌لیست"); }
  };

  const handleDeployDone = async (checklistId: string) => {
    try {
      await apiClient.put(`/deploy-checklists/${checklistId}`, {
        items: deployChecklists.find((c) => c.id === checklistId)?.items,
        deployed: true,
      });
      toast.success("Deploy ثبت شد");
    } catch { toast.error("خطا"); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 text-primary animate-spin" />
    </div>
  );
  if (!project) return notFound();

  const tasks: Task[] = project.tasks;
  const milestones: Milestone[] = project.milestones;
  const doneTasks = tasks.filter((t) => t.status === "done").length;
  const totalTracked = tasks.reduce((s, t) => s + t.trackedSeconds, 0);
  const isOverBudget = project.spent > project.budget;

  const taskAsLeadCard = tasks.map((t) => ({
    ...t, companyName: t.title, contactName: "", contactPhone: "",
    estimatedValue: 0, conversionProbability: 0, columnId: t.status,
    tags: t.tags, assigneeId: (t.assigneeIds as string[])[0], activities: [],
  }));

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/projects" className="hover:text-foreground transition-colors">پروژه‌ها</Link>
        <ArrowRight className="w-3.5 h-3.5 rotate-180" />
        <span className="text-foreground font-medium">{project.name}</span>
      </motion.div>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-card border border-border p-6">
        <div className={cn("absolute top-0 left-0 right-0 h-1 bg-gradient-to-r", project.colorHash)} />
        <div className="relative flex items-start gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-foreground mb-1">{project.name}</h1>
            <p className="text-muted-foreground text-sm">{project.client?.companyName}</p>
            {project.description && (
              <p className="text-sm text-muted-foreground mt-2 max-w-xl leading-relaxed">{project.description}</p>
            )}
          </div>
          <div className="flex items-center gap-6 flex-wrap">
            {[
              { icon: CheckSquare, label: "تسک", value: `${doneTasks}/${tasks.length}` },
              { icon: Clock, label: "ردیابی", value: formatDuration(totalTracked) },
              { icon: DollarSign, label: "بودجه", value: formatPrice(project.budget, true), extra: isOverBudget ? "⚠️" : "" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-0.5">
                  <stat.icon className="w-3 h-3" />{stat.label}
                </div>
                <p className="text-sm font-semibold text-foreground tabular-nums">{stat.value} {stat.extra}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="relative flex items-center gap-4 mt-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <div className="flex justify-between text-xs mb-1.5">
              <span className="text-muted-foreground">پیشرفت کلی</span>
              <span className="font-medium text-foreground">{project.progress}٪</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${project.progress}%` }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                className={cn("h-full rounded-full bg-gradient-to-r", project.colorHash)} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2 space-x-reverse">
              {members.map((m) => (
                <div key={m.id} title={m.name}
                  className="w-8 h-8 rounded-full gradient-brand border-2 border-card flex items-center justify-center text-xs font-bold text-black">
                  {m.name.slice(0, 1)}
                </div>
              ))}
            </div>
            <span className="text-xs text-muted-foreground">{members.length} نفر</span>
          </div>
          <div className="text-xs text-muted-foreground">
            ددلاین: <span className="text-foreground font-medium">{toJalali(project.deadline)}</span>
          </div>
        </div>
      </motion.div>

      {/* View switcher */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center bg-muted p-1 rounded-xl gap-0.5 flex-wrap">
          {([
            { key: "list", label: "لیست", icon: LayoutList },
            { key: "kanban", label: "کانبان", icon: Columns },
            { key: "calendar", label: "تقویم", icon: Calendar },
            { key: "gantt", label: "گانت", icon: BarChart2 },
            { key: "milestones", label: "نقاط عطف", icon: Flag },
            ...(["admin", "developer", "project_manager"].includes(user?.role ?? "")
              ? [{ key: "tech" as ViewMode, label: "فنی", icon: Code2 }] : []),
          ] as { key: ViewMode; label: string; icon: React.ElementType }[]).map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setView(key)}
              className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                view === key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
              <Icon className="w-3.5 h-3.5" />{label}
            </button>
          ))}
        </div>
        <button onClick={() => setShowTaskForm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-brand text-black text-sm font-semibold ms-auto gold-glow">
          <Plus className="w-3.5 h-3.5" />تسک جدید
        </button>
      </div>

      {/* Modal: تسک جدید */}
      <AnimatePresence>
        {showTaskForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowTaskForm(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-card border border-border rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-foreground">تسک جدید</h3>
                <button onClick={() => setShowTaskForm(false)}><X className="w-4 h-4 text-muted-foreground" /></button>
              </div>
              <input value={newTask.title} onChange={(e) => setNewTask((p) => ({ ...p, title: e.target.value }))}
                placeholder="عنوان تسک *" className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
              <select value={newTask.priority} onChange={(e) => setNewTask((p) => ({ ...p, priority: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-foreground text-sm">
                <option value="low">اولویت کم</option>
                <option value="medium">اولویت متوسط</option>
                <option value="high">اولویت زیاد</option>
                <option value="urgent">فوری</option>
              </select>
              <input type="date" value={newTask.dueDate} onChange={(e) => setNewTask((p) => ({ ...p, dueDate: e.target.value }))}
                className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-foreground text-sm" />
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowTaskForm(false)}
                  className="flex-1 py-2.5 rounded-xl border border-border bg-muted text-foreground text-sm">انصراف</button>
                <button onClick={handleAddTask} disabled={savingTask}
                  className="flex-1 py-2.5 rounded-xl gradient-brand text-black font-semibold text-sm gold-glow disabled:opacity-60">
                  {savingTask ? "در حال ثبت..." : "افزودن"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <AnimatePresence mode="wait">
        {view === "kanban" && (
          <motion.div key="kanban" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <KanbanBoard
              columns={TASK_COLUMNS}
              leads={taskAsLeadCard as never}
              onLeadClick={(item) => {
                const task = tasks.find((t) => t.id === item.id);
                if (task) setActiveTask(task);
              }}
            />
          </motion.div>
        )}

        {view === "list" && (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="rounded-2xl border border-border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {["عنوان", "وضعیت", "اولویت", "سررسید", "زمان ردیابی", ""].map((h) => (
                    <th key={h} className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => {
                  const isActive = runningTaskId === task.id;
                  return (
                    <tr key={task.id} onClick={() => setActiveTask(task)}
                      className="border-b border-border/50 hover:bg-muted/30 cursor-pointer transition-colors">
                      <td className="px-4 py-3 font-medium text-foreground">{task.title}</td>
                      <td className="px-4 py-3"><TaskStatusBadge status={task.status} /></td>
                      <td className="px-4 py-3"><PriorityBadge priority={task.priority} /></td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{task.dueDate ? toJalali(task.dueDate) : "—"}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground tabular-nums">{formatDuration(task.trackedSeconds)}</td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => isActive ? useTimerStore.getState().stopTimer() : startTimer(task.id, task.title, task.projectId)}
                          className={cn("p-1.5 rounded-lg transition-colors",
                            isActive ? "text-destructive hover:bg-destructive/10" : "text-muted-foreground hover:text-primary hover:bg-primary/10")}>
                          {isActive ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5" />}
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {tasks.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-12 text-muted-foreground text-sm">تسکی وجود ندارد</td></tr>
                )}
              </tbody>
            </table>
          </motion.div>
        )}

        {view === "gantt" && (
          <motion.div key="gantt" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <GanttView tasks={tasks} milestones={milestones} startDate={project.startDate} endDate={project.deadline} />
          </motion.div>
        )}

        {view === "calendar" && (
          <motion.div key="calendar" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="rounded-2xl bg-card border border-border p-6">
            <ProjectCalendarView tasks={tasks} />
          </motion.div>
        )}

        {view === "milestones" && (
          <motion.div key="milestones" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">نقاط عطف پروژه</h3>
              {["admin", "project_manager"].includes(user?.role ?? "") && (
                <button onClick={() => setShowMilestoneForm(!showMilestoneForm)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-brand text-black text-sm font-semibold gold-glow">
                  <Plus className="w-3.5 h-3.5" />افزودن نقطه عطف
                </button>
              )}
            </div>

            {showMilestoneForm && (
              <div className="p-4 rounded-2xl border border-primary/20 bg-primary/5 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">نقطه عطف جدید</p>
                  <button onClick={() => setShowMilestoneForm(false)}><X className="w-4 h-4 text-muted-foreground" /></button>
                </div>
                <input value={newMilestone.title} onChange={(e) => setNewMilestone(p => ({ ...p, title: e.target.value }))}
                  placeholder="عنوان نقطه عطف..."
                  className="w-full px-3 py-2 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                <input type="date" value={newMilestone.dueDate} onChange={(e) => setNewMilestone(p => ({ ...p, dueDate: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-background border border-border text-sm focus:outline-none" />
                <textarea value={newMilestone.description} onChange={(e) => setNewMilestone(p => ({ ...p, description: e.target.value }))}
                  placeholder="توضیحات (اختیاری)..." rows={2}
                  className="w-full px-3 py-2 rounded-xl bg-background border border-border text-sm focus:outline-none resize-none" />
                <button onClick={handleAddMilestone} disabled={savingMilestone}
                  className="w-full py-2 rounded-xl gradient-brand text-black text-sm font-semibold disabled:opacity-60">
                  {savingMilestone ? "در حال ذخیره..." : "ذخیره"}
                </button>
              </div>
            )}

            {milestones.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <Flag className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">نقطه عطفی تعریف نشده است</p>
              </div>
            ) : (
              <div className="relative pr-6">
                <div className="absolute right-2 top-0 bottom-0 w-px bg-border" />
                {milestones
                  .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                  .map((m) => {
                    const isPast = new Date(m.dueDate) < new Date();
                    const isDone = !!m.completedAt;
                    return (
                      <div key={m.id} className="relative mb-4 mr-4">
                        <div className={cn("absolute -right-[22px] top-1.5 w-4 h-4 rotate-45 border-2",
                          isDone ? "bg-emerald-400 border-emerald-600" : isPast ? "bg-red-400 border-red-600" : "bg-primary border-primary/50")} />
                        <div className={cn("p-4 rounded-2xl border",
                          isDone ? "border-emerald-500/20 bg-emerald-500/5" : isPast ? "border-red-500/20 bg-red-500/5" : "border-border bg-card")}>
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-medium text-foreground text-sm">{m.title}</p>
                              {m.description && <p className="text-xs text-muted-foreground mt-1">{m.description}</p>}
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className={cn("text-xs px-2 py-0.5 rounded-full",
                                isDone ? "bg-emerald-500/10 text-emerald-400" : isPast ? "bg-red-500/10 text-red-400 font-medium" : "bg-muted text-muted-foreground")}>
                                {isDone ? "✓ تکمیل" : isPast ? "⚠ گذشت" : toJalali(m.dueDate)}
                              </span>
                              {!isDone && ["admin", "project_manager"].includes(user?.role ?? "") && (
                                <button onClick={() => handleCompleteMilestone(m.id)}
                                  className="text-xs px-2 py-0.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20">
                                  تکمیل
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </motion.div>
        )}

        {view === "tech" && (
          <motion.div key="tech" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
            <div className="p-5 rounded-2xl bg-card border border-border space-y-3">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-primary" />مخزن کد
              </h3>
              <div className="flex gap-3">
                <input value={repoUrl} onChange={(e) => setRepoUrl(e.target.value)} placeholder="https://github.com/org/repo"
                  className="flex-1 px-3 py-2 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
                {repoUrl && (
                  <a href={repoUrl} target="_blank" rel="noopener noreferrer"
                    className="px-4 py-2 rounded-xl bg-primary/10 text-primary text-sm hover:bg-primary/20 transition-colors">
                    باز کردن ↗
                  </a>
                )}
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-card border border-border space-y-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Code2 className="w-4 h-4 text-primary" />مستندات فنی
              </h3>
              {techDocs.map((doc) => (
                <div key={doc.id}>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">{doc.title}</label>
                  <textarea value={doc.content ?? ""}
                    onChange={(e) => setTechDocs(p => p.map(d => d.id === doc.id ? { ...d, content: e.target.value } : d))}
                    rows={3} placeholder={`${doc.title}...`}
                    className="w-full px-3 py-2.5 rounded-xl bg-background border border-border text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none" />
                </div>
              ))}
            </div>

            <div className="p-5 rounded-2xl bg-card border border-border space-y-4">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Server className="w-4 h-4 text-primary" />اطلاعات سرورها
              </h3>
              {servers.map((srv) => (
                <div key={srv.id} className="p-4 rounded-xl bg-muted/50 space-y-2">
                  <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium",
                    srv.environment === "production" ? "bg-red-500/10 text-red-400" :
                    srv.environment === "staging" ? "bg-amber-500/10 text-amber-400" : "bg-blue-500/10 text-blue-400")}>
                    {{ development: "توسعه", staging: "استیجینگ", production: "پروداکشن" }[srv.environment] ?? srv.environment}
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <input value={srv.url ?? ""} onChange={(e) => setServers(p => p.map(s => s.id === srv.id ? { ...s, url: e.target.value } : s))}
                      placeholder="URL سرور" className="px-3 py-2 rounded-lg bg-background border border-border text-sm focus:outline-none" />
                    <input value={srv.username ?? ""} onChange={(e) => setServers(p => p.map(s => s.id === srv.id ? { ...s, username: e.target.value } : s))}
                      placeholder="نام کاربری" className="px-3 py-2 rounded-lg bg-background border border-border text-sm focus:outline-none" />
                  </div>
                </div>
              ))}
            </div>

            <button onClick={handleSaveTech} disabled={savingTech}
              className="px-6 py-2.5 rounded-xl gradient-brand text-black text-sm font-semibold gold-glow disabled:opacity-60">
              {savingTech ? "در حال ذخیره..." : "ذخیره اطلاعات فنی"}
            </button>

            <div className="p-5 rounded-2xl bg-card border border-border space-y-5">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <CheckSquare2 className="w-4 h-4 text-primary" />چک‌لیست Deploy
              </h3>
              {deployChecklists.map((checklist) => {
                const done = checklist.items.filter((i) => i.isChecked).length;
                return (
                  <div key={checklist.id}>
                    <div className="flex items-center justify-between mb-3">
                      <span className={cn("text-sm font-medium px-2.5 py-1 rounded-full",
                        checklist.environment === "production" ? "bg-red-500/10 text-red-400" : "bg-amber-500/10 text-amber-400")}>
                        {{ staging: "استیجینگ", production: "پروداکشن" }[checklist.environment] ?? checklist.environment}
                      </span>
                      <span className="text-xs text-muted-foreground">{done}/{checklist.items.length}</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full mb-3 overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(done / checklist.items.length) * 100}%` }} />
                    </div>
                    <div className="space-y-2">
                      {checklist.items.map((item) => (
                        <label key={item.id} className="flex items-center gap-3 cursor-pointer hover:bg-muted/30 p-2 rounded-xl transition-colors">
                          <input type="checkbox" checked={item.isChecked}
                            onChange={() => handleDeployChecklistChange(checklist.id,
                              checklist.items.map(i => i.id === item.id ? { ...i, isChecked: !i.isChecked } : i))}
                            className="w-4 h-4 rounded accent-primary" />
                          <span className={cn("text-sm", item.isChecked ? "line-through text-muted-foreground" : "text-foreground")}>
                            {item.title}
                          </span>
                        </label>
                      ))}
                    </div>
                    {done === checklist.items.length && (
                      <button onClick={() => handleDeployDone(checklist.id)}
                        className="mt-3 w-full py-2 rounded-xl gradient-brand text-black text-sm font-semibold">
                        ✓ ثبت deploy
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Task Drawer */}
      <AnimatePresence>
        {activeTask && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setActiveTask(null)}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 250 }}
              className="fixed top-0 left-0 h-full w-full max-w-md z-50 bg-card border-r border-border shadow-modal overflow-y-auto">
              <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1 me-4">
                    <h2 className="text-lg font-bold text-foreground">{activeTask.title}</h2>
                    {activeTask.description && <p className="text-sm text-muted-foreground mt-2">{activeTask.description}</p>}
                  </div>
                  <button onClick={() => setActiveTask(null)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground shrink-0">✕</button>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-border/50">
                    <span className="text-xs text-muted-foreground">وضعیت</span>
                    <select value={activeTask.status}
                      onChange={(e) => {
                        const s = e.target.value as TaskStatus;
                        handleTaskStatusChange(activeTask.id, s);
                        setActiveTask((t) => t ? { ...t, status: s } : t);
                      }}
                      className="text-xs bg-muted border border-border rounded-lg px-2 py-1">
                      {TASK_COLUMNS.map((col) => <option key={col.id} value={col.id}>{col.title}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-border/50">
                    <span className="text-xs text-muted-foreground">اولویت</span>
                    <PriorityBadge priority={activeTask.priority} />
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-border/50">
                    <span className="text-xs text-muted-foreground">سررسید</span>
                    <span className="text-sm text-foreground">{activeTask.dueDate ? toJalali(activeTask.dueDate) : "—"}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-border/50">
                    <span className="text-xs text-muted-foreground">زمان ردیابی</span>
                    <span className="text-sm font-mono tabular-nums text-foreground">{formatDuration(activeTask.trackedSeconds)}</span>
                  </div>
                </div>

                {(activeTask.tags as string[]).length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs text-muted-foreground mb-2">تگ‌ها</p>
                    <div className="flex flex-wrap gap-1">
                      {(activeTask.tags as string[]).map((t) => (
                        <span key={t} className="px-2 py-1 rounded-lg text-xs bg-muted text-foreground">{t}</span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-6 p-4 rounded-xl bg-muted">
                  <p className="text-xs text-muted-foreground mb-3">تایمر</p>
                  <button
                    onClick={() => runningTaskId === activeTask.id
                      ? useTimerStore.getState().stopTimer()
                      : startTimer(activeTask.id, activeTask.title, activeTask.projectId)}
                    className={cn("w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all",
                      runningTaskId === activeTask.id
                        ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
                        : "gradient-brand text-black gold-glow")}>
                    {runningTaskId === activeTask.id
                      ? <><Square className="w-4 h-4 fill-current" />توقف تایمر</>
                      : <><Play className="w-4 h-4" />شروع تایمر</>}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
