"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  FolderOpen, FileText, Headphones, MessageSquare, FileSignature,
  CheckCircle2, Clock, AlertCircle, ChevronLeft, Pen,
} from "lucide-react";
import { usePortal, portalFetch } from "@/lib/portal-context";
import { cn } from "@/lib/utils";
import { toJalali } from "@/lib/utils";

interface DashboardData {
  projects: Array<{ id: string; name: string; status: string; progress: number; deadline: string }>;
  overdueInvoices: Array<{ id: string; invoiceNumber: string; total: number; status: string }>;
  overdueInvoicesTotal: number;
  openTickets: Array<{ id: string; title: string; status: string; priority: string }>;
  pendingContracts: Array<{ id: string; title: string; status: string; signToken: string }>;
  unreadMessages: Array<{ id: string; authorName: string; content: string; createdAt: string }>;
}

const PROJECT_STATUS: Record<string, { label: string; color: string }> = {
  planning: { label: "برنامه‌ریزی", color: "text-blue-400" },
  in_progress: { label: "در حال اجرا", color: "text-amber-400" },
  completed: { label: "تکمیل شده", color: "text-emerald-400" },
  on_hold: { label: "متوقف", color: "text-muted-foreground" },
};

export default function PortalDashboard() {
  const { user, token } = usePortal();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    portalFetch("/api/portal/dashboard", {}, token)
      .then((r) => r.json())
      .then((d) => setData(d.data))
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  }, [token]);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "صبح بخیر" : hour < 18 ? "روز بخیر" : "شب بخیر";

  return (
    <div className="space-y-6" dir="rtl">
      {/* Welcome */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-foreground">{greeting}، {user?.name} 👋</h1>
        <p className="text-muted-foreground text-sm mt-1">خلاصه وضعیت پروژه‌ها و سرویس‌های شما</p>
      </motion.div>

      {/* Pending contracts — show each one individually */}
      {data?.pendingContracts && data.pendingContracts.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-amber-500/30 bg-amber-500/5 overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3 border-b border-amber-500/20">
            <Pen className="w-4 h-4 text-amber-400 shrink-0" />
            <p className="font-semibold text-amber-400 text-sm flex-1">
              {data.pendingContracts.length} قرارداد منتظر امضای شما
            </p>
            <Link href="/portal/contracts" className="text-xs text-amber-400/70 hover:text-amber-400 flex items-center gap-1 transition-colors">
              مشاهده همه <ChevronLeft className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-amber-500/10">
            {data.pendingContracts.map((c) => (
              <div key={c.id} className="flex items-center gap-4 px-5 py-4">
                <FileSignature className="w-8 h-8 text-amber-400 bg-amber-500/10 rounded-xl p-1.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{c.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {c.status === "admin_signed" ? "✓ امضای پرسی‌کور ثبت شده — نوبت شماست" : "آماده برای مطالعه و امضا"}
                  </p>
                </div>
                <Link
                  href={`/portal/contracts?sign=${c.id}`}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold whitespace-nowrap transition-colors shrink-0">
                  <Pen className="w-3.5 h-3.5" />امضا
                </Link>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: FolderOpen, label: "پروژه‌های فعال", value: data?.projects.length ?? "—", href: "/portal/projects", color: "text-blue-400", bg: "bg-blue-500/10" },
          { icon: FileText, label: "فاکتور معوق", value: data?.overdueInvoices.length ?? "—", href: "/portal/invoices", color: "text-amber-400", bg: "bg-amber-500/10" },
          { icon: Headphones, label: "تیکت باز", value: data?.openTickets.length ?? "—", href: "/portal/tickets", color: "text-violet-400", bg: "bg-violet-500/10" },
          { icon: MessageSquare, label: "پیام جدید", value: data?.unreadMessages.length ?? "—", href: "/portal/messages", color: "text-teal-400", bg: "bg-teal-500/10" },
        ].map((s) => (
          <Link key={s.label} href={s.href}>
            <motion.div whileHover={{ y: -2 }}
              className="p-4 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all cursor-pointer">
              <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mb-3", s.bg)}>
                <s.icon className={cn("w-4 h-4", s.color)} />
              </div>
              <p className={cn("text-2xl font-bold tabular-nums", s.color)}>{isLoading ? "…" : s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </motion.div>
          </Link>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {/* Active Projects */}
        <div className="rounded-2xl bg-card border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-foreground flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-blue-400" />پروژه‌های فعال
            </h2>
            <Link href="/portal/projects" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
              همه <ChevronLeft className="w-3 h-3" />
            </Link>
          </div>
          {isLoading ? (
            <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-14 bg-muted rounded-xl animate-pulse" />)}</div>
          ) : data?.projects.length ? (
            <div className="space-y-3">
              {data.projects.slice(0, 4).map((p) => {
                const st = PROJECT_STATUS[p.status] ?? { label: p.status, color: "text-muted-foreground" };
                return (
                  <div key={p.id} className="flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-blue-400 to-teal-400 rounded-full transition-all" style={{ width: `${p.progress}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground tabular-nums shrink-0">{p.progress}٪</span>
                      </div>
                    </div>
                    <span className={cn("text-xs shrink-0", st.color)}>{st.label}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">پروژه‌ای وجود ندارد</p>
          )}
        </div>

        {/* Open Tickets */}
        <div className="rounded-2xl bg-card border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-foreground flex items-center gap-2">
              <Headphones className="w-4 h-4 text-violet-400" />تیکت‌های باز
            </h2>
            <Link href="/portal/tickets" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
              همه <ChevronLeft className="w-3 h-3" />
            </Link>
          </div>
          {isLoading ? (
            <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-12 bg-muted rounded-xl animate-pulse" />)}</div>
          ) : data?.openTickets.length ? (
            <div className="space-y-2">
              {data.openTickets.slice(0, 4).map((t) => (
                <Link key={t.id} href={`/portal/tickets/${t.id}`}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors">
                  <div className={cn("w-2 h-2 rounded-full shrink-0",
                    t.priority === "high" ? "bg-red-400" : t.priority === "low" ? "bg-emerald-400" : "bg-amber-400"
                  )} />
                  <p className="text-sm text-foreground truncate flex-1">{t.title}</p>
                  <span className={cn("text-xs px-2 py-0.5 rounded-full",
                    t.status === "open" ? "bg-blue-500/10 text-blue-400" :
                    t.status === "in_progress" ? "bg-amber-500/10 text-amber-400" :
                    "bg-muted text-muted-foreground"
                  )}>{t.status === "open" ? "باز" : t.status === "in_progress" ? "در حال بررسی" : t.status}</span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">همه تیکت‌ها بسته شده‌اند</p>
            </div>
          )}
          <Link href="/portal/tickets?new=1"
            className="flex items-center justify-center gap-2 mt-3 py-2.5 rounded-xl border border-border bg-muted text-muted-foreground text-sm hover:text-foreground transition-colors">
            + تیکت جدید
          </Link>
        </div>
      </div>

      {/* Overdue invoices */}
      {data?.overdueInvoices && data.overdueInvoices.length > 0 && (
        <div className="rounded-2xl bg-amber-500/5 border border-amber-500/20 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-foreground flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400" />فاکتورهای معوق
            </h2>
            <p className="text-sm font-semibold text-amber-400">
              جمع: {(data.overdueInvoicesTotal / 1_000_000).toFixed(1)} میلیون تومان
            </p>
          </div>
          <div className="space-y-2">
            {data.overdueInvoices.map((inv) => (
              <Link key={inv.id} href={`/portal/invoices`}
                className="flex items-center justify-between p-3 rounded-xl bg-card border border-border hover:border-amber-500/30 transition-all">
                <span className="text-sm text-foreground font-mono">{inv.invoiceNumber}</span>
                <span className="text-sm font-semibold text-amber-400">{(inv.total / 1_000_000).toFixed(1)} میلیون</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Recent messages */}
      {data?.unreadMessages && data.unreadMessages.length > 0 && (
        <div className="rounded-2xl bg-card border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-foreground flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-teal-400" />پیام‌های جدید
            </h2>
            <Link href="/portal/messages" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
              همه <ChevronLeft className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {data.unreadMessages.map((m) => (
              <div key={m.id} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-teal-500/20 flex items-center justify-center text-teal-400 text-sm shrink-0 font-medium">
                  {m.authorName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground">{m.authorName}</p>
                  <p className="text-sm text-muted-foreground truncate">{m.content}</p>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">{toJalali(m.createdAt)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
