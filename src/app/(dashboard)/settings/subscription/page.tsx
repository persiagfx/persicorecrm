"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  Zap, CheckCircle2, Building2, Clock, Users, Briefcase,
  CreditCard, AlertTriangle, RefreshCw, ArrowUpRight, Star,
} from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { toJalali } from "@/lib/utils";
import { toast } from "sonner";

interface TenantInfo {
  id: string; name: string; plan: string; status: string;
  trialEndsAt: string | null; maxUsers: number; maxClients: number;
  _count: { users: number }; clientCount: number;
  payments: { id: string; amount: number; plan: string; status: string; createdAt: string }[];
}

const PLANS = [
  {
    key: "starter",
    name: "Starter",
    price: 490000,
    priceLabel: "۴۹۰,۰۰۰",
    maxUsers: 5, maxClients: 100,
    color: "border-blue-500/30 hover:border-blue-500/60",
    activeBg: "bg-blue-600/10",
    badge: null,
    features: ["تا ۵ کاربر", "تا ۱۰۰ مشتری", "CRM کامل", "فاکتورسازی", "پشتیبانی ایمیلی"],
  },
  {
    key: "professional",
    name: "Pro",
    price: 990000,
    priceLabel: "۹۹۰,۰۰۰",
    maxUsers: 20, maxClients: 500,
    color: "border-violet-500/50 hover:border-violet-400",
    activeBg: "bg-violet-600/10",
    badge: "محبوب‌ترین",
    features: ["تا ۲۰ کاربر", "تا ۵۰۰ مشتری", "همه امکانات Starter", "حقوق و دستمزد", "گزارش پیشرفته", "API دسترسی"],
  },
  {
    key: "enterprise",
    name: "Enterprise",
    price: 0,
    priceLabel: "تماس",
    maxUsers: 999, maxClients: 99999,
    color: "border-emerald-500/30 hover:border-emerald-500/60",
    activeBg: "bg-emerald-600/10",
    badge: null,
    features: ["کاربران نامحدود", "مشتریان نامحدود", "سرور اختصاصی", "پشتیبانی ۲۴/۷"],
  },
];

function daysLeft(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86400000));
}

