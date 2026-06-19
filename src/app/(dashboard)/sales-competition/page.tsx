"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Trophy, Medal, Target, TrendingUp, Settings, X, Check,
  ChevronDown, Star, Zap, Crown,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { RoleGuard } from "@/components/common/RoleGuard";
import { useAuth } from "@/lib/auth/context";
import { apiClient } from "@/lib/api/client";
import { toast } from "sonner";
import type { SalesCompetition, CompetitionMetric, CompetitionReward } from "@/types";

// ─── Constants ────────────────────────────────────────────────────────────────
const METRIC_LABELS: Record<CompetitionMetric, string> = {
  revenue: "بیشترین درآمد",
  deals_count: "بیشترین معامله بسته‌شده",
  conversion_rate: "بالاترین نرخ تبدیل",
};

const PODIUM_ORDER = [1, 0, 2]; // 2nd, 1st, 3rd in display order

const PODIUM_CONFIG = [
  { height: "h-24", bg: "from-slate-400/30 to-slate-500/20", border: "border-slate-400/40", label: "مقام دوم", emoji: "🥈" },
  { height: "h-36", bg: "from-amber-400/30 to-yellow-500/20", border: "border-amber-400/60", label: "مقام اول", emoji: "🥇" },
  { height: "h-16", bg: "from-orange-400/30 to-amber-500/20", border: "border-orange-400/40", label: "مقام سوم", emoji: "🥉" },
];

const REWARD_CONFIG = [
  { gradient: "from-amber-400 to-yellow-500", border: "border-amber-400/40", glow: "shadow-amber-400/20" },
  { gradient: "from-slate-300 to-slate-400", border: "border-slate-300/40", glow: "shadow-slate-400/10" },
  { gradient: "from-orange-400 to-amber-500", border: "border-orange-400/40", glow: "shadow-orange-400/10" },
];

const METRIC_UNIT: Record<CompetitionMetric, string> = {
  revenue: "تومان",
  deals_count: "معامله",
  conversion_rate: "%",
};

// ─── Rank badge ───────────────────────────────────────────────────────────────
function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-xl">🥇</span>;
  if (rank === 2) return <span className="text-xl">🥈</span>;
  if (rank === 3) return <span className="text-xl">🥉</span>;
  return <span className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">#{rank}</span>;
}

// ─── Empty reward default form ────────────────────────────────────────────────
const EMPTY_REWARDS: CompetitionReward[] = [
  { rank: 1, title: "مقام اول", badgeEmoji: "🥇", bonusAmount: 0, bonusPercent: 0 },
  { rank: 2, title: "مقام دوم", badgeEmoji: "🥈", bonusAmount: 0, bonusPercent: 0 },
  { rank: 3, title: "مقام سوم", badgeEmoji: "🥉", bonusAmount: 0, bonusPercent: 0 },
];

// ─── Page ─────────────────────────────────────────────────────────────────────
interface ApiRankEntry {
  userId: string;
  name: string;
  avatar: string | null;
  color: string;
  deals: number;
  totalValue: number;
  totalLeads: number;
  conversionRate: number;
}

