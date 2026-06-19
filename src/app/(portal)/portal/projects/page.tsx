"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  FolderOpen, Clock, CheckCircle2, PauseCircle, ListChecks,
  AlertCircle, ChevronDown, ChevronUp, Layers, CreditCard,
  TrendingUp, BarChart3, Flag,
} from "lucide-react";
import { usePortal, portalFetch } from "@/lib/portal-context";
import { cn } from "@/lib/utils";
import { toJalali } from "@/lib/utils";

interface TaskStats {
  total: number;
  done: number;
  inProgress: number;
  overdue: number;
}

interface InvoiceStats {
  totalInvoiced: number;
  paid: number;
  unpaid: number;
}

interface ChecklistSummary {
  id: string;
  environment: string;
  total: number;
  done: number;
  deployedAt: string | null;
}

interface RecentTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: string | null;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  progress: number;
  budget: number;
  startDate: string;
  deadline: string;
  completedAt: string | null;
  totalTrackedSeconds: number;
  milestones: Array<{ id: string; title: string; dueDate: string; completedAt: string | null }>;
  taskStats: TaskStats;
  invoiceStats: InvoiceStats;
  checklistSummary: ChecklistSummary[];
  recentTasks: RecentTask[];
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: typeof Clock }> = {
  planning: { label: "برنامه‌ریزی", color: "text-blue-400", bg: "bg-blue-500/10", icon: Clock },
  in_progress: { label: "در حال اجرا", color: "text-amber-400", bg: "bg-amber-500/10", icon: TrendingUp },
  completed: { label: "تکمیل شده", color: "text-emerald-400", bg: "bg-emerald-500/10", icon: CheckCircle2 },
  on_hold: { label: "متوقف", color: "text-muted-foreground", bg: "bg-muted", icon: PauseCircle },
};

const TASK_STATUS_LABELS: Record<string, string> = {
  backlog: "بک‌لاگ", todo: "باید انجام شود", in_progress: "در حال انجام",
  review: "در بررسی", done: "انجام شد", completed: "تکمیل",
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  critical: { label: "بحرانی", color: "text-red-400" },
  high: { label: "بالا", color: "text-orange-400" },
  medium: { label: "متوسط", color: "text-amber-400" },
  low: { label: "پایین", color: "text-muted-foreground" },
};

const ENV_LABELS: Record<string, string> = {
  staging: "استیجینگ", production: "پروداکشن", development: "توسعه",
};

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("fa-IR").format(amount) + " تومان";
}

function ProjectTimeline({ project }: { project: Project }) {
  const start = new Date(project.startDate).getTime();
  const end = new Date(project.deadline).getTime();
  const now = Date.now();
  const total = end - start;
  if (total <= 0) return null;

  const todayPct = Math.min(100, Math.max(0, ((now - start) / total) * 100));
  const isOverdue = now > end && project.status !== "completed";

  return (
    <div className="space-y-2">
      <div className="relative h-9 bg-muted rounded-xl overflow-hidden">
        <div className="absolute inset-y-0 right-0 bg-gradient-to-l from-blue-400/40 to-teal-400/40 rounded-xl transition-all"
          style={{ width: `${project.progress}%` }} />
        {todayPct > 0 && todayPct < 100 && (
          <div className={cn("absolute top-0 bottom-0 w-0.5", isOverdue ? "bg-red-400" : "bg-primary")}
            style={{ right: `${todayPct}%` }}>
            <div className={cn("absolute -top-1 right-1/2 -translate-x-1/2 w-2 h-2 rounded-full", isOverdue ? "bg-red-400" : "bg-primary")} />
          </div>
        )}
        {project.milestones.map((m) => {
          const mTime = new Date(m.dueDate).getTime();
          const pct = Math.min(100, Math.max(0, ((mTime - start) / total) * 100));
          return (
            <div key={m.id}
              className={cn("absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-card z-10",
                m.completedAt ? "bg-emerald-400" : "bg-amber-400")}
              style={{ right: `${pct}%` }}
              title={m.title} />
          );
        })}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold text-foreground/80 drop-shadow">{project.progress}٪</span>
        </div>
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>{toJalali(project.startDate)}</span>
        {isOverdue && <span className="text-red-400 font-medium">تأخیر دارد!</span>}
        <span className={cn(isOverdue ? "text-red-400" : "")}>ددلاین: {toJalali(project.deadline)}</span>
      </div>
    </div>
  );
}

