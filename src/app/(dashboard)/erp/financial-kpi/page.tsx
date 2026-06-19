"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { BarChart2, Wallet, TrendingUp, AlertTriangle, Users, Building2 } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface KPIData {
  revenue: { total: number; paid: number; pending: number; paidThisMonth: number; overdueCount: number };
  banking: { totalBalance: number; accountCount: number };
  payroll: { totalPaidThisYear: number; headCount: number };
  budget: { totalBudget: number; budgetCount: number };
}

const fmt = (n: number) => (n / 1_000_000).toFixed(1) + " م";

export default function FinancialKPIPage() {
  const [data, setData] = useState<KPIData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiClient.get("/erp/financial-kpi");
        setData(res.data.data);
      } catch { toast.error("خطا در بارگذاری"); }
      finally { setLoading(false); }
    })();
  }, []);

  const cards = data ? [
    { label: "کل درآمد فاکتورها", value: fmt(data.revenue.total), sub: `${fmt(data.revenue.paid)} پرداخت شده`, icon: TrendingUp, color: "text-emerald-400 bg-emerald-500/10" },
    { label: "درآمد این ماه", value: fmt(data.revenue.paidThisMonth), sub: `${data.revenue.overdueCount} فاکتور معوق`, icon: Wallet, color: "text-amber-400 bg-amber-500/10" },
    { label: "موجودی بانکی", value: fmt(data.banking.totalBalance), sub: `${data.banking.accountCount} حساب فعال`, icon: Building2, color: "text-blue-400 bg-blue-500/10" },
    { label: "حقوق پرداختی امسال", value: fmt(data.payroll.totalPaidThisYear), sub: `${data.payroll.headCount} دوره پرداخت`, icon: Users, color: "text-purple-400 bg-purple-500/10" },
    { label: "بودجه تعریف‌شده", value: fmt(data.budget.totalBudget), sub: `${data.budget.budgetCount} ردیف بودجه`, icon: BarChart2, color: "text-rose-400 bg-rose-500/10" },
    { label: "بدهکاران معوق", value: `${data.revenue.overdueCount} فاکتور`, sub: "نیاز به پیگیری", icon: AlertTriangle, color: "text-orange-400 bg-orange-500/10" },
  ] : [];

  return (
    <div className="space-y-6 max-w-4xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><BarChart2 className="w-6 h-6 text-primary" />داشبورد KPI مالی</h1>
        <p className="text-muted-foreground text-sm mt-0.5">شاخص‌های کلیدی عملکرد مالی سازمان</p>
      </motion.div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">{[1,2,3,4,5,6].map(i => <div key={i} className="h-28 rounded-2xl bg-card animate-pulse border border-border" />)}</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {cards.map((c, i) => (
            <motion.div key={c.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="p-5 rounded-2xl bg-card border border-border hover:border-white/20 transition-all">
              <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mb-3", c.color)}><c.icon className="w-4 h-4" /></div>
              <p className="text-xl font-bold text-foreground">{c.value}</p>
              <p className="text-sm text-muted-foreground mt-0.5">{c.label}</p>
              <p className="text-xs text-muted-foreground/70 mt-1">{c.sub}</p>
            </motion.div>
          ))}
        </div>
      )}

      {data && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          className="p-6 rounded-2xl bg-card border border-border">
          <h3 className="font-semibold text-foreground mb-4">وضعیت مالی کلی</h3>
          <div className="space-y-3">
            {[
              { label: "نرخ وصول مطالبات", value: data.revenue.total > 0 ? ((data.revenue.paid / data.revenue.total) * 100).toFixed(1) + "%" : "—", color: "bg-emerald-500" },
              { label: "نسبت هزینه حقوق به درآمد", value: data.revenue.paid > 0 ? ((data.payroll.totalPaidThisYear / data.revenue.paid) * 100).toFixed(1) + "%" : "—", color: "bg-blue-500" },
              { label: "پوشش بودجه", value: data.budget.totalBudget > 0 ? ((data.revenue.paid / data.budget.totalBudget) * 100).toFixed(1) + "%" : "—", color: "bg-purple-500" },
            ].map(row => (
              <div key={row.label} className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground w-48 shrink-0">{row.label}</span>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div className={cn("h-full rounded-full", row.color)} style={{ width: Math.min(parseFloat(row.value) || 0, 100) + "%" }} />
                </div>
                <span className="text-sm font-semibold text-foreground w-16 text-left">{row.value}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
