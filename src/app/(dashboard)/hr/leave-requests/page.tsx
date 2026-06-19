"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CalendarDays, Plus, Check, X, Clock, Search, Filter, ChevronDown } from "lucide-react";
import { useAuth } from "@/lib/auth/context";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface LeaveRequest {
  id: string;
  userId: string;
  user: { id: string; name: string };
  type: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string | null;
  status: string;
  reviewNote: string | null;
  createdAt: string;
}

const TYPE_LABELS: Record<string, string> = {
  annual: "سالانه", sick: "استعلاجی", emergency: "اضطراری",
  maternity: "زایمان", paternity: "پدری", unpaid: "بدون حقوق",
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: "در انتظار", color: "text-yellow-400 bg-yellow-500/10" },
  approved: { label: "تأیید شده", color: "text-emerald-400 bg-emerald-500/10" },
  rejected: { label: "رد شده", color: "text-red-400 bg-red-500/10" },
};

const ADMIN_ROLES = ["admin", "hr_manager", "sales_manager"];

export default function LeaveRequestsPage() {
  const { user } = useAuth();
  const isAdmin = ADMIN_ROLES.includes(user?.role ?? "");

  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: "annual", startDate: "", endDate: "", reason: "" });
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewNote, setReviewNote] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/hr/leave-requests");
      const d = await r.json();
      setRequests(d.data ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async () => {
    if (!form.startDate || !form.endDate) { toast.error("تاریخ شروع و پایان الزامی است"); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/hr/leave-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      toast.success("درخواست مرخصی ثبت شد");
      setShowForm(false);
      setForm({ type: "annual", startDate: "", endDate: "", reason: "" });
      load();
    } catch { toast.error("خطا در ثبت درخواست"); }
    finally { setSubmitting(false); }
  };

  const handleReview = async (id: string, status: "approved" | "rejected") => {
    try {
      const res = await fetch(`/api/hr/leave-requests/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _action: "review", status, reviewNote }),
      });
      if (!res.ok) throw new Error();
      toast.success(status === "approved" ? "درخواست تأیید شد" : "درخواست رد شد");
      setReviewingId(null);
      setReviewNote("");
      load();
    } catch { toast.error("خطا در بررسی درخواست"); }
  };

  const filtered = requests.filter(r => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (r.user?.name?.toLowerCase().includes(q)) || TYPE_LABELS[r.type]?.includes(q);
    }
    return true;
  });

  const pending = requests.filter(r => r.status === "pending").length;
  const myRequests = requests.filter(r => r.userId === user?.id);
  const inputCls = "w-full bg-background/50 border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30";

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <CalendarDays className="w-6 h-6 text-primary" />
            {isAdmin ? "مدیریت مرخصی‌ها" : "درخواست مرخصی"}
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {isAdmin ? `${pending} درخواست در انتظار بررسی` : `${myRequests.length} درخواست ثبت‌شده من`}
          </p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-brand text-black font-semibold text-sm">
          <Plus className="w-4 h-4" />
          درخواست جدید
        </button>
      </motion.div>

      {/* Stats (admin only) */}
      {isAdmin && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "در انتظار", value: requests.filter(r => r.status === "pending").length, color: "text-yellow-400 bg-yellow-500/10" },
            { label: "تأیید شده", value: requests.filter(r => r.status === "approved").length, color: "text-emerald-400 bg-emerald-500/10" },
            { label: "رد شده", value: requests.filter(r => r.status === "rejected").length, color: "text-red-400 bg-red-500/10" },
          ].map(s => (
            <div key={s.label} className="p-4 rounded-xl bg-card border border-border flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${s.color}`}>
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        {isAdmin && (
          <div className="relative max-w-xs flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="جستجوی کارمند..."
              className="w-full pe-10 ps-4 py-2.5 rounded-xl bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
        )}
        <div className="flex gap-1 p-1 bg-muted rounded-xl">
          {[["all", "همه"], ["pending", "در انتظار"], ["approved", "تأیید"], ["rejected", "رد"]].map(([v, l]) => (
            <button key={v} onClick={() => setStatusFilter(v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${statusFilter === v ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 rounded-2xl bg-card border border-border animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          <CalendarDays className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>درخواستی وجود ندارد</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((req) => {
            const statusCfg = STATUS_CONFIG[req.status] ?? { label: req.status, color: "text-muted-foreground bg-muted" };
            const isReviewing = reviewingId === req.id;
            return (
              <motion.div key={req.id} layout
                className="p-4 rounded-2xl bg-card border border-border hover:border-border-strong transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {isAdmin && (
                        <span className="font-semibold text-foreground">{req.user?.name}</span>
                      )}
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusCfg.color}`}>
                        {statusCfg.label}
                      </span>
                      <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        {TYPE_LABELS[req.type] ?? req.type}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {req.startDate?.slice(0, 10)} تا {req.endDate?.slice(0, 10)} — {req.days} روز
                    </p>
                    {req.reason && <p className="text-xs text-muted-foreground mt-1 truncate">{req.reason}</p>}
                    {req.reviewNote && (
                      <p className="text-xs text-yellow-400 mt-1">یادداشت: {req.reviewNote}</p>
                    )}
                  </div>
                  {isAdmin && req.status === "pending" && !isReviewing && (
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => { setReviewingId(req.id); setReviewNote(""); }}
                        className="px-3 py-1.5 text-xs font-medium rounded-xl border border-border hover:border-primary/40 text-muted-foreground hover:text-foreground transition-colors">
                        بررسی
                      </button>
                    </div>
                  )}
                </div>

                {isAdmin && isReviewing && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-3 space-y-2 border-t border-border pt-3">
                    <input value={reviewNote} onChange={e => setReviewNote(e.target.value)}
                      className={inputCls} placeholder="یادداشت (اختیاری)..." />
                    <div className="flex gap-2">
                      <button onClick={() => handleReview(req.id, "approved")}
                        className="flex-1 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-semibold flex items-center justify-center gap-1">
                        <Check className="w-3.5 h-3.5" />تأیید
                      </button>
                      <button onClick={() => handleReview(req.id, "rejected")}
                        className="flex-1 py-2 rounded-xl bg-red-500 hover:bg-red-400 text-white text-xs font-semibold flex items-center justify-center gap-1">
                        <X className="w-3.5 h-3.5" />رد
                      </button>
                      <button onClick={() => setReviewingId(null)}
                        className="px-3 py-2 rounded-xl border border-border text-xs text-muted-foreground hover:text-foreground">
                        لغو
                      </button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* New Request Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={e => e.target === e.currentTarget && setShowForm(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl">
              <div className="p-5 border-b border-border flex items-center justify-between">
                <h3 className="font-bold text-foreground flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-primary" />
                  درخواست مرخصی جدید
                </h3>
                <button onClick={() => setShowForm(false)} className="p-2 rounded-xl hover:bg-muted text-muted-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-5 space-y-3">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5">نوع مرخصی</label>
                  <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} className={inputCls}>
                    {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1.5">از تاریخ</label>
                    <input type="date" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1.5">تا تاریخ</label>
                    <input type="date" value={form.endDate} onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))} className={inputCls} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5">دلیل مرخصی</label>
                  <textarea value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))} rows={3}
                    className={inputCls + " resize-none"} placeholder="دلیل درخواست مرخصی..." />
                </div>
              </div>
              <div className="p-5 border-t border-border flex gap-3">
                <button onClick={handleSubmit} disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl gradient-brand text-black font-semibold text-sm disabled:opacity-50">
                  {submitting ? "در حال ثبت..." : "ثبت درخواست"}
                </button>
                <button onClick={() => setShowForm(false)}
                  className="px-4 py-2.5 rounded-xl border border-border text-muted-foreground hover:text-foreground text-sm">
                  انصراف
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
