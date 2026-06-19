"use client";

import { useState, useEffect, useCallback } from "react";
import {
  BarChart3, Play, Download, Save, PlusCircle, ChevronDown,
  ChevronUp, Filter, Layers, BookOpen, X, Check,
} from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { apiClient } from "@/lib/api/client";

// ─── Types ───────────────────────────────────────────────────────────────────

type Entity = "leads" | "clients" | "invoices" | "expenses" | "campaigns";
type ChartType = "bar" | "line" | "none";

interface ReportConfig {
  entity: Entity;
  columns: string[];
  filters: { dateFrom: string; dateTo: string; status: string };
  chartType: ChartType;
  limit: number;
}

interface ReportResult {
  rows: Record<string, unknown>[];
  total: number;
  columns: string[];
}

interface SavedReport {
  id: string;
  name: string;
  description?: string;
  config: ReportConfig;
  isShared: boolean;
  createdAt: string;
  createdBy: { id: string; name: string };
}

// ─── Entity meta ─────────────────────────────────────────────────────────────

const ENTITIES: { value: Entity; label: string }[] = [
  { value: "leads", label: "لیدها" },
  { value: "clients", label: "مشتریان" },
  { value: "invoices", label: "فاکتورها" },
  { value: "expenses", label: "هزینه‌ها" },
  { value: "campaigns", label: "کمپین‌ها" },
];

const COLUMNS_BY_ENTITY: Record<Entity, { value: string; label: string }[]> = {
  leads: [
    { value: "companyName", label: "نام شرکت" },
    { value: "contactName", label: "نام مخاطب" },
    { value: "contactPhone", label: "تلفن" },
    { value: "contactEmail", label: "ایمیل" },
    { value: "estimatedValue", label: "ارزش تخمینی" },
    { value: "conversionProbability", label: "احتمال تبدیل" },
    { value: "status", label: "وضعیت" },
    { value: "source", label: "منبع" },
    { value: "createdAt", label: "تاریخ ثبت" },
  ],
  clients: [
    { value: "companyName", label: "نام شرکت" },
    { value: "contactName", label: "نام مخاطب" },
    { value: "contactPhone", label: "تلفن" },
    { value: "contactEmail", label: "ایمیل" },
    { value: "status", label: "وضعیت" },
    { value: "totalRevenue", label: "کل درآمد" },
    { value: "projectCount", label: "تعداد پروژه" },
    { value: "createdAt", label: "تاریخ ثبت" },
  ],
  invoices: [
    { value: "invoiceNumber", label: "شماره فاکتور" },
    { value: "status", label: "وضعیت" },
    { value: "total", label: "جمع کل" },
    { value: "subtotal", label: "مبلغ خالص" },
    { value: "taxAmount", label: "مالیات" },
    { value: "discount", label: "تخفیف" },
    { value: "issuedAt", label: "تاریخ صدور" },
    { value: "dueDate", label: "سررسید" },
    { value: "paidAt", label: "تاریخ پرداخت" },
  ],
  expenses: [
    { value: "title", label: "عنوان" },
    { value: "amount", label: "مبلغ" },
    { value: "category", label: "دسته‌بندی" },
    { value: "date", label: "تاریخ" },
    { value: "approvalStatus", label: "وضعیت تأیید" },
    { value: "createdAt", label: "تاریخ ثبت" },
  ],
  campaigns: [
    { value: "title", label: "عنوان" },
    { value: "channel", label: "کانال" },
    { value: "status", label: "وضعیت" },
    { value: "budget", label: "بودجه" },
    { value: "startDate", label: "تاریخ شروع" },
    { value: "endDate", label: "تاریخ پایان" },
    { value: "createdAt", label: "تاریخ ثبت" },
  ],
};