export default function SubscriptionPage() {
  const [tenant, setTenant] = useState<TenantInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState("");

  useEffect(() => {
    apiClient.get("/tenant/me")
      .then(r => setTenant(r.data.data))
      .catch(() => toast.error("خطا در بارگذاری"))
      .finally(() => setLoading(false));
  }, []);

  const handleUpgrade = async (plan: string) => {
    if (plan === "enterprise") {
      toast.info("برای پلن Enterprise با پشتیبانی تماس بگیرید");
      return;
    }
    setUpgrading(plan);
    try {
      const r = await apiClient.post("/billing/pay", { plan });
      const { startPayUrl } = r.data.data;
      window.location.href = startPayUrl;
    } catch (err: any) {
      toast.error(err?.response?.data?.error ?? "خطا در اتصال به درگاه پرداخت");
      setUpgrading("");
    }
  };

  const days = daysLeft(tenant?.trialEndsAt ?? null);
  const isExpired = tenant?.plan === "trial" && days !== null && days === 0;
  const userUsage = tenant ? Math.round((tenant._count.users / tenant.maxUsers) * 100) : 0;
  const clientUsage = tenant ? Math.round((tenant.clientCount / tenant.maxClients) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-violet-400" />مدیریت اشتراک
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">پلن فعلی، مصرف و تاریخچه پرداخت‌ها</p>
      </motion.div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-32 rounded-2xl bg-white/5 animate-pulse" />)}
        </div>
      ) : tenant && (
        <>
          {/* Current Plan Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Plan card */}
            <div className="p-4 rounded-2xl bg-violet-500/5 border border-violet-500/20 space-y-2">
              <div className="flex items-center gap-2 text-sm text-white/50">
                <Zap className="w-4 h-4 text-violet-400" />پلن فعلی
              </div>
              <p className="text-2xl font-black text-white capitalize">{tenant.plan}</p>
              {tenant.plan === "trial" && days !== null && (
                <div className={cn("flex items-center gap-1 text-xs font-medium", isExpired ? "text-red-400" : days <= 3 ? "text-amber-400" : "text-emerald-400")}>
                  {isExpired ? <AlertTriangle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                  {isExpired ? "منقضی شده" : `${days} روز باقی`}
                </div>
              )}
              {tenant.trialEndsAt && !isExpired && (
                <p className="text-xs text-white/25">انقضا: {toJalali(tenant.trialEndsAt)}</p>
              )}
            </div>

            {/* Users */}
            <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-white/50">
                  <Users className="w-4 h-4 text-blue-400" />کاربران
                </div>
                <span className="text-sm font-bold text-white">{tenant._count.users} / {tenant.maxUsers}</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div className={cn("h-full rounded-full transition-all", userUsage >= 90 ? "bg-red-500" : userUsage >= 70 ? "bg-amber-500" : "bg-blue-500")}
                  style={{ width: `${Math.min(100, userUsage)}%` }} />
              </div>
              <p className="text-xs text-white/25">{userUsage}% مصرف شده</p>
            </div>

            {/* Clients */}
            <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-white/50">
                  <Briefcase className="w-4 h-4 text-emerald-400" />مشتریان
                </div>
                <span className="text-sm font-bold text-white">{tenant.clientCount} / {tenant.maxClients}</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div className={cn("h-full rounded-full transition-all", clientUsage >= 90 ? "bg-red-500" : clientUsage >= 70 ? "bg-amber-500" : "bg-emerald-500")}
                  style={{ width: `${Math.min(100, clientUsage)}%` }} />
              </div>
              <p className="text-xs text-white/25">{clientUsage}% مصرف شده</p>
            </div>
          </div>

          {/* Plan Cards */}
          <div>
            <h2 className="text-sm font-semibold text-white/50 mb-3">انتخاب پلن</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {PLANS.map(plan => {
                const isActive = tenant.plan === plan.key;
                return (
                  <div key={plan.key}
                    className={cn("relative p-5 rounded-2xl border transition-all", plan.color, isActive && plan.activeBg)}>
                    {plan.badge && (
                      <span className="absolute -top-2.5 left-4 text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-600 text-white flex items-center gap-1">
                        <Star className="w-2.5 h-2.5" />{plan.badge}
                      </span>
                    )}
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-white">{plan.name}</h3>
                      {isActive && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/20">
                          فعال
                        </span>
                      )}
                    </div>
                    <p className="text-xl font-black mb-4">
                      {plan.price > 0 ? (
                        <><span className="text-white">{plan.priceLabel}</span><span className="text-xs text-white/30 font-normal"> ت/ماه</span></>
                      ) : (
                        <span className="text-emerald-400">{plan.priceLabel}</span>
                      )}
                    </p>
                    <ul className="space-y-1.5 mb-4">
                      {plan.features.map(f => (
                        <li key={f} className="flex items-center gap-2 text-xs text-white/50">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />{f}
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => !isActive && handleUpgrade(plan.key)}
                      disabled={isActive || upgrading === plan.key}
                      className={cn(
                        "w-full py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all",
                        isActive
                          ? "bg-white/5 text-white/30 cursor-default"
                          : plan.key === "pro"
                            ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:shadow-lg hover:shadow-violet-500/20"
                            : "bg-white/5 border border-white/10 text-white/70 hover:bg-white/10"
                      )}
                    >
                      {upgrading === plan.key ? <RefreshCw className="w-3 h-3 animate-spin" /> : null}
                      {isActive ? "پلن فعلی" : plan.key === "enterprise" ? "تماس بگیرید" : "ارتقا به این پلن"}
                      {!isActive && plan.key !== "enterprise" && <ArrowUpRight className="w-3 h-3" />}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Payment History */}
          {tenant.payments.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-white/50 mb-3">تاریخچه پرداخت‌ها</h2>
              <div className="rounded-2xl border border-white/[0.07] overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-white/[0.03]">
                    <tr>
                      {["تاریخ", "پلن", "مبلغ", "وضعیت"].map(h => (
                        <th key={h} className="text-right px-4 py-2.5 text-xs text-white/40 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {tenant.payments.map(p => (
                      <tr key={p.id} className="hover:bg-white/[0.02]">
                        <td className="px-4 py-2.5 text-xs text-white/40">{toJalali(p.createdAt)}</td>
                        <td className="px-4 py-2.5 text-xs text-white/60 capitalize">{p.plan}</td>
                        <td className="px-4 py-2.5 text-xs text-white/70">{p.amount.toLocaleString("fa-IR")} تومان</td>
                        <td className="px-4 py-2.5">
                          <span className={cn("text-[10px] px-2 py-0.5 rounded-full",
                            p.status === "paid" ? "bg-emerald-500/15 text-emerald-400" :
                            p.status === "failed" ? "bg-red-500/15 text-red-400" :
                            "bg-amber-500/15 text-amber-400"
                          )}>
                            {p.status === "paid" ? "پرداخت شده" : p.status === "failed" ? "ناموفق" : "در انتظار"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* No tenant state */}
      {!loading && !tenant && (
        <div className="text-center py-16">
          <Building2 className="w-12 h-12 mx-auto mb-4 text-white/10" />
          <p className="text-white/30">این حساب به workspace متصل نیست</p>
          <p className="text-white/15 text-sm mt-1">برای استفاده از امکانات SaaS، از طریق صفحه ثبت‌نام workspace بسازید</p>
        </div>
      )}
    </div>
  );
}
