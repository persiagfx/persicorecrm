"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { WalletCards, Plus, Check, X, Clock, CheckCircle, XCircle, Banknote, ChevronDown } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import type { AdvanceStatus } from "@/types";
import { useAuth } from "@/lib/auth/context";
import { formatPrice, toJalali } from "@/lib/utils";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SalaryAdvance {
  id: string;
  userId: string;
  amount: number;
  reason: string;
  description: string | null;
  neededAt: string;
  status: AdvanceStatus;
  reviewNote: string | null;
  reviewedAt: string | null;
  paidAt: string | null;
  createdAt: string;
  user?: { id: string; name: string; role: string };
}

const STATUS_CFG: Record<AdvanceStatus, { label: string; color: string; icon: React.ElementType }> = {
  pending:  { label: "در انتظار", color: "text-yellow-600 bg-yellow-500/10 border-yellow-500/20", icon: Clock },
  approved: { label: "تایید شد",  color: "text-green-600 bg-green-500/10 border-green-500/20",   icon: CheckCircle },
  rejected: { label: "رد شد",     color: "text-red-600 bg-red-500/10 border-red-500/20",           icon: XCircle },
  paid:     { label: "پرداخت شد", color: "text-blue-600 bg-blue-500/10 border-blue-500/20",        icon: Banknote },
};

const EMPTY_FORM = { amount: "", reason: "", description: "", neededAt: "" };

