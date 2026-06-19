"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Percent, Plus, Search, Tag, Copy, CheckCircle2, X, Pencil, Trash2 } from "lucide-react";
import { formatPrice, toJalali } from "@/lib/utils";
import { StatCard } from "@/components/common/StatCard";
import { apiClient } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface DiscountCode { id: string; code: string; discountType: "percent"|"fixed"; discountValue: number; minOrderAmount?: number; maxUsage?: number; usedCount: number; validFrom?: string; validUntil?: string; isActive: boolean; description?: string; }

const TYPE_LABEL = { percent: "درصدی", fixed: "مبلغ ثابت" };

export default function DiscountsPage() {
  const [codes, setCodes] = useState<DiscountCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<DiscountCode | undefined>();
  const [form, setForm] = useState({ code: "", discountType: "percent" as DiscountCode["discountType"], discountValue: 10, minOrderAmount: 0, maxUsage: 0, validFrom: "", validUntil: "", isActive: true, description: "" });

  const load = useCallback(async () => { try { const r = await apiClient.get("/ecommerce/discount-codes"); setCodes(r.data.data ?? []); } catch { toast.error("خطا"); } finally { setLoading(false); } }, []);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    try {
      if (editing) await apiClient.put(`/ecommerce/discount-codes/${editing.id}`, form); else await apiClient.post("/ecommerce/discount-codes", form);
      toast.success("ذخیره شد"); setShowModal(false); setEditing(undefined); load();
    } catch { toast.error("خطا"); }
  };
  const del = async (id: string) => { if (!confirm("حذف؟")) return; try { await apiClient.delete(`/ecommerce/discount-codes/${id}`); toast.success("حذف شد"); load(); } catch { /**/ } };
  const open = (c?: DiscountCode) => { setEditing(c); setForm(c ? { code: c.code, discountType: c.discountType, discountValue: c.discountValue, minOrderAmount: c.minOrderAmount ?? 0, maxUsage: c.maxUsage ?? 0, validFrom: c.validFrom ?? "", validUntil: c.validUntil ?? "", isActive: c.isActive, description: c.description ?? "" } : { code: `DISC${Math.random().toString(36).substring(2, 8).toUpperCase()}`, discountType: "percent", discountValue: 10, minOrderAmount: 0, maxUsage: 100, validFrom: "", validUntil: "", isActive: true, description: "" }); setShowModal(true); };
  const copyCode = (code: string) => { navigator.clipboard.writeText(code); toast.success("کپی شد"); };

  const filtered = codes.filter(c => !search || c.code.includes(search.toUpperCase()) || (c.description ?? "").includes(search));
  const activeCodes = codes.filter(c => c.isActive).length;
  const totalUsed = codes.reduce((a, c) => a + c.usedCount, 0);

  const isExpired = (c: DiscountCode) => c.validUntil && new Date(c.validUntil) < new Date();
  const isExhausted = (c: DiscountCode) => c.maxUsage && c.usedCount >= c.maxUsage;

  return (
    <div className="p-6 space-y-5 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold flex items-center gap-2"><Percent className="w-6 h-6 text-primary" />کدهای تخفیف</h1></div>
        <button onClick={() => open()} className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-brand text-black text-sm font-semibold"><Plus className="w-4 h-4" /> کد جدید</button>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <StatCard title="کل کدها" value={codes.length} icon={Tag} color="blue" />
        <StatCard title="فعال" value={activeCodes} icon={CheckCircle2} color="green" />
        <StatCard title="کل استفاده" value={totalUsed} icon={Percent} color="amber" />
      </div>
      <div className="relative"><Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="جستجو..." className="w-full pe-10 ps-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" /></div>
      <div className="grid grid-cols-2 gap-4">
        {loading ? <div className="col-span-2 p-12 text-center text-muted-foreground">در حال بارگذاری...</div> : filtered.length === 0 ? (
          <div className="col-span-2 p-12 text-center text-muted-foreground glass rounded-2xl border border-border"><Percent className="w-10 h-10 mx-auto mb-3 opacity-30" /><p>کد تخفیفی یافت نشد</p></div>
        ) : filtered.map(c => {
          const expired = isExpired(c);
          const exhausted = isExhausted(c);
          const alive = c.isActive && !expired && !exhausted;
          return (
            <div key={c.id} className={cn("glass rounded-2xl border p-5", alive ? "border-primary/20" : "border-border opacity-70")}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={cn("px-3 py-2 rounded-xl font-mono text-base font-bold tracking-widest", alive ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>{c.code}</div>
                  <button onClick={() => copyCode(c.code)} className="p-1.5 rounded-lg hover:bg-muted" title="کپی"><Copy className="w-3.5 h-3.5 text-muted-foreground" /></button>
                </div>
                <div className="flex gap-1"><button onClick={() => open(c)} className="p-1.5 rounded-lg hover:bg-muted"><Pencil className="w-3.5 h-3.5 text-muted-foreground" /></button><button onClick={() => del(c.id)} className="p-1.5 rounded-lg hover:bg-destructive/10"><Trash2 className="w-3.5 h-3.5 text-destructive" /></button></div>
              </div>
              <div className="flex items-center gap-2 flex-wrap mb-3">
                <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", alive ? "text-emerald-400 bg-emerald-500/10" : expired ? "text-gray-400 bg-gray-500/10" : exhausted ? "text-red-400 bg-red-500/10" : "text-gray-400 bg-gray-500/10")}>{alive ? "فعال" : expired ? "منقضی" : exhausted ? "تمام شد" : "غیرفعال"}</span>
                <span className="px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground">{c.discountType === "percent" ? `${c.discountValue}%` : formatPrice(c.discountValue)}</span>
                <span className="px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground">{TYPE_LABEL[c.discountType]}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
                {c.minOrderAmount ? <div>حداقل: {formatPrice(c.minOrderAmount)}</div> : null}
                <div>استفاده: {c.usedCount}{c.maxUsage ? `/${c.maxUsage}` : ""}</div>
                {c.validFrom && <div>از: {toJalali(c.validFrom)}</div>}
                {c.validUntil && <div>تا: {toJalali(c.validUntil)}</div>}
              </div>
              {c.description && <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border">{c.description}</p>}
              {c.maxUsage && (
                <div className="mt-3">
                  <div className="w-full bg-muted rounded-full h-1.5"><div className={cn("h-1.5 rounded-full transition-all", exhausted ? "bg-red-500" : "gradient-brand")} style={{ width: `${Math.min(100, c.usedCount / c.maxUsage * 100)}%` }} /></div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="glass rounded-2xl p-6 w-full max-w-md border border-border max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5"><h2 className="text-lg font-bold">{editing ? "ویرایش کد" : "کد تخفیف جدید"}</h2><button onClick={() => setShowModal(false)}><X className="w-4 h-4" /></button></div>
              <div className="space-y-3">
                <input placeholder="کد تخفیف *" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} dir="ltr" className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm font-mono focus:outline-none focus:border-primary tracking-widest" />
                <div className="grid grid-cols-2 gap-3">
                  <select value={form.discountType} onChange={e => setForm(f => ({ ...f, discountType: e.target.value as DiscountCode["discountType"] }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary">
                    {Object.entries(TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                  <input type="number" placeholder={form.discountType === "percent" ? "درصد (0-100)" : "مبلغ تخفیف"} value={form.discountValue || ""} onChange={e => setForm(f => ({ ...f, discountValue: Number(e.target.value) }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input type="number" placeholder="حداقل مبلغ سفارش" value={form.minOrderAmount || ""} onChange={e => setForm(f => ({ ...f, minOrderAmount: Number(e.target.value) }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                  <input type="number" placeholder="حداکثر استفاده" value={form.maxUsage || ""} onChange={e => setForm(f => ({ ...f, maxUsage: Number(e.target.value) }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-xs text-muted-foreground mb-1">از تاریخ</label><input type="date" value={form.validFrom} onChange={e => setForm(f => ({ ...f, validFrom: e.target.value }))} className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" /></div>
                  <div><label className="block text-xs text-muted-foreground mb-1">تا تاریخ</label><input type="date" value={form.validUntil} onChange={e => setForm(f => ({ ...f, validUntil: e.target.value }))} className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" /></div>
                </div>
                <textarea placeholder="توضیح" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary resize-none" />
                <label className="flex items-center gap-2 cursor-pointer text-sm"><input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} /><span>کد فعال است</span></label>
              </div>
              <div className="flex gap-3 mt-5"><button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl border border-border text-sm">انصراف</button><button onClick={save} className="flex-[2] py-2.5 rounded-xl gradient-brand text-black text-sm font-semibold">ذخیره</button></div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
