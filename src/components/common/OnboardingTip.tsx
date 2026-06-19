"use client";

import { useState, useEffect, ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Lightbulb, X } from "lucide-react";

interface OnboardingTipProps {
  tip: string;
  storageKey: string;
  icon?: ReactNode;
}

export function OnboardingTip({ tip, storageKey, icon }: OnboardingTipProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const dismissed = localStorage.getItem(`onboarding_tip_${storageKey}`);
      if (!dismissed) setVisible(true);
    } catch {
      // localStorage unavailable (SSR / private mode)
    }
  }, [storageKey]);

  function dismiss() {
    try {
      localStorage.setItem(`onboarding_tip_${storageKey}`, "1");
    } catch {
      // ignore
    }
    setVisible(false);
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
          className="flex items-start gap-3 px-4 py-3 rounded-xl border border-primary/20 bg-primary/5 text-right"
          style={{ direction: "rtl" }}
          role="status"
          aria-live="polite"
        >
          <span className="mt-0.5 text-primary shrink-0">
            {icon ?? <Lightbulb className="w-4 h-4" />}
          </span>
          <p className="flex-1 text-sm text-foreground/80 leading-relaxed">{tip}</p>
          <button
            onClick={dismiss}
            aria-label="بستن راهنما"
            className="shrink-0 mt-0.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
