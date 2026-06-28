"use client";
export const dynamic = "force-dynamic";

import { Suspense, useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "motion/react";
import { CheckCircle2, XCircle, Loader2, ArrowLeft } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import Link from "next/link";

type Status = "verifying" | "success" | "failed";

function BillingCallbackPageInner() {
  const params = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<Status>("verifying");
  const [refId, setRefId] = useState<string | null>(null);
  const [plan, setPlan] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const verified = useRef(false);

  useEffect(() => {
    if (verified.current) return;
    verified.current = true;

    const authority = params.get("Authority");
    const zpStatus = params.get("Status");
    const planParam = params.get("plan");

    setPlan(planParam);

    if (!authority || zpStatus !== "OK") {
      setStatus("failed");
      setErrorMsg("پرداخت توسط کاربر لغو شد یا با خطا مواجه شد.");
      return;
    }

    apiClient
      .post("/billing/verify", { authority, plan: planParam })
      .then((r) => {
        setRefId(r.data.data.refId);
        setStatus("success");
        // Reload tenant info after a short delay
        setTimeout(() => router.refresh(), 1000);
      })
      .catch((err) => {
        setErrorMsg(err?.response?.data?.error ?? "خطا در تأیید پرداخت");
        setStatus("failed");
      });
  }, [params, router]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center max-w-md w-full p-8 rounded-2xl border border-white/[0.07] bg-white/[0.02]"
      >
        {status === "verifying" && (
          <>
            <Loader2 className="w-12 h-12 text-violet-400 animate-spin mx-auto mb-4" />
            <h2 className="text-lg font-bold text-white mb-2">در حال تأیید پرداخت...</h2>
            <p className="text-sm text-white/40">لطفاً صفحه را نبندید</p>
          </>
        )}

        {status === "success" && (
          <>
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }}>
              <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
            </motion.div>
            <h2 className="text-xl font-black text-white mb-2">پرداخت موفق!</h2>
            <p className="text-sm text-white/50 mb-1">
              پلن <span className="text-white font-semibold capitalize">{plan}</span> با موفقیت فعال شد.
            </p>
            {refId && (
              <p className="text-xs text-white/30 mb-6">کد پیگیری: {refId}</p>
            )}
            <Link
              href="/settings/subscription"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-500 transition-colors"
            >
              مشاهده اشتراک
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </>
        )}

        {status === "failed" && (
          <>
            <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-black text-white mb-2">پرداخت ناموفق</h2>
            <p className="text-sm text-white/50 mb-6">{errorMsg}</p>
            <div className="flex items-center justify-center gap-3">
              <Link
                href="/settings/subscription"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 text-white text-sm font-semibold hover:bg-white/15 transition-colors"
              >
                بازگشت
                <ArrowLeft className="w-4 h-4" />
              </Link>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}

export default function BillingCallbackPage() {
  return <Suspense><BillingCallbackPageInner /></Suspense>;
}
