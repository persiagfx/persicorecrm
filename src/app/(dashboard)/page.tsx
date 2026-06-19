"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { DollarSign, Users, Briefcase, TrendingUp, Clock, CheckSquare, RefreshCw, Settings2, Eye, EyeOff, X } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { StatCard } from "@/components/common/StatCard";
import { OnboardingChecklist } from "@/components/onboarding/OnboardingChecklist";
import { useAuth } from "@/lib/auth/context";
import { timeAgo } from "@/lib/utils";
import { DATA_VIZ_COLORS } from "@/lib/constants";
import { useDashboard, useDashboardActiveProjects, dashboardKeys } from "@/lib/api/hooks/useDashboard";
import { useQueryClient } from "@tanstack/react-query";
import { useSSE } from "@/hooks/useSSE";

const PERSIAN_MONTHS: Record<string, string> = {
  "01": "فروردین", "02": "اردیبهشت", "03": "خرداد",
  "04": "تیر", "05": "مرداد", "06": "شهریور",
  "07": "مهر", "08": "آبان", "09": "آذر",
  "10": "دی", "11": "بهمن", "12": "اسفند",
};

const staggerContainer = { animate: { transition: { staggerChildren: 0.06 } } };
const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-muted rounded-lg ${className ?? ""}`} />;
}

const ALL_WIDGETS = [
  { id: "revenue", label: "نمودار درآمد ماهانه" },
  { id: "leads", label: "وضعیت Leadها" },
  { id: "tasks", label: "تسک‌های در جریان" },
  { id: "activity", label: "فعالیت اخیر" },
  { id: "projects", label: "پروژه‌های فعال" },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data, isLoading, isError, refetch } = useDashboard();
  const { data: activeProjects = [], isLoading: projectsLoading } = useDashboardActiveProjects();
  const [showCustomize, setShowCustomize] = useState(false);
  const [hiddenWidgets, setHiddenWidgets] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try { return JSON.parse(localStorage.getItem("crm-dashboard-hidden") ?? "[]"); } catch { return []; }
  });

  const isVisible = (id: string) => !hiddenWidgets.includes(id);
  const toggleWidget = (id: string) => {
    const updated = isVisible(id)
      ? [...hiddenWidgets, id]
      : hiddenWidgets.filter((w) => w !== id);
    setHiddenWidgets(updated);
    localStorage.setItem("crm-dashboard-hidden", JSON.stringify(updated));
  };

  // Invalidate dashboard on realtime events
  useSSE((event) => {
    if (["client.created", "lead.updated", "invoice.paid", "task.completed"].includes(event.type)) {
      qc.invalidateQueries({ queryKey: dashboardKeys.all });
    }
  });

  const stats = data?.stats;
  const revenueByMonth = data?.revenueByMonth ?? [];
  const leadsByStatus = data?.leadsByStatus ?? [];
  const activities = data?.recentActivities ?? [];
  const tasks = data?.pendingTasks ?? [];

  const revenueChartData = revenueByMonth.map((r) => ({
    month: PERSIAN_MONTHS[r.month.slice(5, 7)] ?? r.month,
    revenue: Math.round(Number(r.revenue) / 1_000_000),
  }));

  const leadStatusData = leadsByStatus.map((l) => ({
    name:
      l.status === "won" ? "برنده" :
      l.status === "lost" ? "باخته" :
      l.status === "new" ? "جدید" :
      l.status === "contacted" ? "تماس" :
      l.status === "meeting" ? "جلسه" :
      l.status === "proposal" ? "پروپوزال" :
      l.status === "negotiation" ? "مذاکره" : l.status,
    value: l._count.id,
  }));

  const wonCount = leadsByStatus.find((l) => l.status === "won")?._count.id ?? 0;
  const totalLeads = leadsByStatus.reduce((s, l) => s + l._count.id, 0);
  const convRate = totalLeads > 0 ? Math.round((wonCount / totalLeads) * 100) : 0;

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-muted-foreground">خطا در بارگذاری داشبورد</p>
        <button onClick={() => refetch()} className="flex items-center gap-2 text-sm text-primary hover:underline">
          <RefreshCw className="w-4 h-4" /> تلاش مجدد
        </button>
      </div>
    );
  }

  return (
    <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-6">

      <OnboardingChecklist />

      {/* Greeting */}
      <motion.div variants={fadeUp}>
        <div className="relative overflow-hidden rounded-2xl p-6 bg-card border border-border">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_50%,hsla(43,74%,56%,0.08),transparent_70%)]" />
          <div className="relative flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-1">
                سلام {user?.name?.split(" ")[0]} 👋
              </h1>
              <p className="text-muted-foreground text-sm">
                {isLoading ? "در حال بارگذاری..." : tasks.length > 0
                  ? `امروز ${tasks.length} تسک داری. بریم شروع کنیم!`
                  : "همه تسک‌هات رو تموم کردی، عالیه!"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCustomize(true)}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                title="شخصی‌سازی داشبورد"
              >
                <Settings2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => { refetch(); qc.invalidateQueries({ queryKey: dashboardKeys.activeProjects }); }}
                className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                title="بروزرسانی"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Customize Modal */}
          <AnimatePresence>
            {showCustomize && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
                onClick={() => setShowCustomize(false)}>
                <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-foreground">شخصی‌سازی داشبورد</h3>
                    <button onClick={() => setShowCustomize(false)}><X className="w-4 h-4 text-muted-foreground" /></button>
                  </div>
                  <p className="text-xs text-muted-foreground">ویجت‌هایی که می‌خواهید نمایش داده شوند را انتخاب کنید</p>
                  <div className="space-y-2">
                    {ALL_WIDGETS.map((w) => {
                      const visible = isVisible(w.id);
                      return (
                        <button key={w.id} onClick={() => toggleWidget(w.id)}
                          className="w-full flex items-center justify-between p-3 rounded-xl bg-muted hover:bg-muted/80 transition-colors">
                          <span className="text-sm text-foreground">{w.label}</span>
                          {visible
                            ? <Eye className="w-4 h-4 text-primary" />
                            : <EyeOff className="w-4 h-4 text-muted-foreground" />}
                        </button>
                      );
                    })}
                  </div>
                  <button onClick={() => { setHiddenWidgets([]); localStorage.removeItem("crm-dashboard-hidden"); }}
                    className="w-full text-xs text-muted-foreground hover:text-foreground py-2 transition-colors">
                    بازنشانی به حالت پیش‌فرض
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Stat Cards */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)
        ) : (
          <>
            <StatCard
              title="درآمد این ماه (تومان)"
              value={stats?.revenue ?? 0}
              icon={DollarSign}
              trend={stats?.revenueGrowth ?? 0}
              trendLabel="نسبت به ماه قبل"
              gradient="gradient-brand"
            />
            <StatCard
              title="مشتریان"
              value={stats?.totalClients ?? 0}
              icon={Users}
              trend={stats?.newLeads ?? 0}
              trendLabel="لید جدید این ماه"
            />
            <StatCard
              title="پروژه‌های فعال"
              value={stats?.activeProjects ?? 0}
              icon={Briefcase}
              trend={-(stats?.overdueInvoices ?? 0)}
              trendLabel="فاکتور معوق"
            />
            <StatCard
              title="نرخ تبدیل Lead"
              value={convRate}
              icon={TrendingUp}
              suffix="٪"
              trend={0}
              trendLabel="این ماه"
            />
          </>
        )}
      </motion.div>

      {/* Charts Row */}
      {(isVisible("revenue") || isVisible("leads")) && (
      <motion.div variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Revenue Chart */}
        {isVisible("revenue") && <div className="lg:col-span-2 p-6 rounded-2xl bg-card border border-border">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-semibold text-foreground">درآمد ماهانه</h2>
              <p className="text-xs text-muted-foreground mt-0.5">میلیون تومان</p>
            </div>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />درآمد
            </span>
          </div>
          {isLoading ? (
            <Skeleton className="h-[200px]" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={revenueChartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(43 74% 56%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(43 74% 56%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 6% 14%)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(240 5% 65%)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(240 5% 65%)" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ background: "hsl(240 10% 6%)", border: "1px solid hsl(240 6% 14%)", borderRadius: 12, fontSize: 12 }}
                  labelStyle={{ color: "hsl(0 0% 98%)" }}
                />
                <Area type="monotone" dataKey="revenue" stroke="hsl(43 74% 56%)" strokeWidth={2} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>}

        {/* Lead Status Pie */}
        {isVisible("leads") && <div className="p-6 rounded-2xl bg-card border border-border">
          <h2 className="font-semibold text-foreground mb-1">وضعیت Leadها</h2>
          <p className="text-xs text-muted-foreground mb-4">توزیع بر اساس مرحله</p>
          {isLoading ? (
            <Skeleton className="h-40" />
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={leadStatusData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                    {leadStatusData.map((_, i) => (
                      <Cell key={i} fill={DATA_VIZ_COLORS[i % DATA_VIZ_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(240 10% 6%)", border: "1px solid hsl(240 6% 14%)", borderRadius: 12, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {leadStatusData.map((item, i) => (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <span className="w-2 h-2 rounded-full" style={{ background: DATA_VIZ_COLORS[i % DATA_VIZ_COLORS.length] }} />
                      {item.name}
                    </span>
                    <span className="font-medium text-foreground">{item.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>}
      </motion.div>
      )}

      {/* Bottom Row */}
      {(isVisible("tasks") || isVisible("activity")) && (
      <motion.div variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Pending Tasks */}
        {isVisible("tasks") && <div className="p-6 rounded-2xl bg-card border border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-primary" />
              تسک‌های در جریان
            </h2>
            <span className="text-xs text-muted-foreground">{tasks.length} مورد</span>
          </div>
          {isLoading ? (
            <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
          ) : tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">هیچ تسک فعالی وجود ندارد 🎉</p>
          ) : (
            <div className="space-y-2">
              {tasks.slice(0, 5).map((task) => (
                <motion.div
                  key={task.id}
                  whileHover={{ x: -2 }}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors cursor-pointer"
                >
                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    task.priority === "urgent" ? "bg-red-500" :
                    task.priority === "high" ? "bg-orange-400" :
                    task.priority === "medium" ? "bg-blue-400" : "bg-slate-400"
                  }`} />
                  <span className="text-sm text-foreground flex-1 truncate">{task.title}</span>
                  {task.dueDate && (
                    <span className="text-xs text-muted-foreground shrink-0">
                      {new Date(task.dueDate).toLocaleDateString("fa-IR")}
                    </span>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>}

        {/* Recent Activity */}
        {isVisible("activity") && <div className="p-6 rounded-2xl bg-card border border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              فعالیت اخیر
            </h2>
          </div>
          {isLoading ? (
            <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
          ) : (
            <div className="space-y-3">
              {activities.slice(0, 5).map((log) => (
                <div key={log.id} className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full gradient-brand flex items-center justify-center text-xs font-bold text-black shrink-0">
                    {log.actor?.name.slice(0, 1) ?? "؟"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground leading-relaxed">{log.description}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{timeAgo(log.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>}
      </motion.div>
      )}

      {/* Active Projects */}
      {isVisible("projects") && (
      <motion.div variants={fadeUp}>
        <div className="p-6 rounded-2xl bg-card border border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-primary" />
              پروژه‌های فعال
            </h2>
          </div>
          {projectsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {activeProjects.map((project) => (
                <motion.div
                  key={project.id}
                  whileHover={{ y: -2 }}
                  className="p-4 rounded-xl border border-border hover:border-primary/30 transition-all cursor-pointer bg-background"
                >
                  <div className={`w-full h-1.5 rounded-full bg-gradient-to-r ${project.colorHash} mb-3`} />
                  <h3 className="font-medium text-sm text-foreground truncate">{project.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5 mb-3">{project.client?.companyName}</p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{project.progress}٪</span>
                    <span className="text-muted-foreground">
                      {project.deadline ? new Date(project.deadline).toLocaleDateString("fa-IR") : "—"}
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${project.colorHash} transition-all`}
                      style={{ width: `${project.progress ?? 0}%` }}
                    />
                  </div>
                </motion.div>
              ))}
              {activeProjects.length === 0 && (
                <div className="col-span-3 py-8 text-center text-muted-foreground text-sm">
                  هیچ پروژه فعالی وجود ندارد
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
      )}
    </motion.div>
  );
}