export default function AdvancePage() {
  const { user } = useAuth();
  const [advances, setAdvances] = useState<SalaryAdvance[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<AdvanceStatus | "all">("all");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [reviewId, setReviewId] = useState<string | null>(null);
  const [reviewNote, setReviewNote] = useState("");

  const canReview = ["admin", "accountant", "hr"].includes(user?.role ?? "");

  const fetchData = () => {
    setLoading(true);
    apiClient.get("/advance")
      .then((r) => setAdvances(r.data.data ?? []))
      .catch(() => toast.error("خطا در دریافت مساعده‌ها"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = useMemo(() =>
    advances.filter((a) => statusFilter === "all" || a.status === statusFilter),
    [advances, statusFilter]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.post("/advance", { ...form, amount: Number(form.amount) });
      toast.success("درخواست مساعده ثبت شد");
      setShowForm(false);
      setForm(EMPTY_FORM);
      fetchData();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg ?? "خطا در ثبت درخواست");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReview = async (id: string, status: "approved" | "rejected") => {
    try {
      await apiClient.patch(`/advance/${id}`, { status, reviewNote });
      toast.success(status === "approved" ? "تأیید شد" : "رد شد");
      setReviewId(null);
      setReviewNote("");
      fetchData();
    } catch {
      toast.error("خطا در بررسی درخواست");
    }
  };

  const handleMarkPaid = async (id: string) => {
    try {
      await apiClient.patch(`/advance/${id}`, { status: "paid" });
      toast.success("پرداخت ثبت شد");
      fetchData();
    } catch {
      toast.error("خطا در ثبت پرداخت");
    }
  };

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <WalletCards className="w-6 h-6 text-primary" />مساعده حقوق
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">درخواست و مدیریت پیش‌پرداخت حقوق</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-brand text-black font-semibold text-sm gold-glow">
          <Plus className="w-4 h-4" />درخواست جدید
        </button>
      </motion.div>

      {/* Status filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {(["all", "pending", "approved", "rejected", "paid"] as const).map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={cn("px-3 py-1.5 rounded-xl text-sm border transition-all",
              statusFilter === s
                ? "bg-primary/10 text-primary border-primary/30"
                : "bg-card text-muted-foreground border-border hover:text-foreground"
            )}>
            {s === "all" ? "همه" : STATUS_CFG[s].label}
            <span className="mr-1.5 text-xs opacity-70">
              ({s === "all" ? advances.length : advances.filter((a) => a.status === s).length})
            </span>
          </button>
        ))}
      </div>

      {/* Modal form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowForm(false)}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-6">
              <h3 className="font-bold text-foreground mb-4">درخواست مساعده</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5">مبلغ (تومان) *</label>
                  <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    placeholder="5000000" required
                    className="w-full px-4 py-2.5 rounded-xl bg-muted border border-border text-foreground" />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5">دلیل *</label>
                  <input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })}
                    placeholder="مثال: هزینه درمانی" required
                    className="w-full px-4 py-2.5 rounded-xl bg-muted border border-border text-foreground" />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5">توضیحات</label>
                  <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={2} className="w-full px-4 py-2.5 rounded-xl bg-muted border border-border text-foreground resize-none" />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5">تاریخ مورد نیاز *</label>
                  <input type="date" value={form.neededAt} onChange={(e) => setForm({ ...form, neededAt: e.target.value })}
                    required className="w-full px-4 py-2.5 rounded-xl bg-muted border border-border text-foreground" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowForm(false)}
                    className="flex-1 py-2.5 rounded-xl border border-border bg-muted text-foreground text-sm">انصراف</button>
                  <button type="submit" disabled={submitting}
                    className="flex-1 py-2.5 rounded-xl gradient-brand text-black font-semibold text-sm gold-glow disabled:opacity-60">
                    {submitting ? "در حال ثبت..." : "ثبت درخواست"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-card border border-border animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((adv, i) => {
            const cfg = STATUS_CFG[adv.status];
            return (
              <motion.div key={adv.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="rounded-2xl bg-card border border-border p-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                    <cfg.icon className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      {canReview && adv.user && (
                        <span className="text-xs font-semibold text-foreground">{adv.user.name} ·</span>
                      )}
                      <span className="text-sm font-medium text-foreground">{adv.reason}</span>
                      <span className={cn("px-2 py-0.5 rounded-lg text-xs border", cfg.color)}>{cfg.label}</span>
                    </div>
                    {adv.description && <p className="text-xs text-muted-foreground mb-1">{adv.description}</p>}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                      <span>مبلغ: <span className="font-semibold text-foreground">{formatPrice(adv.amount, true)}</span></span>
                      <span>مورد نیاز: {toJalali(adv.neededAt)}</span>
                    </div>
                    {adv.reviewNote && <p className="text-xs text-amber-400 mt-1">یادداشت: {adv.reviewNote}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {canReview && adv.status === "pending" && (
                      reviewId === adv.id ? (
                        <div className="flex flex-col gap-2">
                          <input value={reviewNote} onChange={(e) => setReviewNote(e.target.value)}
                            placeholder="یادداشت (اختیاری)"
                            className="px-2 py-1 text-xs rounded-lg bg-muted border border-border text-foreground" />
                          <div className="flex gap-1">
                            <button onClick={() => handleReview(adv.id, "approved")}
                              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500 text-white text-xs">
                              <Check className="w-3 h-3" />تأیید
                            </button>
                            <button onClick={() => handleReview(adv.id, "rejected")}
                              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-500 text-white text-xs">
                              <X className="w-3 h-3" />رد
                            </button>
                            <button onClick={() => setReviewId(null)} className="px-2 py-1 rounded-lg bg-muted text-xs">لغو</button>
                          </div>
                        </div>
                      ) : (
                        <button onClick={() => setReviewId(adv.id)}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-muted border border-border text-xs text-muted-foreground hover:text-foreground">
                          <ChevronDown className="w-3 h-3" />بررسی
                        </button>
                      )
                    )}
                    {canReview && adv.status === "approved" && (
                      <button onClick={() => handleMarkPaid(adv.id)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs hover:bg-blue-500/20">
                        <Banknote className="w-3 h-3" />ثبت پرداخت
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
          {filtered.length === 0 && (
            <div className="py-20 text-center text-muted-foreground">
              <WalletCards className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>درخواستی وجود ندارد</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
