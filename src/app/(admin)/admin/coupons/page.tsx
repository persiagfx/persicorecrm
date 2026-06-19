"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Tag, Plus, X, Copy, Trash2, Edit3, ToggleLeft, ToggleRight, Calendar, Percent, DollarSign } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { toast } from "sonner";

interface Coupon {
  id: string; code: string; description: string | null;
  discountType: string; discountValue: number; maxUses: number | null;
  usedCount: number; minAmount: number | null; applicablePlans: string[];
  isActive: boolean; expiresAt: string | null; createdAt: string;
}

const PLAN_LABELS: Record<string, string> = { trial: "آزمایشی", starter: "استارتر", pro: "حرفه‌ای", enterprise: "سازمانی" };
const EMPTY_FORM = {
  code: "", description: "", discountType: "percent", discountValue: "", maxUses: "",
  minAmount: "", applicablePlans: [] as string[], isActive: true, expiresAt: "",
};

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editItem, setEditItem] = useState<Coupon | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await apiClient.get("/admin/coupons");
      setCoupons(r.data.data ?? []);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditItem(null); setForm({ ...EMPTY_FORM }); setModal(true); };
  const openEdit = (c: Coupon) => {
    setEditItem(c);
    setForm({
      code: c.code, description: c.description ?? "", discountType: c.discountType,
      discountValue: String(c.discountValue), maxUses: c.maxUses ? String(c.maxUses) : "",
      minAmount: c.minAmount ? String(c.minAmount) : "", applicablePlans: c.applicablePlans ?? [],
      isActive: c.isActive, expiresAt: c.expiresAt ? c.expiresAt.split("T")[0] : "",
    });
    setModal(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const data = {
        ...form,
        discountValue: Number(form.discountValue),
        maxUses: form.maxUses ? Number(form.maxUses) : null,
        minAmount: form.minAmount ? Number(form.minAmount) : null,
        expiresAt: form.expiresAt || null,
      };
      if (editItem) {
        await apiClient.patch(`/admin/coupons/${editItem.id}`, data);
        toast.success("کوپن بروزرسانی شد ✓");
      } else {
        await apiClient.post("/admin/coupons", data);
        toast.success("کوپن ایجاد شد ✓");
      }
      setModal(false);
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.error ?? "خطا در ذخیره");
    } finally { setSaving(false); }
  };

  const toggleActive = async (c: Coupon) => {
    try {
      await apiClient.patch(`/admin/coupons/${c.id}`, { isActive: !c.isActive });
      setCoupons(prev => prev.map(x => x.id === c.id ? { ...x, isActive: !x.isActive } : x));
    } catch { toast.error("خطا"); }
  };

  const del = async (id: string) => {
    if (!confirm("این کوپن حذف شود؟")) return;
    try {
      await apiClient.delete(`/admin/coupons/${id}`);
      toast.success("حذف شد");
      load();
    } catch { toast.error("خطا"); }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("کپی شد!");
  };

  const genCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const code = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    setForm(p => ({ ...p, code }));
  };

  const togglePlan = (plan: string) => {
    setForm(p => ({
      ...p,
      applicablePlans: p.applicablePlans.includes(plan)
        ? p.applicablePlans.filter(x => x !== plan)
        : [...p.applicablePlans, plan],
    }));
  };

  const fmtDate = (d: string) => new Date(d).toLocaleDateString("fa-IR");
  const isExpired = (d: string | null) => d && new Date(d) < new Date();
  const usagePct = (c: Coupon) => c.maxUses ? Math.round((c.usedCount / c.maxUses) * 100) : null;

  const stats = {
    active: coupons.filter(c => c.isActive && !isExpired(c.expiresAt)).length,
    expired: coupons.filter(c => isExpired(c.expiresAt)).length,
    totalUses: coupons.reduce((a, c) => a + c.usedCount, 0),
  };

  return (
    <div className="p-8 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">کوپن‌های تخفیف</h1>
          <p className="text-sm text-white/40 mt-1">مدیریت کدهای تخفیف برای کسب‌وکارها</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-sm font-semibold hover:opacity-90">
          <Plus className="w-4 h-4" />کوپن جدید
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 max-w-md">
        {[
          { label: "فعال", value: stats.active, color: "text-green-400" },
          { label: "منقضی", value: stats.expired, color: "text-red-400" },
          { label: "کل استفاده", value: stats.totalUses, color: "text-violet-400" },
        ].map(s => (
          <div key={s.label} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-white/40 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-40 rounded-2xl bg-white/5 animate-pulse" />)}
        </div>
      ) : coupons.length === 0 ? (
        <div className="text-center py-20 text-white/30">
          <Tag className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>هنوز کوپنی تعریف نشده</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {coupons.map((c, idx) => {
            const expired = isExpired(c.expiresAt);
            const pct = usagePct(c);
            return (
              <motion.div key={c.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.06 }}
                className={`rounded-2xl border p-4 space-y-3 transition-opacity ${expired ? "opacity-50" : ""} ${c.isActive ? "border-white/15 bg-white/5" : "border-white/5 bg-white/3"}`}>

                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <code className="text-lg font-bold text-white font-mono tracking-wider">{c.code}</code>
                      <button onClick={() => copyCode(c.code)} className="p-1 rounded-md hover:bg-white/10 text-white/30 hover:text-white transition-colors">
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {c.description && <p className="text-xs text-white/40 mt-0.5">{c.description}</p>}
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => toggleActive(c)} className="text-white/40 hover:text-white transition-colors">
                      {c.isActive ? <ToggleRight className="w-5 h-5 text-violet-400" /> : <ToggleLeft className="w-5 h-5" />}
                    </button>
                    <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg hover:bg-white/10 text-white/30 hover:text-white transition-colors">
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => del(c.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/30 hover:text-red-400 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-bold ${
                    c.discountType === "percent" ? "bg-violet-500/20 text-violet-300" : "bg-green-500/20 text-green-300"
                  }`}>
                    {c.discountType === "percent" ? <Percent className="w-3.5 h-3.5" /> : <DollarSign className="w-3.5 h-3.5" />}
                    {c.discountValue}{c.discountType === "percent" ? "%" : " ت"}
                  </div>
                  {c.minAmount && <span className="text-xs text-white/30">حداقل: {c.minAmount.toLocaleString()} ت</span>}
                </div>

                {pct !== null && (
                  <div>
                    <div className="flex justify-between text-xs text-white/40 mb-1">
                      <span>استفاده</span>
                      <span>{c.usedCount} / {c.maxUses}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/10">
                      <div className={`h-full rounded-full transition-all ${pct >= 90 ? "bg-red-500" : "bg-violet-500"}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-white/30">
                  {(c.applicablePlans?.length ?? 0) > 0
                    ? <span>{c.applicablePlans.map(p => PLAN_LABELS[p]).join("، ")}</span>
                    : <span>همه پلن‌ها</span>}
                  {c.expiresAt && (
                    <span className={expired ? "text-red-400" : ""}>
                      {expired ? "منقضی" : `انقضا: ${fmtDate(c.expiresAt)}`}
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {modal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-[#0f0f1a] border border-white/10 rounded-2xl w-full max-w-lg p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">{editItem ? "ویرایش کوپن" : "کوپن جدید"}</h3>
                <button onClick={() => setModal(false)} className="p-2 rounded-xl hover:bg-white/10 text-white/40">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-white/40 mb-1.5">کد تخفیف</label>
                  <div className="flex gap-2">
                    <input value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white/70 text-sm focus:outline-none font-mono uppercase" dir="ltr"
                      disabled={!!editItem} />
                    {!editItem && (
                      <button onClick={genCode} className="px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/50 hover:text-white text-xs whitespace-nowrap">
                        تولید خودکار
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-white/40 mb-1.5">توضیحات</label>
                  <input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white/70 text-sm focus:outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-white/40 mb-1.5">نوع تخفیف</label>
                    <select value={form.discountType} onChange={e => setForm(p => ({ ...p, discountType: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white/70 text-sm focus:outline-none">
                      <option value="percent">درصدی</option>
                      <option value="fixed">مبلغ ثابت</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-white/40 mb-1.5">
                      {form.discountType === "percent" ? "درصد تخفیف" : "مبلغ تخفیف (تومان)"}
                    </label>
                    <input type="number" value={form.discountValue} onChange={e => setForm(p => ({ ...p, discountValue: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white/70 text-sm focus:outline-none" dir="ltr" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-white/40 mb-1.5">حداکثر استفاده</label>
                    <input type="number" value={form.maxUses} onChange={e => setForm(p => ({ ...p, maxUses: e.target.value }))}
                      placeholder="بدون محدودیت"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white/70 text-sm focus:outline-none" dir="ltr" />
                  </div>
                  <div>
                    <label className="block text-xs text-white/40 mb-1.5">حداقل خرید (تومان)</label>
                    <input type="number" value={form.minAmount} onChange={e => setForm(p => ({ ...p, minAmount: e.target.value }))}
                      placeholder="اختیاری"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white/70 text-sm focus:outline-none" dir="ltr" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-white/40 mb-1.5">تاریخ انقضا</label>
                  <input type="date" value={form.expiresAt} onChange={e => setForm(p => ({ ...p, expiresAt: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white/70 text-sm focus:outline-none" dir="ltr" />
                </div>
                <div>
                  <label className="block text-xs text-white/40 mb-2">قابل استفاده در (خالی = همه)</label>
                  <div className="flex gap-2 flex-wrap">
                    {["starter", "pro", "enterprise"].map(pl => (
                      <button key={pl} onClick={() => togglePlan(pl)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          form.applicablePlans.includes(pl) ? "bg-violet-600/30 text-violet-200 border border-violet-500/40" : "bg-white/5 text-white/40 border border-white/10 hover:text-white"
                        }`}>
                        {PLAN_LABELS[pl]}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-sm text-white/70">فعال بودن</span>
                  <button onClick={() => setForm(p => ({ ...p, isActive: !p.isActive }))}
                    className={`w-10 h-5 rounded-full transition-colors relative ${form.isActive ? "bg-violet-600" : "bg-white/10"}`}>
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${form.isActive ? "right-0.5" : "right-5"}`} />
                  </button>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={save} disabled={saving || !form.code || !form.discountValue}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-semibold text-sm hover:opacity-90 disabled:opacity-50">
                  {saving ? "در حال ذخیره..." : "ذخیره"}
                </button>
                <button onClick={() => setModal(false)}
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
