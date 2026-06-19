"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Star, Plus, X, CheckCircle2, Clock, Award, Search } from "lucide-react";
import { useAuth } from "@/lib/auth/context";
import { apiClient } from "@/lib/api/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface KPI {
  id: string;
  userId: string;
  user: { id: string; name: string };
  period: string;
  goals: string[];
  score: number | null;
  grade: string | null;
  status: string;
  reviewNotes: string | null;
  reviewedBy: { id: string; name: string } | null;
}

interface TeamUser { id: string; name: string; role: string; }

const GRADE_CONFIG: Record<string, { color: string; label: string }> = {
  A: { color: "text-emerald-400 bg-emerald-500/10", label: "عالی" },
  B: { color: "text-blue-400 bg-blue-500/10", label: "خوب" },
  C: { color: "text-yellow-400 bg-yellow-500/10", label: "متوسط" },
  D: { color: "text-orange-400 bg-orange-500/10", label: "ضعیف" },
  F: { color: "text-red-400 bg-red-500/10", label: "نیاز به بهبود" },
};

const ADMIN_ROLES = ["admin", "hr_manager", "sales_manager"];

export default function KPIPage() {
  const { user } = useAuth();
  const isAdmin = ADMIN_ROLES.includes(user?.role ?? "");

  const [kpis, setKpis] = useState<KPI[]>([]);
  const [users, setUsers] = useState<TeamUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [form, setForm] = useState({ userId: "", period: "", goals: "" });
  const [reviewForm, setReviewForm] = useState({ score: "", grade: "B", reviewNotes: "" });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/hr/kpi");
      const d = await r.json();
      setKpis(d.data ?? []);
    } finally { setLoading(false); }
  };

  useEffect(() => {
    load();
    if (isAdmin) {
      apiClient.get("/users").then(r => setUsers(r.data?.data ?? [])).catch((err) => console.error(err));
    }
  }, [isAdmin]);

  const handleCreate = async () => {
    if (!form.userId || !form.period) { toast.error("کارمند و دوره را مشخص کنید"); return; }
    setSaving(true);
    try {
      const goals = form.goals ? form.goals.split("\n").filter(Boolean) : [];
      const res = await fetch("/api/hr/kpi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, goals }),
      });
      if (!res.ok) throw new Error();
      toast.success("ارزیابی ثبت شد");
      setShowCreate(false);
      setForm({ userId: "", period: "", goals: "" });
      load();
    } catch { toast.error("خطا در ثبت"); }
    finally { setSaving(false); }
  };

  const handleReview = async (id: string) => {
    if (!reviewForm.score) { toast.error("امتیاز الزامی است"); return; }
    setSaving(true);
    try {
      const res = await fetch(`/api/hr/kpi/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _action: "review", ...reviewForm, score: parseFloat(reviewForm.score) }),
      });
      if (!res.ok) throw new Error();
      toast.success("نتیجه ارزیابی ثبت شد");
      setReviewingId(null);
      setReviewForm({ score: "", grade: "B", reviewNotes: "" });
      load();
    } catch { toast.error("خطا در ثبت نتیجه"); }
    finally { setSaving(false); }
  };

  const myKpis = isAdmin ? kpis : kpis.filter(k => k.userId === user?.id);
  const filtered = myKpis.filter(k => {
    if (statusFilter !== "all" && k.status !== statusFilter) return false;
    if (search) return k.user?.name?.toLowerCase().includes(search.toLowerCase()) || k.period.includes(search);
    return true;
  });

  const inputCls = "w-full bg-background/50 border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30";

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Star className="w-6 h-6 text-primary" />
            ارزیابی عملکرد
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {isAdmin
              ? `${kpis.filter(k => k.status === "pending").length} ارزیابی در انتظار بررسی`
              : `${myKpis.length} ارزیابی شما`}
          </p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-brand text-black font-semibold text-sm">
            <Plus className="w-4 h-4" /> ارزیابی جدید
          </button>
        )}
      </motion.div>

      {/* Stats (admin) */}
      {isAdmin && (
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "کل ارزیابی‌ها", value: kpis.length, icon: Star, color: "text-primary bg-primary/10" },
            { label: "در انتظار", value: kpis.filter(k => k.status === "pending").length, icon: Clock, color: "text-yellow-400 bg-yellow-500/10" },
            { label: "تکمیل‌شده", value: kpis.filter(k => k.status === "reviewed").length, icon: CheckCircle2, color: "text-emerald-400 bg-emerald-500/10" },
            { label: "میانگین امتیاز", value: kpis.filter(k => k.score != null).length > 0 ? Math.round(kpis.filter(k => k.score != null).reduce((s, k) => s + (k.score ?? 0), 0) / kpis.filter(k => k.score != null).length) : "—", icon: Award, color: "text-blue-400 bg-blue-500/10" },
          ].map(s => (
            <div key={s.label} className="p-4 rounded-xl bg-card border border-border flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${s.color}`}>
                <s.icon className="w-4 h-4" />
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
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="جستجو..."
              className="w-full pe-10 ps-4 py-2.5 rounded-xl bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
        )}
        <div className="flex gap-1 p-1 bg-muted rounded-xl">
          {[["all", "همه"], ["pending", "در انتظار"], ["reviewed", "بررسی شده"]].map(([v, l]) => (
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
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-24 rounded-2xl bg-card border border-border animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          <Star className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>ارزیابی‌ای وجود ندارد</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(kpi => {
            const gradeCfg = kpi.grade ? GRADE_CONFIG[kpi.grade] : null;
            const reviewing = reviewingId === kpi.id;
            return (
              <motion.div key={kpi.id} layout
                className="p-4 rounded-2xl bg-card border border-border hover:border-border-strong transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      {isAdmin && <span className="font-semibold text-foreground">{kpi.user?.name}</span>}
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">{kpi.period}</span>
                      {gradeCfg && (
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${gradeCfg.color}`}>
                          {kpi.grade} — {gradeCfg.label}
                        </span>
                      )}
                    </div>
                    {kpi.goals?.length > 0 && (
                      <ul className="text-xs text-muted-foreground space-y-0.5 mt-1">
                        {kpi.goals.slice(0, 3).map((g, i) => <li key={i} className="flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-primary/40 shrink-0" />{g}</li>)}
                        {kpi.goals.length > 3 && <li className="text-muted-foreground/60">+{kpi.goals.length - 3} هدف دیگر...</li>}
                      </ul>
                    )}
                    {kpi.score != null && (
                      <div className="mt-2 flex items-center gap-3">
                        <div className="flex-1 max-w-32 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${kpi.score}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground">{kpi.score}/100</span>
                      </div>
                    )}
                    {kpi.reviewNotes && <p className="text-xs text-muted-foreground mt-1">{kpi.reviewNotes}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${kpi.status === "reviewed" ? "text-emerald-400 bg-emerald-500/10" : "text-yellow-400 bg-yellow-500/10"}`}>
                      {kpi.status === "reviewed" ? "بررسی شده" : "در انتظار"}
                    </span>
                    {isAdmin && kpi.status === "pending" && !reviewing && (
                      <button onClick={() => { setReviewingId(kpi.id); setReviewForm({ score: "", grade: "B", reviewNotes: "" }); }}
                        className="text-xs px-3 py-1.5 rounded-xl border border-border hover:border-primary/40 text-muted-foreground hover:text-foreground transition-colors">
                        ثبت نتیجه
                      </button>
                    )}
                  </div>
                </div>

                {isAdmin && reviewing && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-3 border-t border-border pt-3 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-muted-foreground mb-1.5">امتیاز (0-100) *</label>
                        <input type="number" min="0" max="100" value={reviewForm.score}
                          onChange={e => setReviewForm(p => ({ ...p, score: e.target.value }))} className={inputCls} />
                      </div>
                      <div>
                        <label className="block text-xs text-muted-foreground mb-1.5">رتبه</label>
                        <select value={reviewForm.grade} onChange={e => setReviewForm(p => ({ ...p, grade: e.target.value }))} className={inputCls}>
                          {["A", "B", "C", "D", "F"].map(g => <option key={g} value={g}>{g} — {GRADE_CONFIG[g]?.label}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1.5">یادداشت ارزیابی</label>
                      <textarea value={reviewForm.reviewNotes} onChange={e => setReviewForm(p => ({ ...p, reviewNotes: e.target.value }))} rows={2}
                        className={inputCls + " resize-none"} placeholder="بازخورد مدیر..." />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleReview(kpi.id)} disabled={saving}
                        className="flex-1 py-2 rounded-xl gradient-brand text-black text-xs font-semibold disabled:opacity-50">
                        {saving ? "..." : "ثبت نتیجه"}
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

      {/* Create Modal (admin) */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={e => e.target === e.currentTarget && setShowCreate(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl">
              <div className="p-5 border-b border-border flex items-center justify-between">
                <h3 className="font-bold text-foreground">ارزیابی عملکرد جدید</h3>
                <button onClick={() => setShowCreate(false)} className="p-2 rounded-xl hover:bg-muted text-muted-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-5 space-y-3">
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5">کارمند *</label>
                  <select value={form.userId} onChange={e => setForm(p => ({ ...p, userId: e.target.value }))} className={inputCls}>
                    <option value="">انتخاب کارمند...</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5">دوره ارزیابی *</label>
                  <input value={form.period} onChange={e => setForm(p => ({ ...p, period: e.target.value }))} className={inputCls} placeholder="مثلاً: 1403-Q1 یا فروردین 1403" />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5">اهداف (هر هدف یک خط)</label>
                  <textarea value={form.goals} onChange={e => setForm(p => ({ ...p, goals: e.target.value }))} rows={4}
                    className={inputCls + " resize-none"} placeholder="هدف اول&#10;هدف دوم&#10;هدف سوم" />
                </div>
              </div>
              <div className="p-5 border-t border-border flex gap-3">
                <button onClick={handleCreate} disabled={saving}
                  className="flex-1 py-2.5 rounded-xl gradient-brand text-black font-semibold text-sm disabled:opacity-50">
                  {saving ? "در حال ذخیره..." : "ثبت ارزیابی"}
                </button>
                <button onClick={() => setShowCreate(false)}
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
