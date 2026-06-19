"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Square, ChevronUp, ChevronDown } from "lucide-react";
import { useTimerStore } from "@/lib/store";
import { formatDuration } from "@/lib/utils";
import { apiClient } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function FloatingTimer() {
  const { isRunning, taskTitle, elapsedSeconds, stopTimer, tick } = useTimerStore();
  const [expanded, setExpanded] = useState(false);
  const [stopping, setStopping] = useState(false);

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [isRunning, tick]);

  const handleStop = async () => {
    setStopping(true);
    // stopTimer برمی‌گرداند: { durationSeconds, timeEntryId, projectId, taskId }
    const result = stopTimer();

    // ذخیره در DB
    if (result.timeEntryId && result.durationSeconds > 0) {
      apiClient.put(`/time-entries/${result.timeEntryId}`, {
        isRunning: false,
        durationSeconds: result.durationSeconds,
      }).catch(() => {
        // در صورت خطا، time entry هنوز در DB هست و running است
        // بار بعد که کاربر timer شروع کند، running entry پاک می‌شود
      });
    } else if (result.projectId && result.durationSeconds > 0) {
      // اگر timeEntryId نداریم، یک manual entry ثبت می‌کنیم
      apiClient.post("/time-entries", {
        projectId: result.projectId,
        taskId: result.taskId || undefined,
        _manual: true,
        startedAt: new Date(Date.now() - result.durationSeconds * 1000).toISOString(),
        durationSeconds: result.durationSeconds,
      }).catch((err) => console.error(err));
    }

    setStopping(false);
  };

  return (
    <AnimatePresence>
      {isRunning && (
        <motion.div
          initial={{ opacity: 0, y: 80, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 80, scale: 0.9 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className={cn(
            "fixed bottom-6 left-6 z-50",
            "glass border border-primary/40 rounded-2xl",
            "shadow-modal gold-glow overflow-hidden"
          )}
          style={{ minWidth: 280 }}
        >
          <div className="flex items-center gap-3 p-4">
            <div className="relative shrink-0">
              <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
              <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-primary/40 animate-ping" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="text-2xl font-mono tabular-nums font-bold text-primary leading-none">
                {formatDuration(elapsedSeconds)}
              </div>
              <p className="text-xs text-muted-foreground truncate mt-0.5">{taskTitle}</p>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button onClick={() => setExpanded((v) => !v)}
                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                {expanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
              </button>
              <button onClick={handleStop} disabled={stopping}
                className="p-1.5 rounded-lg bg-destructive/10 hover:bg-destructive/20 text-destructive transition-colors disabled:opacity-60">
                <Square className="w-3.5 h-3.5 fill-current" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
