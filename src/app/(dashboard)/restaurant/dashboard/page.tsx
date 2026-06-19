"use client";
import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { ChefHat, UtensilsCrossed, TableProperties, ShoppingCart, TrendingUp, Clock, Users, DollarSign } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { formatPrice } from "@/lib/utils";
import { StatCard } from "@/components/common/StatCard";
import { apiClient } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import Link from "next/link";

// ────────── Types ──────────
type OrderStatus = "pending" | "preparing" | "ready" | "served";

interface OrderItem {
  name: string;
  qty: number;
}

interface LiveOrder {
  id: string;
  tableNumber: number;
  items: OrderItem[];
  status: OrderStatus;
  createdAt: Date;
  total: number;
}

interface DayRevenue {
  day: string;
  revenue: number;
}

interface TopItem {
  name: string;
  count: number;
}

// ────────── Mock data (replace with apiClient calls) ──────────
const MOCK_ORDERS: LiveOrder[] = [
  { id: "ord-001", tableNumber: 4, items: [{ name: "چلو کباب کوبیده", qty: 2 }, { name: "دوغ", qty: 2 }], status: "preparing", createdAt: new Date(Date.now() - 8 * 60 * 1000), total: 320000 },
  { id: "ord-002", tableNumber: 7, items: [{ name: "جوجه کباب", qty: 1 }, { name: "نان سنگک", qty: 2 }], status: "ready", createdAt: new Date(Date.now() - 22 * 60 * 1000), total: 185000 },
  { id: "ord-003", tableNumber: 2, items: [{ name: "قرمه سبزی", qty: 3 }, { name: "ماست موسیر", qty: 1 }], status: "pending", createdAt: new Date(Date.now() - 3 * 60 * 1000), total: 270000 },
  { id: "ord-004", tableNumber: 9, items: [{ name: "فسنجان", qty: 2 }], status: "served", createdAt: new Date(Date.now() - 45 * 60 * 1000), total: 240000 },
  { id: "ord-005", tableNumber: 1, items: [{ name: "کتلت", qty: 4 }, { name: "نوشابه", qty: 4 }], status: "preparing", createdAt: new Date(Date.now() - 12 * 60 * 1000), total: 460000 },
  { id: "ord-006", tableNumber: 5, items: [{ name: "چلو ماهی", qty: 2 }, { name: "سالاد شیرازی", qty: 1 }], status: "ready", createdAt: new Date(Date.now() - 30 * 60 * 1000), total: 310000 },
  { id: "ord-007", tableNumber: 3, items: [{ name: "بریانی", qty: 1 }], status: "served", createdAt: new Date(Date.now() - 60 * 60 * 1000), total: 95000 },
  { id: "ord-008", tableNumber: 8, items: [{ name: "کباب بختیاری", qty: 2 }, { name: "دلمه", qty: 1 }], status: "pending", createdAt: new Date(Date.now() - 1 * 60 * 1000), total: 385000 },
  { id: "ord-009", tableNumber: 6, items: [{ name: "میرزا قاسمی", qty: 2 }, { name: "نان لواش", qty: 4 }], status: "preparing", createdAt: new Date(Date.now() - 17 * 60 * 1000), total: 190000 },
  { id: "ord-010", tableNumber: 11, items: [{ name: "آبگوشت", qty: 3 }], status: "served", createdAt: new Date(Date.now() - 90 * 60 * 1000), total: 225000 },
];

const MOCK_REVENUE_7DAYS: DayRevenue[] = [
  { day: "شنبه", revenue: 4200000 },
  { day: "یکشنبه", revenue: 3800000 },
  { day: "دوشنبه", revenue: 5100000 },
  { day: "سه‌شنبه", revenue: 4700000 },
  { day: "چهارشنبه", revenue: 6200000 },
  { day: "پنجشنبه", revenue: 7800000 },
  { day: "جمعه", revenue: 9100000 },
];

const MOCK_TOP_ITEMS: TopItem[] = [
  { name: "چلو کباب کوبیده", count: 48 },
  { name: "جوجه کباب", count: 37 },
  { name: "قرمه سبزی", count: 29 },
  { name: "فسنجان", count: 21 },
  { name: "چلو ماهی", count: 18 },
  { name: "بریانی", count: 14 },
];