const STATUS_OPTIONS_BY_ENTITY: Record<Entity, { value: string; label: string }[]> = {
  leads: [
    { value: "", label: "همه" },
    { value: "new", label: "جدید" },
    { value: "contacted", label: "تماس گرفته شده" },
    { value: "qualified", label: "واجد شرایط" },
    { value: "won", label: "برنده" },
    { value: "lost", label: "باخته" },
  ],
  clients: [
    { value: "", label: "همه" },
    { value: "active", label: "فعال" },
    { value: "inactive", label: "غیرفعال" },
  ],
  invoices: [
    { value: "", label: "همه" },
    { value: "draft", label: "پیش‌نویس" },
    { value: "sent", label: "ارسال شده" },
    { value: "paid", label: "پرداخت شده" },
    { value: "overdue", label: "سررسید گذشته" },
    { value: "cancelled", label: "لغو شده" },
  ],
  expenses: [
    { value: "", label: "همه" },
    { value: "pending", label: "در انتظار" },
    { value: "approved", label: "تأیید شده" },
    { value: "rejected", label: "رد شده" },
  ],
  campaigns: [
    { value: "", label: "همه" },
    { value: "draft", label: "پیش‌نویس" },
    { value: "active", label: "فعال" },
    { value: "paused", label: "متوقف" },
    { value: "completed", label: "تکمیل شده" },
  ],
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCell(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "number") return value.toLocaleString("fa-IR");
  if (typeof value === "boolean") return value ? "بله" : "خیر";
  if (value instanceof Date) return value.toLocaleDateString("fa-IR");
  if (typeof value === "string") {
    // Try ISO date
    if (/^\d{4}-\d{2}-\d{2}T/.test(value)) {
      return new Date(value).toLocaleDateString("fa-IR");
    }
    return value;
  }
  return String(value);
}

