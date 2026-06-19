"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "motion/react";
import { apiClient } from "@/lib/api/client";
import { toJalali } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Calendar, ChevronLeft, ChevronRight, AlertCircle, CheckCircle2, Clock, Layers } from "lucide-react";
import type { User } from "@/types";

interface Project {
  id: string;
  name: string;
  status: string;
  progress: number;
  startDate: string;
  deadline: string;
  memberIds: string[];
  colorHash: string;
  client: { companyName: string };
}

const STATUS_COLORS: Record<string, string> = {
  in_progress: "bg-blue-500",
  planning:    "bg-amber-500",
  review:      "bg-purple-500",
  completed:   "bg-emerald-500",
  on_hold:     "bg-zinc-500",
  cancelled:   "bg-red-500",
};

const STATUS_LABELS: Record<string, string> = {
  in_progress: "در حال اجرا",
  planning:    "برنامه‌ریزی",
  review:      "بررسی",
  completed:   "تکمیل‌شده",
  on_hold:     "متوقف",
  cancelled:   "لغو شده",
};

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

interface Props {
  members: User[];
}

export default function TeamScheduleTab({ members }: Props) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

  useEffect(() => {
    apiClient.get("/projects")
      .then((r) => setProjects(r.data ?? []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const monthStart = new Date(viewYear, viewMonth, 1);
  const monthEnd = new Date(viewYear, viewMonth, daysInMonth, 23, 59, 59);

  const MONTH_NAMES = ["ژانویه", "فوریه", "مارس", "آوریل", "مه", "ژوئن", "جولای", "اوت", "سپتامبر", "اکتبر", "نوامبر", "دسامبر"];

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  // پروژه‌هایی که با این ماه overlap دارند
  const visibleProjects = useMemo(() =>
    projects.filter((p) => {
      const s = new Date(p.startDate);
      const e = new Date(p.deadline);
      return s <= monthEnd && e >= monthStart;
    }),
    [projects, monthStart, monthEnd]
  );

  // بار کاری هر عضو: تعداد پروژه‌های فعال
  const memberLoad = useMemo(() =>
    members.reduce<Record<string, Project[]>>((acc, m) => {
      acc[m.id] = visibleProjects.filter((p) =>
        Array.isArray(p.memberIds) && p.memberIds.includes(m.id)
      );
      return acc;
    }, {}),
    [members, visibleProjects]
  );

  // برای هر پروژه: شروع و پایان در ماه جاری (clamp)
  function getBarStyle(project: Project) {
    const s = new Date(project.startDate);
    const e = new Date(project.deadline);
    const clampedStart = s < monthStart ? monthStart : s;
    const clampedEnd = e > monthEnd ? monthEnd : e;
    const startDay = clampedStart.getDate();
    const endDay = clampedEnd.getDate();
    const left = ((startDay - 1) / daysInMonth) * 100;
    const width = Math.max(((endDay - startDay + 1) / daysInMonth) * 100, 2);
    return { left: `${left}%`, width: `${width}%` };
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />برنامه‌ریزی شغلی تیم
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            نمای ماهانه از پروژه‌های هر عضو
          </p>
        </div>
        <div className="flex items-center gap-1 bg-muted p-1 rounded-xl">
          <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-card transition-colors text-muted-foreground hover:text-foreground">
            <ChevronRight className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium text-foreground px-3 min-w-[110px] text-center">
            {MONTH_NAMES[viewMonth]} {viewYear}
          </span>
          <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-card transition-colors text-muted-foreground hover:text-foreground">
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "پروژه‌های این ماه", value: visibleProjects.length, icon: Layers, color: "text-blue-400" },
          {
            label: "اعضای مشغول",
            value: members.filter((m) => (memberLoad[m.id]?.length ?? 0) > 0).length,
            icon: CheckCircle2,
            color: "text-emerald-400",
          },
          {
            label: "اعضای آزاد",
            value: members.filter((m) => (memberLoad[m.id]?.length ?? 0) === 0).length,
            icon: Clock,
            color: "text-amber-400",
          },
        ].map((s) => (
          <div key={s.label} className="p-4 rounded-2xl bg-card border border-border">
            <div className="flex items-center gap-2 mb-1.5">
              <s.icon className={cn("w-4 h-4", s.color)} />
              <span className="text-xs text-muted-foreground">{s.label}</span>
            </div>
            <p className="text-2xl font-bold text-foreground tabular-nums">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Gantt Chart */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <div style={{ minWidth: 700 }}>
            {/* Day header */}
            <div className="flex border-b border-border bg-muted/40">
              <div className="w-44 shrink-0 px-4 py-2.5 text-xs font-semibold text-muted-foreground border-l border-border">
                عضو
              </div>
              <div className="flex-1 relative">
                <div className="flex">
                  {days.map((d) => {
                    const isToday = viewYear === now.getFullYear() && viewMonth === now.getMonth() && d === now.getDate();
                    return (
                      <div key={d} className={cn(
                        "flex-1 text-center text-[10px] py-2 border-l border-border/30 last:border-l-0",
                        isToday ? "text-primary font-bold" : "text-muted-foreground"
                      )}>
                        {d % 5 === 0 || d === 1 ? d : ""}
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="w-24 shrink-0 px-3 py-2.5 text-xs font-semibold text-muted-foreground text-center border-r border-border">
                بار کاری
              </div>
            </div>

            {/* Member rows */}
            {members.map((member, mi) => {
              const projs = memberLoad[member.id] ?? [];
              const loadLevel = projs.length === 0 ? "free" : projs.length <= 2 ? "normal" : "heavy";
              return (
                <motion.div key={member.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: mi * 0.04 }}
                  className="flex border-b border-border/50 last:border-b-0 hover:bg-muted/20 transition-colors group">

                  {/* Member info */}
                  <div className="w-44 shrink-0 px-4 py-3 flex items-center gap-2.5 border-l border-border">
                    <div className="w-7 h-7 rounded-full gradient-brand flex items-center justify-center text-black text-xs font-bold shrink-0">
                      {member.name.slice(0, 1)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{member.name.split(" ")[0]}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{member.name.split(" ")[1] ?? ""}</p>
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="flex-1 relative py-2 px-1" style={{ minHeight: 48 }}>
                    {/* Today line */}
                    {viewYear === now.getFullYear() && viewMonth === now.getMonth() && (
                      <div
                        className="absolute top-0 bottom-0 w-px bg-primary/40 z-10"
                        style={{ left: `${((now.getDate() - 0.5) / daysInMonth) * 100}%` }}
                      />
                    )}

                    {/* Project bars */}
                    {projs.map((p, pi) => {
                      const style = getBarStyle(p);
                      const color = STATUS_COLORS[p.status] ?? "bg-blue-500";
                      const isOverdue = new Date(p.deadline) < now && p.status !== "completed";
                      return (
                        <div key={p.id}
                          title={`${p.name} — ${p.client.companyName} | ${STATUS_LABELS[p.status] ?? p.status} | ددلاین: ${toJalali(p.deadline)}`}
                          className={cn(
                            "absolute rounded-md h-6 flex items-center px-2 overflow-hidden cursor-default transition-opacity hover:opacity-90",
                            color,
                            isOverdue ? "opacity-80 ring-1 ring-red-400" : "opacity-75"
                          )}
                          style={{ ...style, top: 4 + pi * 28 }}>
                          <span className="text-white text-[10px] font-medium truncate whitespace-nowrap">
                            {p.name}
                          </span>
                          {isOverdue && <AlertCircle className="w-3 h-3 text-white ml-1 shrink-0" />}
                        </div>
                      );
                    })}

                    {projs.length === 0 && (
                      <div className="absolute inset-y-0 left-2 right-2 flex items-center">
                        <span className="text-xs text-muted-foreground/50 italic">بدون پروژه</span>
                      </div>
                    )}
                  </div>

                  {/* Load badge */}
                  <div className="w-24 shrink-0 px-3 py-3 flex items-center justify-center border-r border-border">
                    <span className={cn(
                      "px-2.5 py-1 rounded-lg text-xs font-medium",
                      loadLevel === "free"   ? "bg-muted text-muted-foreground" :
                      loadLevel === "normal" ? "bg-blue-500/10 text-blue-400" :
                                               "bg-red-500/10 text-red-400"
                    )}>
                      {loadLevel === "free" ? "آزاد" : loadLevel === "normal" ? `${projs.length} پروژه` : `${projs.length} پروژه 🔥`}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 flex-wrap">
        <span className="text-xs text-muted-foreground">وضعیت:</span>
        {Object.entries(STATUS_LABELS).map(([k, v]) => (
          <span key={k} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className={cn("w-2.5 h-2.5 rounded-sm", STATUS_COLORS[k] ?? "bg-muted")} />
            {v}
          </span>
        ))}
      </div>
    </div>
  );
}
