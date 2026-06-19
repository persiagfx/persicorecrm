"use client";

import { useMemo, useRef } from "react";
import { cn } from "@/lib/utils";
import type { Task, Milestone } from "@/types";

interface GanttViewProps {
  tasks: Task[];
  milestones?: Milestone[];
  startDate?: string;
  endDate?: string;
}

const PRIORITY_COLORS: Record<string, string> = {
  low: "#64748b",
  medium: "#3b82f6",
  high: "#f97316",
  urgent: "#ef4444",
};

const STATUS_OPACITY: Record<string, number> = {
  backlog: 0.4,
  todo: 0.6,
  in_progress: 0.9,
  review: 0.75,
  done: 0.5,
};

const STATUS_LABELS: Record<string, string> = {
  backlog: "بک‌لاگ",
  todo: "در انتظار",
  in_progress: "در حال انجام",
  review: "بررسی",
  done: "تکمیل",
};

function getDaysBetween(a: Date, b: Date) {
  return Math.ceil((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

const DAY_WIDTH = 28;

export function GanttView({ tasks, milestones = [], startDate, endDate }: GanttViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const { ganttStart, totalDays, columns, taskRows } = useMemo(() => {
    const validTasks = tasks.filter((t) => t.startDate && t.dueDate);
    if (validTasks.length === 0 && milestones.length === 0) {
      return { ganttStart: new Date(), totalDays: 30, columns: [], taskRows: [] };
    }

    const allDates = [
      ...validTasks.map((t) => new Date(t.startDate!)),
      ...validTasks.map((t) => new Date(t.dueDate!)),
      ...milestones.map((m) => new Date(m.dueDate)),
    ];

    const minDate = startDate
      ? new Date(startDate)
      : new Date(Math.min(...allDates.map((d) => d.getTime())));
    const maxDate = endDate
      ? new Date(endDate)
      : new Date(Math.max(...allDates.map((d) => d.getTime())));

    minDate.setDate(minDate.getDate() - 3);
    maxDate.setDate(maxDate.getDate() + 7);

    const days = Math.max(getDaysBetween(minDate, maxDate), 30);

    // ستون‌های هفتگی
    const cols: { label: string; dayOffset: number }[] = [];
    for (let i = 0; i < days; i += 7) {
      const d = addDays(minDate, i);
      cols.push({
        label: d.toLocaleDateString("fa-IR", { month: "short", day: "numeric" }),
        dayOffset: i,
      });
    }

    const rows = tasks.map((task) => {
      const s = task.startDate ? new Date(task.startDate) : null;
      const e = task.dueDate ? new Date(task.dueDate) : null;
      const left = s ? Math.max(getDaysBetween(minDate, s), 0) * DAY_WIDTH : null;
      const width = s && e ? Math.max(getDaysBetween(s, e), 1) * DAY_WIDTH : null;
      return { task, left, width };
    });

    return { ganttStart: minDate, totalDays: days, columns: cols, taskRows: rows };
  }, [tasks, milestones, startDate, endDate]);

  const today = new Date();
  const todayOffset = Math.max(getDaysBetween(ganttStart, today), 0);
  const totalWidth = totalDays * DAY_WIDTH;

  const tasksWithoutDates = tasks.filter((t) => !t.startDate || !t.dueDate);

  if (tasks.length === 0) {
    return (
      <div className="p-12 text-center text-muted-foreground text-sm">
        <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3 text-2xl">📅</div>
        <p className="font-medium text-foreground mb-1">هنوز تسکی تعریف نشده</p>
        <p>تسک‌ها را در تب کانبان ایجاد کنید</p>
      </div>
    );
  }

  if (taskRows.every((r) => r.left === null) && milestones.length === 0) {
    return (
      <div className="p-12 text-center text-muted-foreground text-sm">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-3">
          <span className="text-2xl">📅</span>
        </div>
        <p className="font-medium text-foreground mb-1">تاریخ تسک‌ها تعریف نشده</p>
        <p className="text-sm mb-4">برای نمایش در گانت، تاریخ شروع و پایان تسک‌ها را تعریف کنید</p>
        <div className="max-w-xs mx-auto text-right space-y-2 bg-muted/40 rounded-xl p-4 border border-border">
          {tasks.slice(0, 5).map((t) => (
            <div key={t.id} className="flex items-center gap-2 text-xs">
              <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: PRIORITY_COLORS[t.priority] }} />
              <span className="text-foreground truncate">{t.title}</span>
              <span className="mr-auto text-muted-foreground shrink-0">بدون تاریخ</span>
            </div>
          ))}
          {tasks.length > 5 && <p className="text-xs text-muted-foreground text-center">و {tasks.length - 5} تسک دیگر</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-card border border-border overflow-hidden">
      <div className="flex">
        {/* ستون نام تسک‌ها (ثابت) */}
        <div className="w-52 shrink-0 border-l border-border">
          {/* header */}
          <div className="h-10 flex items-center px-4 border-b border-border bg-muted/50">
            <span className="text-xs font-medium text-muted-foreground">تسک</span>
          </div>
          {taskRows.map(({ task }) => (
            <div
              key={task.id}
              className="h-12 flex items-center px-4 border-b border-border hover:bg-muted/30 transition-colors"
            >
              <div className="min-w-0">
                <p className="text-xs font-medium text-foreground truncate">{task.title}</p>
                <p className="text-[10px] text-muted-foreground">{STATUS_LABELS[task.status]}</p>
              </div>
            </div>
          ))}
          {/* milestone rows */}
          {milestones.map((m) => (
            <div key={m.id} className="h-10 flex items-center px-4 border-b border-border">
              <p className="text-xs font-medium text-primary truncate">◆ {m.title}</p>
            </div>
          ))}
        </div>

        {/* ناحیه اسکرول Gantt */}
        <div className="flex-1 overflow-x-auto" ref={scrollRef}>
          <div style={{ width: totalWidth, minWidth: "100%" }}>
            {/* header تاریخ‌ها */}
            <div className="h-10 flex items-end border-b border-border bg-muted/50 relative">
              {columns.map((col) => (
                <div
                  key={col.dayOffset}
                  className="absolute bottom-0 text-[10px] text-muted-foreground pb-2 border-r border-border/50"
                  style={{ left: col.dayOffset * DAY_WIDTH, width: 7 * DAY_WIDTH }}
                >
                  <span className="px-2">{col.label}</span>
                </div>
              ))}
              {/* خط امروز */}
              <div
                className="absolute top-0 bottom-0 w-px bg-primary/60 z-10"
                style={{ left: todayOffset * DAY_WIDTH }}
              />
            </div>

            {/* ردیف‌های تسک‌ها */}
            {taskRows.map(({ task, left, width }) => (
              <div key={task.id} className="h-12 border-b border-border relative hover:bg-muted/20 transition-colors">
                {/* خطوط عمودی هفتگی */}
                {columns.map((col) => (
                  <div
                    key={col.dayOffset}
                    className="absolute top-0 bottom-0 w-px bg-border/30"
                    style={{ left: col.dayOffset * DAY_WIDTH }}
                  />
                ))}
                {/* خط امروز */}
                <div
                  className="absolute top-0 bottom-0 w-px bg-primary/30 z-10"
                  style={{ left: todayOffset * DAY_WIDTH }}
                />
                {/* نوار تسک */}
                {left !== null && width !== null && (
                  <div
                    className="absolute top-3 h-6 rounded-md flex items-center px-2 cursor-pointer hover:brightness-110 transition-all z-20"
                    style={{
                      left: left,
                      width: Math.max(width, 24),
                      backgroundColor: PRIORITY_COLORS[task.priority],
                      opacity: STATUS_OPACITY[task.status],
                    }}
                    title={`${task.title} | ${task.startDate} → ${task.dueDate}`}
                  >
                    {width > 40 && (
                      <span className="text-[10px] text-white font-medium truncate">
                        {task.title}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* ردیف‌های milestone */}
            {milestones.map((m) => {
              const mLeft = getDaysBetween(ganttStart, new Date(m.dueDate)) * DAY_WIDTH;
              const isPast = new Date(m.dueDate) < today && !m.completedAt;
              return (
                <div key={m.id} className="h-10 border-b border-border relative hover:bg-muted/20">
                  {columns.map((col) => (
                    <div key={col.dayOffset} className="absolute top-0 bottom-0 w-px bg-border/30" style={{ left: col.dayOffset * DAY_WIDTH }} />
                  ))}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20"
                    style={{ left: Math.max(mLeft, 12) }}
                    title={m.title}
                  >
                    <div className={cn(
                      "w-4 h-4 rotate-45 border-2",
                      m.completedAt
                        ? "bg-emerald-400 border-emerald-600"
                        : isPast
                          ? "bg-red-400 border-red-600"
                          : "bg-primary border-primary/60"
                    )} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* تسک‌های بدون تاریخ */}
      {tasksWithoutDates.length > 0 && (
        <div className="border-t border-dashed border-border/60 px-4 py-3 bg-muted/20">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
            تسک‌های بدون زمان‌بندی ({tasksWithoutDates.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {tasksWithoutDates.map((t) => (
              <span key={t.id} className="inline-flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full bg-card border border-border text-muted-foreground">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: PRIORITY_COLORS[t.priority] }} />
                {t.title}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* راهنما */}
      <div className="px-4 py-3 border-t border-border bg-muted/30 flex items-center gap-4 flex-wrap">
        {Object.entries(PRIORITY_COLORS).map(([k, v]) => (
          <div key={k} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: v }} />
            <span className="text-[10px] text-muted-foreground">
              {{ low: "کم", medium: "متوسط", high: "زیاد", urgent: "فوری" }[k]}
            </span>
          </div>
        ))}
        <div className="flex items-center gap-1.5 mr-2">
          <div className="w-1 h-4 bg-primary/60 rounded" />
          <span className="text-[10px] text-muted-foreground">امروز</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-primary rotate-45" />
          <span className="text-[10px] text-muted-foreground">نقطه عطف</span>
        </div>
      </div>
    </div>
  );
}
