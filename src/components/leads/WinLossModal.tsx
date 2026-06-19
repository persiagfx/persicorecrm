"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Trophy, XCircle, X } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { toast } from "sonner";

interface WinLossModalProps {
  leadId: string;
  outcome: "won" | "lost";
  onClose: () => void;
  onSaved: () => void;
}

const WIN_CATEGORIES = [
  { value: "price", label: "قیمت مناسب" },
  { value: "quality", label: "کیفیت محصول/خدمات" },
  { value: "trust", label: "اعتماد و رابطه" },
  { value: "features", label: "ویژگی‌های محصول" },
  { value: "timing", label: "زمان‌بندی مناسب" },
  { value: "other", label: "سایر" },
];

const LOSS_CATEGORIES = [
  { value: "price", label: "قیمت بالا" },
  { value: "competitor", label: "انتخاب رقیب" },
  { value: "budget", label: "نبود بودجه" },
  { value: "timing", label: "زمان‌بندی نامناسب" },
  { value: "quality", label: "کیفیت ناکافی" },
  { value: "trust", label: "عدم اعتماد" },
  { value: "features", label: "کمبود ویژگی" },
  { value: "other", label: "سایر" },
];

export function WinLossModal({ leadId, outcome, onClose, onSaved }: WinLossModalProps) {
  const isWon = outcome === "won";
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [competitor, setCompetitor] = useState("");
  const [saving, setSaving] = useState(false);

  const categories = isWon ? WIN_CATEGORIES : LOSS_CATEGORIES;

  const handleSave = async () => {
    if (!category) { toast.error("لطفاً دلیل را انتخاب کنید"); return; }
    setSaving(true);
    try {
      await apiClient.put(`/leads/${leadId}`, {
        status: outcome,
        winLossCategory: category,
        winLossDescription: description,
        competitorName: !isWon ? competitor : undefined,
      });
      toast.success(isWon ? "تبریک! قرارداد ثبت شد 🎉" : "سرنخ به عنوان از دست رفته ثبت شد");
      onSaved();
      onClose();
    } catch {
      toast.error("خطا در ذخیره");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
        onClick={e => e.target === e.currentTarget && onClose()}>
        <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
          className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl">

          <div className={`p-5 border-b border-border rounded-t-2xl flex items-center justify-between ${isWon ? "bg-emerald-500/5" : "bg-red-500/5"}`}>
            <div className="flex items-center gap-3">
              {isWon
                ? <Trophy className="w-6 h-6 text-emerald-400" />
                : <XCircle className="w-6 h-6 text-red-400" />}
              <div>
                <h3 className="font-bold text-foreground text-lg">
                  {isWon ? "قرارداد بسته شد! 🎉" : "سرنخ از دست رفت"}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isWon ? "دلیل موفقیت را ثبت کن تا برای آینده بیاموزیم" : "دلیل از دست رفتن را مشخص کن"}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted text-muted-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-5 space-y-4">
            <div>
              <label className="block text-xs text-muted-foreground mb-2">
                {isWon ? "چه عاملی منجر به موفقیت شد؟ *" : "چرا این معامله از دست رفت؟ *"}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {categories.map((cat) => (
                  <button key={cat.value} onClick={() => setCategory(cat.value)}
                    className={`px-3 py-2 rounded-xl border text-sm font-medium transition-all text-right ${
                      category === cat.value
                        ? isWon ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300" : "border-red-500/50 bg-red-500/10 text-red-300"
                        : "border-border bg-muted/30 text-muted-foreground hover:text-foreground hover:border-border-strong"
                    }`}>
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {!isWon && (
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5">نام رقیب (اگر انتخاب شد)</label>
                <input value={competitor} onChange={e => setCompetitor(e.target.value)}
                  className="w-full bg-background/50 border border-border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  placeholder="مثلاً: شرکت الف" />
              </div>
            )}

            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">توضیحات بیشتر</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
                className="w-full bg-background/50 border border-border rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="جزئیات بیشتری بنویس..." />
            </div>
          </div>

          <div className="p-5 border-t border-border flex gap-3">
            <button onClick={handleSave} disabled={saving}
              className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 ${
                isWon
                  ? "bg-emerald-500 hover:bg-emerald-400 text-white"
                  : "bg-red-500 hover:bg-red-400 text-white"
              }`}>
              {saving ? "در حال ذخیره..." : isWon ? "ثبت موفقیت" : "ثبت شکست"}
            </button>
            <button onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-border text-muted-foreground hover:text-foreground text-sm">
              بعداً
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
