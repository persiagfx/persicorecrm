"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAgentAuth } from "@/lib/agent-auth/context";
import Link from "next/link";
import { Check, Zap } from "lucide-react";

interface PlanDef {
  key: "FREE" | "STARTER" | "PRO" | "ENTERPRISE";
  name: string;
  color: string;
  agents: number;
  msgs: string;
  features: string[];
  badge?: string;
}

const PLANS: PlanDef[] = [
  {
    key: "FREE", name: "رایگان", color: "#64748b", agents: 1, msgs: "۱۰۰",
    features: ["۱ ایجنت", "۱۰۰ پیام ماهانه", "۳ منبع دانش", "نصب روی سایت", "برند Persicore"],
  },
  {
    key: "STARTER", name: "پایه", color: "#3b82f6", agents: 3, msgs: "۱,۰۰۰",
    features: ["۳ ایجنت", "۱,۰۰۰ پیام ماهانه", "دانش نامحدود", "CRM sync", "پشتیبانی ایمیل", "برند Persicore"],
  },
  {
    key: "PRO", name: "حرفه‌ای", color: "#8b5cf6", agents: 10, msgs: "۵,۰۰۰",
    features: ["۱۰ ایجنت", "۵,۰۰۰ پیام ماهانه", "URL Crawler", "CRM sync پیشرفته", "آنالیتیکس", "پشتیبانی اولویت‌دار", "برند Persicore"],
    badge: "محبوب‌ترین",
  },
  {
    key: "ENTERPRISE", name: "سازمانی", color: "#f59e0b", agents: 50, msgs: "۵۰,۰۰۰",
    features: ["۵۰ ایجنت", "۵۰,۰۰۰ پیام ماهانه", "حذف برند Persicore", "API اختصاصی", "SLA 99.9%", "مدیر اکانت اختصاصی"],
  },
];

export default function PlansPage() {
  const { user, isLoading, refreshUser } = useAgentAuth();
  const router = useRouter();
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoading && !user) router.push("/agent/login");
  }, [user, isLoading, router]);

  // Load prices from settings
  useEffect(() => {
    fetch("/api/agent/settings/prices")
      .then((r) => r.json())
      .then((d) => { if (d.data) setPrices(d.data); })
      .catch(() => {});
  }, []);

  const upgrade = async (plan: string) => {
    if (plan === "FREE") return;
    setError("");
    setLoadingPlan(plan);
    try {
      const token = localStorage.getItem("agent-token") || localStorage.getItem("crm-token");
      const res = await fetch("/api/agent/payment/request", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (!res.ok || data.error) { setError(data.message ?? "خطا در اتصال به درگاه"); return; }
      window.location.href = data.data.startPayUrl;
    } catch { setError("خطای شبکه"); }
    finally { setLoadingPlan(null); }
  };

  if (isLoading || !user) return null;

  const currentPlan = (user as any).plan ?? "FREE";
  const PLAN_ORDER = ["FREE", "STARTER", "PRO", "ENTERPRISE"];
  const currentIdx = PLAN_ORDER.indexOf(currentPlan);

  const formatPrice = (plan: PlanDef) => {
    if (plan.key === "FREE") return "رایگان";
    const p = prices[plan.key];
    if (!p) return "تماس بگیرید";
    return `${p.toLocaleString("fa-IR")} تومان`;
  };

  return (
    <div className="min-h-screen bg-[#07071a] text-white" dir="rtl" style={{ fontFamily: "Vazirmatn, sans-serif" }}>
      <div className="border-b border-white/8 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <Link href="/agent/dashboard" className="text-white/40 hover:text-white text-sm transition-colors">← داشبورد</Link>
          <span className="text-white/20">/</span>
          <Zap className="w-4 h-4 text-violet-400" />
          <span className="font-medium">ارتقای پلن</span>
          <span className="mr-auto text-sm text-white/40">
            پلن فعلی: <span className="text-violet-400 font-semibold">{PLANS.find(p => p.key === currentPlan)?.name ?? currentPlan}</span>
          </span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black mb-3">پلن خودت رو انتخاب کن</h1>
          <p className="text-white/50">بدون قرارداد — هر ماه می‌تونی تغییر بدی</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/25 text-red-300 text-sm rounded-xl px-4 py-3 mb-6 text-center">
            {error}
          </div>
        )}

        <div className="grid grid-cols-4 gap-4">
          {PLANS.map((plan) => {
            const planIdx = PLAN_ORDER.indexOf(plan.key);
            const isCurrent = plan.key === currentPlan;
            const isDowngrade = planIdx < currentIdx;
            const isUpgrade = planIdx > currentIdx;

            return (
              <div
                key={plan.key}
                className={`relative rounded-2xl p-6 border flex flex-col transition-all ${plan.badge ? "border-violet-500/50 bg-violet-500/6 shadow-lg shadow-violet-500/10" : "border-white/10 bg-white/3"} ${isCurrent ? "ring-2 ring-violet-500/40" : ""}`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 right-1/2 translate-x-1/2 text-xs bg-violet-500 text-white px-3 py-1 rounded-full font-medium whitespace-nowrap">
                    {plan.badge}
                  </div>
                )}
                {isCurrent && (
                  <div className="absolute -top-3 left-4 text-xs bg-green-500 text-white px-3 py-1 rounded-full font-medium">
                    پلن فعلی
                  </div>
                )}

                <div className="mb-4">
                  <div className="font-bold text-lg mb-1" style={{ color: plan.color }}>{plan.name}</div>
                  <div className="text-2xl font-black mb-0.5">{formatPrice(plan)}</div>
                  {plan.key !== "FREE" && <div className="text-xs text-white/40">در ماه</div>}
                </div>

                <ul className="space-y-2 mb-6 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-white/70">
                      <Check className="w-3.5 h-3.5 flex-shrink-0" style={{ color: plan.color }} />
                      {f}
                    </li>
                  ))}
                </ul>

                {isCurrent ? (
                  <div className="w-full text-center py-2.5 rounded-xl text-sm border border-green-500/30 text-green-400">
                    ✓ پلن فعلی
                  </div>
                ) : isDowngrade ? (
                  <div className="w-full text-center py-2.5 rounded-xl text-sm text-white/30 border border-white/8 cursor-not-allowed">
                    تنزل پلن
                  </div>
                ) : plan.key === "FREE" ? (
                  <div className="w-full text-center py-2.5 rounded-xl text-sm text-white/30 border border-white/8 cursor-not-allowed">
                    پلن پایه
                  </div>
                ) : (
                  <button
                    onClick={() => upgrade(plan.key)}
                    disabled={loadingPlan === plan.key}
                    className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
                    style={{ background: `${plan.color}22`, border: `1px solid ${plan.color}44`, color: plan.color }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = `${plan.color}33`)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = `${plan.color}22`)}
                  >
                    {loadingPlan === plan.key ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-3.5 h-3.5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                        در حال انتقال...
                      </span>
                    ) : (
                      `ارتقا به ${plan.name} ←`
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-8 bg-white/3 border border-white/8 rounded-2xl p-5 text-center">
          <p className="text-sm text-white/50">
            درگاه پرداخت امن <span className="text-white/70 font-medium">زرین‌پال</span> •
            پس از پرداخت، پلن فوری فعال می‌شه •
            برای سوالات با پشتیبانی تماس بگیرید
          </p>
        </div>
      </div>
    </div>
  );
}