function exportCsv(rows: Record<string, unknown>[], columns: string[]) {
  const header = columns.join(",");
  const body = rows
    .map((row) =>
      columns
        .map((c) => {
          const v = formatCell(row[c]);
          return `"${v.replace(/"/g, '""')}"`;
        })
        .join(",")
    )
    .join("\n");
  const blob = new Blob(["﻿" + header + "\n" + body], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `report_${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Default config ───────────────────────────────────────────────────────────

const defaultConfig = (): ReportConfig => ({
  entity: "leads",
  columns: ["companyName", "contactName", "status", "estimatedValue", "createdAt"],
  filters: { dateFrom: "", dateTo: "", status: "" },
  chartType: "bar",
  limit: 200,
});

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReportBuilderPage() {
  const [config, setConfig] = useState<ReportConfig>(defaultConfig());
  const [reportName, setReportName] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [result, setResult] = useState<ReportResult | null>(null);
  const [running, setRunning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedReports, setSavedReports] = useState<SavedReport[]>([]);
  const [savedMsg, setSavedMsg] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const fetchSavedReports = useCallback(async () => {
    try {
      const res = await apiClient.get("/reports/builder");
      setSavedReports(res.data.data ?? []);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchSavedReports();
  }, [fetchSavedReports]);

  // When entity changes, reset columns to default visible set
  const handleEntityChange = (entity: Entity) => {
    const defaultCols = COLUMNS_BY_ENTITY[entity].slice(0, 5).map((c) => c.value);
    setConfig((prev) => ({
      ...prev,
      entity,
      columns: defaultCols,
      filters: { dateFrom: "", dateTo: "", status: "" },
    }));
    setResult(null);
  };

  const toggleColumn = (col: string) => {
    setConfig((prev) => ({
      ...prev,
      columns: prev.columns.includes(col)
        ? prev.columns.filter((c) => c !== col)
        : [...prev.columns, col],
    }));
  };

  const runReport = async () => {
    setRunning(true);
    setResult(null);
    try {
      const res = await apiClient.post("/reports/builder/run", config);
      setResult(res.data.data);
    } catch {
      // ignore
    } finally {
      setRunning(false);
    }
  };

  const saveReport = async () => {
    if (!reportName.trim()) {
      setSavedMsg("لطفاً نام گزارش را وارد کنید");
      setTimeout(() => setSavedMsg(""), 3000);
      return;
    }
    setSaving(true);
    try {
      await apiClient.post("/reports/builder", {
        name: reportName,
        description: reportDescription,
        config,
        isShared: false,
      });
      setSavedMsg("گزارش ذخیره شد");
      await fetchSavedReports();
      setTimeout(() => setSavedMsg(""), 3000);
    } catch {
      setSavedMsg("خطا در ذخیره گزارش");
      setTimeout(() => setSavedMsg(""), 3000);
    } finally {
      setSaving(false);
    }
  };

  const loadReport = (report: SavedReport) => {
    setConfig(report.config);
    setReportName(report.name);
    setReportDescription(report.description ?? "");
    setResult(null);
  };

  const chartData = result?.rows.slice(0, 20) ?? [];
  const numericCols = result?.columns.filter((c) =>
    result.rows.some((r) => typeof r[c] === "number")
  ) ?? [];
  const labelCol = result?.columns.find((c) =>
    result.rows.some((r) => typeof r[c] === "string" && r[c] !== null)
  ) ?? result?.columns[0] ?? "";

  return (
    <div className="flex h-full min-h-screen gap-0 -mx-4 -mt-4" dir="rtl">
      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside
        className={`
          flex flex-col bg-card border-l border-border shrink-0 transition-all duration-200
          ${sidebarOpen ? "w-72" : "w-12"}
        `}
      >
        {/* Toggle */}
        <div className="flex items-center justify-between px-3 py-3 border-b border-border">
          {sidebarOpen && (
            <span className="font-semibold text-sm text-foreground flex items-center gap-1.5">
              <Filter className="w-4 h-4 text-primary" />
              تنظیمات گزارش
            </span>
          )}
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="p-1 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
          >
            {sidebarOpen ? <ChevronUp className="w-4 h-4 rotate-90" /> : <ChevronDown className="w-4 h-4 rotate-90" />}
          </button>
        </div>

        {sidebarOpen && (
          <div className="flex-1 overflow-y-auto p-3 space-y-4 text-sm">
            {/* Entity selector */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                موجودیت
              </p>
              <div className="space-y-1">
                {ENTITIES.map((e) => (
                  <button
                    key={e.value}
                    onClick={() => handleEntityChange(e.value)}
                    className={`w-full text-right px-3 py-2 rounded-lg text-sm transition-colors ${
                      config.entity === e.value
                        ? "bg-primary/20 text-primary font-medium"
                        : "text-foreground hover:bg-muted"
                    }`}
                  >
                    {e.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Column checklist */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                ستون‌ها
              </p>
              <div className="space-y-1">
                {COLUMNS_BY_ENTITY[config.entity].map((col) => {
                  const checked = config.columns.includes(col.value);
                  return (
                    <label
                      key={col.value}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer hover:bg-muted transition-colors"
                    >
                      <span
                        className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                          checked
                            ? "bg-primary border-primary"
                            : "border-border"
                        }`}
                      >
                        {checked && <Check className="w-3 h-3 text-black" />}
                      </span>
                      <input
                        type="checkbox"
                        className="hidden"
                        checked={checked}
                        onChange={() => toggleColumn(col.value)}
                      />
                      <span className="text-foreground text-xs">{col.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Filters */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                فیلترها
              </p>
              <div className="space-y-2">
                <div>
                  <label className="text-xs text-muted-foreground">از تاریخ</label>
                  <input
                    type="date"
                    value={config.filters.dateFrom}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        filters: { ...prev.filters, dateFrom: e.target.value },
                      }))
                    }
                    className="w-full mt-1 px-2 py-1.5 rounded-lg bg-muted border border-border text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">تا تاریخ</label>
                  <input
                    type="date"
                    value={config.filters.dateTo}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        filters: { ...prev.filters, dateTo: e.target.value },
                      }))
                    }
                    className="w-full mt-1 px-2 py-1.5 rounded-lg bg-muted border border-border text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">وضعیت</label>
                  <select
                    value={config.filters.status}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        filters: { ...prev.filters, status: e.target.value },
                      }))
                    }
                    className="w-full mt-1 px-2 py-1.5 rounded-lg bg-muted border border-border text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {STATUS_OPTIONS_BY_ENTITY[config.entity].map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Chart type */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                نوع نمودار
              </p>
              <div className="flex gap-1">
                {(["bar", "line", "none"] as ChartType[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setConfig((prev) => ({ ...prev, chartType: t }))}
                    className={`flex-1 py-1.5 rounded-lg text-xs transition-colors ${
                      config.chartType === t
                        ? "bg-primary text-black font-semibold"
                        : "bg-muted text-muted-foreground hover:bg-muted/60"
                    }`}
                  >
                    {t === "bar" ? "میله‌ای" : t === "line" ? "خطی" : "بدون"}
                  </button>
                ))}
              </div>
            </div>

            {/* Limit */}
            <div>
              <label className="text-xs text-muted-foreground">حداکثر ردیف</label>
              <input
                type="number"
                min={1}
                max={1000}
                value={config.limit}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, limit: Number(e.target.value) || 200 }))
                }
                className="w-full mt-1 px-2 py-1.5 rounded-lg bg-muted border border-border text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Saved reports list */}
            {savedReports.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide flex items-center gap-1">
                  <BookOpen className="w-3 h-3" />
                  گزارش‌های ذخیره‌شده
                </p>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {savedReports.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => loadReport(r)}
                      className="w-full text-right px-2 py-2 rounded-lg hover:bg-muted transition-colors group"
                    >
                      <p className="text-xs font-medium text-foreground group-hover:text-primary line-clamp-1">
                        {r.name}
                      </p>
                      {r.description && (
                        <p className="text-[10px] text-muted-foreground line-clamp-1 mt-0.5">
                          {r.description}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </aside>

      {/* ── Main area ────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-border bg-card shrink-0 flex-wrap">
          <BarChart3 className="w-5 h-5 text-primary shrink-0" />
          <input
            type="text"
            placeholder="نام گزارش..."
            value={reportName}
            onChange={(e) => setReportName(e.target.value)}
            className="flex-1 min-w-[160px] max-w-xs px-3 py-1.5 rounded-lg bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <input
            type="text"
            placeholder="توضیحات (اختیاری)..."
            value={reportDescription}
            onChange={(e) => setReportDescription(e.target.value)}
            className="flex-1 min-w-[160px] max-w-sm px-3 py-1.5 rounded-lg bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <div className="flex items-center gap-2 mr-auto">
            {savedMsg && (
              <span
                className={`text-xs px-2 py-1 rounded-lg ${
                  savedMsg.includes("خطا")
                    ? "bg-red-500/20 text-red-400"
                    : "bg-emerald-500/20 text-emerald-400"
                }`}
              >
                {savedMsg}
              </span>
            )}
            <button
              onClick={saveReport}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted border border-border text-sm text-foreground hover:bg-muted/60 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? "..." : "ذخیره"}
            </button>
            {result && result.rows.length > 0 && (
              <button
                onClick={() => exportCsv(result.rows, result.columns)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted border border-border text-sm text-foreground hover:bg-muted/60 transition-colors"
              >
                <Download className="w-4 h-4" />
                خروجی CSV
              </button>
            )}
            <button
              onClick={runReport}
              disabled={running}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg gradient-brand text-black font-semibold text-sm gold-glow disabled:opacity-60 transition-all"
            >
              <Play className="w-4 h-4" />
              {running ? "در حال اجرا..." : "اجرای گزارش"}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Empty state */}
          {!result && !running && (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Layers className="w-12 h-12 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground text-sm">
                موجودیت و ستون‌های مورد نظر را انتخاب کنید سپس «اجرای گزارش» را بزنید
              </p>
            </div>
          )}

          {/* Loading */}
          {running && (
            <div className="flex items-center justify-center h-40">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {result && !running && (
            <>
              {/* Summary */}
              <div className="flex items-center gap-3 text-sm">
                <span className="px-3 py-1 rounded-full bg-primary/20 text-primary font-medium text-xs">
                  {result.total.toLocaleString("fa-IR")} ردیف
                </span>
                <span className="text-muted-foreground text-xs">
                  {ENTITIES.find((e) => e.value === config.entity)?.label} ·{" "}
                  {result.columns.length} ستون
                </span>
              </div>

              {/* Chart */}
              {config.chartType !== "none" && numericCols.length > 0 && chartData.length > 0 && (
                <div className="p-5 rounded-2xl bg-card border border-border">
                  <h3 className="text-sm font-semibold text-foreground mb-3">نمودار</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    {config.chartType === "line" ? (
                      <LineChart
                        data={chartData}
                        margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="hsl(240 6% 14%)"
                          vertical={false}
                        />
                        <XAxis
                          dataKey={labelCol}
                          tick={{ fontSize: 10, fill: "hsl(240 5% 65%)" }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(v) => String(v).slice(0, 10)}
                        />
                        <YAxis
                          tick={{ fontSize: 10, fill: "hsl(240 5% 65%)" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          contentStyle={{
                            background: "hsl(240 10% 6%)",
                            border: "1px solid hsl(240 6% 14%)",
                            borderRadius: 10,
                            fontSize: 11,
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: 11, paddingTop: 12 }} />
                        {numericCols.slice(0, 3).map((col, i) => (
                          <Line
                            key={col}
                            type="monotone"
                            dataKey={col}
                            stroke={
                              ["hsl(43 74% 56%)", "hsl(263 70% 60%)", "hsl(190 70% 50%)"][i]
                            }
                            strokeWidth={2}
                            dot={false}
                          />
                        ))}
                      </LineChart>
                    ) : (
                      <BarChart
                        data={chartData}
                        margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="hsl(240 6% 14%)"
                          vertical={false}
                        />
                        <XAxis
                          dataKey={labelCol}
                          tick={{ fontSize: 10, fill: "hsl(240 5% 65%)" }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(v) => String(v).slice(0, 12)}
                        />
                        <YAxis
                          tick={{ fontSize: 10, fill: "hsl(240 5% 65%)" }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          contentStyle={{
                            background: "hsl(240 10% 6%)",
                            border: "1px solid hsl(240 6% 14%)",
                            borderRadius: 10,
                            fontSize: 11,
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: 11, paddingTop: 12 }} />
                        {numericCols.slice(0, 3).map((col, i) => (
                          <Bar
                            key={col}
                            dataKey={col}
                            fill={
                              ["hsl(43 74% 56%)", "hsl(263 70% 60%)", "hsl(190 70% 50%)"][i]
                            }
                            radius={[4, 4, 0, 0]}
                          />
                        ))}
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </div>
              )}

              {/* Data table */}
              {result.rows.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 rounded-2xl bg-card border border-border text-muted-foreground text-sm">
                  <X className="w-8 h-8 mb-2 opacity-30" />
                  داده‌ای یافت نشد
                </div>
              ) : (
                <div className="rounded-2xl border border-border bg-card overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border bg-muted/30">
                          <th className="px-4 py-3 text-right text-muted-foreground font-semibold w-10">
                            #
                          </th>
                          {result.columns.map((col) => {
                            const meta = COLUMNS_BY_ENTITY[config.entity].find(
                              (c) => c.value === col
                            );
                            return (
                              <th
                                key={col}
                                className="px-4 py-3 text-right text-muted-foreground font-semibold whitespace-nowrap"
                              >
                                {meta?.label ?? col}
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody>
                        {result.rows.map((row, idx) => (
                          <tr
                            key={idx}
                            className="border-b border-border/40 hover:bg-muted/20 transition-colors"
                          >
                            <td className="px-4 py-2.5 text-muted-foreground tabular-nums">
                              {(idx + 1).toLocaleString("fa-IR")}
                            </td>
                            {result.columns.map((col) => (
                              <td
                                key={col}
                                className="px-4 py-2.5 text-foreground whitespace-nowrap"
                              >
                                {formatCell(row[col])}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="px-4 py-2 border-t border-border bg-muted/20 text-xs text-muted-foreground text-left">
                    نمایش {result.rows.length.toLocaleString("fa-IR")} ردیف
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
