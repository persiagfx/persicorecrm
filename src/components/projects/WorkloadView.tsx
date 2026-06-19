"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { USER_ROLES } from "@/lib/constants";
import type { Task, User } from "@/types";

interface WorkloadViewProps {
  tasks: Task[];
  members: User[];
}

const TASK_STATUS_LABELS: Record<string, string> = {
  backlog: "بک‌لاگ",
  todo: "در انتظار",
  in_progress: "در حال انجام",
  review: "بررسی",
  done: "تکمیل",
};

const TASK_STATUS_COLORS: Record<string, string> = {
  backlog: "bg-slate-400",
  todo: "bg-blue-400",
  in_progress: "bg-amber-400",
  review: "bg-purple-400",
  done: "bg-emerald-400",
};

function workloadLevel(activeCount: number): { label: string; color: string; barColor: string } {
  if (activeCount === 0) return { label: "بدون تسک", color: "text-muted-foreground", barColor: "bg-muted" };
  if (activeCount <= 3) return { label: "نرمال", color: "text-emerald-400", barColor: "bg-emerald-400" };
  if (activeCount <= 6) return { label: "متوسط", color: "text-amber-400", barColor: "bg-amber-400" };
  return { label: "اضافه‌بار", color: "text-red-400", barColor: "bg-red-400" };
}

export function WorkloadView({ tasks, members }: WorkloadViewProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const memberWorkload = useMemo(() => {
    return members.map((member) => {
      const myTasks = tasks.filter((t) => t.assigneeIds.includes(member.id));
      const activeTasks = myTasks.filter((t) => t.status !== "done" && t.status !== "backlog");
      const byStatus = Object.fromEntries(
        ["backlog", "todo", "in_progress", "review", "done"].map((s) => [
          s,
          myTasks.filter((t) => t.status === s).length,
        ])
      );
      return { member, myTasks, activeTasks, byStatus };
    });
  }, [tasks, members]);

  const maxActive = Math.max(...memberWorkload.map((m) => m.activeTasks.length), 1);

  return (
    <div className="space-y-3">
      {memberWorkload.map(({ member, myTasks, activeTasks, byStatus }) => {
        const level = workloadLevel(activeTasks.length);
        const isExpanded = expandedId === member.id;
        const barWidth = Math.round((activeTasks.length / maxActive) * 100);

        return (
          <div
            key={member.id}
            className="rounded-2xl bg-card border border-border overflow-hidden"
          >
            {/* ردیف اصلی */}
            <button
              className="w-full flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors text-right"
              onClick={() => setExpandedId(isExpanded ? null : member.id)}
            >
              {/* آواتار */}
              <div className="w-10 h-10 rounded-full gradient-brand flex items-center justify-center text-sm font-bold text-black shrink-0">
                {member.name.slice(0, 1)}
              </div>

              {/* اطلاعات */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-foreground">{member.name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                    {USER_ROLES[member.role]?.label}
                  </span>
                </div>
                {/* نوار پیشرفت */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all duration-500", level.barColor)}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                  <span className={cn("text-xs font-medium shrink-0", level.color)}>
                    {activeTasks.length} تسک فعال
                  </span>
                  <span className={cn("text-[10px] shrink-0", level.color)}>
                    ({level.label})
                  </span>
                </div>
              </div>

              {/* آمار کوچک */}
              <div className="flex gap-1 shrink-0">
                {Object.entries(byStatus).map(([status, count]) =>
                  count > 0 ? (
                    <div
                      key={status}
                      className={cn("w-5 h-5 rounded-full text-[9px] font-bold text-white flex items-center justify-center", TASK_STATUS_COLORS[status])}
                      title={`${TASK_STATUS_LABELS[status]}: ${count}`}
                    >
                      {count}
                    </div>
                  ) : null
                )}
              </div>

              {/* فلش */}
              <span className={cn("text-muted-foreground transition-transform", isExpanded && "rotate-180")}>
                ▾
              </span>
            </button>

            {/* تسک‌های این عضو (expanded) */}
            {isExpanded && (
              <div className="border-t border-border bg-muted/20 divide-y divide-border">
                {myTasks.length === 0 ? (
                  <p className="px-4 py-3 text-sm text-muted-foreground">هیچ تسکی اختصاص داده نشده</p>
                ) : (
                  myTasks.map((task) => (
                    <div key={task.id} className="flex items-center gap-3 px-6 py-2.5">
                      <div className={cn("w-2 h-2 rounded-full shrink-0", TASK_STATUS_COLORS[task.status])} />
                      <span className="text-sm text-foreground flex-1 truncate">{task.title}</span>
                      <span className="text-[10px] text-muted-foreground shrink-0">{TASK_STATUS_LABELS[task.status]}</span>
                      {task.dueDate && (
                        <span className={cn(
                          "text-[10px] shrink-0",
                          new Date(task.dueDate) < new Date() && task.status !== "done"
                            ? "text-red-400 font-medium"
                            : "text-muted-foreground"
                        )}>
                          {new Date(task.dueDate).toLocaleDateString("fa-IR")}
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        );
      })}

      {memberWorkload.length === 0 && (
        <div className="p-12 text-center text-muted-foreground text-sm">
          عضوی در این پروژه وجود ندارد.
        </div>
      )}
    </div>
  );
}
