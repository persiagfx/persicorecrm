"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { useContentAuth } from "@/lib/content-auth/context";
import { useRouter } from "next/navigation";
import { CreditCard, Check, ArrowRight, Zap, Crown, Sparkles, Star } from "lucide-react";
import { toast } from "sonner";

export default function BillingPage() {
  const { user, isLoading, refreshUser } = useContentAuth();
  const router = useRouter();
  const [settings, setSettings] = useState({ proPlanPrice: 0, plusPlanPrice: 0, proPlanLimit: 20, plusPlanLimit: 50 });
  const [upgrading, setUpgrading] = useState<string | null>(null);

  const token = typeof window !== "undefined" ? localStorage.getItem("content-token") : null;

  useEffect(() => {
    if (!isLoading && !user) router.push("/content/login");
  }, [user, isLoading, router]);

  useEffect(() => {
    // Fetch public pricing (we can reuse the admin endpoint for now or make a public one)
    // For now just show static plans until admin sets prices
  }, []);

  const handleUpgrade = async (plan: "PRO" | "PLUS") => {
    setUpgrading(plan);
    try {
      const res = await fetch("/api/content/billing/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      window.location.href = data.data.startPayUrl;
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "خطا در اتصال به درگاه پرداخت");
      setUpgrading(null);
    }
  };

  const plans = [
    {
      id: "FREE",
      label: "رایگان",
      price: 0,
      limit: 5,
      icon: Sparkles,
      gradient: "from-slate-500 to-gray-600",
      features: ["۵ تولید محتوا در ماه", "همه پلتفرم‌ها", "متن و تصویر AI", "ادیتور متن حرفه‌ای", "تحلیل SEO"],
      cta: "پلن فعلی",
      disabled: true,
    },
    {
      id: "PRO",
      label: "پرو",
      price: settings.proPlanPrice,
      limit: settings.proPlanLimit,
      icon: Zap,
      gradient: "from-violet-500 to-indigo-600",
      popular: true,
      features: ["۲۰ تولید محتوا در ماه", "همه پلتفرم‌ها", "متن و تصویر AI", "ادیتور تصویر پیشرفته", "تحلیل SEO کامل", "تاریخچه نامحدود"],
      cta: "ارتقا به پرو",
    },
    {
      id: "PLUS",
      label: "پلاس",
      price: settings.plusPlanPrice,
      limit: settings.plusPlanLimit,
      icon: Crown,
      gradient: "from-amber-400 to-orange-500",
      features: ["۵۰ تولید محتوا در ماه", "همه پلتفرم‌ها", "متن و تصویر AI", "همه امکانات پرو", "پشتیبانی اولویت‌دار", "دسترسی زودهنگام به ویژگی‌های جدید"],
      cta: "ارتقا به پلاس",
    },
  ];

  if (isLoading) return (
    <div className="min-h-screen bg-[#050508] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050508] text-white" dir="rtl">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] rounded-full bg-violet-600/10 blur-[120px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff04_1px,transparent_1px),linear-gradient(to_bottom,#ffffff04_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      <header className="relative z-10 border-b border-white/5 bg-black/20 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
          <button onClick={() => router.push("/content")}
            className="flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors text-sm">
            <ArrowRight className="w-4 h-4" /> برگشت
          </button>
          <CreditCard className="w-5 h-5 text-violet-400" />
          <h1 className="font-bold text-white">پلن‌ها</h1>
        </div>
      </header>

      <main className="relative z-10 max-w-5xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold text-white mb-3">
            پلن مناسب خود را انتخاب کنید
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            className="text-white/40">
            پلن فعلی شما: <span className="text-violet-400 font-semibold">{user?.plan === "UNLIMITED" ? "نامحدود (CRM)" : user?.plan}</span>
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan, i) => {
            const Icon = plan.icon;
            const isCurrentPlan = user?.plan === plan.id;
            return (
              <motion.div key={plan.id}
                initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`relative rounded-2xl border overflow-hidden ${
                  plan.popular
                    ? "border-violet-500/40 bg-violet-500/5 shadow-2xl shadow-violet-500/10"
                    : "border-white/10 bg-white/3"
                }`}>
                {plan.popular && (
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500 to-indigo-500" />
                )}
                {plan.popular && (
                  <div className="absolute top-3 left-4">
                    <span className="flex items-center gap-1 bg-violet-500/20 border border-violet-500/30 text-violet-300 text-xs px-2 py-0.5 rounded-full">
                      <Star className="w-3 h-3" /> محبوب‌ترین
                    </span>
                  </div>
                )}

                <div className="p-6 pt-8">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${plan.gradient} flex items-center justify-center mb-4 shadow-lg`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1">{plan.label}</h3>
                  <div className="mb-1">
                    {plan.price > 0 ? (
                      <div>
                        <span className="text-3xl font-bold text-white">{plan.price.toLocaleString("fa-IR")}</span>
                        <span className="text-white/40 text-sm mr-1">تومان/ماه</span>
                      </div>
                    ) : (
                      <span className="text-3xl font-bold text-white">رایگان</span>
                    )}
                  </div>
                  <p className="text-white/40 text-sm mb-6">{plan.limit} تولید در ماه</p>

                  <ul className="space-y-2.5 mb-6">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        <span className="text-white/60">{f}</span>
                      </li>
                    ))}
                  </ul>

                  <motion.button
                    whileHover={!isCurrentPlan && !plan.disabled ? { scale: 1.02 } : {}}
                    whileTap={!isCurrentPlan && !plan.disabled ? { scale: 0.98 } : {}}
                    onClick={() => !isCurrentPlan && plan.id !== "FREE" && handleUpgrade(plan.id as "PRO" | "PLUS")}
                    disabled={isCurrentPlan || plan.disabled || upgrading === plan.id}
                    className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
                      isCurrentPlan
                        ? "bg-white/5 border border-white/10 text-white/30 cursor-default"
                        : plan.popular
                        ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40"
                        : "bg-white/8 border border-white/15 text-white/70 hover:bg-white/12"
                    }`}>
                    {upgrading === plan.id ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        در حال اتصال...
                      </div>
                    ) : isCurrentPlan ? "پلن فعلی" : plan.cta}
                  </motion.button>
                </div>
              </motion.div>
            );
          })}
        </div>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="text-center text-white/20 text-sm mt-8">
          پرداخت امن از طریق زرین‌پال · لغو اشتراک در هر زمان
        </motion.p>
      </main>
    </div>
  );
}
