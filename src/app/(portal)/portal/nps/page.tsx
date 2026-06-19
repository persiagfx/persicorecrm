"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Star, CheckCircle2, SmilePlus } from "lucide-react";
import { portalFetch } from "@/lib/portal-context";
import { cn } from "@/lib/utils";

interface NpsSurvey {
  id: string;
  title: string;
  description: string | null;
}

export default function PortalNpsPage() {
  const [survey, setSurvey] = useState<NpsSurvey | null | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [selected, setSelected] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    portalFetch("/api/portal/nps")
      .then((r) => r.json())
      .then((d) => setSurvey(d.data ?? null))
      .catch(() => setSurvey(null))
      .finally(() => setIsLoading(false));
  }, []);

  const handleSubmit = async () => {
    if (selected === null || !survey || submitting) return;
    setSubmitting(true);
    try {
      const res = await portalFetch("/api/portal/nps", {
        method: "POST",
        body: JSON.stringify({ formId: survey.id, score: selected, comment }),
      });
      if (res.ok) {
        setSubmitted(true);
      }
    } catch {
      // silent
    } finally {
      setSubmitting(false);
    }
  };

  const getScoreLabel = (score: number): string => {
    if (score <= 6) return "ناراضی";
    if (score <= 8) return "خنثی";
    return "خوشحال";
  };

  const getScoreColor = (score: number): string => {
    if (score <= 6) return "border-red-500/50 bg-red-500/10 text-red-400";
    if (score <= 8) return "border-yellow-500/50 bg-yellow-500/10 text-yellow-400";
    return "border-green-500/50 bg-green-500/10 text-green-400";
  };

  const getButtonColor = (score: number, isSelected: boolean): string => {
    if (!isSelected) return "border-border bg-muted text-muted-foreground hover:border-blue-400/40 hover:text-foreground";
    if (score <= 6) return "border-red-500 bg-red-500/15 text-red-400 font-bold";
    if (score <= 8) return "border-yellow-500 bg-yellow-500/15 text-yellow-400 font-bold";
    return "border-green-500 bg-green-500/15 text-green-400 font-bold";
  };

  return (
    <div className="max-w-2xl mx-auto" dir="rtl">
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
          </motion.div>
        ) : submitted || survey == null ? (
          /* Thank you state */
          <motion.div key="thankyou"
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16 space-y-4">
            <div className="w-20 h-20 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10 text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">ممنون از نظر شما</h2>
            <p className="text-muted-foreground">
              {submitted
                ? "پاسخ شما با موفقیت ثبت شد. از اینکه وقت گذاشتید سپاسگزاریم."
                : "در حال حاضر نظرسنجی فعالی برای شما وجود ندارد."}
            </p>
          </motion.div>
        ) : (
          /* Survey form */
          <motion.div key="survey" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="space-y-8">
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <SmilePlus className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">{survey.title}</h1>
                {survey.description && (
                  <p className="text-sm text-muted-foreground mt-0.5">{survey.description}</p>
                )}
              </div>
            </div>

            {/* NPS Question */}
            <div className="p-6 rounded-2xl bg-card border border-border space-y-6">
              <div>
                <p className="text-base font-semibold text-foreground">
                  چقدر ما را به دیگران توصیه می‌کنید؟
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  امتیاز ۰ (اصلاً توصیه نمی‌کنم) تا ۱۰ (حتماً توصیه می‌کنم)
                </p>
              </div>

              {/* Score buttons */}
              <div className="grid grid-cols-11 gap-1.5">
                {Array.from({ length: 11 }, (_, i) => (
                  <motion.button
                    key={i}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => setSelected(i)}
                    className={cn(
                      "aspect-square w-full rounded-xl border text-sm transition-all",
                      getButtonColor(i, selected === i)
                    )}
                  >
                    {i}
                  </motion.button>
                ))}
              </div>

              {/* Score labels */}
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>اصلاً توصیه نمی‌کنم</span>
                <span>حتماً توصیه می‌کنم</span>
              </div>

              {/* Selected score badge */}
              <AnimatePresence>
                {selected !== null && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                    className={cn("inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm", getScoreColor(selected))}
                  >
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span>امتیاز شما: {selected} — {getScoreLabel(selected)}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Comment */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                نظر اضافی <span className="text-muted-foreground font-normal">(اختیاری)</span>
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="اگر نظر یا پیشنهادی دارید بنویسید..."
                rows={4}
                className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/40 resize-none"
              />
            </div>

            {/* Submit */}
            <motion.button
              whileHover={{ scale: selected !== null ? 1.02 : 1 }}
              whileTap={{ scale: selected !== null ? 0.97 : 1 }}
              onClick={handleSubmit}
              disabled={selected === null || submitting}
              className={cn(
                "w-full py-3.5 rounded-xl font-semibold text-sm transition-all",
                selected !== null
                  ? "bg-gradient-to-r from-blue-500 to-teal-500 text-white hover:opacity-90"
                  : "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
              )}
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  در حال ارسال...
                </span>
              ) : (
                "ثبت نظر"
              )}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
