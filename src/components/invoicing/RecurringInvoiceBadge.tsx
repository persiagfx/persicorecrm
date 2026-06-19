"use client";

import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

const INTERVAL_LABELS: Record<string, string> = {
  monthly: "ماهانه",
  quarterly: "فصلی",
  yearly: "سالانه",
};

interface RecurringInvoiceBadgeProps {
  interval: string;
  nextDate?: Date | string | null;
  className?: string;
}

export function RecurringInvoiceBadge({ interval, nextDate, className }: RecurringInvoiceBadgeProps) {
  const label = INTERVAL_LABELS[interval] ?? interval;

  const formattedDate = nextDate
    ? new Date(nextDate).toLocaleDateString("fa-IR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20">
        <RefreshCw className="w-3 h-3" />
        تکراری - {label}
      </span>
      {formattedDate && (
        <span className="text-xs text-muted-foreground">
          بعدی: {formattedDate}
        </span>
      )}
    </div>
  );
}