// ────────── Helpers ──────────
function elapsedMinutes(date: Date): number {
  return Math.floor((Date.now() - date.getTime()) / 60000);
}

function formatElapsed(minutes: number): string {
  if (minutes < 60) return `${minutes} دقیقه پیش`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h} ساعت${m > 0 ? ` و ${m} دقیقه` : ""} پیش`;
}

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; bg: string }> = {
  pending:   { label: "در انتظار", color: "text-amber-400",  bg: "bg-amber-400/10 border-amber-400/20" },
  preparing: { label: "در حال آماده‌سازی", color: "text-blue-400",  bg: "bg-blue-400/10 border-blue-400/20" },
  ready:     { label: "آماده سرو",   color: "text-emerald-400", bg: "bg-emerald-400/10 border-emerald-400/20" },
  served:    { label: "سرو شده",   color: "text-slate-400",  bg: "bg-slate-400/10 border-slate-400/20" },
};

const staggerContainer = { animate: { transition: { staggerChildren: 0.07 } } };
const fadeUp = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse bg-muted rounded-lg", className)} />;
}

// ────────── Main Component ──────────
export default function RestaurantDashboardPage() {
  const [orders, setOrders] = useState<LiveOrder[]>(MOCK_ORDERS);
  const [revenueData] = useState<DayRevenue[]>(MOCK_REVENUE_7DAYS);
  const [topItems] = useState<TopItem[]>(MOCK_TOP_ITEMS);
  const [now, setNow] = useState(new Date());
  const [isLoading] = useState(false);

  // Tick every minute to refresh elapsed times
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  // ── Computed stats ──
  const todayRevenue = orders.reduce((s, o) => s + o.total, 0);
  const totalOrders = orders.length;
  const tablesOccupied = new Set(orders.filter((o) => o.status !== "served").map((o) => o.tableNumber)).size;
  const totalTables = 15;
  const avgOrderValue = totalOrders > 0 ? Math.round(todayRevenue / totalOrders) : 0;

  // Format revenue in millions for the chart tooltip
  const formatChartRevenue = (v: number) =>
    `${(v / 1_000_000).toLocaleString("fa-IR")} م.ت`;

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="space-y-6"
      dir="rtl"
    >
      {/* ── Header ── */}
      <motion.div variants={fadeUp}>
        <div className="relative overflow-hidden rounded-2xl p-6 bg-card border border-border">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_50%,hsla(25,80%,50%,0.08),transparent_70%)]" />
          <div className="relative flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                <ChefHat className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">داشبورد رستوران</h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {now.toLocaleDateString("fa-IR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <Link
                href="/restaurant/orders/new"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium transition-colors"
              >
                <ShoppingCart className="w-4 h-4" />
                سفارش جدید
              </Link>
              <Link
                href="/restaurant/tables"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-muted hover:bg-muted/70 text-foreground text-sm font-medium transition-colors border border-border"
              >
                <TableProperties className="w-4 h-4" />
                میزها
              </Link>
              <Link
                href="/restaurant/menu"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-muted hover:bg-muted/70 text-foreground text-sm font-medium transition-colors border border-border"
              >
                <UtensilsCrossed className="w-4 h-4" />
                منو
              </Link>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Stat Cards ── */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)
        ) : (
          <>
            <StatCard
              title="سفارشات امروز"
              value={totalOrders}
              icon={ShoppingCart}
              trend={12}
              trendLabel="نسبت به دیروز"
              gradient="bg-orange-500/10"
            />
            <StatCard
              title="درآمد امروز (تومان)"
              value={todayRevenue}
              icon={DollarSign}
              trend={8}
              trendLabel="نسبت به دیروز"
              gradient="bg-emerald-500/10"
            />
            <StatCard
              title="میزهای اشغال"
              value={tablesOccupied}
              suffix={` / ${totalTables}`}
              icon={TableProperties}
              gradient="bg-blue-500/10"
            />
            <StatCard
              title="میانگین هر سفارش"
              value={avgOrderValue}
              icon={TrendingUp}
              gradient="bg-purple-500/10"
            />
          </>
        )}
      </motion.div>

      {/* ── Charts Row ── */}
      <motion.div variants={fadeUp} className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Revenue 7 days */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-card border border-border">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-semibold text-foreground">درآمد ۷ روز اخیر</h2>
              <p className="text-xs text-muted-foreground mt-0.5">تومان</p>
            </div>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-400" />
              درآمد روزانه
            </span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={revenueData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRestRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="hsl(25 90% 55%)" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="hsl(25 90% 55%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="day"
                tick={{ fontSize: 11, fill: "hsl(240 5% 65%)" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}م`}
                tick={{ fontSize: 10, fill: "hsl(240 5% 65%)" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(v: number) => [formatChartRevenue(v), "درآمد"]}
                contentStyle={{
                  background: "hsl(240 10% 6%)",
                  border: "1px solid hsl(240 6% 14%)",
                  borderRadius: 12,
                  fontSize: 12,
                  direction: "rtl",
                }}
                labelStyle={{ color: "hsl(0 0% 98%)" }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="hsl(25 90% 55%)"
                strokeWidth={2}
                fill="url(#colorRestRevenue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Top selling items */}
        <div className="p-6 rounded-2xl bg-card border border-border">
          <h2 className="font-semibold text-foreground mb-1">پرفروش‌ترین آیتم‌ها</h2>
          <p className="text-xs text-muted-foreground mb-4">بر اساس تعداد سفارش امروز</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={topItems}
              layout="vertical"
              margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
            >
              <XAxis type="number" tick={{ fontSize: 10, fill: "hsl(240 5% 65%)" }} axisLine={false} tickLine={false} />
              <YAxis
                type="category"
                dataKey="name"
                width={110}
                tick={{ fontSize: 10, fill: "hsl(240 5% 65%)" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={(v: number) => [v, "تعداد"]}
                contentStyle={{
                  background: "hsl(240 10% 6%)",
                  border: "1px solid hsl(240 6% 14%)",
                  borderRadius: 12,
                  fontSize: 12,
                  direction: "rtl",
                }}
              />
              <Bar dataKey="count" fill="hsl(25 90% 55%)" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* ── Live Orders ── */}
      <motion.div variants={fadeUp}>
        <div className="p-6 rounded-2xl bg-card border border-border">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-400" />
              <h2 className="font-semibold text-foreground">سفارشات زنده</h2>
              <span className="text-xs bg-orange-400/10 text-orange-400 border border-orange-400/20 px-2 py-0.5 rounded-full">
                {orders.filter((o) => o.status !== "served").length} فعال
              </span>
            </div>
            <span className="text-xs text-muted-foreground">{orders.length} سفارش آخر</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5 gap-3">
            {orders.map((order, idx) => {
              const cfg = STATUS_CONFIG[order.status];
              const elapsed = elapsedMinutes(order.createdAt);
              const isUrgent = order.status === "preparing" && elapsed > 20;

              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05, duration: 0.3 }}
                  whileHover={{ y: -2 }}
                  className={cn(
                    "relative p-4 rounded-xl border transition-all cursor-pointer",
                    "bg-background hover:bg-muted/30",
                    isUrgent ? "border-red-500/40 shadow-[0_0_12px_rgba(239,68,68,0.1)]" : "border-border hover:border-border/80"
                  )}
                >
                  {/* Urgent indicator */}
                  {isUrgent && (
                    <span className="absolute top-2 left-2 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  )}

                  {/* Table number */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-orange-500/10 flex items-center justify-center">
                        <span className="text-xs font-bold text-orange-400">
                          {order.tableNumber.toLocaleString("fa-IR")}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">میز</span>
                    </div>
                    <span className={cn(
                      "text-[10px] font-medium px-2 py-0.5 rounded-full border",
                      cfg.bg, cfg.color
                    )}>
                      {cfg.label}
                    </span>
                  </div>

                  {/* Items summary */}
                  <div className="space-y-1 mb-3 min-h-[40px]">
                    {order.items.slice(0, 2).map((item, i) => (
                      <p key={i} className="text-xs text-foreground truncate">
                        <span className="text-muted-foreground ml-1">×{item.qty.toLocaleString("fa-IR")}</span>
                        {item.name}
                      </p>
                    ))}
                    {order.items.length > 2 && (
                      <p className="text-[10px] text-muted-foreground">
                        +{(order.items.length - 2).toLocaleString("fa-IR")} آیتم دیگر
                      </p>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-2 border-t border-border/50">
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatElapsed(elapsed)}
                    </span>
                    <span className="text-xs font-semibold text-foreground">
                      {order.total.toLocaleString("fa-IR")} ت
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
