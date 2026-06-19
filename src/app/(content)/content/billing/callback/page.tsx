"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "motion/react";
import { CheckCircle, XCircle, Loader2, ArrowLeft } from "lucide-react";

export default function ContentBillingCallbackPage() {
  const params = useSearchParams();
  const router = useRouter();
  const called = useRef(false);
  const [status, setStatus] = useState<"loading" | "success" | "failed">("loading");
  const [refId, setRefId] = useState<string | null>(null);
  const [plan, setPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const token = typeof window !== "undefined" ? localStorage.getItem("content-token") : null;

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    const authority = params.get("Authority");
    const zpStatus = params.get("Status");
    const planParam = params.get("plan");

    if (!authority || !zpStatus) { setStatus("failed"); setError("پارامترهای پرداخت ناقص است"); return; }

    fetch("/api/content/billing/callback", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ Authority: authority, Status: zpStatus, plan: planParam }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.data?.success) {
          setStatus("success");
          setRefId(data.data.refId);
          setPlan(data.data.plan);
          // Refresh user to get new plan
          if (typeof window !== "undefined") {
            // Token is still valid, user plan updates on next /me fetch
          }
        } else {
          setStatus("failed");
          setError(data.data?.message ?? "پرداخت ناموفق بود");
        }
      })
      .catch(() => { setStatus("failed"); setError("خطا در ارتباط با سرور"); });
  }, []);

  return (
    <div className="min-h-screen bg-[#050508] flex items-center justify-center" dir="rtl">
      <div className="fixed inset-0 pointer-events-none">
        {status === "success" && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-emerald-600/10 blur-[120px]" />}
        {status === "failed" && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-rose-600/10 blur-[120px]" />}
      </div>

      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-10 max-w-md w-full mx-4 text-center shadow-2xl">

        {status === "loading" && (
          <div className="flex flex-col items-center gap-4">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 border-2 border-violet-500/30 border-t-violet-500 rounded-full" />
            <p className="text-white/60">در حال تایید پرداخت...</p>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center gap-4">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }}>
              <CheckCircle className="w-20 h-20 text-emerald-400" />
            </motion.div>
            <h2 className="text-2xl font-bold text-white">پرداخت موفق</h2>
            <p className="text-white/50">اشتراک {plan === "PRO" ? "پرو" : "پلاس"} شما فعال شد</p>
            {refId && <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white/40 text-sm">کد پیگیری: {refId}</div>}
            <motion.button whileHover={{ scale: 1.02 }} onClick={() => router.push("/content")}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold mt-2">
              شروع تولید محتوا <ArrowLeft className="w-4 h-4" />
            </motion.button>
          </div>
        )}

        {status === "failed" && (
          <div className="flex flex-col items-center gap-4">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }}>
              <XCircle className="w-20 h-20 text-rose-400" />
            </motion.div>
            <h2 className="text-2xl font-bold text-white">پرداخت ناموفق</h2>
            <p className="text-white/50">{error ?? "پرداخت انجام نشد"}</p>
            <div className="flex gap-3 mt-2">
              <button onClick={() => router.push("/content/billing")}
                className="px-5 py-2.5 rounded-xl border border-white/10 text-white/50 hover:text-white/80 hover:bg-white/5 transition-all text-sm">
                تلاش مجدد
              </button>
              <button onClick={() => router.push("/content")}
                className="px-5 py-2.5 rounded-xl bg-white/8 text-white/60 hover:bg-white/12 transition-all text-sm">
                برگشت
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
