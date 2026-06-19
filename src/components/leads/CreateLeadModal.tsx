"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Zap } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { toast } from "sonner";

interface CreateLeadModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (lead: unknown) => void;
}

const SOURCES = [
  { value: "", label: "انتخاب منبع..." },
  { value: "referral", label: "معرفی" },
  { value: "website", label: "وبسایت" },
  { value: "social", label: "شبکه اجتماعی" },
  { value: "ads", label: "تبلیغات" },
  { value: "cold_call", label: "تماس سرد" },
  { value: "exhibition", label: "نمایشگاه" },
  { value: "other", label: "سایر" },
];

export function CreateLeadModal({ open, onClose, onCreated }: CreateLeadModalProps) {
  const [form, setForm] = useState({
    companyName: "", contactName: "", contactPhone: "",
    contactEmail: "", estimatedValue: "", source: "",
    notes: "", conversionProbability: "50",
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.companyName || !form.contactName || !form.contactPhone) {
      toast.error("نام شرکت، نام مخاطب و تلفن الزامی است");
      return;
    }
    setSaving(true);
    try {
      const res = await apiClient.post("/leads", {
        ...form,
        estimatedValue: Number(form.estimatedValue) || 0,
        conversionProbability: Number(form.conversionProbability) || 50,
        status: "new",
        columnId: "col-new",
      });
      toast.success("سرنخ جدید اضافه شد ✓");
      onCreated(res.data?.data ?? res.data);
      setForm({ companyName: "", contactName: "", contactPhone: "", contactEmail: "", estimatedValue: "", source: "", notes: "", conversionProbability: "50" });
      onClose();
    } catch (e: any) {
      toast.error(e?.response?.data?.error ?? "خطا در ثبت سرنخ");
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full bg-background/50 border border-border rounded-xl px-3 py-2.5 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all";

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={e => e.target === e.currentTarget && onClose()}>
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
            className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl">
            <form onSubmit={handleSubmit}>
              <div className="p-5 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-bold text-foreground">سرنخ جدید</h3>
                </div>
                <button type="button" onClick={onClose} className="p-2 rounded-xl hover:bg-muted text-muted-foreground">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1.5">نام شرکت *</label>
                    <input value={form.companyName} onChange={e => setForm(p => ({ ...p, companyName: e.target.value }))}
                      className={inputCls} placeholder="نام شرکت یا کسب‌وکار" />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1.5">نام مخاطب *</label>
                    <input value={form.contactName} onChange={e => setForm(p => ({ ...p, contactName: e.target.value }))}
                      className={inputCls} placeholder="نام و نام خانوادگی" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1.5">تلفن *</label>
                    <input value={form.contactPhone} onChange={e => setForm(p => ({ ...p, contactPhone: e.target.value }))}
                      className={inputCls} dir="ltr" placeholder="09xxxxxxxxx" />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1.5">ایمیل</label>
                    <input type="email" value={form.contactEmail} onChange={e => setForm(p => ({ ...p, contactEmail: e.target.value }))}
                      className={inputCls} dir="ltr" placeholder="example@email.com" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1.5">ارزش تخمینی (تومان)</label>
                    <input type="number" value={form.estimatedValue} onChange={e => setForm(p => ({ ...p, estimatedValue: e.target.value }))}
                      className={inputCls} dir="ltr" placeholder="0" />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1.5">منبع</label>
                    <select value={form.source} onChange={e => setForm(p => ({ ...p, source: e.target.value }))} className={inputCls}>
                      {SOURCES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5">احتمال تبدیل: {form.conversionProbability}٪</label>
                  <input type="range" min="0" max="100" value={form.conversionProbability}
                    onChange={e => setForm(p => ({ ...p, conversionProbability: e.target.value }))}
                    className="w-full accent-primary" />
                </div>
                <div>
                  <label className="block text-xs text-muted-foreground mb-1.5">یادداشت</label>
                  <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2}
                    className={inputCls + " resize-none"} placeholder="توضیحات اضافی..." />
                </div>
              </div>

              <div className="p-5 border-t border-border flex gap-3">
                <button type="submit" disabled={saving}
                  className="flex-1 py-2.5 rounded-xl gradient-brand text-black font-semibold text-sm gold-glow disabled:opacity-50">
                  {saving ? "در حال ذخیره..." : "ثبت سرنخ"}
                </button>
                <button type="button" onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-border text-muted-foreground hover:text-foreground text-sm">
                  انصراف
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
