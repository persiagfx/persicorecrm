"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  MessageSquare, Plus, X, Send, ChevronDown,
  Clock, CheckCircle2, AlertCircle, Circle,
} from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { toast } from "sonner";

interface Reply { id: string; authorType: string; authorName: string; content: string; createdAt: string; }
interface Ticket {
  id: string; subject: string; message: string; category: string;
  priority: string; status: string; createdAt: string; replies: Reply[];
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  open:        { label: "باز",            color: "text-amber-400 bg-amber-400/10", icon: <Circle className="w-3 h-3" /> },
  in_progress: { label: "در بررسی",      color: "text-blue-400 bg-blue-400/10",   icon: <Clock className="w-3 h-3" /> },
  waiting:     { label: "در انتظار",     color: "text-purple-400 bg-purple-400/10", icon: <Clock className="w-3 h-3" /> },
  resolved:    { label: "حل شده",        color: "text-green-400 bg-green-400/10", icon: <CheckCircle2 className="w-3 h-3" /> },
  closed:      { label: "بسته",          color: "text-white/30 bg-white/5",       icon: <X className="w-3 h-3" /> },
};

const CATEGORIES = [
  { value: "general",   label: "عمومی" },
  { value: "billing",   label: "مالی / اشتراک" },
  { value: "technical", label: "فنی / باگ" },
  { value: "feature",   label: "پیشنهاد قابلیت" },
];

const PRIORITIES = [
  { value: "low",      label: "پایین" },
  { value: "medium",   label: "متوسط" },
  { value: "high",     label: "بالا" },
  { value: "critical", label: "بحرانی" },
];

export default function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ subject: "", message: "", category: "general", priority: "medium" });
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await apiClient.get("/support");
      setTickets(r.data.data ?? []);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const submit = async () => {
    if (!form.subject.trim() || !form.message.trim()) return;
    setSubmitting(true);
    try {
      await apiClient.post("/support", form);
      toast.success("تیکت شما ثبت شد. تیم پشتیبانی به زودی پاسخ می‌دهد.");
      setShowNew(false);
      setForm({ subject: "", message: "", category: "general", priority: "medium" });
      load();
    } catch { toast.error("خطا در ارسال تیکت"); }
    finally { setSubmitting(false); }
  };

  const fmtDate = (d: string) => new Date(d).toLocaleString("fa-IR", { dateStyle: "short", timeStyle: "short" });

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">پشتیبانی</h1>
          <p className="text-sm text-muted-foreground mt-0.5">تیکت‌های شما و پاسخ‌های تیم پشتیبانی</p>
        </div>
        <button onClick={() => setShowNew(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90">
          <Plus className="w-4 h-4" />تیکت جدید
        </button>
      </div>

      {/* New ticket modal */}
      <AnimatePresence>
        {showNew && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-background border border-border rounded-2xl w-full max-w-lg p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-foreground">تیکت جدید</h3>
                <button onClick={() => setShowNew(false)} className="p-2 rounded-xl hover:bg-muted text-muted-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5">موضوع</label>
                  <input value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
                    placeholder="خلاصه مشکل یا سوال شما"
                    className="w-full bg-muted/30 border border-border rounded-xl px-3 py-2.5 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1.5">دسته‌بندی</label>
                    <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                      className="w-full bg-muted/30 border border-border rounded-xl px-3 py-2.5 text-foreground text-sm focus:outline-none">
                      {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1.5">اولویت</label>
                    <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}
                      className="w-full bg-muted/30 border border-border rounded-xl px-3 py-2.5 text-foreground text-sm focus:outline-none">
                      {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5">توضیحات</label>
                  <textarea value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} rows={4}
                    placeholder="جزئیات مشکل یا سوال خود را بنویسید..."
                    className="w-full bg-muted/30 border border-border rounded-xl px-3 py-2.5 text-foreground text-sm focus:outline-none resize-none" />
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={submit} disabled={submitting || !form.subject.trim() || !form.message.trim()}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 disabled:opacity-50">
                  <Send className="w-4 h-4" />{submitting ? "در حال ارسال..." : "ارسال تیکت"}
                </button>
                <button onClick={() => setShowNew(false)}
                  className="px-4 py-2.5 rounded-xl border border-border text-muted-foreground hover:text-foreground text-sm">
                  انصراف
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-20 rounded-2xl bg-muted/30 animate-pulse" />)}
        </div>
      ) : tickets.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">هنوز تیکتی ارسال نکرده‌اید</p>
          <p className="text-sm mt-1">اگر سوال یا مشکلی دارید تیکت ارسال کنید</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((t, idx) => {
            const cfg = STATUS_CONFIG[t.status] ?? STATUS_CONFIG.open;
            const isOpen = selected?.id === t.id;
            return (
              <motion.div key={t.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                className="rounded-2xl border border-border bg-card overflow-hidden">
                <button className="w-full text-right p-4 hover:bg-muted/20 transition-colors" onClick={() => setSelected(isOpen ? null : t)}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full ${cfg.color}`}>
                        {cfg.icon}{cfg.label}
                      </span>
                      <p className="font-medium text-foreground">{t.subject}</p>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <span className="text-xs">{fmtDate(t.createdAt)}</span>
                      {t.replies.length > 0 && (
                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-primary/20 text-primary">
                          {t.replies.length} پاسخ
                        </span>
                      )}
                      <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                    </div>
                  </div>
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden border-t border-border">
                      <div className="p-4 space-y-3">
                        {/* Original message */}
                        <div className="bg-muted/30 rounded-xl p-3 text-sm text-muted-foreground leading-relaxed">
                          {t.message}
                        </div>
                        {/* Replies */}
                        {t.replies.map(r => (
                          <div key={r.id} className={`flex gap-3 ${r.authorType === "admin" ? "flex-row-reverse" : ""}`}>
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                              r.authorType === "admin" ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                            }`}>
                              {r.authorType === "admin" ? "P" : "S"}
                            </div>
                            <div className={`flex-1 ${r.authorType === "admin" ? "items-end" : ""}`}>
                              <div className={`flex items-center gap-2 mb-1 text-xs text-muted-foreground ${r.authorType === "admin" ? "justify-end" : ""}`}>
                                <span className="font-medium text-foreground">{r.authorName}</span>
                                <span>{fmtDate(r.createdAt)}</span>
                              </div>
                              <div className={`rounded-xl p-3 text-sm leading-relaxed ${
                                r.authorType === "admin" ? "bg-primary/10 text-foreground" : "bg-muted/30 text-muted-foreground"
                              }`}>
                                {r.content}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
