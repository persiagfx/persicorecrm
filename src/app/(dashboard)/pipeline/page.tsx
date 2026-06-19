"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  TrendingUp, Trophy, Target, Clock, ArrowDown, PieChart as PieChartIcon,
  XCircle, CheckCircle, GitMerge, ChevronDown, Plus, X, Loader2,
  BarChart2, Users, DollarSign, CalendarDays,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, PieChart, Pie, Legend,
} from "recharts";

import { apiClient } from "@/lib/api/client";
import { formatPrice } from "@/lib/utils";
import { LEAD_STATUSES } from "@/lib/constants";
import { RoleGuard } from "@/components/common/RoleGuard";
import type { LeadStatus } from "@/types";

// ─── Constants ────────────────────────────────────────────────────────────────

const FUNNEL_STAGES: LeadStatus[] = ["new", "contacted", "meeting", "proposal", "negotiation", "won"];
const STAGE_COLORS = ["#3b82f6", "#6366f1", "#8b5cf6", "#a855f7", "#f59e0b", "#10b981"];

const WIN_LOSS_CATEGORY_LABELS: Record<string, string> = {
  price: "قیمت", quality: "کیفیت", competitor: "رقیب", timing: "زمان‌بندی",
  budget: "بودجه", trust: "اعتماد", features: "ویژگی‌ها", other: "سایر",
};
const WIN_LOSS_COLORS = ["#10b981", "#6366f1", "#f59e0b", "#ef4444", "#3b82f6", "#8b5cf6", "#ec4899", "#6b7280"];

