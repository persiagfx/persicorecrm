"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Receipt, Plus, X, Pencil, Trash2, DollarSign, Clock, CheckCircle2 } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { StatCard } from "@/components/common/StatCard";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { toJalali, formatPrice } from "@/lib/utils";

interface LegalFee {
  id: string; caseId?: string; description: string; feeType: string;
  amount: number; billableHours?: number; hourlyRate?: number;
  date: string; status: string; notes?: string;
}
interface LegalCase { id: string; caseNumber: string; title: string; }

const FEE_TYPE_LABELS: Record<string, string> = { fixed: "مبلغ ثابت", hourly: "ساعتی", success: "پیروزی‌محور" };
const STATUS_CFG: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  pending: { label: "در انتظار", color: "text-amber-400 bg-amber-500/10", icon: Clock },
  billed:  { label: "صورتحساب شده", color: "text-blue-400 bg-blue-500/10", icon: Receipt },
  paid:    { label: "پرداخت شده", color: "text-emerald-400 bg-emerald-500/10", icon: CheckCircle2 },
};

const EMPTY_FORM = { caseId: "", description: "", feeType: "fixed", amount: "", billableHours: "", hourlyRate: "", date: new Date().toISOString().slice(0, 10), status: "pending", notes: "" };

export default function LegalBillingPage() {
  const [fees, setFees] = useState<LegalFee[]>([]);
  const [cases, setCases] = useState<LegalCase[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, billed: 0, paid: 0, totalHours: 0 });
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterCase, setFilterCase] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<LegalFee | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });

  const load = useCallback(async () => {
    try {
      const res = await apiClient.get("/legal/billing");
      setFees(res.data.data.fees ?? []);
      setCases(res.data.data.cases ?? []);
      setStats(res.data.data.stats ?? {});
    } catch { toast.error("خطا در بارگذاری"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const open = (f?: LegalFee) => {
    setEditing(f ?? null);
    setForm(f ? {
      caseId: f.caseId ?? "", description: f.description, feeType: f.feeType,
      amount: String(f.amount), billableHours: String(f.billableHours ?? ""),
      hourlyRate: String(f.hourlyRate ?? ""), date: f.date.slice(0, 10), status: f.status, notes: f.notes ?? "",
    } : { ...EMPTY_FORM });
    setShowModal(true);
  };

  const save = async () => {
    if (!form.description.trim()) { toast.error("توضیحات الزامی است"); return; }
    try {
      const payload = { ...form, amount: Number(form.amount || 0), billableHours: form.billableHours ? Number(form.billableHours) : null, hourlyRate: form.hourlyRate ? Number(form.hourlyRate) : null };
      if (editing) await apiClient.put(`/legal/billing/${editing.id}`, payload);
      else await apiClient.post("/legal/billing", payload);
      toast.success("ذخیره شد");
      setShowModal(false);
      load();
    } catch { toast.error("خطا"); }
  };

  const del = async (id: string) => {
    if (!confirm("حذف این هزینه؟")) return;
    try { await apiClient.delete(`/legal/billing/${id}`); toast.success("حذف شد"); load(); }
    catch { toast.error("خطا"); }
  };

  const updateStatus = async (id: string, status: string) => {
    try { await apiClient.put(`/legal/billing/${id}`, { ...fees.find(f => f.id === id), status }); load(); toast.success("وضعیت بروز شد"); }
    catch { toast.error("خطا"); }
  };

  const filtered = fees.filter(f =>
    (!filterStatus || f.status === filterStatus) &&
    (!filterCase || f.caseId === filterCase)
  );

  return (
    <div className="space-y-6 max-w-5xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Receipt className="w-6 h-6 text-primary" />صورتحساب حقوقی
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">پیگیری حق‌الوکاله، هزینه‌های پرونده و صورت‌حساب‌ها</p>
        </div>
        <button onClick={() => open()} className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-brand text-black text-sm font-semibold">
          <Plus className="w-4 h-4" />ثبت هزینه
        </button>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="کل مطالبات" value={formatPrice(stats.total)} icon={DollarSign} color="blue" />
        <StatCard title="در انتظار" value={formatPrice(stats.pending)} icon={Clock} color="amber" />
        <StatCard title="صورتحساب شده" value={formatPrice(stats.billed)} icon={Receipt} color="violet" />
        <StatCard title="پرداخت شده" value={formatPrice(stats.paid)} icon={CheckCircle2} color="green" />
      </div>

      <div className="flex items-center gap-3">
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm text-foreground">
          <option value="">همه وضعیت‌ها</option>
          {Object.entries(STATUS_CFG).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
        </select>
        <select value={filterCase} onChange={e => setFilterCase(e.target.value)} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm text-foreground">
          <option value="">همه پرونده‌ها</option>
          {cases.map(c => <option key={c.id} value={c.id}>{c.caseNumber} — {c.title}</option>)}
        </select>
        {stats.totalHours > 0 && (
          <span className="mr-auto text-sm text-muted-foreground flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />کل ساعت: {stats.totalHours.toFixed(1)}
          </span>
        )}
      </div>

      <div className="rounded-2xl bg-card border border-border overflow-hidden">
        <div className="p-4 border-b border-border text-sm text-muted-foreground">{filtered.length} رکورد</div>
        {loading ? (
          <div className="p-6 space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground"><Receipt className="w-10 h-10 mx-auto mb-3 opacity-30" />هزینه‌ای ثبت نشده</div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map(fee => {
              const sCfg = STATUS_CFG[fee.status] ?? STATUS_CFG.pending;
              const fCase = cases.find(c => c.id === fee.caseId);
              const StatusIcon = sCfg.icon;
              return (
                <div key={fee.id} className="flex items-center gap-4 px-5 py-4 hover:bg-muted/20 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm truncate">{fee.description}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      {fCase && <span className="font-mono">{fCase.caseNumber}</span>}
                      <span>{toJalali(fee.date)}</span>
                      <span>{FEE_TYPE_LABELS[fee.feeType] ?? fee.feeType}</span>
                      {fee.billableHours && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{fee.billableHours} ساعت</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-foreground text-sm">{formatPrice(fee.amount)}</span>
                    <select value={fee.status} onChange={e => updateStatus(fee.id, e.target.value)}
                      className={cn("px-2 py-1 rounded-lg text-xs border-0 font-medium cursor-pointer", sCfg.color)}>
                      {Object.entries(STATUS_CFG).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
                    </select>
                    <button onClick={() => open(fee)} className="p-1.5 rounded-lg hover:bg-muted"><Pencil className="w-3.5 h-3.5 text-muted-foreground" /></button>
                    <button onClick={() => del(fee.id)} className="p-1.5 rounded-lg hover:bg-destructive/10"><Trash2 className="w-3.5 h-3.5 text-destructive" /></button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
            onClick={e => e.target === e.currentTarget && setShowModal(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="glass rounded-2xl p-6 w-full max-w-lg border border-border max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold">{editing ? "ویرایش هزینه" : "ثبت هزینه جدید"}</h2>
                <button onClick={() => setShowModal(false)}><X className="w-4 h-4" /></button>
              </div>
              <div className="space-y-3">
                <select value={form.caseId} onChange={e => setForm(f => ({ ...f, caseId: e.target.value }))} className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm text-foreground">
                  <option value="">بدون پرونده</option>
                  {cases.map(c => <option key={c.id} value={c.id}>{c.caseNumber} — {c.title}</option>)}
                </select>
                <input placeholder="توضیحات *" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                <div className="grid grid-cols-2 gap-3">
                  <select value={form.feeType} onChange={e => setForm(f => ({ ...f, feeType: e.target.value }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm text-foreground">
                    {Object.entries(FEE_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm text-foreground">
                    {Object.entries(STATUS_CFG).map(([v, c]) => <option key={v} value={v}>{c.label}</option>)}
                  </select>
                </div>
                <input type="number" placeholder="مبلغ (ریال)" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                {form.feeType === "hourly" && (
                  <div className="grid grid-cols-2 gap-3">
                    <input type="number" placeholder="ساعت کاری" value={form.billableHours} onChange={e => setForm(f => ({ ...f, billableHours: e.target.value }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                    <input type="number" placeholder="نرخ ساعتی (ریال)" value={form.hourlyRate} onChange={e => setForm(f => ({ ...f, hourlyRate: e.target.value }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                  </div>
                )}
                <div><label className="block text-xs text-muted-foreground mb-1">تاریخ</label>
                  <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" /></div>
                <textarea placeholder="یادداشت" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary resize-none" />
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl border border-border text-sm text-muted-foreground">انصراف</button>
                <button onClick={save} className="flex-[2] py-2.5 rounded-xl gradient-brand text-black text-sm font-semibold">ذخیره</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
