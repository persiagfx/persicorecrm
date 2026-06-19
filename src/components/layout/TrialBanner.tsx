"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, X, Zap, Clock } from "lucide-react";
import { useAuth } from "@/lib/auth/context";
import { cn } from "@/lib/utils";

function daysLeft(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86400000));
}

export function TrialBanner() {
  const { user } = useAuth();
  const router = useRouter();
  const [dismissed, setDismissed] = useState(false);

  const tenant = user?.tenant;
  if (!tenant || dismissed) return null;

  const isExpired = tenant.plan === "trial" && tenant.trialEndsAt && new Date(tenant.trialEndsAt) < new Date();
  const days = daysLeft(tenant.trialEndsAt);
  const isWarning = tenant.plan === "trial" && days !== null && days <= 5;

  // Only show for trial plan
  if (tenant.plan !== "trial") return null;
  // Don't show if > 5 days left and not expired
  if (!isExpired && !isWarning) return null;

  return (
    <div className={cn(
      "relative flex items-center justify-between gap-3 px-4 py-2.5 text-sm",
      isExpired
        ? "bg-red-900/80 border-b border-red-700/50 text-red-100"
        : "bg-amber-900/60 border-b border-amber-700/40 text-amber-100"
    )}>
      <div className="flex items-center gap-2">
        {isExpired
          ? <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          : <Clock className="w-4 h-4 text-amber-400 shrink-0" />
        }
        <span className="font-medium">
          {isExpired
            ? "دوره تریال شما به پایان رسیده است — برای ادامه استفاده پلن انتخاب کنید"
            : `${days} روز تا پایان تریال باقی مانده`
          }
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={() => router.push("/settings/subscription")}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all",
            isExpired
              ? "bg-red-500 hover:bg-red-400 text-white"
              : "bg-amber-500 hover:bg-amber-400 text-white"
          )}
        >
          <Zap className="w-3 h-3" />
          {isExpired ? "ارتقا پلن" : "مشاهده پلن‌ها"}
        </button>
        {!isExpired && (
          <button
            onClick={() => setDismissed(true)}
            className="p-1 rounded hover:bg-white/10 transition-colors"
          >
            <X className="w-3.5 h-3.5 opacity-60" />
          </button>
        )}
      </div>
    </div>
  );
}
