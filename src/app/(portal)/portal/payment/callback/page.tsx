"use client";
export const dynamic = "force-dynamic";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "motion/react";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Status = "loading" | "success" | "failed";

function PaymentCallbackPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<Status>("loading");
  const [refId, setRefId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const authority = searchParams.get("Authority");
    const zpStatus = searchParams.get("Status");
    const invoiceId = searchParams.get("invoiceId");

    if (!authority || !invoiceId) {
      setStatus("failed");
      setError("اطلاعات پرداخت ناقص است");
      return;
    }

    fetch("/api/portal/payment/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ authority, status: zpStatus, invoiceId }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.data?.status === "success" || d.data?.status === "already_paid") {
          setRefId(d.data.refId);
          setStatus("success");
        } else {
          setStatus("failed");
          setError(d.error || "تأیید پرداخت ناموفق بود");
        }
      })
      .catch(() => {
        setStatus("failed");
        setError("خطا در اتصال به سرور");
      });
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center" dir="rtl">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-950 via-background to-teal-950 opacity-60" />

      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-full max-w-sm px-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 text-center shadow-2xl">
          {status === "loading" && (
            <>
              <Loader2 className="w-16 h-16 text-blue-400 animate-spin mx-auto mb-4" />
              <h2 className="text-xl font-bold text-white mb-2">در حال تأیید پرداخت...</h2>
              <p className="text-white/50 text-sm">لطفاً چند لحظه صبر کنید</p>
            </>
          )}

          {status === "success" && (
            <>
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", duration: 0.5 }}>
                <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-5">
                  <CheckCircle className="w-10 h-10 text-emerald-400" />
                </div>
              </motion.div>
              <h2 className="text-2xl font-bold text-white mb-2">پرداخت موفق!</h2>
              <p className="text-white/60 text-sm mb-4">پرداخت شما با موفقیت انجام شد</p>
              {refId && (
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 mb-6">
                  <p className="text-xs text-white/50 mb-1">کد پیگیری</p>
                  <p className="font-mono text-lg font-bold text-emerald-400">{refId}</p>
                </div>
              )}
              <Link href="/portal/invoices"
                className={cn(
                  "block w-full py-3 rounded-xl text-white font-semibold",
                  "bg-gradient-to-r from-blue-500 to-teal-500",
                  "hover:opacity-90 transition-opacity"
                )}>
                مشاهده فاکتورها
              </Link>
            </>
          )}

          {status === "failed" && (
            <>
              <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-5">
                <XCircle className="w-10 h-10 text-red-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">پرداخت ناموفق</h2>
              <p className="text-white/60 text-sm mb-6">{error || "پرداخت لغو شد یا با خطا مواجه شد"}</p>
              <div className="flex gap-2">
                <button onClick={() => router.back()}
                  className="flex-1 py-3 rounded-xl border border-white/10 text-white/70 hover:bg-white/5 transition-colors text-sm font-medium">
                  بازگشت
                </button>
                <Link href="/portal/invoices"
                  className="flex-1 py-3 rounded-xl bg-blue-500/20 border border-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors text-sm font-medium text-center">
                  فاکتورها
                </Link>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default function PaymentCallbackPage() {
  return <Suspense><PaymentCallbackPageInner /></Suspense>;
}
