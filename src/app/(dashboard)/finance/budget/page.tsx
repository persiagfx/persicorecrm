"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { Target, TrendingDown, TrendingUp, RefreshCw, Tag } from "lucide-react";
import { formatPrice } from "@/lib/utils";
const fmtR = (amount: number, short = false) => formatPrice(amount, short);
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { apiClient } from "@/lib/api/client";

// ── Types ─────────────────────────────────────────────────────────────────────
interface MonthRow {
  month: string;
  monthNum: number;
  budgeted: number;
  actual: number;
  revenue: number;
}

interface CategoryRow {
  category: string;
  total: number;
  count: number;
}

interface BudgetData {
  budgeted: number;
  actualSpend: number;
  actualRevenue: number;
  targetRevenue: number;
  byMonth: MonthRow[];
  byCategory: CategoryRow[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const STORAGE_KEY = "budget-category-limits";

function getCategoryLimits(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function saveCategoryLimits(limits: Record<string, number>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(limits));
}

function pct(value: number, target: number): number {
  if (!target || !value) return 0;
  return Math.min(100, Math.round((value / target) * 100));
}

const CATEGORY_LABELS: Record<string, string> = {
  travel: "سفر و ایاب‌وذهاب",
  tools: "ابزار و نرم‌افزار",
  marketing: "بازاریابی",
  office: "اداری",
  salary: "حقوق و دستمزد",
  hosting: "هاستینگ",
  other: "سایر",
};

// ── Progress bar ──────────────────────────────────────────────────────────────
function ProgressBar({ value, max, color = "bg-primary" }: { value: number; max: number; color?: string }) {
  const p = pct(value, max);
  return (
    <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
      <div
        className={cn("h-full rounded-full transition-all duration-500", color)}
        style={{ width: `${p}%` }}
      />
    </div>
  );
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KpiCard({
  title, actual, target, icon: Icon, positiveWhenOver = false,
}: {
  title: string;
  actual: number;
  target: number;
  icon: React.ElementType;
  positiveWhenOver?: boolean;
}) {
  const p = pct(actual, target);
  const over = p >= 100;
  const barColor = positiveWhenOver
    ? over ? "bg-emerald-500" : "bg-primary"
    : over ? "bg-red-500" : "bg-emerald-500";
  const valueColor = positiveWhenOver
    ? over ? "text-emerald-400" : "text-foreground"
    : over ? "text-red-400" : "text-foreground";

  return (
    <div className="p-5 rounded-2xl bg-card border border-border space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{title}</span>
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      <p className={cn("text-2xl font-bold tabular-nums", valueColor)}>
        {fmtR(actual, true)}
      </p>
      <div className="space-y-1">
        <ProgressBar value={actual} max={target} color={barColor} />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{p}٪ از هدف</span>
          <span>هدف: {fmtR(target, true)}</span>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function BudgetPage() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [data, setData] = useState<BudgetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [categoryLimits, setCategoryLimits] = useState<Record<string, number>>({});
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  // Load category limits from localStorage on mount
  useEffect(() => {
    setCategoryLimits(getCategoryLimits());
  }, []);

  const fetchData = () => {
    setLoading(true);
    apiClient
      .get("/finance/budget-actual", { params: { year } })
      .then((r) => setData(r.data.data))
      .catch(() => toast.error("خطا در دریافت داده‌های بودجه"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year]);

  const d = data;
  const netProfit = (d?.actualRevenue ?? 0) - (d?.actualSpend ?? 0);

  // Chart data: convert to millions for readability
  const chartData = (d?.byMonth ?? []).map((row) => ({
    month: row.month,
    "بودجه": Math.round(row.budgeted / 1_000_000),
    "هزینه واقعی": Math.round(row.actual / 1_000_000),
    "درآمد": Math.round(row.revenue / 1_000_000),
  }));

  function handleSaveLimit(category: string) {
    const val = Number(editValue.replace(/,/g, ""));
    if (isNaN(val) || val < 0) {
      toast.error("مقدار معتبر وارد کنید");
      return;
    }
    const updated = { ...categoryLimits, [category]: val };
    setCategoryLimits(updated);
    saveCategoryLimits(updated);
    setEditingCategory(null);
    toast.success("بودجه دسته‌بندی ذخیره شد");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Target className="w-6 h-6 text-primary" />
            بودجه در مقابل واقعی
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            مقایسه بودجه برنامه‌ریزی‌شده با هزینه‌ها و درآمد واقعی
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Year selector */}
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="px-3 py-2 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted border border-border text-sm hover:bg-muted/80 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          </button>
        </div>
      </motion.div>

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 rounded-2xl bg-card border border-border animate-pulse" />
          ))}
        </div>
      )}

