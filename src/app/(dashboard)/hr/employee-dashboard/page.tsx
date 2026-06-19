"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { LayoutDashboard, Wallet, Calendar, Clock, CheckSquare, User, AlarmClock } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface DashboardData {
  user: { id: string; name: string; email: string; avatar: string | null; department: string | null; position: string | null; phone: string | null; createdAt: string; } | null;
  payroll: { period: string; netPay: number; status: string; paidAt: string | null; } | null;
  leaves: { approved: number; pending: number; total: number; };
  attendance: { presentDays: number; };
  shift: { name: string; startTime: string; endTime: string; color: string; } | null;
  onboarding: { id: string; type: string; status: string; tasks: { id: string; title: string; done: boolean }[]; } | null;
}

export default function EmployeeDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiClient.get("/hr/employee-dashboard");
        setData(res.data.data);
      } catch { toast.error("خطا در بارگذاری"); }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return (
    <div className="space-y-6 max-w-4xl">
      <div className="h-8 w-64 bg-card rounded-xl animate-pulse border border-border" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <div key={i} className="h-28 rounded-2xl bg-card animate-pulse border border-border" />)}
      </div>
    </div>
  );

  if (!data) return <div className="p-12 text-center text-muted-foreground">داده‌ای یافت نشد</div>;

  const { user, payroll, leaves, attendance, shift, onboarding } = data;
  const doneTasks = onboarding?.tasks.filter(t => t.done).length ?? 0;
  const totalTasks = onboarding?.tasks.length ?? 0;
  const onboardingProgress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  const joinDate = user?.createdAt ? new Date(user.createdAt).toLocaleDateString("fa-IR") : "—";

  return (
    <div className="space-y-6 max-w-4xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><LayoutDashboard className="w-6 h-6 text-primary" />داشبورد کارمند</h1>
        <p className="text-muted-foreground text-sm mt-0.5">اطلاعات شخصی و عملکرد شما</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="p-6 rounded-2xl bg-card border border-border flex items-center gap-6">
        <div className="w-16 h-16 rounded-2xl gradient-brand flex items-center justify-center text-2xl font-bold text-black shrink-0">
          {user?.name?.slice(0, 1) ?? "?"}
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-foreground">{user?.name ?? "—"}</h2>
          <p className="text-sm text-muted-foreground">{user?.position ?? "—"} {user?.department ? `· ${user.department}` : ""}</p>
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
            {user?.email && <span className="flex items-center gap-1"><User className="w-3 h-3" />{user.email}</span>}
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />عضویت: {joinDate}</span>
          </div>
        </div>
        {shift && (
          <div className="px-4 py-3 rounded-xl border border-border text-center shrink-0">
            <div className="flex items-center gap-1.5 mb-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: shift.color }} />
              <span className="text-xs font-medium text-foreground">{shift.name}</span>
            </div>
            <p className="text-xs text-muted-foreground">{shift.startTime} — {shift.endTime}</p>
          </div>
        )}
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "آخرین حقوق", value: payroll ? `${(payroll.netPay / 1_000_000).toFixed(1)} م` : "—", sub: payroll?.period ?? "", icon: Wallet, color: "text-amber-400 bg-amber-500/10" },
          { label: "مرخصی تایید شده", value: `${leaves.approved} روز`, sub: `${leaves.pending} در انتظار`, icon: Calendar, color: "text-blue-400 bg-blue-500/10" },
          { label: "حضور این ماه", value: `${attendance.presentDays} روز`, sub: "", icon: Clock, color: "text-emerald-400 bg-emerald-500/10" },
          { label: "شیفت کاری", value: shift?.name ?? "تعریف نشده", sub: shift ? `${shift.startTime}–${shift.endTime}` : "", icon: AlarmClock, color: "text-purple-400 bg-purple-500/10" },
        ].map((c, i) => (
          <motion.div key={c.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}
            className="p-5 rounded-2xl bg-card border border-border">
            <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mb-3", c.color)}><c.icon className="w-4 h-4" /></div>
            <p className="text-lg font-bold text-foreground">{c.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{c.label}</p>
            {c.sub && <p className="text-xs text-muted-foreground/70 mt-0.5">{c.sub}</p>}
          </motion.div>
        ))}
      </div>

      {payroll && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="p-5 rounded-2xl bg-card border border-border">
          <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2"><Wallet className="w-4 h-4 text-primary" />آخرین فیش حقوقی — {payroll.period}</h3>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-2xl font-bold text-foreground">{formatPrice(payroll.netPay)} تومان</p>
              <p className="text-xs text-muted-foreground">خالص دریافتی</p>
            </div>
            <span className={cn("px-3 py-1.5 rounded-full text-sm font-medium",
              payroll.status === "paid" ? "bg-emerald-500/10 text-emerald-400" : payroll.status === "approved" ? "bg-blue-500/10 text-blue-400" : "bg-muted text-muted-foreground")}>
              {{ draft: "پیش‌نویس", approved: "تایید شده", paid: "✓ پرداخت شده" }[payroll.status] ?? payroll.status}
            </span>
          </div>
          {payroll.paidAt && <p className="text-xs text-muted-foreground mt-2">تاریخ پرداخت: {new Date(payroll.paidAt).toLocaleDateString("fa-IR")}</p>}
        </motion.div>
      )}

      {onboarding && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
          className="p-5 rounded-2xl bg-card border border-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-primary" />
              {onboarding.type === "onboarding" ? "چک‌لیست ورود" : "چک‌لیست خروج"}
            </h3>
            <div className="flex items-center gap-2">
              <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${onboardingProgress}%` }} />
              </div>
              <span className="text-xs text-muted-foreground">{doneTasks}/{totalTasks}</span>
            </div>
          </div>
          <div className="space-y-2">
            {onboarding.tasks.map(task => (
              <div key={task.id} className="flex items-center gap-3 p-2.5 rounded-xl bg-muted/30">
                <div className={cn("w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0",
                  task.done ? "bg-primary border-primary" : "border-border")}>
                  {task.done && <CheckSquare className="w-3 h-3 text-primary-foreground" />}
                </div>
                <span className={cn("text-sm", task.done ? "line-through text-muted-foreground" : "text-foreground")}>{task.title}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
