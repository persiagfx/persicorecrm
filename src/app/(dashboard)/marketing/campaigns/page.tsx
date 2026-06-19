"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Megaphone, Plus, X, TrendingUp, Eye, MousePointerClick, ShoppingCart, DollarSign,
  BarChart2, Pencil, Save, ClipboardList, FileText, Printer, CheckCircle2,
  PlayCircle, Settings2, Lightbulb
} from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { toast } from "sonner";
import type { Campaign, CampaignStatus, CampaignChannel, CampaignProgressNote, CampaignProgressPhase } from "@/types";
import { RoleGuard } from "@/components/common/RoleGuard";
import { useAuth } from "@/lib/auth/context";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const STATUS_CFG: Record<CampaignStatus, { label: string; color: string }> = {
  draft: { label: "پیش‌نویس", color: "bg-gray-500/10 text-gray-500 border-gray-500/20" },
  active: { label: "فعال", color: "bg-green-500/10 text-green-600 border-green-500/20" },
  paused: { label: "متوقف", color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20" },
  completed: { label: "تمام‌شده", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
};

const CHANNEL_CFG: Record<CampaignChannel, { label: string; color: string }> = {
  google: { label: "گوگل", color: "bg-red-500/10 text-red-600" },
  instagram: { label: "اینستاگرام", color: "bg-pink-500/10 text-pink-600" },
  linkedin: { label: "لینکدین", color: "bg-blue-600/10 text-blue-700" },
  email: { label: "ایمیل", color: "bg-purple-500/10 text-purple-600" },
  sms: { label: "پیامک", color: "bg-teal-500/10 text-teal-600" },
  content: { label: "محتوا", color: "bg-orange-500/10 text-orange-600" },
  other: { label: "سایر", color: "bg-gray-500/10 text-gray-500" },
};

const PHASE_CFG: Record<CampaignProgressPhase, { label: string; icon: React.FC<{ className?: string }>; color: string; dot: string }> = {
  planning:   { label: "برنامه‌ریزی", icon: Lightbulb,    color: "text-blue-500",   dot: "bg-blue-500" },
  running:    { label: "در حال اجرا", icon: PlayCircle,   color: "text-green-500",  dot: "bg-green-500" },
  optimizing: { label: "بهینه‌سازی",  icon: Settings2,    color: "text-amber-500",  dot: "bg-amber-500" },
  completed:  { label: "تکمیل",       icon: CheckCircle2, color: "text-purple-500", dot: "bg-purple-500" },
};

const EMPTY_FORM = {
  title: "", channel: "google" as CampaignChannel, status: "draft" as CampaignStatus,
  budget: 0, startDate: "", endDate: "", targetAudience: "", description: "",
};

const TOOLTIP_STYLE = {
  contentStyle: {
    background: "#1e1e2e",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "12px",
    fontSize: "12px",
    color: "#f8f8f2",
    boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
  },
  labelStyle: { color: "#a8a8b3" },
  itemStyle: { color: "#f8f8f2" },
};

export default function CampaignsPage() {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  useEffect(() => {
    apiClient.get("/campaigns?perPage=100")
      .then(res => setCampaigns(res.data?.data ?? []))
      .catch(() => toast.error("خطا در دریافت کمپین‌ها"));
  }, []);
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | "all">("all");
  const [channelFilter, setChannelFilter] = useState<CampaignChannel | "all">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState<"info" | "progress">("info");
  const [showForm, setShowForm] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState<{
    title: string; channel: CampaignChannel; status: CampaignStatus; budget: number;
    startDate: string; endDate: string; targetAudience: string; description: string;
    targetROI: string; targetConversions: string;
  }>({ title: "", channel: "google", status: "draft", budget: 0, startDate: "", endDate: "", targetAudience: "", description: "", targetROI: "", targetConversions: "" });
  const [form, setForm] = useState(EMPTY_FORM);

  // Note form state
  const [noteText, setNoteText] = useState("");
  const [notePhase, setNotePhase] = useState<CampaignProgressPhase>("running");

  const filtered = useMemo(() => campaigns.filter(c => {
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    if (channelFilter !== "all" && c.channel !== channelFilter) return false;
    return true;
  }), [campaigns, statusFilter, channelFilter]);

  const selected = campaigns.find(c => c.id === selectedId);

  const totalMetrics = useMemo(() => campaigns.reduce((acc, c) => ({
    impressions: acc.impressions + c.metrics.impressions,
    clicks: acc.clicks + c.metrics.clicks,
    conversions: acc.conversions + c.metrics.conversions,
    spend: acc.spend + c.metrics.spend,
    revenue: acc.revenue + c.metrics.revenue,
  }), { impressions: 0, clicks: 0, conversions: 0, spend: 0, revenue: 0 }), [campaigns]);

  const chartData = campaigns.map(c => ({
    name: c.title.length > 10 ? c.title.slice(0, 10) + "…" : c.title,
    بودجه: Math.round(c.budget / 1_000_000),
    خرج: Math.round(c.metrics.spend / 1_000_000),
    درآمد: Math.round(c.metrics.revenue / 1_000_000),
  }));

  const handleSubmit = async () => {
    if (!form.title || !form.startDate) return;
    try {
      const res = await apiClient.post("/campaigns", { ...form, createdById: user?.id });
      setCampaigns(prev => [res.data?.data ?? res.data, ...prev]);
      setShowForm(false);
      setForm(EMPTY_FORM);
      toast.success("کمپین ثبت شد");
    } catch { toast.error("خطا در ثبت کمپین"); }
  };

  const saveEdit = async () => {
    if (!selectedId) return;
    try {
      const patch = {
        title: editForm.title, channel: editForm.channel, status: editForm.status,
        budget: editForm.budget, startDate: editForm.startDate,
        endDate: editForm.endDate || undefined, targetAudience: editForm.targetAudience || undefined,
        description: editForm.description || undefined,
        targetROI: editForm.targetROI ? Number(editForm.targetROI) : undefined,
        targetConversions: editForm.targetConversions ? Number(editForm.targetConversions) : undefined,
      };
      const res = await apiClient.patch(`/campaigns/${selectedId}`, patch);
      const updated = res.data?.data ?? res.data;
      setCampaigns(prev => prev.map(c => c.id === selectedId ? { ...c, ...updated } : c));
      setEditMode(false);
      toast.success("کمپین بروزرسانی شد");
    } catch { toast.error("خطا در بروزرسانی"); }
  };

  const addNote = async () => {
    if (!noteText.trim() || !selectedId) return;
    const note: CampaignProgressNote = {
      id: `pn${Date.now()}`,
      text: noteText.trim(),
      phase: notePhase,
      authorId: user?.id ?? "",
      createdAt: new Date().toISOString(),
    };
    try {
      await apiClient.patch(`/campaigns/${selectedId}`, {
        progressNotes: [...(campaigns.find(c => c.id === selectedId)?.progressNotes ?? []), note],
      });
    } catch { /* silent — update local state anyway */ }
    setCampaigns(prev => prev.map(c => c.id === selectedId
      ? { ...c, progressNotes: [...(c.progressNotes ?? []), note] }
      : c));
    setNoteText("");
  };

  const getUserName = (uid: string) => uid;

  const getROI = (c: Campaign) => c.metrics.spend > 0 ? Math.round(((c.metrics.revenue - c.metrics.spend) / c.metrics.spend) * 100) : 0;
  const getCTR = (c: Campaign) => c.metrics.impressions > 0 ? ((c.metrics.clicks / c.metrics.impressions) * 100).toFixed(2) : "0";
  const totalROI = totalMetrics.spend > 0 ? Math.round(((totalMetrics.revenue - totalMetrics.spend) / totalMetrics.spend) * 100) : 0;

  const closeDetail = () => { setSelectedId(null); setEditMode(false); setDetailTab("info"); setNoteText(""); };

  return (
    <RoleGuard roles={["admin", "marketing", "sales_manager"]}>
      <div className="space-y-6">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Megaphone className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">کمپین‌های تبلیغاتی</h1>
              <p className="text-sm text-muted-foreground">{campaigns.filter(c => c.status === "active").length} کمپین فعال از {campaigns.length}</p>
            </div>
          </div>
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors gold-glow">
            <Plus className="w-4 h-4" />کمپین جدید
          </button>
        </motion.div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {[
            { label: "ایمپرشن", value: (totalMetrics.impressions / 1000).toFixed(0) + "K", icon: Eye, color: "text-blue-500", bg: "bg-blue-500/10" },
            { label: "کلیک", value: totalMetrics.clicks.toLocaleString("fa-IR"), icon: MousePointerClick, color: "text-green-500", bg: "bg-green-500/10" },
            { label: "تبدیل", value: totalMetrics.conversions.toLocaleString("fa-IR"), icon: ShoppingCart, color: "text-purple-500", bg: "bg-purple-500/10" },
            { label: "هزینه (M)", value: `${Math.round(totalMetrics.spend / 1_000_000)} M`, icon: DollarSign, color: "text-red-500", bg: "bg-red-500/10" },
            { label: "ROI کل", value: `${totalROI}%`, icon: TrendingUp, color: totalROI > 0 ? "text-green-500" : "text-red-500", bg: totalROI > 0 ? "bg-green-500/10" : "bg-red-500/10" },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <motion.div key={label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card p-4">
              <div className={`w-8 h-8 ${bg} rounded-xl flex items-center justify-center mb-3`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <p className="text-xl font-bold tabular-nums">{value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </motion.div>
          ))}
        </div>

        {/* Chart */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-primary" />
            مقایسه بودجه / هزینه / درآمد (میلیون تومان)
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE.contentStyle} labelStyle={TOOLTIP_STYLE.labelStyle} itemStyle={TOOLTIP_STYLE.itemStyle} formatter={(v: number) => `${v} M تومان`} />
              <Bar dataKey="بودجه" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="خرج" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              <Bar dataKey="درآمد" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center justify-center gap-5 mt-2">
            {[["بودجه", "hsl(var(--primary))"], ["هزینه", "#f59e0b"], ["درآمد", "#10b981"]].map(([name, color]) => (
              <div key={name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="w-3 h-2 rounded-sm inline-block" style={{ background: color }} />
                {name}
              </div>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap items-center">
          <div className="flex gap-1.5 flex-wrap">
            {(["all", "draft", "active", "paused", "completed"] as const).map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 text-xs rounded-xl transition-colors border ${statusFilter === s ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:bg-muted"}`}>
                {s === "all" ? "همه وضعیت‌ها" : STATUS_CFG[s].label}
              </button>
            ))}
          </div>
          <div className="w-px h-5 bg-border hidden sm:block" />
          <div className="flex gap-1.5 flex-wrap">
            {(["all", "google", "instagram", "linkedin", "email", "sms", "content"] as const).map(ch => (
              <button key={ch} onClick={() => setChannelFilter(ch)}
                className={`px-3 py-1.5 text-xs rounded-xl transition-colors border ${channelFilter === ch ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:bg-muted"}`}>
                {ch === "all" ? "همه کانال‌ها" : CHANNEL_CFG[ch].label}
              </button>
            ))}
          </div>
        </div>

        {/* Campaign Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c, i) => {
            const spentPct = c.budget > 0 ? Math.min(100, Math.round((c.metrics.spend / c.budget) * 100)) : 0;
            const roi = getROI(c);
            const ctr = getCTR(c);
            return (
              <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className={`card p-5 cursor-pointer hover:border-primary/40 hover:shadow-md transition-all ${selectedId === c.id ? "border-primary ring-1 ring-primary/20" : ""}`}
                onClick={() => { setSelectedId(c.id); setDetailTab("info"); }}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs px-2 py-0.5 rounded-lg ${CHANNEL_CFG[c.channel].color}`}>{CHANNEL_CFG[c.channel].label}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-lg border ${STATUS_CFG[c.status].color}`}>{STATUS_CFG[c.status].label}</span>
                    </div>
                    <h3 className="font-semibold text-sm leading-tight">{c.title}</h3>
                  </div>
                  {(c.progressNotes?.length ?? 0) > 0 && (
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full shrink-0">
                      {c.progressNotes!.length} یادداشت
                    </span>
                  )}
                </div>
                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-muted-foreground">بودجه مصرف‌شده</span>
                    <span className={`font-medium ${spentPct > 90 ? "text-red-500" : spentPct > 70 ? "text-yellow-500" : "text-foreground"}`}>{spentPct}%</span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${spentPct > 90 ? "bg-red-500" : spentPct > 70 ? "bg-yellow-500" : "bg-primary"}`} style={{ width: `${spentPct}%` }} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center pt-3 border-t border-border">
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">CTR</p>
                    <p className="text-sm font-bold">{ctr}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">تبدیل</p>
                    <p className="text-sm font-bold">{c.metrics.conversions}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">ROI</p>
                    <p className={`text-sm font-bold ${roi > 0 ? "text-green-500" : "text-red-500"}`}>{roi}%</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
          {filtered.length === 0 && (
            <div className="col-span-3 text-center py-16 text-muted-foreground">
              <Megaphone className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>کمپینی یافت نشد</p>
            </div>
          )}
        </div>

        {/* Detail Modal */}
        <AnimatePresence>
          {selected && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={closeDetail}>
              <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }}
                onClick={e => e.stopPropagation()}
                className="w-full max-w-xl bg-card border border-border rounded-2xl shadow-2xl flex flex-col max-h-[92vh]">

                {/* Modal Header */}
                <div className="flex items-start justify-between gap-3 px-6 py-4 border-b border-border shrink-0">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`text-xs px-2 py-0.5 rounded-lg ${CHANNEL_CFG[editMode ? editForm.channel : selected.channel].color}`}>
                        {CHANNEL_CFG[editMode ? editForm.channel : selected.channel].label}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-lg border ${STATUS_CFG[editMode ? editForm.status : selected.status].color}`}>
                        {STATUS_CFG[editMode ? editForm.status : selected.status].label}
                      </span>
                    </div>
                    <h2 className="font-bold text-lg leading-tight">{editMode ? editForm.title || selected.title : selected.title}</h2>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => setShowReport(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted hover:bg-muted/80 text-xs font-medium transition-colors text-muted-foreground hover:text-foreground">
                      <FileText className="w-3.5 h-3.5" />گزارش
                    </button>
                    {!editMode ? (
                      <button onClick={() => { setEditMode(true); setEditForm({ title: selected.title, channel: selected.channel, status: selected.status, budget: selected.budget, startDate: selected.startDate, endDate: selected.endDate ?? "", targetAudience: selected.targetAudience ?? "", description: selected.description ?? "", targetROI: selected.targetROI?.toString() ?? "", targetConversions: selected.targetConversions?.toString() ?? "" }); }}
                        className="p-1.5 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                        <Pencil className="w-4 h-4" />
                      </button>
                    ) : (
                      <button onClick={saveEdit}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors">
                        <Save className="w-3.5 h-3.5" />ذخیره
                      </button>
                    )}
                    <button onClick={closeDetail} className="p-1.5 rounded-xl hover:bg-muted transition-colors"><X className="w-5 h-5" /></button>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-border shrink-0">
                  {[
                    { id: "info" as const, label: "اطلاعات", icon: ClipboardList },
                    { id: "progress" as const, label: "پیشرفت", icon: TrendingUp },
                  ].map(({ id, label, icon: Icon }) => (
                    <button key={id} onClick={() => setDetailTab(id)}
                      className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${detailTab === id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
                      <Icon className="w-4 h-4" />{label}
                      {id === "progress" && (selected.progressNotes?.length ?? 0) > 0 && (
                        <span className="text-xs bg-primary/15 text-primary rounded-full px-1.5 py-0.5">{selected.progressNotes!.length}</span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-y-auto p-6">
                  {detailTab === "info" && (
                    <div className="space-y-4">
                      {editMode ? (
                        /* ── Full edit form ── */
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-1">عنوان کمپین</label>
                            <input value={editForm.title} onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))} className="input-field w-full text-sm" />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-muted-foreground mb-1">کانال</label>
                              <select value={editForm.channel} onChange={e => setEditForm(p => ({ ...p, channel: e.target.value as CampaignChannel }))} className="input-field w-full text-sm">
                                {Object.entries(CHANNEL_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-muted-foreground mb-1">وضعیت</label>
                              <select value={editForm.status} onChange={e => setEditForm(p => ({ ...p, status: e.target.value as CampaignStatus }))} className="input-field w-full text-sm">
                                {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                              </select>
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-1">بودجه کل (تومان)</label>
                            <input type="number" value={editForm.budget} onChange={e => setEditForm(p => ({ ...p, budget: Number(e.target.value) }))} className="input-field w-full text-sm" />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-muted-foreground mb-1">تاریخ شروع</label>
                              <input type="date" value={editForm.startDate} onChange={e => setEditForm(p => ({ ...p, startDate: e.target.value }))} className="input-field w-full text-sm" />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-muted-foreground mb-1">تاریخ پایان</label>
                              <input type="date" value={editForm.endDate} onChange={e => setEditForm(p => ({ ...p, endDate: e.target.value }))} className="input-field w-full text-sm" />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-muted-foreground mb-1">هدف ROI (%)</label>
                              <input type="number" value={editForm.targetROI} onChange={e => setEditForm(p => ({ ...p, targetROI: e.target.value }))} className="input-field w-full text-sm" placeholder="مثلاً 300" />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-muted-foreground mb-1">هدف تبدیل</label>
                              <input type="number" value={editForm.targetConversions} onChange={e => setEditForm(p => ({ ...p, targetConversions: e.target.value }))} className="input-field w-full text-sm" placeholder="مثلاً 120" />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-1">مخاطبان هدف</label>
                            <input value={editForm.targetAudience} onChange={e => setEditForm(p => ({ ...p, targetAudience: e.target.value }))} className="input-field w-full text-sm" />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-1">توضیحات</label>
                            <textarea value={editForm.description} onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))} className="input-field w-full resize-none text-sm" rows={2} />
                          </div>
                        </div>
                      ) : (
                        /* ── Read-only view ── */
                        <>
                          {selected.description && <p className="text-sm text-muted-foreground">{selected.description}</p>}
                          {selected.targetAudience && (
                            <div className="bg-muted/50 rounded-xl p-3 text-sm">
                              <span className="font-medium">مخاطبان هدف: </span>{selected.targetAudience}
                            </div>
                          )}
                          <div className="grid grid-cols-2 gap-3">
                            {[
                              { label: "بودجه کل", value: selected.budget.toLocaleString("fa-IR") + " ت" },
                              { label: "هزینه‌شده", value: selected.metrics.spend.toLocaleString("fa-IR") + " ت" },
                              { label: "ایمپرشن", value: selected.metrics.impressions.toLocaleString("fa-IR") },
                              { label: "کلیک", value: selected.metrics.clicks.toLocaleString("fa-IR") },
                              { label: "تبدیل", value: selected.metrics.conversions.toLocaleString("fa-IR") },
                              { label: "درآمد", value: selected.metrics.revenue.toLocaleString("fa-IR") + " ت", highlight: true },
                            ].map(({ label, value, highlight }) => (
                              <div key={label} className="p-3 bg-muted/30 rounded-xl">
                                <p className="text-xs text-muted-foreground mb-1">{label}</p>
                                <p className={`font-bold tabular-nums ${highlight ? "text-green-500" : ""}`}>{value}</p>
                              </div>
                            ))}
                          </div>

                          {(selected.targetROI || selected.targetConversions) && (
                            <div className="space-y-3">
                              {selected.targetROI && (() => {
                                const roi = getROI(selected);
                                const pct = Math.min(100, Math.round((roi / selected.targetROI!) * 100));
                                return (
                                  <div>
                                    <div className="flex justify-between text-xs mb-1.5">
                                      <span className="text-muted-foreground">ROI — هدف: {selected.targetROI}%</span>
                                      <span className={`font-semibold ${roi >= selected.targetROI! ? "text-green-500" : "text-amber-500"}`}>{roi}% ({pct}%)</span>
                                    </div>
                                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                                      <div className={`h-full rounded-full ${pct >= 100 ? "bg-green-500" : "bg-amber-500"}`} style={{ width: `${pct}%` }} />
                                    </div>
                                  </div>
                                );
                              })()}
                              {selected.targetConversions && (() => {
                                const pct = Math.min(100, Math.round((selected.metrics.conversions / selected.targetConversions!) * 100));
                                return (
                                  <div>
                                    <div className="flex justify-between text-xs mb-1.5">
                                      <span className="text-muted-foreground">تبدیل — هدف: {selected.targetConversions}</span>
                                      <span className={`font-semibold ${pct >= 100 ? "text-green-500" : "text-amber-500"}`}>{selected.metrics.conversions} ({pct}%)</span>
                                    </div>
                                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                                      <div className={`h-full rounded-full ${pct >= 100 ? "bg-green-500" : "bg-primary"}`} style={{ width: `${pct}%` }} />
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          )}

                          <div className="flex items-center justify-between text-sm text-muted-foreground border-t border-border pt-3">
                            <span>شروع: {new Date(selected.startDate).toLocaleDateString("fa-IR")}</span>
                            {selected.endDate && <span>پایان: {new Date(selected.endDate).toLocaleDateString("fa-IR")}</span>}
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {detailTab === "progress" && (
                    <div className="space-y-5">
                      {/* Notes timeline */}
                      {(selected.progressNotes?.length ?? 0) > 0 ? (
                        <div className="space-y-3">
                          {selected.progressNotes!.map((note, i) => {
                            const ph = PHASE_CFG[note.phase];
                            const PhaseIcon = ph.icon;
                            return (
                              <div key={note.id} className="flex gap-3">
                                <div className="flex flex-col items-center">
                                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${ph.dot} bg-opacity-15`}>
                                    <PhaseIcon className={`w-3.5 h-3.5 ${ph.color}`} />
                                  </div>
                                  {i < selected.progressNotes!.length - 1 && (
                                    <div className="w-px flex-1 bg-border mt-1 min-h-4" />
                                  )}
                                </div>
                                <div className="pb-3 min-w-0 flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className={`text-xs font-semibold ${ph.color}`}>{ph.label}</span>
                                    <span className="text-xs text-muted-foreground">
                                      {new Date(note.createdAt).toLocaleDateString("fa-IR")} · {getUserName(note.authorId)}
                                    </span>
                                  </div>
                                  <p className="text-sm leading-relaxed">{note.text}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground text-sm">
                          <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-30" />
                          یادداشتی ثبت نشده
                        </div>
                      )}

                      {/* Add note form */}
                      <div className="bg-muted/30 rounded-xl p-4 space-y-3 border border-border/50">
                        <p className="text-sm font-medium">ثبت یادداشت جدید</p>
                        <select value={notePhase} onChange={e => setNotePhase(e.target.value as CampaignProgressPhase)}
                          className="input-field w-full text-sm">
                          {Object.entries(PHASE_CFG).map(([k, v]) => (
                            <option key={k} value={k}>{v.label}</option>
                          ))}
                        </select>
                        <textarea value={noteText} onChange={e => setNoteText(e.target.value)}
                          className="input-field w-full resize-none text-sm" rows={3}
                          placeholder="گزارش پیشرفت، تغییرات، نتایج..." />
                        <button onClick={addNote} disabled={!noteText.trim()}
                          className="w-full py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                          ثبت یادداشت
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Report Modal */}
        <AnimatePresence>
          {showReport && selected && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
              onClick={() => setShowReport(false)}>
              <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }}
                onClick={e => e.stopPropagation()}
                className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl flex flex-col max-h-[92vh]">
                <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
                  <span className="font-bold">گزارش کمپین</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => window.print()}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted hover:bg-muted/80 text-xs font-medium transition-colors text-muted-foreground hover:text-foreground">
                      <Printer className="w-3.5 h-3.5" />چاپ / PDF
                    </button>
                    <button onClick={() => setShowReport(false)} className="p-1.5 rounded-xl hover:bg-muted"><X className="w-5 h-5" /></button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 print:p-0">
                  {/* Report header */}
                  <div className="flex items-start justify-between gap-3 pb-4 border-b border-border">
                    <div>
                      <h2 className="font-bold text-xl mb-1">{selected.title}</h2>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-lg ${CHANNEL_CFG[selected.channel].color}`}>{CHANNEL_CFG[selected.channel].label}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-lg border ${STATUS_CFG[selected.status].color}`}>{STATUS_CFG[selected.status].label}</span>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground text-left">
                      <div>شروع: {new Date(selected.startDate).toLocaleDateString("fa-IR")}</div>
                      {selected.endDate && <div>پایان: {new Date(selected.endDate).toLocaleDateString("fa-IR")}</div>}
                    </div>
                  </div>

                  {/* KPI grid */}
                  <div>
                    <h3 className="text-sm font-semibold mb-3">شاخص‌های کلیدی</h3>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { label: "بودجه کل", value: selected.budget.toLocaleString("fa-IR") + " ت" },
                        { label: "هزینه‌شده", value: selected.metrics.spend.toLocaleString("fa-IR") + " ت" },
                        { label: "ROI", value: `${getROI(selected)}%`, highlight: getROI(selected) > 0 },
                        { label: "ایمپرشن", value: selected.metrics.impressions.toLocaleString("fa-IR") },
                        { label: "کلیک (CTR: " + getCTR(selected) + "%)", value: selected.metrics.clicks.toLocaleString("fa-IR") },
                        { label: "تبدیل", value: selected.metrics.conversions.toLocaleString("fa-IR") },
                        { label: "درآمد", value: selected.metrics.revenue.toLocaleString("fa-IR") + " ت", highlight: true },
                        ...(selected.targetROI ? [{ label: "هدف ROI", value: `${selected.targetROI}%` }] : []),
                        ...(selected.targetConversions ? [{ label: "هدف تبدیل", value: String(selected.targetConversions) }] : []),
                      ].map(({ label, value, highlight }) => (
                        <div key={label} className="p-3 bg-muted/30 rounded-xl">
                          <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
                          <p className={`font-bold text-sm tabular-nums ${highlight ? "text-green-500" : ""}`}>{value}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Progress bars */}
                  {(selected.targetROI || selected.targetConversions) && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold">دستیابی به اهداف</h3>
                      {selected.targetROI && (() => {
                        const roi = getROI(selected);
                        const pct = Math.min(100, Math.round((roi / selected.targetROI!) * 100));
                        return (
                          <div>
                            <div className="flex justify-between text-xs mb-1.5">
                              <span>ROI — هدف {selected.targetROI}%</span>
                              <span className={`font-semibold ${pct >= 100 ? "text-green-500" : "text-amber-500"}`}>{roi}% ({pct}%)</span>
                            </div>
                            <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${pct >= 100 ? "bg-green-500" : "bg-amber-500"}`} style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })()}
                      {selected.targetConversions && (() => {
                        const pct = Math.min(100, Math.round((selected.metrics.conversions / selected.targetConversions!) * 100));
                        return (
                          <div>
                            <div className="flex justify-between text-xs mb-1.5">
                              <span>تبدیل — هدف {selected.targetConversions}</span>
                              <span className={`font-semibold ${pct >= 100 ? "text-green-500" : "text-amber-500"}`}>{selected.metrics.conversions} ({pct}%)</span>
                            </div>
                            <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${pct >= 100 ? "bg-green-500" : "bg-primary"}`} style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* Progress notes timeline */}
                  {(selected.progressNotes?.length ?? 0) > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold mb-3">یادداشت‌های پیشرفت</h3>
                      <div className="space-y-3">
                        {selected.progressNotes!.map((note) => {
                          const ph = PHASE_CFG[note.phase];
                          const PhaseIcon = ph.icon;
                          return (
                            <div key={note.id} className="flex gap-3 p-3 bg-muted/20 rounded-xl">
                              <PhaseIcon className={`w-4 h-4 ${ph.color} shrink-0 mt-0.5`} />
                              <div>
                                <div className="flex items-center gap-2 mb-0.5">
                                  <span className={`text-xs font-semibold ${ph.color}`}>{ph.label}</span>
                                  <span className="text-xs text-muted-foreground">{new Date(note.createdAt).toLocaleDateString("fa-IR")} · {getUserName(note.authorId)}</span>
                                </div>
                                <p className="text-sm">{note.text}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Auto summary */}
                  <div className="bg-muted/40 rounded-xl p-4">
                    <h3 className="text-sm font-semibold mb-2">خلاصه خودکار</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {(() => {
                        const roi = getROI(selected);
                        const spentPct = selected.budget > 0 ? Math.round((selected.metrics.spend / selected.budget) * 100) : 0;
                        const roiPct = selected.targetROI ? Math.round((roi / selected.targetROI) * 100) : null;
                        const parts: string[] = [];
                        if (roi > 0) parts.push(`این کمپین با ROI ${roi}٪ عملکرد مثبتی داشته`);
                        else parts.push(`این کمپین در حال حاضر ROI منفی (${roi}٪) دارد`);
                        parts.push(`${spentPct}٪ بودجه مصرف شده`);
                        if (roiPct !== null) {
                          if (roiPct >= 100) parts.push(`هدف ROI محقق شده (${roiPct}٪ از هدف)`);
                          else parts.push(`${roiPct}٪ از هدف ROI محقق شده`);
                        }
                        if (selected.metrics.conversions > 0) parts.push(`${selected.metrics.conversions} تبدیل ثبت شده`);
                        return parts.join(". ") + ".";
                      })()}
                    </p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* New Campaign Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setShowForm(false)}>
              <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.96, opacity: 0 }}
                onClick={e => e.stopPropagation()}
                className="bg-card border border-border rounded-2xl w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-lg">کمپین جدید</h2>
                  <button onClick={() => setShowForm(false)} className="p-1.5 rounded-xl hover:bg-muted"><X className="w-5 h-5" /></button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1.5">عنوان *</label>
                    <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} className="input-field w-full" placeholder="عنوان کمپین..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">کانال</label>
                    <select value={form.channel} onChange={e => setForm(p => ({ ...p, channel: e.target.value as CampaignChannel }))} className="input-field w-full">
                      {Object.entries(CHANNEL_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">بودجه (تومان)</label>
                    <input type="number" value={form.budget || ""} onChange={e => setForm(p => ({ ...p, budget: Number(e.target.value) }))} className="input-field w-full" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">تاریخ شروع *</label>
                    <input type="date" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} className="input-field w-full" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">تاریخ پایان</label>
                    <input type="date" value={form.endDate} onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))} className="input-field w-full" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1.5">مخاطبان هدف</label>
                    <input value={form.targetAudience} onChange={e => setForm(p => ({ ...p, targetAudience: e.target.value }))} className="input-field w-full" placeholder="توصیف مخاطبان هدف..." />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1.5">توضیحات</label>
                    <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="input-field w-full resize-none" rows={2} />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={handleSubmit} className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">ذخیره</button>
                  <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl border border-border text-sm hover:bg-muted transition-colors">انصراف</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </RoleGuard>
  );
}