const GRADIENT_COLORS = [
  "#3b82f6", "#4f6fe8", "#6366f1", "#7c5be8", "#8b5cf6",
  "#a044d4", "#b336b2", "#c42a8a", "#cf2e68", "#10b981",
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface PipelineLead {
  id: string;
  companyName: string;
  contactName: string;
  status: string;
  columnId: string;
  estimatedValue: number;
  conversionProbability: number;
  assignee?: { id: string; name: string; role?: string };
  assigneeId?: string;
  winLossCategory?: string;
  winLossDescription?: string;
  competitorName?: string;
  createdAt?: string;
}

interface FunnelStage {
  id: string;
  name: string;
  color: string;
  order: number;
}

interface SalesFunnel {
  id: string;
  name: string;
  stages: FunnelStage[];
  isDefault: boolean;
  createdById: string;
  createdAt: string;
  createdBy?: { id: string; name: string; avatar?: string };
}

interface FunnelStageStats {
  id: string;
  name: string;
  color: string;
  order: number;
  leadCount: number;
  totalValue: number;
  conversionRate: number;
  avgDaysInStage: number;
}

interface FunnelStats {
  stages: FunnelStageStats[];
  totalValue: number;
  overallConversion: number;
  reachedProposal: number;
  totalLeadsEntered: number;
  wonCount: number;
  lostCount: number;
  avgDealCycleDays: number;
}

// ─── FunnelVisualizer ─────────────────────────────────────────────────────────

function FunnelVisualizer({
  stages,
  stats,
  onStageClick,
  activeStageId,
}: {
  stages: FunnelStageStats[];
  stats: FunnelStats;
  onStageClick: (stageId: string) => void;
  activeStageId: string | null;
}) {
  const maxCount = Math.max(...stages.map((s) => s.leadCount), 1);

  return (
    <div className="space-y-1.5">
      {stages.map((stage, i) => {
        const widthPct = Math.max((stage.leadCount / maxCount) * 100, 8);
        const color = GRADIENT_COLORS[Math.min(i, GRADIENT_COLORS.length - 1)];
        const isActive = activeStageId === stage.id;
        const isLost = stage.id === "lost";

        return (
          <motion.div
            key={stage.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="group"
          >
            {/* Stage row */}
            <div className="flex items-center gap-3 mb-0.5">
              <span className="text-xs text-muted-foreground w-32 text-right truncate font-medium">
                {stage.name}
              </span>
              <div className="flex-1 text-xs text-muted-foreground flex items-center gap-3 justify-end">
                <span className="text-foreground font-semibold">
                  {stage.leadCount} لید
                </span>
                {i > 0 && (
                  <span
                    className={`flex items-center gap-0.5 font-medium text-[11px] ${
                      isLost
                        ? "text-red-400"
                        : stage.conversionRate >= 50
                        ? "text-emerald-400"
                        : "text-amber-400"
                    }`}
                  >
                    <ArrowDown className="w-2.5 h-2.5" />
                    {stage.conversionRate}%
                  </span>
                )}
                <span className="text-muted-foreground text-[11px]">
                  {formatPrice(Math.round(stage.totalValue / 1_000_000))} م
                </span>
              </div>
            </div>

            {/* Trapezoid bar */}
            <button
              onClick={() => onStageClick(stage.id)}
              className="w-full text-left focus:outline-none"
            >
              <div className="relative h-10 bg-muted/30 rounded-lg overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${widthPct}%` }}
                  transition={{ duration: 0.6, delay: i * 0.05, ease: "easeOut" }}
                  className={`absolute inset-y-0 left-0 rounded-lg transition-all ${
                    isActive ? "ring-2 ring-white/40" : ""
                  }`}
                  style={{
                    background: isLost
                      ? `linear-gradient(135deg, #ef4444cc, #ef4444)`
                      : `linear-gradient(135deg, ${color}99, ${color})`,
                    opacity: isActive ? 1 : 0.82,
                  }}
                />
                {/* avg days badge */}
                <div className="absolute inset-0 flex items-center px-3 gap-2">
                  {stage.avgDaysInStage > 0 && (
                    <span className="text-[10px] text-white/70 bg-black/20 px-1.5 py-0.5 rounded-full">
                      ~{stage.avgDaysInStage} روز
                    </span>
                  )}
                </div>
              </div>
            </button>
          </motion.div>
        );
      })}
    </div>
  );
}

// ─── StageSidePanel ───────────────────────────────────────────────────────────

function StageSidePanel({
  stageId,
  stageName,
  leads,
  onClose,
}: {
  stageId: string;
  stageName: string;
  leads: PipelineLead[];
  onClose: () => void;
}) {
  const stageLeads = leads.filter(
    (l) => (l.columnId || l.status) === stageId
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40 }}
      className="bg-card border border-border rounded-2xl p-5 h-fit sticky top-4"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground text-sm">
          {stageName}
          <span className="text-muted-foreground font-normal mr-1.5">
            ({stageLeads.length} لید)
          </span>
        </h3>
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {stageLeads.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">
          لیدی در این مرحله وجود ندارد
        </p>
      ) : (
        <div className="space-y-2.5 max-h-[500px] overflow-y-auto">
          {stageLeads.map((lead) => (
            <div
              key={lead.id}
              className="p-3 rounded-xl bg-muted/40 border border-border/50 hover:bg-muted/60 transition-colors"
            >
              <p className="font-medium text-sm text-foreground leading-tight">
                {lead.companyName}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {lead.contactName}
              </p>
              {lead.estimatedValue > 0 && (
                <p className="text-xs text-emerald-400 font-medium mt-1">
                  {formatPrice(Math.round(lead.estimatedValue / 1_000_000))} م تومان
                </p>
              )}
              {lead.assignee && (
                <p className="text-[11px] text-muted-foreground mt-1">
                  {lead.assignee.name}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ─── CreateFunnelModal ────────────────────────────────────────────────────────

const DEFAULT_FUNNEL_STAGES: FunnelStage[] = [
  { id: "new", name: "جدید", color: "#3b82f6", order: 0 },
  { id: "contacted", name: "تماس گرفته شد", color: "#6366f1", order: 1 },
  { id: "meeting", name: "جلسه", color: "#8b5cf6", order: 2 },
  { id: "proposal", name: "پیشنهاد ارسال شد", color: "#a855f7", order: 3 },
  { id: "negotiation", name: "مذاکره", color: "#f59e0b", order: 4 },
  { id: "won", name: "قرارداد بسته شد", color: "#10b981", order: 5 },
  { id: "lost", name: "از دست رفت", color: "#ef4444", order: 6 },
];

function CreateFunnelModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (f: SalesFunnel) => void;
}) {
  const [name, setName] = useState("");
  const [isDefault, setIsDefault] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    if (!name.trim()) {
      setError("نام قیف فروش الزامی است");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await apiClient.post("/funnels", {
        name: name.trim(),
        stages: DEFAULT_FUNNEL_STAGES,
        isDefault,
      });
      onCreated(res.data.data);
    } catch {
      setError("خطا در ایجاد قیف فروش");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl"
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-foreground">
            ایجاد قیف فروش جدید
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              نام قیف
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: قیف فروش اصلی"
              className="w-full px-3.5 py-2.5 rounded-xl bg-muted border border-border text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
              dir="rtl"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-foreground">قیف پیش‌فرض</span>
          </label>

          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

          <div className="flex gap-2 pt-2">
            <button
              onClick={handleCreate}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              ایجاد قیف
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm text-muted-foreground bg-muted hover:bg-muted/70 transition-colors"
            >
              لغو
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── FunnelAnalyzerTab ────────────────────────────────────────────────────────

function FunnelAnalyzerTab({ leads }: { leads: PipelineLead[] }) {
  const [funnels, setFunnels] = useState<SalesFunnel[]>([]);
  const [selectedFunnelId, setSelectedFunnelId] = useState<string | null>(null);
  const [funnelStats, setFunnelStats] = useState<FunnelStats | null>(null);
  const [loadingFunnels, setLoadingFunnels] = useState(true);
  const [loadingStats, setLoadingStats] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeStageId, setActiveStageId] = useState<string | null>(null);

  // Load funnels list
  useEffect(() => {
    setLoadingFunnels(true);
    apiClient
      .get("/funnels")
      .then((res) => {
        const list: SalesFunnel[] = res.data.data ?? [];
        setFunnels(list);
        const def = list.find((f) => f.isDefault) ?? list[0];
        if (def) setSelectedFunnelId(def.id);
      })
      .catch(console.error)
      .finally(() => setLoadingFunnels(false));
  }, []);

  // Load stats when funnel changes
  const loadStats = useCallback((funnelId: string) => {
    setLoadingStats(true);
    setFunnelStats(null);
    apiClient
      .get(`/funnels/${funnelId}/stats`)
      .then((res) => setFunnelStats(res.data.data))
      .catch(console.error)
      .finally(() => setLoadingStats(false));
  }, []);

  useEffect(() => {
    if (selectedFunnelId) loadStats(selectedFunnelId);
  }, [selectedFunnelId, loadStats]);

  const selectedFunnel = funnels.find((f) => f.id === selectedFunnelId);

  const kpiCards = funnelStats
    ? [
        {
          label: "لیدهای وارد شده",
          value: funnelStats.totalLeadsEntered,
          icon: Users,
          color: "text-blue-400",
          bg: "bg-blue-500/10",
        },
        {
          label: "رسیده به پیشنهاد",
          value: `${funnelStats.reachedProposal}%`,
          icon: Target,
          color: "text-violet-400",
          bg: "bg-violet-500/10",
        },
        {
          label: "نرخ تبدیل کل",
          value: `${funnelStats.overallConversion}%`,
          icon: TrendingUp,
          color: "text-emerald-400",
          bg: "bg-emerald-500/10",
        },
        {
          label: "میانگین چرخه فروش",
          value: `${funnelStats.avgDealCycleDays} روز`,
          icon: CalendarDays,
          color: "text-amber-400",
          bg: "bg-amber-500/10",
        },
        {
          label: "ارزش کل قیف",
          value: `${formatPrice(Math.round(funnelStats.totalValue / 1_000_000))} م`,
          icon: DollarSign,
          color: "text-rose-400",
          bg: "bg-rose-500/10",
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <GitMerge className="w-5 h-5 text-primary" />
            تحلیل قیف فروش
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            آنالیز بصری مراحل فروش و نرخ تبدیل
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Funnel selector */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown((v) => !v)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-muted border border-border text-sm text-foreground hover:bg-muted/70 transition-colors min-w-[160px]"
            >
              <span className="flex-1 text-right truncate">
                {loadingFunnels
                  ? "در حال بارگذاری..."
                  : selectedFunnel?.name ?? "انتخاب قیف"}
              </span>
              <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
            </button>

            <AnimatePresence>
              {showDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="absolute left-0 top-full mt-1 bg-card border border-border rounded-xl shadow-xl z-30 min-w-[200px] overflow-hidden"
                >
                  {funnels.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => {
                        setSelectedFunnelId(f.id);
                        setShowDropdown(false);
                        setActiveStageId(null);
                      }}
                      className={`w-full text-right px-4 py-2.5 text-sm hover:bg-muted transition-colors flex items-center gap-2 ${
                        f.id === selectedFunnelId
                          ? "text-primary font-medium"
                          : "text-foreground"
                      }`}
                    >
                      {f.isDefault && (
                        <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">
                          پیش‌فرض
                        </span>
                      )}
                      {f.name}
                    </button>
                  ))}
                  {funnels.length === 0 && (
                    <p className="px-4 py-3 text-sm text-muted-foreground">
                      قیفی ایجاد نشده
                    </p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            قیف جدید
          </button>
        </div>
      </div>

      {/* KPI cards */}
      {funnelStats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {kpiCards.map((c) => (
            <motion.div
              key={c.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-2xl bg-card border border-border"
            >
              <div className={`w-8 h-8 rounded-xl ${c.bg} flex items-center justify-center mb-2`}>
                <c.icon className={`w-4 h-4 ${c.color}`} />
              </div>
              <p className="text-xl font-bold text-foreground">{c.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{c.label}</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Main funnel + side panel */}
      {loadingStats || loadingFunnels ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      ) : funnelStats ? (
        <div className={`grid gap-6 ${activeStageId ? "grid-cols-1 lg:grid-cols-3" : "grid-cols-1"}`}>
          {/* Funnel visual */}
          <div className={`p-6 rounded-2xl bg-card border border-border ${activeStageId ? "lg:col-span-2" : ""}`}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-foreground text-sm">
                {selectedFunnel?.name ?? "قیف فروش"}
              </h3>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <BarChart2 className="w-3.5 h-3.5" />
                کلیک روی مرحله → مشاهده لیدها
              </div>
            </div>

            <FunnelVisualizer
              stages={funnelStats.stages}
              stats={funnelStats}
              onStageClick={(id) =>
                setActiveStageId((cur) => (cur === id ? null : id))
              }
              activeStageId={activeStageId}
            />

            {/* Summary row */}
            <div className="mt-5 pt-4 border-t border-border grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xl font-bold text-emerald-400">
                  {funnelStats.wonCount}
                </p>
                <p className="text-xs text-muted-foreground">قرارداد بسته شد</p>
              </div>
              <div>
                <p className="text-xl font-bold text-red-400">
                  {funnelStats.lostCount}
                </p>
                <p className="text-xs text-muted-foreground">از دست رفت</p>
              </div>
              <div>
                <p className="text-xl font-bold text-amber-400">
                  {funnelStats.overallConversion}%
                </p>
                <p className="text-xs text-muted-foreground">نرخ تبدیل</p>
              </div>
            </div>
          </div>

          {/* Side panel */}
          <AnimatePresence>
            {activeStageId && (
              <StageSidePanel
                stageId={activeStageId}
                stageName={
                  funnelStats.stages.find((s) => s.id === activeStageId)
                    ?.name ?? activeStageId
                }
                leads={leads}
                onClose={() => setActiveStageId(null)}
              />
            )}
          </AnimatePresence>
        </div>
      ) : (
        <div className="p-12 text-center text-muted-foreground">
          {funnels.length === 0
            ? "هنوز قیف فروشی ایجاد نشده. روی «قیف جدید» کلیک کنید."
            : "قیفی را برای مشاهده آمار انتخاب کنید."}
        </div>
      )}

      {/* Stage breakdown table */}
      {funnelStats && funnelStats.stages.length > 0 && (
        <div className="rounded-2xl bg-card border border-border overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="font-semibold text-sm text-foreground">جزئیات هر مرحله</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {["مرحله", "تعداد لید", "ارزش کل", "نرخ تبدیل از قبل", "میانگین روز در مرحله"].map((h) => (
                    <th
                      key={h}
                      className="text-right px-4 py-3 text-xs font-medium text-muted-foreground"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {funnelStats.stages.map((stage, i) => (
                  <motion.tr
                    key={stage.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() =>
                      setActiveStageId((cur) =>
                        cur === stage.id ? null : stage.id
                      )
                    }
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: stage.color }}
                        />
                        <span className="font-medium text-foreground">
                          {stage.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-foreground font-semibold">
                      {stage.leadCount}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatPrice(Math.round(stage.totalValue / 1_000_000))} م
                    </td>
                    <td className="px-4 py-3">
                      {i === 0 ? (
                        <span className="text-muted-foreground text-xs">—</span>
                      ) : (
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            stage.id === "lost"
                              ? "bg-red-500/10 text-red-400"
                              : stage.conversionRate >= 50
                              ? "bg-emerald-500/10 text-emerald-400"
                              : "bg-amber-500/10 text-amber-400"
                          }`}
                        >
                          {stage.conversionRate}%
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {stage.avgDaysInStage > 0
                        ? `${stage.avgDaysInStage} روز`
                        : "—"}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateFunnelModal
            onClose={() => setShowCreateModal(false)}
            onCreated={(f) => {
              setFunnels((prev) => [...prev, f]);
              setSelectedFunnelId(f.id);
              setShowCreateModal(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PipelinePage() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "winloss" | "funnel">("dashboard");
  const [leads, setLeads] = useState<PipelineLead[]>([]);
  const [crmUsers, setCrmUsers] = useState<{ id: string; name: string; role: string }[]>([]);

  useEffect(() => {
    apiClient.get("/leads?perPage=200").then((res) => setLeads(res.data.data ?? [])).catch(console.error);
    apiClient.get("/users").then((res) => setCrmUsers(res.data.data ?? [])).catch(console.error);
  }, []);

  const stats = useMemo(() => {
    const bystage = FUNNEL_STAGES.map((status) => {
      const items = leads.filter((l) => l.status === status);
      return {
        status,
        label: LEAD_STATUSES[status].label,
        count: items.length,
        value: items.reduce((s, l) => s + l.estimatedValue, 0),
      };
    });

    const funnelData = bystage.map((s, i) => ({
      ...s,
      conversionRate: i === 0 ? 100 : bystage[i - 1].count > 0
        ? Math.round((s.count / bystage[i - 1].count) * 100)
        : 0,
    }));

    const wonLeads = leads.filter((l) => l.status === "won");
    const lostLeads = leads.filter((l) => l.status === "lost");
    const activeLeads = leads.filter((l) => !["won", "lost"].includes(l.status));

    const forecastValue = activeLeads.reduce(
      (s, l) => s + (l.estimatedValue * l.conversionProbability) / 100,
      0
    );

    const repStats = crmUsers
      .filter((u) => u.role === "sales_rep" || u.role === "sales_manager")
      .map((u) => ({
        user: u,
        wonCount: wonLeads.filter((l) => (l.assignee?.id ?? l.assigneeId) === u.id).length,
        wonValue: wonLeads.filter((l) => (l.assignee?.id ?? l.assigneeId) === u.id).reduce((s, l) => s + l.estimatedValue, 0),
      }))
      .sort((a, b) => b.wonValue - a.wonValue);

    return { funnelData, wonLeads, lostLeads, activeLeads, forecastValue, repStats };
  }, [leads, crmUsers]);

  const winLossStats = useMemo(() => {
    const categorised = leads.filter((l) => (l as PipelineLead & { winLossCategory?: string }).winLossCategory);
    const won = categorised.filter((l) => l.status === "won");
    const lost = categorised.filter((l) => l.status === "lost");
    const withCategory = [...won, ...lost];
    const winRate = withCategory.length > 0 ? Math.round((won.length / withCategory.length) * 100) : 0;

    const toCategory = (arr: typeof lost) =>
      Object.entries(
        arr.reduce((acc, r) => {
          const cat = (r as PipelineLead & { winLossCategory?: string }).winLossCategory ?? "other";
          acc[cat] = (acc[cat] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      ).map(([k, v]) => ({ name: WIN_LOSS_CATEGORY_LABELS[k] ?? k, value: v }));

    const lostByCategory = toCategory(lost);
    const wonByCategory = toCategory(won);
    const topLossReason = [...lostByCategory].sort((a, b) => b.value - a.value)[0]?.name ?? "—";
    const topWinReason = [...wonByCategory].sort((a, b) => b.value - a.value)[0]?.name ?? "—";
    const wonValue = leads.filter((l) => l.status === "won").reduce((s, l) => s + l.estimatedValue, 0);

    return { withCategory, won, lost, winRate, lostByCategory, wonByCategory, topLossReason, topWinReason, wonValue };
  }, [leads]);

  const repChartData = stats.repStats.map((r) => ({
    name: r.user.name,
    درآمد: Math.round(r.wonValue / 1_000_000),
    تعداد: r.wonCount,
  }));

  const TABS = [
    ["dashboard", "قیف فروش"],
    ["funnel", "تحلیل قیف"],
    ["winloss", "تحلیل برد/باخت"],
  ] as const;

  return (
    <RoleGuard roles={["admin", "sales_manager"]} fallback={
      <div className="p-12 text-center text-muted-foreground">دسترسی به این صفحه برای نقش شما مجاز نیست.</div>
    }>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-primary" />
              داشبورد قیف فروش
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">تحلیل pipeline و نرخ تبدیل مراحل فروش</p>
          </div>
          <div className="flex gap-1 p-1 bg-muted rounded-xl">
            {TABS.map(([tab, label]) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === tab ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                {label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* ── Tab: Dashboard ── */}
        {activeTab === "dashboard" && <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "لیدهای فعال", value: stats.activeLeads.length, sub: "در حال پیگیری", icon: Target, color: "text-blue-400", bg: "bg-blue-500/10" },
              { label: "قراردادهای بسته شده", value: stats.wonLeads.length, sub: `${stats.lostLeads.length} از دست رفته`, icon: Trophy, color: "text-emerald-400", bg: "bg-emerald-500/10" },
              { label: "پیش‌بینی درآمد", value: formatPrice(Math.round(stats.forecastValue / 1_000_000)) + " م", sub: "بر اساس احتمال تبدیل", icon: TrendingUp, color: "text-amber-400", bg: "bg-amber-500/10" },
              {
                label: "نرخ تبدیل کل",
                value: leads.filter((l) => l.status === "won").length > 0
                  ? Math.round((leads.filter((l) => l.status === "won").length / leads.length) * 100) + "%"
                  : "0%",
                sub: "لید به قرارداد", icon: Clock, color: "text-purple-400", bg: "bg-purple-500/10",
              },
            ].map((c) => (
              <motion.div key={c.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="p-5 rounded-2xl bg-card border border-border">
                <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center mb-3`}>
                  <c.icon className={`w-5 h-5 ${c.color}`} />
                </div>
                <p className="text-2xl font-bold text-foreground">{c.value}</p>
                <p className="text-sm font-medium text-foreground mt-0.5">{c.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{c.sub}</p>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-card border border-border">
              <h3 className="font-semibold text-foreground mb-4">قیف فروش — تعداد لید در هر مرحله</h3>
              <div className="space-y-2">
                {stats.funnelData.map((stage, i) => (
                  <div key={stage.status} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-foreground font-medium">{stage.label}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-muted-foreground">{stage.count} لید</span>
                        {i > 0 && (
                          <span className={`flex items-center gap-0.5 font-medium ${stage.conversionRate >= 50 ? "text-emerald-400" : "text-red-400"}`}>
                            <ArrowDown className="w-3 h-3" />
                            {stage.conversionRate}%
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="relative h-7 bg-muted rounded-lg overflow-hidden">
                      <div
                        className="h-full rounded-lg transition-all duration-500 flex items-center px-2"
                        style={{
                          width: `${Math.max((stage.count / Math.max(...stats.funnelData.map((s) => s.count), 1)) * 100, 4)}%`,
                          backgroundColor: STAGE_COLORS[i],
                          opacity: 0.85,
                        }}
                      />
                      <span className="absolute inset-0 flex items-center px-3 text-xs text-foreground font-medium">
                        {formatPrice(Math.round(stage.value / 1_000_000))} م تومان
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-card border border-border">
              <h3 className="font-semibold text-foreground mb-4">عملکرد کارشناسان فروش (میلیون تومان)</h3>
              {repChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={repChartData} layout="vertical" margin={{ right: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} width={80} />
                    <Tooltip
                      contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }}
                      formatter={(v: number) => [`${v} م`, "درآمد"]}
                    />
                    <Bar dataKey="درآمد" radius={[0, 6, 6, 0]}>
                      {repChartData.map((_, index) => (
                        <Cell key={index} fill={STAGE_COLORS[index % STAGE_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-muted-foreground text-sm text-center py-8">داده‌ای موجود نیست</p>
              )}
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-card border border-border">
            <h3 className="font-semibold text-foreground mb-4">آخرین قراردادهای بسته شده و از دست رفته</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-right pb-3 text-muted-foreground font-medium">شرکت</th>
                    <th className="text-right pb-3 text-muted-foreground font-medium">ارزش</th>
                    <th className="text-right pb-3 text-muted-foreground font-medium">کارشناس</th>
                    <th className="text-right pb-3 text-muted-foreground font-medium">نتیجه</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {leads
                    .filter((l) => l.status === "won" || l.status === "lost")
                    .slice(0, 8)
                    .map((lead) => {
                      const rep = lead.assignee ?? crmUsers.find((u) => u.id === lead.assigneeId);
                      return (
                        <tr key={lead.id} className="hover:bg-muted/50 transition-colors">
                          <td className="py-3 font-medium text-foreground">{lead.companyName}</td>
                          <td className="py-3 text-muted-foreground">{formatPrice(Math.round(lead.estimatedValue / 1_000_000))} م</td>
                          <td className="py-3 text-muted-foreground">{rep?.name ?? "—"}</td>
                          <td className="py-3">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${lead.status === "won" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"}`}>
                              {lead.status === "won" ? "✓ بسته شد" : "✗ از دست رفت"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </>}

        {/* ── Tab: Funnel Analyzer ── */}
        {activeTab === "funnel" && <FunnelAnalyzerTab leads={leads} />}

        {/* ── Tab: Win/Loss ── */}
        {activeTab === "winloss" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "نرخ برد کل", value: `${winLossStats.winRate}%`, icon: TrendingUp, color: "text-green-500", bg: "bg-green-500/10" },
                { label: "قراردادهای ثبت‌شده", value: winLossStats.won.length, icon: CheckCircle, color: "text-emerald-500", bg: "bg-emerald-500/10" },
                { label: "از دست رفته", value: winLossStats.lost.length, icon: XCircle, color: "text-red-500", bg: "bg-red-500/10" },
                { label: "ارزش برنده‌شده", value: formatPrice(Math.round(winLossStats.wonValue / 1_000_000)) + " م", icon: Trophy, color: "text-amber-500", bg: "bg-amber-500/10" },
              ].map(({ label, value, icon: Icon, color, bg }) => (
                <div key={label} className="p-5 rounded-2xl bg-card border border-border">
                  <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center mb-3`}>
                    <Icon className={`w-5 h-5 ${color}`} />
                  </div>
                  <p className="text-2xl font-bold">{value}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20">
                <p className="text-xs font-medium text-red-600 mb-1">متداول‌ترین دلیل باخت</p>
                <p className="text-lg font-bold text-foreground">{winLossStats.topLossReason}</p>
              </div>
              <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/20">
                <p className="text-xs font-medium text-green-600 mb-1">متداول‌ترین دلیل برد</p>
                <p className="text-lg font-bold text-foreground">{winLossStats.topWinReason}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl bg-card border border-border">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <PieChartIcon className="w-4 h-4 text-red-500" />
                  دلایل شکست
                </h3>
                {winLossStats.lostByCategory.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={winLossStats.lostByCategory} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value">
                        {winLossStats.lostByCategory.map((_, i) => <Cell key={i} fill={WIN_LOSS_COLORS[i % WIN_LOSS_COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <p className="text-sm text-muted-foreground text-center py-8">داده‌ای ثبت نشده</p>}
              </div>

              <div className="p-6 rounded-2xl bg-card border border-border">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <PieChartIcon className="w-4 h-4 text-green-500" />
                  دلایل پیروزی
                </h3>
                {winLossStats.wonByCategory.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={winLossStats.wonByCategory} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value">
                        {winLossStats.wonByCategory.map((_, i) => <Cell key={i} fill={WIN_LOSS_COLORS[i % WIN_LOSS_COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <p className="text-sm text-muted-foreground text-center py-8">داده‌ای ثبت نشده</p>}
              </div>
            </div>

            <div className="rounded-2xl bg-card border border-border overflow-hidden">
              <div className="p-4 border-b border-border">
                <h3 className="font-semibold">جزئیات برد/باخت‌ها</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      {["نتیجه", "دسته‌بندی", "رقیب", "توضیح", "تاریخ"].map((h) => (
                        <th key={h} className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {winLossStats.withCategory.map((r) => {
                      const cat = (r as PipelineLead & { winLossCategory?: string }).winLossCategory ?? "other";
                      const desc = (r as PipelineLead & { winLossDescription?: string }).winLossDescription;
                      const competitor = (r as PipelineLead & { competitorName?: string }).competitorName;
                      return (
                        <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${r.status === "won" ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"}`}>
                              {r.status === "won" ? "✓ برد" : "✗ باخت"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm">{WIN_LOSS_CATEGORY_LABELS[cat] ?? cat}</td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">{competitor ?? "—"}</td>
                          <td className="px-4 py-3 text-sm text-muted-foreground max-w-xs truncate">{desc ?? r.companyName}</td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            {new Date(r.id).toLocaleDateString("fa-IR")}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleGuard>
  );
}