      {!loading && d && (
        <>
          {/* KPI Cards */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <KpiCard
              title="درآمد واقعی در برابر هدف"
              actual={d.actualRevenue}
              target={d.targetRevenue || d.actualRevenue || 1}
              icon={TrendingUp}
              positiveWhenOver
            />
            <KpiCard
              title="هزینه واقعی در برابر بودجه"
              actual={d.actualSpend}
              target={d.budgeted || d.actualSpend || 1}
              icon={TrendingDown}
              positiveWhenOver={false}
            />
            {/* Net Profit card */}
            <div className="p-5 rounded-2xl bg-card border border-border space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">سود خالص</span>
                <Target className="w-4 h-4 text-muted-foreground" />
              </div>
              <p className={cn("text-2xl font-bold tabular-nums", netProfit >= 0 ? "text-emerald-400" : "text-red-400")}>
                {fmtR(netProfit, true)}
              </p>
              <div className="text-xs text-muted-foreground flex justify-between">
                <span>درآمد: {fmtR(d.actualRevenue, true)}</span>
                <span>هزینه: {fmtR(d.actualSpend, true)}</span>
              </div>
            </div>
          </motion.div>

          {/* Monthly Bar Chart */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-6 rounded-2xl bg-card border border-border"
          >
            <h2 className="font-semibold text-foreground mb-4">
              مقایسه ماهانه (میلیون تومان)
            </h2>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 6% 14%)" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 10, fill: "hsl(240 5% 65%)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "hsl(240 5% 65%)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(240 10% 6%)",
                    border: "1px solid hsl(240 6% 14%)",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                  formatter={(v: number) => [`${v} م`, undefined]}
                />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
                <Bar dataKey="بودجه" fill="hsl(43 74% 56%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="هزینه واقعی" fill="hsl(263 70% 60%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="درآمد" fill="hsl(142 71% 45%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Category Table */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-2xl bg-card border border-border overflow-hidden"
          >
            <div className="p-5 border-b border-border flex items-center gap-2">
              <Tag className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-foreground">هزینه‌ها بر اساس دسته‌بندی</h2>
              <span className="text-xs text-muted-foreground mr-auto">
                روی بودجه کلیک کنید تا ویرایش کنید (ذخیره محلی)
              </span>
            </div>

            {d.byCategory.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12">
                هزینه‌ای در این دوره ثبت نشده است
              </p>
            ) : (
              <div className="divide-y divide-border">
                {/* Table header */}
                <div className="grid grid-cols-4 gap-4 px-5 py-3 text-xs text-muted-foreground font-medium">
                  <span>دسته‌بندی</span>
                  <span className="text-center">تعداد</span>
                  <span className="text-left">هزینه واقعی</span>
                  <span className="text-left">بودجه تعیین‌شده</span>
                </div>

                {d.byCategory.map((row) => {
                  const label = CATEGORY_LABELS[row.category] ?? row.category;
                  const limit = categoryLimits[row.category] ?? 0;
                  const isEditing = editingCategory === row.category;
                  const overBudget = limit > 0 && row.total > limit;

                  return (
                    <div
                      key={row.category}
                      className="px-5 py-4 space-y-2 hover:bg-muted/40 transition-colors"
                    >
                      <div className="grid grid-cols-4 gap-4 items-center">
                        <span className="text-sm font-medium text-foreground">{label}</span>
                        <span className="text-sm text-muted-foreground text-center">{row.count}</span>
                        <span className={cn("text-sm font-semibold tabular-nums text-left", overBudget ? "text-red-400" : "text-foreground")}>
                          {fmtR(row.total, true)}
                        </span>

                        {/* Editable budget cell */}
                        <div className="text-left">
                          {isEditing ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                className="w-28 px-2 py-1 text-xs rounded-lg bg-muted border border-primary focus:outline-none text-foreground tabular-nums"
                                placeholder="مبلغ (تومان)"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleSaveLimit(row.category);
                                  if (e.key === "Escape") setEditingCategory(null);
                                }}
                              />
                              <button
                                onClick={() => handleSaveLimit(row.category)}
                                className="px-2 py-1 text-xs rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                              >
                                ذخیره
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setEditingCategory(row.category);
                                setEditValue(String(limit || ""));
                              }}
                              className={cn(
                                "text-sm tabular-nums text-left hover:underline cursor-pointer transition-colors",
                                overBudget ? "text-red-400 font-semibold" : limit ? "text-foreground" : "text-muted-foreground"
                              )}
                            >
                              {limit ? fmtR(limit, true) : "— تعیین بودجه"}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Progress bar if limit is set */}
                      {limit > 0 && (
                        <ProgressBar
                          value={row.total}
                          max={limit}
                          color={overBudget ? "bg-red-500" : "bg-primary"}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </>
      )}
    </div>
  );
}