function TaskProgressRing({ done, total }: { done: number; total: number }) {
  if (total === 0) return null;
  const pct = Math.round((done / total) * 100);
  const r = 20;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference - (pct / 100) * circumference;

  return (
    <div className="relative w-14 h-14 flex items-center justify-center">
      <svg width="56" height="56" className="rotate-[-90deg]">
        <circle cx="28" cy="28" r={r} stroke="currentColor" strokeWidth="3" fill="none" className="text-muted" />
        <circle cx="28" cy="28" r={r} stroke="currentColor" strokeWidth="3" fill="none"
          strokeDasharray={circumference} strokeDashoffset={dashOffset}
          strokeLinecap="round"
          className="text-blue-400 transition-all duration-700" />
      </svg>
      <span className="absolute text-xs font-bold text-foreground">{pct}٪</span>
    </div>
  );
}

export default function PortalProjectsPage() {
  const { token } = usePortal();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Record<string, "overview" | "tasks" | "milestones" | "checklist">>({});

  useEffect(() => {
    portalFetch("/api/portal/projects", {}, token)
      .then((r) => r.json())
      .then((d) => setProjects(d.data ?? []))
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  }, [token]);

  const getTab = (id: string) => activeTab[id] ?? "overview";
  const setTab = (id: string, tab: "overview" | "tasks" | "milestones" | "checklist") =>
    setActiveTab((prev) => ({ ...prev, [id]: tab }));

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
    </div>
  );

  const totalProjects = projects.length;
  const activeProjects = projects.filter((p) => p.status === "in_progress").length;
  const completedProjects = projects.filter((p) => p.status === "completed").length;

  return (
    <div className="space-y-5" dir="rtl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <FolderOpen className="w-6 h-6 text-blue-400" />پروژه‌های من
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          {totalProjects} پروژه · {activeProjects} فعال · {completedProjects} تکمیل‌شده
        </p>
      </motion.div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "کل پروژه‌ها", value: totalProjects, icon: FolderOpen, color: "text-blue-400", bg: "bg-blue-500/10" },
          { label: "در حال اجرا", value: activeProjects, icon: TrendingUp, color: "text-amber-400", bg: "bg-amber-500/10" },
          { label: "تکمیل‌شده", value: completedProjects, icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10" },
        ].map((s) => (
          <div key={s.label} className={cn("p-4 rounded-2xl border border-border", s.bg)}>
            <s.icon className={cn("w-5 h-5 mb-2", s.color)} />
            <p className={cn("text-2xl font-bold tabular-nums", s.color)}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        {projects.map((p, i) => {
          const cfg = STATUS_CONFIG[p.status] ?? STATUS_CONFIG.planning;
          const isExpanded = expanded === p.id;
          const tab = getTab(p.id);
          const isOverdue = new Date(p.deadline) < new Date() && p.status !== "completed";
          const completedMilestones = p.milestones.filter((m) => m.completedAt).length;
          const hasChecklists = p.checklistSummary.length > 0;

          return (
            <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={cn("rounded-2xl bg-card border overflow-hidden transition-colors",
                isOverdue ? "border-red-500/30" : "border-border")}>

              {/* Header */}
              <div className="p-5 cursor-pointer" onClick={() => setExpanded(isExpanded ? null : p.id)}>
                <div className="flex items-start gap-4">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", cfg.bg)}>
                    <cfg.icon className={cn("w-5 h-5", cfg.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground truncate">{p.name}</h3>
                        {isOverdue && (
                          <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-400 text-[10px] shrink-0">
                            <AlertCircle className="w-2.5 h-2.5" />تأخیر
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={cn("flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium", cfg.bg, cfg.color)}>
                          <cfg.icon className="w-3 h-3" />{cfg.label}
                        </span>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                      </div>
                    </div>

                    {p.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{p.description}</p>}

                    {/* Progress bar */}
                    <div className="flex items-center gap-3 mt-3">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-muted-foreground">پیشرفت کلی</span>
                          <span className="text-xs font-semibold text-foreground">{p.progress}٪</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-blue-400 to-teal-400 rounded-full transition-all duration-500"
                            style={{ width: `${p.progress}%` }} />
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-muted-foreground">ددلاین</p>
                        <p className={cn("text-xs font-medium", isOverdue ? "text-red-400" : "text-foreground")}>
                          {toJalali(p.deadline)}
                        </p>
                      </div>
                    </div>

                    {/* Quick stats row */}
                    <div className="flex items-center gap-3 mt-2.5 flex-wrap">
                      {p.taskStats.total > 0 && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <ListChecks className="w-3 h-3" />
                          {p.taskStats.done}/{p.taskStats.total} تسک
                        </span>
                      )}
                      {completedMilestones > 0 && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Flag className="w-3 h-3" />
                          {completedMilestones}/{p.milestones.length} مایلستون
                        </span>
                      )}
                      {p.totalTrackedSeconds > 0 && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />{formatDuration(p.totalTrackedSeconds)}
                        </span>
                      )}
                      {p.taskStats.overdue > 0 && (
                        <span className="flex items-center gap-1 text-xs text-red-400">
                          <AlertCircle className="w-3 h-3" />{p.taskStats.overdue} تسک معوق
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Expanded content */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
                    className="overflow-hidden border-t border-border">
                    {/* Tab bar */}
                    <div className="flex gap-1 p-3 pb-0 px-5 border-b border-border/50">
                      {([
                        { id: "overview", label: "نمای کلی", icon: BarChart3 },
                        ...(p.taskStats.total > 0 ? [{ id: "tasks", label: `تسک‌ها (${p.taskStats.total})`, icon: ListChecks }] : []),
                        ...(p.milestones.length > 0 ? [{ id: "milestones", label: `مایلستون (${p.milestones.length})`, icon: Flag }] : []),
                        ...(hasChecklists ? [{ id: "checklist", label: "چک‌لیست دیپلوی", icon: Layers }] : []),
                      ] as Array<{ id: "overview" | "tasks" | "milestones" | "checklist"; label: string; icon: typeof BarChart3 }>).map((t) => (
                        <button key={t.id} onClick={() => setTab(p.id, t.id)}
                          className={cn("flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-t-lg transition-colors",
                            tab === t.id ? "bg-card text-foreground border-x border-t border-border -mb-px" : "text-muted-foreground hover:text-foreground"
                          )}>
                          <t.icon className="w-3 h-3" />{t.label}
                        </button>
                      ))}
                    </div>

                    <div className="p-5">
                      {/* Overview tab */}
                      {tab === "overview" && (
                        <div className="space-y-4">
                          {/* Key stats */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                            {[
                              { label: "شروع", value: toJalali(p.startDate), icon: Clock, color: "text-blue-400" },
                              { label: "ددلاین", value: toJalali(p.deadline), icon: AlertCircle, color: isOverdue ? "text-red-400" : "text-foreground" },
                              { label: "زمان کار", value: p.totalTrackedSeconds > 0 ? formatDuration(p.totalTrackedSeconds) : "—", icon: Clock, color: "text-amber-400" },
                              { label: "وضعیت", value: cfg.label, icon: cfg.icon, color: cfg.color },
                            ].map((s) => (
                              <div key={s.label} className="p-3 rounded-xl bg-muted">
                                <s.icon className={cn("w-4 h-4 mx-auto mb-1.5", s.color)} />
                                <p className={cn("text-sm font-semibold", s.color)}>{s.value}</p>
                                <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                              </div>
                            ))}
                          </div>

                          {/* Task progress ring */}
                          {p.taskStats.total > 0 && (
                            <div className="p-4 rounded-xl bg-muted/50 border border-border">
                              <div className="flex items-center gap-4">
                                <TaskProgressRing done={p.taskStats.done} total={p.taskStats.total} />
                                <div className="flex-1">
                                  <p className="text-sm font-semibold text-foreground mb-2">پیشرفت تسک‌ها</p>
                                  <div className="grid grid-cols-2 gap-2">
                                    {[
                                      { label: "انجام شده", value: p.taskStats.done, color: "text-emerald-400" },
                                      { label: "در حال انجام", value: p.taskStats.inProgress, color: "text-amber-400" },
                                      { label: "کل تسک‌ها", value: p.taskStats.total, color: "text-foreground" },
                                      { label: "معوق", value: p.taskStats.overdue, color: "text-red-400" },
                                    ].map((s) => (
                                      <div key={s.label} className="flex items-center justify-between text-xs">
                                        <span className="text-muted-foreground">{s.label}</span>
                                        <span className={cn("font-semibold tabular-nums", s.color)}>{s.value}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Timeline */}
                          <div>
                            <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-1.5">
                              <TrendingUp className="w-4 h-4 text-primary" />تایم‌لاین پروژه
                            </h4>
                            <ProjectTimeline project={p} />
                          </div>

                          {/* Invoice summary */}
                          {p.invoiceStats.totalInvoiced > 0 && (
                            <div className="p-4 rounded-xl bg-muted/50 border border-border">
                              <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-1.5">
                                <CreditCard className="w-4 h-4 text-emerald-400" />وضعیت مالی
                              </h4>
                              <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">کل صورت‌حساب</span>
                                  <span className="font-medium">{formatCurrency(p.invoiceStats.totalInvoiced)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">پرداخت‌شده</span>
                                  <span className="font-medium text-emerald-400">{formatCurrency(p.invoiceStats.paid)}</span>
                                </div>
                                {p.invoiceStats.unpaid > 0 && (
                                  <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">باقی‌مانده</span>
                                    <span className="font-medium text-amber-400">{formatCurrency(p.invoiceStats.unpaid)}</span>
                                  </div>
                                )}
                                {p.invoiceStats.totalInvoiced > 0 && (
                                  <div className="mt-2">
                                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                      <div className="h-full bg-emerald-400 rounded-full transition-all"
                                        style={{ width: `${(p.invoiceStats.paid / p.invoiceStats.totalInvoiced) * 100}%` }} />
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1 text-left" dir="ltr">
                                      {Math.round((p.invoiceStats.paid / p.invoiceStats.totalInvoiced) * 100)}٪ پرداخت شده
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Tasks tab */}
                      {tab === "tasks" && (
                        <div className="space-y-2">
                          {p.recentTasks.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-8">همه تسک‌ها تکمیل شده‌اند 🎉</p>
                          ) : (
                            p.recentTasks.map((task) => {
                              const priorityCfg = PRIORITY_CONFIG[task.priority] ?? PRIORITY_CONFIG.medium;
                              const isTaskOverdue = task.dueDate && new Date(task.dueDate) < new Date();
                              return (
                                <div key={task.id}
                                  className={cn("flex items-center gap-3 p-3 rounded-xl border",
                                    isTaskOverdue ? "bg-red-500/5 border-red-500/20" : "bg-muted/30 border-border")}>
                                  <div className={cn("w-2 h-2 rounded-full shrink-0", priorityCfg.color.replace("text-", "bg-"))} />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm text-foreground truncate">{task.title}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                      {TASK_STATUS_LABELS[task.status] ?? task.status}
                                      {task.dueDate && ` · ${toJalali(task.dueDate)}`}
                                    </p>
                                  </div>
                                  <span className={cn("text-xs font-medium shrink-0", priorityCfg.color)}>
                                    {priorityCfg.label}
                                  </span>
                                </div>
                              );
                            })
                          )}
                          {p.taskStats.total > 5 && (
                            <p className="text-xs text-center text-muted-foreground pt-2">
                              + {p.taskStats.total - 5} تسک دیگر
                            </p>
                          )}
                        </div>
                      )}

                      {/* Milestones tab */}
                      {tab === "milestones" && (
                        <div className="space-y-3">
                          {p.milestones.map((m, idx) => {
                            const isLate = !m.completedAt && new Date(m.dueDate) < new Date();
                            return (
                              <div key={m.id} className="flex items-start gap-3">
                                <div className="relative flex flex-col items-center">
                                  <div className={cn("w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 z-10",
                                    m.completedAt
                                      ? "bg-emerald-500 border-emerald-500"
                                      : isLate ? "bg-red-500/10 border-red-500/50" : "bg-card border-border")}>
                                    {m.completedAt
                                      ? <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                                      : isLate ? <AlertCircle className="w-3 h-3 text-red-400" /> : <span className="text-xs text-muted-foreground">{idx + 1}</span>}
                                  </div>
                                  {idx < p.milestones.length - 1 && (
                                    <div className={cn("w-0.5 h-6 mt-1", m.completedAt ? "bg-emerald-500/30" : "bg-border")} />
                                  )}
                                </div>
                                <div className="flex-1 pb-3">
                                  <p className={cn("text-sm font-medium",
                                    m.completedAt ? "text-emerald-400" : isLate ? "text-red-400" : "text-foreground")}>
                                    {m.title}
                                  </p>
                                  <div className="flex items-center gap-3 mt-0.5">
                                    <p className="text-xs text-muted-foreground">سررسید: {toJalali(m.dueDate)}</p>
                                    {m.completedAt && (
                                      <p className="text-xs text-emerald-400">تکمیل: {toJalali(m.completedAt)}</p>
                                    )}
                                    {isLate && !m.completedAt && (
                                      <span className="text-xs text-red-400 font-medium">تأخیر دارد</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Checklist tab */}
                      {tab === "checklist" && (
                        <div className="space-y-3">
                          {p.checklistSummary.map((cl) => {
                            const pct = cl.total > 0 ? Math.round((cl.done / cl.total) * 100) : 0;
                            return (
                              <div key={cl.id} className="p-4 rounded-xl bg-muted/50 border border-border">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-2">
                                    <Layers className="w-4 h-4 text-primary" />
                                    <span className="text-sm font-semibold text-foreground">
                                      {ENV_LABELS[cl.environment] ?? cl.environment}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground">{cl.done}/{cl.total} آیتم</span>
                                    {cl.deployedAt && (
                                      <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">
                                        دیپلوی شده
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                    <div className={cn("h-full rounded-full transition-all",
                                      pct === 100 ? "bg-emerald-400" : pct > 50 ? "bg-amber-400" : "bg-blue-400")}
                                      style={{ width: `${pct}%` }} />
                                  </div>
                                  <span className={cn("text-xs font-semibold w-8 text-left",
                                    pct === 100 ? "text-emerald-400" : "text-muted-foreground")}>
                                    {pct}٪
                                  </span>
                                </div>
                                {cl.deployedAt && (
                                  <p className="text-xs text-muted-foreground mt-2">
                                    تاریخ دیپلوی: {toJalali(cl.deployedAt)}
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}

        {projects.length === 0 && (
          <div className="py-20 text-center text-muted-foreground">
            <FolderOpen className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>پروژه‌ای وجود ندارد</p>
          </div>
        )}
      </div>
    </div>
  );
}