export default function SalesCompetitionPage() {
  const { user } = useAuth();
  const defaultComp: SalesCompetition = {
    id: "default", title: "رقابت فروش ماهانه", metric: "revenue",
    period: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`,
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10),
    endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().slice(0, 10),
    rewards: EMPTY_REWARDS, isActive: true, createdById: "", createdAt: new Date().toISOString(),
  };
  const [competition, setCompetition] = useState<SalesCompetition>(defaultComp);
  const [activeMetric, setActiveMetric] = useState<CompetitionMetric>("revenue");
  const [showSettings, setShowSettings] = useState(false);
  const [formTitle, setFormTitle] = useState(defaultComp.title);
  const [formMetric, setFormMetric] = useState<CompetitionMetric>("revenue");
  const [formStart, setFormStart] = useState(defaultComp.startDate);
  const [formEnd, setFormEnd] = useState(defaultComp.endDate);
  const [formRewards, setFormRewards] = useState<CompetitionReward[]>(EMPTY_REWARDS);
  const [apiRankings, setApiRankings] = useState<ApiRankEntry[]>([]);
  const [loadingRanks, setLoadingRanks] = useState(true);

  const isManager = ["admin", "sales_manager"].includes(user?.role ?? "");

  useEffect(() => {
    setLoadingRanks(true);
    apiClient.get("/sales-competition?period=month")
      .then((r) => setApiRankings(r.data?.leaderboard ?? []))
      .catch(() => toast.error("خطا در دریافت رتبه‌بندی"))
      .finally(() => setLoadingRanks(false));
  }, []);

  // ─── Rankings — از API واقعی ──────────────────────────────────────────────
  const rankings = apiRankings.map((entry) => {
    const score =
      activeMetric === "revenue" ? entry.totalValue :
      activeMetric === "deals_count" ? entry.deals :
      entry.conversionRate;
    return {
      user: { id: entry.userId, name: entry.name, avatar: entry.avatar, color: entry.color },
      wonValue: entry.totalValue,
      wonCount: entry.deals,
      totalLeads: entry.totalLeads,
      conversionRate: entry.conversionRate,
      score,
    };
  }).sort((a, b) => b.score - a.score);

  const getScoreDisplay = (r: (typeof rankings)[0]) => {
    if (activeMetric === "revenue") return formatPrice(r.wonValue, true);
    if (activeMetric === "deals_count") return `${r.wonCount} معامله`;
    return `${r.conversionRate}%`;
  };

  const myRank = rankings.findIndex(r => r.user.id === user?.id) + 1;
  const myData = rankings.find(r => r.user.id === user?.id);

  const handleSaveSettings = () => {
    setCompetition(prev => ({
      ...prev, title: formTitle, metric: formMetric,
      startDate: formStart, endDate: formEnd, rewards: formRewards,
    }));
    setActiveMetric(formMetric);
    setShowSettings(false);
  };

  const updateReward = (rank: number, field: keyof CompetitionReward, value: string | number) => {
    setFormRewards(prev => prev.map(r => r.rank === rank ? { ...r, [field]: value } : r));
  };

  return (
    <RoleGuard roles={["admin", "sales_manager", "sales_rep"]}>
      <div className="space-y-6">

        {/* ── Header ── */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400/20 to-yellow-500/10 border border-amber-400/30 flex items-center justify-center">
              <Trophy className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{competition.title}</h1>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="text-xs text-muted-foreground">
                  {new Date(competition.startDate).toLocaleDateString("fa-IR")} تا {new Date(competition.endDate).toLocaleDateString("fa-IR")}
                </span>
                <span className="w-1 h-1 rounded-full bg-border" />
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                  {METRIC_LABELS[competition.metric]}
                </span>
                {competition.isActive && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    در حال اجرا
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Metric switcher */}
            <div className="flex gap-1 p-1 bg-muted rounded-xl">
              {(Object.entries(METRIC_LABELS) as [CompetitionMetric, string][]).map(([key, label]) => (
                <button key={key} onClick={() => setActiveMetric(key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${activeMetric === key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                  {label}
                </button>
              ))}
            </div>
            {isManager && (
              <button onClick={() => { setFormTitle(competition.title); setFormMetric(competition.metric); setFormStart(competition.startDate); setFormEnd(competition.endDate); setFormRewards(competition.rewards); setShowSettings(true); }}
                className="p-2 rounded-xl bg-card border border-border hover:bg-muted transition-colors">
                <Settings className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>
        </motion.div>

        {/* ── My Rank Card (for sales_rep) ── */}
        {user?.role === "sales_rep" && myData && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="p-5 rounded-2xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl gradient-brand flex items-center justify-center text-xl font-bold text-black">
                {user.name.slice(0, 1)}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">رتبه شما</p>
                <p className="text-2xl font-bold text-foreground">#{myRank}</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">امتیاز</p>
                <p className="font-bold text-primary">{getScoreDisplay(myData)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">معاملات بسته</p>
                <p className="font-bold">{myData.wonCount}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">نرخ تبدیل</p>
                <p className="font-bold">{myData.conversionRate}%</p>
              </div>
              {competition.rewards[myRank - 1] && (
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">پاداش فعلی</p>
                  <p className="font-bold text-amber-500">
                    {(competition.rewards[myRank - 1].bonusAmount ?? 0).toLocaleString("fa-IR")} ت
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ── Podium ── */}
        {rankings.length >= 3 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
            className="p-6 rounded-2xl bg-card border border-border">
            <div className="flex items-end justify-center gap-4">
              {PODIUM_ORDER.map((rankIdx, displayIdx) => {
                const entry = rankings[rankIdx];
                if (!entry) return null;
                const cfg = PODIUM_CONFIG[displayIdx];
                const reward = competition.rewards.find(r => r.rank === rankIdx + 1);
                const isMe = entry.user.id === user?.id;
                return (
                  <motion.div
                    key={entry.user.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 + displayIdx * 0.08 }}
                    className={`flex flex-col items-center gap-2 ${displayIdx === 1 ? "order-2" : displayIdx === 0 ? "order-1" : "order-3"}`}>
                    {/* Avatar */}
                    <div className={`relative w-16 h-16 rounded-2xl gradient-brand flex items-center justify-center text-2xl font-bold text-black shadow-lg ${isMe ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}`}>
                      {entry.user.name.slice(0, 1)}
                      {displayIdx === 1 && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                          <Crown className="w-5 h-5 text-amber-400 fill-amber-400" />
                        </div>
                      )}
                    </div>
                    {/* Name */}
                    <div className="text-center">
                      <p className="text-sm font-bold">{entry.user.name.split(" ")[0]}</p>
                      <p className="text-xs text-primary font-medium">{getScoreDisplay(entry)}</p>
                    </div>
                    {/* Podium platform */}
                    <div className={`w-28 ${cfg.height} rounded-t-xl bg-gradient-to-b ${cfg.bg} border-t border-x ${cfg.border} flex flex-col items-center justify-center gap-1 transition-all`}>
                      <span className="text-2xl">{cfg.emoji}</span>
                      <span className="text-xs font-semibold text-foreground">{cfg.label}</span>
                      {reward?.bonusAmount ? (
                        <span className="text-xs text-amber-600 font-bold">
                          {(reward.bonusAmount / 1_000_000).toFixed(0)} م ت
                        </span>
                      ) : null}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ── Reward Cards ── */}
        {competition.rewards.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {competition.rewards.map((reward, i) => {
              const cfg = REWARD_CONFIG[i] ?? REWARD_CONFIG[2];
              const winner = rankings[reward.rank - 1];
              return (
                <motion.div key={reward.rank}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 + i * 0.06 }}
                  className={`p-5 rounded-2xl bg-card border ${cfg.border} shadow-lg ${cfg.glow}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{reward.badgeEmoji}</span>
                      <span className="font-bold text-foreground">{reward.title}</span>
                    </div>
                    {winner && (
                      <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${cfg.gradient} flex items-center justify-center text-sm font-bold text-white`}>
                        {winner.user.name.slice(0, 1)}
                      </div>
                    )}
                  </div>
                  {winner && (
                    <p className="text-sm text-muted-foreground mb-3">
                      {winner.user.name}
                    </p>
                  )}
                  <div className="space-y-1.5">
                    {reward.bonusAmount && reward.bonusAmount > 0 ? (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">پاداش نقدی</span>
                        <span className="font-bold text-foreground">{reward.bonusAmount.toLocaleString("fa-IR")} ت</span>
                      </div>
                    ) : null}
                    {reward.bonusPercent && reward.bonusPercent > 0 ? (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">پورسانت اضافی</span>
                        <span className="font-bold text-green-600">+{reward.bonusPercent}%</span>
                      </div>
                    ) : null}
                    {reward.description && (
                      <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border">{reward.description}</p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* ── Full Leaderboard Table ── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="rounded-2xl bg-card border border-border overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              رتبه‌بندی کامل
            </h2>
            <span className="text-xs text-muted-foreground">{rankings.length} نفر</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">رتبه</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">نام</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">معاملات بسته</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">درآمد</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">نرخ تبدیل</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">امتیاز ({METRIC_UNIT[activeMetric]})</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">پاداش</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {rankings.map((entry, i) => {
                  const rank = i + 1;
                  const isMe = entry.user.id === user?.id;
                  const reward = competition.rewards.find(r => r.rank === rank);
                  return (
                    <motion.tr key={entry.user.id}
                      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 + i * 0.04 }}
                      className={`transition-colors ${isMe ? "bg-primary/5 border-l-2 border-primary" : "hover:bg-muted/30"}`}>
                      <td className="px-4 py-3">
                        <RankBadge rank={rank} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-xl gradient-brand flex items-center justify-center text-sm font-bold text-black ${isMe ? "ring-2 ring-primary" : ""}`}>
                            {entry.user.name.slice(0, 1)}
                          </div>
                          <div>
                            <p className="font-medium">{entry.user.name} {isMe && <span className="text-xs text-primary">(شما)</span>}</p>
                            <p className="text-xs text-muted-foreground">{entry.totalLeads} لید کل</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-semibold">{entry.wonCount}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium text-primary tabular-nums">
                          {formatPrice(Math.round(entry.wonValue / 1_000_000))} م
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${entry.conversionRate >= 50 ? "bg-green-500" : "bg-primary"}`}
                              style={{ width: `${entry.conversionRate}%` }} />
                          </div>
                          <span className="text-xs">{entry.conversionRate}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-bold tabular-nums">
                        {activeMetric === "revenue" && formatPrice(entry.wonValue, true)}
                        {activeMetric === "deals_count" && entry.wonCount}
                        {activeMetric === "conversion_rate" && `${entry.conversionRate}%`}
                      </td>
                      <td className="px-4 py-3">
                        {reward ? (
                          <div className="flex items-center gap-1.5">
                            <span>{reward.badgeEmoji}</span>
                            <div>
                              {reward.bonusAmount && reward.bonusAmount > 0 ? (
                                <p className="text-xs font-bold text-amber-600">{reward.bonusAmount.toLocaleString("fa-IR")} ت</p>
                              ) : null}
                              {reward.bonusPercent && reward.bonusPercent > 0 ? (
                                <p className="text-xs text-green-600">+{reward.bonusPercent}% پورسانت</p>
                              ) : null}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* ── Settings Modal (manager only) ── */}
        <AnimatePresence>
          {showSettings && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                className="bg-card border border-border rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl">
                <div className="flex items-center justify-between p-5 border-b border-border">
                  <h2 className="font-bold text-lg flex items-center gap-2">
                    <Settings className="w-5 h-5 text-primary" />
                    تنظیمات رقابت
                  </h2>
                  <button onClick={() => setShowSettings(false)} className="p-1.5 rounded-lg hover:bg-muted">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-5 space-y-5">
                  {/* Basic Info */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-1.5">عنوان رقابت</label>
                      <input value={formTitle} onChange={e => setFormTitle(e.target.value)}
                        className="input-field w-full" placeholder="مثال: مسابقه فروش اردیبهشت" />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium mb-1.5">تاریخ شروع</label>
                        <input type="date" value={formStart} onChange={e => setFormStart(e.target.value)}
                          className="input-field w-full" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1.5">تاریخ پایان</label>
                        <input type="date" value={formEnd} onChange={e => setFormEnd(e.target.value)}
                          className="input-field w-full" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1.5">متریک رتبه‌بندی</label>
                      <div className="flex gap-2">
                        {(Object.entries(METRIC_LABELS) as [CompetitionMetric, string][]).map(([key, label]) => (
                          <button key={key} type="button" onClick={() => setFormMetric(key)}
                            className={`flex-1 py-2 px-3 rounded-xl text-sm transition-all border ${formMetric === key ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:bg-muted"}`}>
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Rewards */}
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Star className="w-4 h-4 text-amber-500" />
                      پاداش‌ها
                    </h3>
                    <div className="space-y-3">
                      {formRewards.map(reward => (
                        <div key={reward.rank} className="p-4 rounded-xl border border-border bg-muted/20 space-y-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{reward.badgeEmoji}</span>
                            <input value={reward.title} onChange={e => updateReward(reward.rank, "title", e.target.value)}
                              className="input-field flex-1" placeholder="عنوان" />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs text-muted-foreground mb-1">مبلغ پاداش (تومان)</label>
                              <input type="number" value={reward.bonusAmount ?? ""}
                                onChange={e => updateReward(reward.rank, "bonusAmount", Number(e.target.value))}
                                className="input-field w-full" placeholder="0" />
                            </div>
                            <div>
                              <label className="block text-xs text-muted-foreground mb-1">پورسانت اضافی (%)</label>
                              <input type="number" value={reward.bonusPercent ?? ""}
                                onChange={e => updateReward(reward.rank, "bonusPercent", Number(e.target.value))}
                                className="input-field w-full" placeholder="0" />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs text-muted-foreground mb-1">توضیحات</label>
                            <input value={reward.description ?? ""}
                              onChange={e => updateReward(reward.rank, "description", e.target.value)}
                              className="input-field w-full" placeholder="توضیح پاداش..." />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-2">
                    <button onClick={handleSaveSettings}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm">
                      <Check className="w-4 h-4" />
                      ذخیره تنظیمات
                    </button>
                    <button onClick={() => setShowSettings(false)}
                      className="flex-1 py-2.5 rounded-xl border border-border text-sm hover:bg-muted transition-colors">
                      انصراف
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </RoleGuard>
  );
}
