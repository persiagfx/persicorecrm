"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Tag, Plus, Search, Percent, DollarSign, X, Pencil, Trash2, Copy } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { StatCard } from "@/components/common/StatCard";
import { apiClient } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface PricingTier { id: string; tierName: string; tierCode: string; discountPercent: number; minOrderValue?: number; maxOrderValue?: number; currency: string; validFrom?: string; validUntil?: string; customerSegment: string; isActive: boolean; description?: string; }

const SEGMENTS = ["همه مشتریان", "عمده‌فروش", "خرده‌فروش", "VIP", "دولتی", "صادرات", "خاص"];
const CURRENCIES = ["IRR", "USD", "EUR", "AED"];

export default function PricingPage() {
  const [tiers, setTiers] = useState<PricingTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<PricingTier | undefined>();
  const [form, setForm] = useState({ tierName: "", tierCode: "", discountPercent: 0, minOrderValue: 0, maxOrderValue: 0, currency: "IRR", validFrom: "", validUntil: "", customerSegment: "همه مشتریان", isActive: true, description: "" });

  const load = useCallback(async () => { try { const r = await apiClient.get("/trading/pricing-tiers"); setTiers(r.data.data ?? []); } catch { toast.error("خطا"); } finally { setLoading(false); } }, []);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    try {
      if (editing) await apiClient.put(`/trading/pricing-tiers/${editing.id}`, form); else await apiClient.post("/trading/pricing-tiers", form);
      toast.success("ذخیره شد"); setShowModal(false); setEditing(undefined); load();
    } catch { toast.error("خطا"); }
  };
  const del = async (id: string) => { if (!confirm("حذف؟")) return; try { await apiClient.delete(`/trading/pricing-tiers/${id}`); toast.success("حذف شد"); load(); } catch { /**/ } };
  const open = (t?: PricingTier) => { setEditing(t); setForm(t ? { tierName: t.tierName, tierCode: t.tierCode, discountPercent: t.discountPercent, minOrderValue: t.minOrderValue ?? 0, maxOrderValue: t.maxOrderValue ?? 0, currency: t.currency, validFrom: t.validFrom ?? "", validUntil: t.validUntil ?? "", customerSegment: t.customerSegment, isActive: t.isActive, description: t.description ?? "" } : { tierName: "", tierCode: "", discountPercent: 0, minOrderValue: 0, maxOrderValue: 0, currency: "IRR", validFrom: "", validUntil: "", customerSegment: "همه مشتریان", isActive: true, description: "" }); setShowModal(true); };
  const duplicate = (t: PricingTier) => { setEditing(undefined); setForm({ tierName: `${t.tierName} (کپی)`, tierCode: `${t.tierCode}-COPY`, discountPercent: t.discountPercent, minOrderValue: t.minOrderValue ?? 0, maxOrderValue: t.maxOrderValue ?? 0, currency: t.currency, validFrom: "", validUntil: "", customerSegment: t.customerSegment, isActive: false, description: t.description ?? "" }); setShowModal(true); };

  const filtered = tiers.filter(t => !search || t.tierName.includes(search) || t.tierCode.includes(search) || t.customerSegment.includes(search));
  const activeTiers = tiers.filter(t => t.isActive).length;
  const avgDiscount = tiers.length ? (tiers.reduce((a, t) => a + t.discountPercent, 0) / tiers.length).toFixed(1) : 0;

  return (
    <div className="p-6 space-y-5 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold flex items-center gap-2"><Tag className="w-6 h-6 text-primary" />تعرفه‌گذاری</h1></div>
        <button onClick={() => open()} className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-brand text-black text-sm font-semibold"><Plus className="w-4 h-4" /> تعرفه جدید</button>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <StatCard title="کل تعرفه‌ها" value={tiers.length} icon={Tag} color="blue" />
        <StatCard title="تعرفه‌های فعال" value={activeTiers} icon={DollarSign} color="green" />
        <StatCard title="میانگین تخفیف" value={`${avgDiscount}%`} icon={Percent} color="amber" />
      </div>
      <div className="relative"><Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="جستجو..." className="w-full pe-10 ps-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" /></div>
      <div className="grid grid-cols-1 gap-4">
        {loading ? <div className="p-12 text-center text-muted-foreground glass rounded-2xl border border-border">در حال بارگذاری...</div> : filtered.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground glass rounded-2xl border border-border"><Tag className="w-10 h-10 mx-auto mb-3 opacity-30" /><p>تعرفه‌ای یافت نشد</p></div>
        ) : filtered.map(t => (
          <div key={t.id} className={cn("glass rounded-2xl border p-5 transition-all", t.isActive ? "border-primary/30" : "border-border opacity-70")}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl gradient-brand flex items-center justify-center text-black font-bold text-lg">
                  {t.discountPercent}%
                </div>
                <div>
                  <p className="font-semibold text-base">{t.tierName}</p>
                  <p className="text-xs text-muted-foreground font-mono">{t.tierCode}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium", t.isActive ? "text-emerald-400 bg-emerald-500/10" : "text-gray-400 bg-gray-500/10")}>{t.isActive ? "فعال" : "غیرفعال"}</span>
                <button onClick={() => duplicate(t)} className="p-1.5 rounded-lg hover:bg-muted" title="کپی"><Copy className="w-3.5 h-3.5 text-muted-foreground" /></button>
                <button onClick={() => open(t)} className="p-1.5 rounded-lg hover:bg-muted"><Pencil className="w-3.5 h-3.5 text-muted-foreground" /></button>
                <button onClick={() => del(t.id)} className="p-1.5 rounded-lg hover:bg-destructive/10"><Trash2 className="w-3.5 h-3.5 text-destructive" /></button>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4 mt-4 text-sm">
              <div><p className="text-xs text-muted-foreground">سگمنت</p><p className="font-medium">{t.customerSegment}</p></div>
              <div><p className="text-xs text-muted-foreground">ارز</p><p className="font-medium">{t.currency}</p></div>
              <div><p className="text-xs text-muted-foreground">حداقل سفارش</p><p className="font-medium">{t.minOrderValue ? formatPrice(t.minOrderValue) : "—"}</p></div>
              <div><p className="text-xs text-muted-foreground">حداکثر سفارش</p><p className="font-medium">{t.maxOrderValue ? formatPrice(t.maxOrderValue) : "—"}</p></div>
            </div>
            {t.description && <p className="text-xs text-muted-foreground mt-3 border-t border-border pt-3">{t.description}</p>}
          </div>
        ))}
      </div>
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="glass rounded-2xl p-6 w-full max-w-lg border border-border max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5"><h2 className="text-lg font-bold">{editing ? "ویرایش تعرفه" : "تعرفه جدید"}</h2><button onClick={() => setShowModal(false)}><X className="w-4 h-4" /></button></div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input placeholder="نام تعرفه *" value={form.tierName} onChange={e => setForm(f => ({ ...f, tierName: e.target.value }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                  <input placeholder="کد تعرفه" value={form.tierCode} dir="ltr" onChange={e => setForm(f => ({ ...f, tierCode: e.target.value }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div><label className="block text-xs text-muted-foreground mb-1">درصد تخفیف (%)</label><input type="number" min={0} max={100} value={form.discountPercent} onChange={e => setForm(f => ({ ...f, discountPercent: Number(e.target.value) }))} className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" /></div>
                  <select value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary self-end">
                    {CURRENCIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                  <select value={form.customerSegment} onChange={e => setForm(f => ({ ...f, customerSegment: e.target.value }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary self-end">
                    {SEGMENTS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input type="number" placeholder="حداقل مبلغ سفارش" value={form.minOrderValue || ""} onChange={e => setForm(f => ({ ...f, minOrderValue: Number(e.target.value) }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                  <input type="number" placeholder="حداکثر مبلغ سفارش" value={form.maxOrderValue || ""} onChange={e => setForm(f => ({ ...f, maxOrderValue: Number(e.target.value) }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-xs text-muted-foreground mb-1">از تاریخ</label><input type="date" value={form.validFrom} onChange={e => setForm(f => ({ ...f, validFrom: e.target.value }))} className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" /></div>
                  <div><label className="block text-xs text-muted-foreground mb-1">تا تاریخ</label><input type="date" value={form.validUntil} onChange={e => setForm(f => ({ ...f, validUntil: e.target.value }))} className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" /></div>
                </div>
                <textarea placeholder="توضیحات" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary resize-none" />
                <label className="flex items-center gap-2 cursor-pointer text-sm"><input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} className="rounded" /><span>تعرفه فعال است</span></label>
              </div>
              <div className="flex gap-3 mt-5"><button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl border border-border text-sm">انصراف</button><button onClick={save} className="flex-[2] py-2.5 rounded-xl gradient-brand text-black text-sm font-semibold">ذخیره</button></div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
