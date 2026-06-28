"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { Headphones, Plus, X, CheckCircle2, Clock } from "lucide-react";
import Link from "next/link";
import { usePortal, portalFetch } from "@/lib/portal-context";
import { cn } from "@/lib/utils";
import { toJalali } from "@/lib/utils";

interface Ticket {
  id: string;
  title: string;
  status: string;
  priority: string;
  category: string;
  createdAt: string;
  resolvedAt: string | null;
  replies: Array<{ id: string; createdAt: string; isRead: boolean; authorType: string }>;
}

const PRIORITY_COLOR: Record<string, string> = {
  high: "bg-red-400",
  medium: "bg-amber-400",
  low: "bg-emerald-400",
};

function PortalTicketsPageInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { token } = usePortal();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNew, setShowNew] = useState(params.get("new") === "1");
  const [form, setForm] = useState({ title: "", description: "", priority: "medium", category: "general" });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    portalFetch("/api/portal/tickets", {}, token)
      .then((r) => r.json())
      .then((d) => setTickets(d.data ?? []))
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  }, [token]);

  const handleCreate = async () => {
    if (!form.title.trim() || !form.description.trim()) return;
    setIsSaving(true);
    try {
      const res = await portalFetch("/api/portal/tickets", {
        method: "POST",
        body: JSON.stringify(form),
      }, token);
      const d = await res.json();
      setTickets((prev) => [d.data, ...prev]);
      setShowNew(false);
      setForm({ title: "", description: "", priority: "medium", category: "general" });
    } catch {
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-5" dir="rtl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Headphones className="w-6 h-6 text-violet-400" />پشتیبانی
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">{tickets.filter((t) => t.status !== "closed").length} تیکت باز</p>
        </div>
        <button onClick={() => setShowNew(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-teal-500 text-white font-semibold text-sm">
          <Plus className="w-4 h-4" />تیکت جدید
        </button>
      </motion.div>

      {/* New ticket modal */}
      <AnimatePresence>
        {showNew && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowNew(false)}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <h2 className="font-bold text-foreground">تیکت پشتیبانی جدید</h2>
                <button onClick={() => setShowNew(false)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground"><X className="w-4 h-4" /></button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">عنوان *</label>
                  <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="خلاصه مشکل..."
                    className="w-full px-4 py-2.5 rounded-xl bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/40" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">اولویت</label>
                    <select value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/40">
                      <option value="low">کم</option>
                      <option value="medium">متوسط</option>
                      <option value="high">زیاد</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">دسته‌بندی</label>
                    <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                      className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/40">
                      <option value="general">عمومی</option>
                      <option value="technical">فنی</option>
                      <option value="billing">مالی</option>
                      <option value="project">پروژه</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">توضیحات *</label>
                  <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    rows={5} placeholder="مشکل را با جزئیات شرح دهید..."
                    className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/40 resize-none" />
                </div>
              </div>
              <div className="px-6 py-4 border-t border-border flex gap-3">
                <button onClick={() => setShowNew(false)} className="flex-1 py-2.5 rounded-xl border border-border bg-muted text-foreground text-sm">انصراف</button>
                <button onClick={handleCreate} disabled={!form.title.trim() || !form.description.trim() || isSaving}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-teal-500 text-white font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed">
                  {isSaving ? "در حال ارسال..." : "ارسال تیکت"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-3">
        {tickets.map((t, i) => {
          const hasUnread = t.replies.some((r) => !r.isRead && r.authorType === "team");
          return (
            <motion.div key={t.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <Link href={`/portal/tickets/${t.id}`}
                className={cn("flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer block",
                  hasUnread ? "bg-blue-500/5 border-blue-500/20 hover:border-blue-500/40" : "bg-card border-border hover:border-primary/20"
                )}>
                <div className={cn("w-2.5 h-2.5 rounded-full shrink-0", PRIORITY_COLOR[t.priority] ?? "bg-muted-foreground")} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground truncate">{t.title}</p>
                    {hasUnread && <span className="shrink-0 w-2 h-2 rounded-full bg-blue-400" />}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {toJalali(t.createdAt)} · {t.replies.length} پاسخ
                  </p>
                </div>
                <span className={cn("flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium shrink-0",
                  t.status === "open" ? "bg-blue-500/10 text-blue-400" :
                  t.status === "in_progress" ? "bg-amber-500/10 text-amber-400" :
                  t.status === "closed" ? "bg-emerald-500/10 text-emerald-400" :
                  "bg-muted text-muted-foreground"
                )}>
                  {t.status === "open" ? "باز" : t.status === "in_progress" ? "در بررسی" : t.status === "closed" ? "بسته" : t.status}
                </span>
              </Link>
            </motion.div>
          );
        })}
        {tickets.length === 0 && (
          <div className="py-20 text-center text-muted-foreground">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-emerald-400 opacity-50" />
            <p className="font-medium">تیکتی وجود ندارد</p>
            <p className="text-sm mt-1">برای ارسال مشکل یا سوال، تیکت جدید بزنید</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PortalTicketsPage() {
  return <Suspense><PortalTicketsPageInner /></Suspense>;
}
