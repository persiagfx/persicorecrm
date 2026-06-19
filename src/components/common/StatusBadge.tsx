import { cn } from "@/lib/utils";
import type { LeadStatus, TaskStatus, TaskPriority, ClientStatus, InvoiceStatus } from "@/types";

const baseClass = "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium";

export function LeadStatusBadge({ status }: { status: LeadStatus }) {
  const map: Record<LeadStatus, { label: string; className: string }> = {
    new: { label: "جدید", className: "bg-blue-500/10 text-blue-500 border border-blue-500/20" },
    contacted: { label: "تماس گرفته شد", className: "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" },
    meeting: { label: "جلسه", className: "bg-violet-500/10 text-violet-400 border border-violet-500/20" },
    proposal: { label: "پروپوزال", className: "bg-purple-500/10 text-purple-400 border border-purple-500/20" },
    negotiation: { label: "مذاکره", className: "bg-amber-500/10 text-amber-500 border border-amber-500/20" },
    won: { label: "قرارداد بسته شد", className: "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" },
    lost: { label: "از دست رفت", className: "bg-red-500/10 text-red-500 border border-red-500/20" },
  };
  const cfg = map[status];
  return <span className={cn(baseClass, cfg.className)}>{cfg.label}</span>;
}

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const map: Record<TaskStatus, { label: string; className: string }> = {
    backlog: { label: "بک‌لاگ", className: "bg-slate-500/10 text-slate-400 border border-slate-500/20" },
    todo: { label: "در انتظار", className: "bg-blue-500/10 text-blue-400 border border-blue-500/20" },
    in_progress: { label: "در حال انجام", className: "bg-amber-500/10 text-amber-500 border border-amber-500/20" },
    review: { label: "بررسی", className: "bg-purple-500/10 text-purple-400 border border-purple-500/20" },
    done: { label: "تکمیل", className: "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" },
  };
  const cfg = map[status];
  return <span className={cn(baseClass, cfg.className)}>{cfg.label}</span>;
}

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const map: Record<TaskPriority, { label: string; className: string; dot: string }> = {
    low: { label: "کم", className: "bg-slate-500/10 text-slate-400", dot: "bg-slate-400" },
    medium: { label: "متوسط", className: "bg-blue-500/10 text-blue-400", dot: "bg-blue-400" },
    high: { label: "زیاد", className: "bg-orange-500/10 text-orange-400", dot: "bg-orange-400" },
    urgent: { label: "فوری", className: "bg-red-500/10 text-red-500", dot: "bg-red-500" },
  };
  const cfg = map[priority];
  return (
    <span className={cn(baseClass, cfg.className)}>
      <span className={cn("w-1.5 h-1.5 rounded-full", cfg.dot)} />
      {cfg.label}
    </span>
  );
}

export function ClientStatusBadge({ status }: { status: ClientStatus }) {
  const map: Record<ClientStatus, { label: string; className: string; pulse?: boolean }> = {
    vip: { label: "VIP", className: "bg-amber-500/10 text-amber-500 border border-amber-500/30", pulse: false },
    active: { label: "فعال", className: "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" },
    at_risk: { label: "در ریسک", className: "bg-red-500/10 text-red-500 border border-red-500/20", pulse: true },
    inactive: { label: "خاموش", className: "bg-slate-500/10 text-slate-400 border border-slate-500/20" },
  };
  const cfg = map[status];
  return (
    <span className={cn(baseClass, cfg.className)}>
      {cfg.pulse && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />}
      {cfg.label}
    </span>
  );
}

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  const map: Record<InvoiceStatus, { label: string; className: string }> = {
    draft: { label: "پیش‌نویس", className: "bg-slate-500/10 text-slate-400 border border-slate-500/20" },
    sent: { label: "ارسال شده", className: "bg-blue-500/10 text-blue-400 border border-blue-500/20" },
    paid: { label: "پرداخت شده", className: "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" },
    overdue: { label: "معوق", className: "bg-red-500/10 text-red-500 border border-red-500/20" },
    cancelled: { label: "لغو شده", className: "bg-slate-500/10 text-slate-500 border border-slate-500/20" },
  };
  const cfg = map[status];
  return <span className={cn(baseClass, cfg.className)}>{cfg.label}</span>;
}
