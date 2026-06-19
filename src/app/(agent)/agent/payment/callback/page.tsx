"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

type State = "verifying" | "success" | "failed" | "cancelled";

export default function PaymentCallbackPage() {
  const params = useSearchParams();
  const router = useRouter();
  const [state, setState] = useState<State>("verifying");
  const [refId, setRefId] = useState("");
  const [plan, setPlan] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const authority = params.get("Authority");
    const status = params.get("Status");
    const userId = params.get("userId");
    const planParam = params.get("plan");

    if (!authority || !userId || !planParam) { setState("failed"); setError("پارامترهای بازگشت ناقص است"); return; }
    if (status === "NOK") { setState("cancelled"); return; }

    setPlan(planParam);

    fetch("/api/agent/payment/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ authority, status, userId, plan: planParam }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.data?.status === "success" || d.data?.status === "already_paid") {
          setRefId(d.data.refId ?? "");
          setState("success");
          setTimeout(() => router.push("/agent/dashboard"), 4000);
        } else {
          setState("failed");
          setError(d.message ?? "تأیید پرداخت ناموفق بود");
        }
      })
      .catch(() => { setState("failed"); setError("خطای شبکه"); });
  }, [params, router]);

  const PLAN_NAMES: Record<string, string> = { STARTER: "پایه", PRO: "حرفه‌ای", ENTERPRISE: "سازمانی" };

  return (
    <div className="min-h-screen bg-[#07071a] text-white flex items-center justify-center" dir="rtl">
      <div className="text-center max-w-sm px-6">
        {state === "verifying" && (
          <>
            <div className="w-16 h-16 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin mx-auto mb-6" />
            <h2 className="text-xl font-bold mb-2">در حال تأیید پرداخت</h2>
            <p className="text-white/50 text-sm">لطفاً صبر کنید...</p>
          </>
        )}

        {state === "success" && (
          <>
            <div className="w-20 h-20 bg-green-500/15 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">✅</div>
            <h2 className="text-2xl font-black mb-2">پرداخت موفق!</h2>
            <p className="text-white/60 mb-4">پلن شما به <span className="text-violet-400 font-bold">{PLAN_NAMES[plan] ?? plan}</span> ارتقا یافت</p>
            {refId && <p className="text-xs text-white/30 mb-6">کد پیگیری: {refId}</p>}
            <p className="text-sm text-white/40 mb-4">به داشبورد منتقل می‌شوید...</p>
            <Link href="/agent/dashboard" className="inline-block bg-violet-500 hover:bg-violet-600 text-white px-6 py-3 rounded-xl font-medium text-sm transition-colors">
              رفتن به داشبورد
            </Link>
          </>
        )}

        {state === "cancelled" && (
          <>
            <div className="w-20 h-20 bg-amber-500/15 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">⚠️</div>
            <h2 className="text-xl font-bold mb-2">پرداخت لغو شد</h2>
            <p className="text-white/50 mb-6 text-sm">پرداخت توسط شما لغو شد. هیچ مبلغی کسر نشده.</p>
            <Link href="/agent/plans" className="inline-block bg-white/8 hover:bg-white/12 text-white px-6 py-3 rounded-xl font-medium text-sm transition-colors">
              بازگشت به پلن‌ها
            </Link>
          </>
        )}

        {state === "failed" && (
          <>
            <div className="w-20 h-20 bg-red-500/15 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">❌</div>
            <h2 className="text-xl font-bold mb-2">پرداخت ناموفق</h2>
            <p className="text-white/50 mb-2 text-sm">{error}</p>
            <p className="text-xs text-white/30 mb-6">در صورت کسر وجه، ظرف ۷۲ ساعت برگشت داده می‌شود.</p>
            <div className="flex gap-3 justify-center">
              <Link href="/agent/plans" className="bg-violet-500 hover:bg-violet-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors">
                تلاش مجدد
              </Link>
              <Link href="/agent/dashboard" className="border border-white/15 text-white/60 hover:text-white px-5 py-2.5 rounded-xl text-sm transition-colors">
                داشبورد
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
