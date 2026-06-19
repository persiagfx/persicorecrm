"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { X, Rocket } from "lucide-react";
import { apiClient } from "@/lib/api/client";

const DISMISS_KEY = "onboarding_banner_dismissed";
const TOTAL_STEPS = 5; // excludes the "completed" meta-step

interface OnboardingProgress {
  steps: Record<string, boolean>;
  completed: boolean;
}

export function OnboardingBanner() {
  const [progress, setProgress] = useState<OnboardingProgress | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Check localStorage first to avoid flicker
    if (typeof window !== "undefined") {
      const wasDismissed = localStorage.getItem(DISMISS_KEY) === "1";
      if (wasDismissed) {
        setDismissed(true);
        setLoaded(true);
        return;
      }
    }

    apiClient
      .get("/onboarding")
      .then((res) => {
        const data = res.data?.data ?? res.data;
        setProgress(data);
      })
      .catch(() => {
        // Silently fail — don't block the UI
      })
      .finally(() => setLoaded(true));
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  };

  if (!loaded || dismissed) return null;
  if (!progress || progress.completed) return null;

  const completedCount = progress.steps
    ? Object.values(progress.steps as Record<string, boolean>).filter(Boolean).length
    : 0;

  // Don't show if all 5 main steps are done (only "completed" meta-step remains)
  if (completedCount >= TOTAL_STEPS) return null;

  const percent = Math.round((completedCount / TOTAL_STEPS) * 100);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.25 }}
        className="mx-4 mt-2 mb-0 rounded-xl border border-violet-500/20 bg-violet-500/5 px-4 py-3"
        dir="rtl"
      >
        <div className="flex items-center gap-3">
          {/* Icon */}
          <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-violet-600/20 flex items-center justify-center">
            <Rocket className="w-4 h-4 text-violet-400" />
          </div>

          {/* Text + bar */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-white/80">
                راه‌اندازی اولیه:{" "}
                <span className="text-violet-400">
                  {completedCount} از {TOTAL_STEPS}
                </span>{" "}
                مرحله کامل شده
              </span>
              <span className="text-xs text-white/30 mr-2">{percent}%</span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-violet-600 to-fuchsia-500 rounded-full"
                animate={{ width: `${percent}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
          </div>

          {/* CTA */}
          <Link
            href="/onboarding"
            className="flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg bg-violet-600/20 border border-violet-500/30 text-violet-400 hover:bg-violet-600/30 hover:text-violet-300 transition-all whitespace-nowrap"
          >
            مشاهده راهنما
          </Link>

          {/* Dismiss */}
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-white/20 hover:text-white/60 hover:bg-white/5 transition-all"
            aria-label="بستن"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
