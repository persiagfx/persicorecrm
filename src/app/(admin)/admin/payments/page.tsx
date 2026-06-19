"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  CreditCard, CheckCircle2, XCircle, Clock, TrendingUp,
  Plus, X, Search, Filter, ExternalLink, RefreshCw, Ban
} from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { toast } from "sonner";

interface Payment {
  id: string;
  tenantId: string;
  amount: number;
  plan: string;
  months: number;
  status: string;
  ref: string | null;
  note: string | null;
  paidAt: string | null;
  createdAt: string;
  tenant?: { id: string; name: string; slug: string; plan: string };
}

const STATUS_COLORS: Record<string, string> = {
  pending: "text-amber-400 bg-amber-400/10",
  paid: "text-green-400 bg-green-400/10",
  failed: "text-red-400 bg-red-400/10",
  refunded: "text-blue-400 bg-blue-400/10",
};
const STATUS_LABELS: Record<string, string> = {
  pending: "در انتظار", paid: "پرداخت شده", failed: "ناموفق", refunded: "برگشتی"
};
const PLAN_LABELS: Record<string, string> = {
  trial: "آزمایشی", starter: "استارتر", pro: "حرفه‌ای", enterprise: "سازمانی"
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [meta, setMeta] = useState({ total: 0, totalRevenue: 0, pendingCount: 0, monthRevenue: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [actionId, setActionId] = useState<string | null>(null);
  const [actionNote, setActionNote] = useState("");
  const [actionType, setActionType] = useState<"confirm" | "reject" | "refund">("confirm");
  const [showAddModal, setShowAddModal] = useState(false);
  const [processing, setProcessing] = useState(false);

  const [addForm, setAddForm] = useState({ tenantId: "", amount: "", plan: "starter", months: 1, status: "paid", ref: "", note: "" });
  const [tenants, setTenants] = useState<{ id: string; name: string }[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      const r = await apiClient.get(`/admin/payments?${params}`);
      setPayments(r.data.data ?? []);
      setMeta(r.data.meta ?? {});
    } finally { setLoading(false); }
  };

  const loadTenants = async () => {
    const r = await apiClient.get("/admin/tenants?perPage=200");
    setTenants(r.data.data ?? []);
  };

  useEffect(() => { load(); }, [statusFilter]);
  useEffect(() => { loadTenants(); }, []);

  const doAction = async () => {
    if (!actionId) return;
    setProcessing(true);
    try {
      await apiClient.patch(`/admin/payments/${actionId}`, { action: actionType, note: actionNote });
      toast.success(actionType === "confirm" ? "پرداخت تأیید شد ✓" : actionType === "reject" ? "پرداخت رد شد" : "بازگشت وجه ثبت شد");
      setActionId(null);
      setActionNote("");
      load();
    } catch { toast.error("خطا در انجام عملیات"); }
    finally { setProcessing(false); }
  };

  const addPayment = async () => {
    setProcessing(true);
    try {
      await apiClient.post("/admin/payments", { ...addForm, amount: Number(addForm.amount) });
      toast.success("پرداخت ثبت شد ✓");
      setShowAddModal(false);
      setAddForm({ tenantId: "", amount: "", plan: "starter", months: 1, status: "paid", ref: "", note: "" });
      load();
    } catch { toast.error("خطا در ثبت پرداخت"); }
    finally { setProcessing(false); }
  };

  const fmt = (n: number) => n.toLocaleString("fa-IR");
  const fmtDate = (d: string) => new Date(d).toLocaleDateString("fa-IR");

  const filtered = search
    ? payments.filter(p => p.tenant?.name.toLowerCase().includes(search.toLowerCase()) || p.ref?.includes(search))
    : payments;

  const kpis = [
    { label: "کل درآمد", value: fmt(meta.totalRevenue ?? 0) + " ت", icon: TrendingUp, color: "text-green-400", bg: "bg-green-400/10" },
    { label: "این ماه", value: fmt(meta.monthRevenue ?? 0) + " ت", icon: CreditCard, color: "text-violet-400", bg: "bg-violet-400/10" },
    { label: "در انتظار", value: String(meta.pendingCount ?? 0), icon: Clock, color: "text-amber-400", bg: "bg-amber-400/10" },
    { label: "کل تراکنش‌ها", value: String(meta.total ?? 0), icon: RefreshCw, color: "text-blue-400", bg: "bg-blue-400/10" },
  ];

  return (
    <div className="p-8 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">مدیریت پرداخت‌ها</h1>
          <p className="text-sm text-white/40 mt-1">تأیید و مدیریت اشتراک کسب‌وکارها</p>
        </div>
        <button onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-sm font-semibold hover:opacity-90">
          <Plus className="w-4 h-4" />ثبت پرداخت دستی
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        {kpis.map((k, i) => (
          <motion.div key={k.label} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            className="rounded-2xl border border-white/10 bg-white/5 p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${k.bg}`}>
              <k.icon className={`w-5 h-5 ${k.color}`} />
            </div>
            <div>
              <p className="text-lg font-bold text-white" dir="ltr">{k.value}</p>
              <p className="text-xs text-white/40">{k.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="جستجو..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pr-9 pl-3 py-2 text-sm text-white/70 focus:outline-none focus:border-violet-500/50" />
        </div>
        <div className="flex gap-1 bg-white/5 p-1 rounded-xl">
          {["", "pending", "paid", "failed", "refunded"].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${statusFilter === s ? "bg-violet-600/30 text-violet-200" : "text-white/40 hover:text-white"}`}>
              {s === "" ? "همه" : STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-white/10 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10 bg-white/5">
              {["کسب‌وکار", "مبلغ", "پلن", "مدت", "وضعیت", "تاریخ", "مرجع", "عملیات"].map(h => (
                <th key={h} className="text-right px-4 py-3 text-xs text-white/40 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="border-b border-white/5">
                  {[...Array(8)].map((_, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-4 bg-white/5 rounded animate-pulse" /></td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-12 text-center text-white/30 text-sm">موردی یافت نشد</td></tr>
            ) : filtered.map(p => (
              <tr key={p.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="px-4 py-3">
                  <p className="text-sm text-white font-medium">{p.tenant?.name ?? "—"}</p>
                  <p className="text-xs text-white/30">{p.tenant?.plan ? PLAN_LABELS[p.tenant.plan] : ""}</p>
                </td>
                <td className="px-4 py-3 text-sm text-white font-mono">{fmt(p.amount)} ت</td>
                <td className="px-4 py-3">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300">
                    {PLAN_LABELS[p.plan] ?? p.plan}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-white/60">{p.months} ماه</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[p.status] ?? "text-white/40 bg-white/10"}`}>
                    {STATUS_LABELS[p.status] ?? p.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-white/40">{fmtDate(p.createdAt)}</td>
                <td className="px-4 py-3 text-xs text-white/40 font-mono">{p.ref ?? "—"}</td>
                <td className="px-4 py-3">
                  {p.status === "pending" && (
                    <div className="flex gap-1">
                      <button onClick={() => { setActionId(p.id); setActionType("confirm"); }}
                        className="p-1.5 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors" title="تأیید">
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => { setActionId(p.id); setActionType("reject"); }}
                        className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors" title="رد">
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  {p.status === "paid" && (
                    <button onClick={() => { setActionId(p.id); setActionType("refund"); }}
                      className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors" title="بازگشت وجه">
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Action Confirm Modal */}
      <AnimatePresence>
        {actionId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-[#0f0f1a] border border-white/10 rounded-2xl w-full max-w-md p-6 space-y-4">
              <h3 className="text-lg font-bold text-white">
                {actionType === "confirm" ? "تأیید پرداخت" : actionType === "reject" ? "رد پرداخت" : "بازگشت وجه"}
              </h3>
              <div>
                <label className="block text-xs text-white/40 mb-1.5">یادداشت (اختیاری)</label>
                <textarea value={actionNote} onChange={e => setActionNote(e.target.value)} rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white/70 text-sm focus:outline-none resize-none" />
              </div>
              <div className="flex gap-3">
                <button onClick={doAction} disabled={processing}
                  className={`flex-1 py-2.5 rounded-xl font-semibold text-sm disabled:opacity-50 ${
                    actionType === "confirm" ? "bg-green-600 hover:bg-green-500 text-white" :
                    actionType === "reject" ? "bg-red-600 hover:bg-red-500 text-white" :
                    "bg-blue-600 hover:bg-blue-500 text-white"
                  }`}>
                  {processing ? "در حال انجام..." : "تأیید"}
                </button>
                <button onClick={() => { setActionId(null); setActionNote(""); }}
                  className="px-4 py-2.5 rounded-xl border border-white/10 text-white/50 hover:text-white text-sm">
                  انصراف
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Payment Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-[#0f0f1a] border border-white/10 rounded-2xl w-full max-w-md p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">ثبت پرداخت دستی</h3>
                <button onClick={() => setShowAddModal(false)} className="p-2 rounded-xl hover:bg-white/10 text-white/40">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-white/40 mb-1.5">کسب‌وکار</label>
                  <select value={addForm.tenantId} onChange={e => setAddForm(p => ({ ...p, tenantId: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white/70 text-sm focus:outline-none">
                    <option value="">انتخاب کسب‌وکار...</option>
                    {tenants.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-white/40 mb-1.5">مبلغ (تومان)</label>
                    <input type="number" value={addForm.amount} onChange={e => setAddForm(p => ({ ...p, amount: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white/70 text-sm focus:outline-none" dir="ltr" />
                  </div>
                  <div>
                    <label className="block text-xs text-white/40 mb-1.5">پلن</label>
                    <select value={addForm.plan} onChange={e => setAddForm(p => ({ ...p, plan: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white/70 text-sm focus:outline-none">
                      {["starter", "pro", "enterprise"].map(pl => (
                        <option key={pl} value={pl}>{PLAN_LABELS[pl]}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-white/40 mb-1.5">مدت (ماه)</label>
                    <input type="number" min={1} value={addForm.months} onChange={e => setAddForm(p => ({ ...p, months: Number(e.target.value) }))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white/70 text-sm focus:outline-none" dir="ltr" />
                  </div>
                  <div>
                    <label className="block text-xs text-white/40 mb-1.5">وضعیت</label>
                    <select value={addForm.status} onChange={e => setAddForm(p => ({ ...p, status: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white/70 text-sm focus:outline-none">
                      <option value="paid">پرداخت شده</option>
                      <option value="pending">در انتظار</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-white/40 mb-1.5">کد مرجع (اختیاری)</label>
                  <input value={addForm.ref} onChange={e => setAddForm(p => ({ ...p, ref: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white/70 text-sm focus:outline-none" dir="ltr" />
                </div>
                <div>
                  <label className="block text-xs text-white/40 mb-1.5">یادداشت</label>
                  <input value={addForm.note} onChange={e => setAddForm(p => ({ ...p, note: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white/70 text-sm focus:outline-none" />
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={addPayment} disabled={processing || !addForm.tenantId || !addForm.amount}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-semibold text-sm hover:opacity-90 disabled:opacity-50">
                  {processing ? "در حال ثبت..." : "ثبت پرداخت"}
                </button>
                <button onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-white/10 text-white/50 hover:text-white text-sm">
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
