"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  PieChart as PieChartIcon, Plus, Pencil, Trash2, ChevronDown, ChevronUp,
  X, Check, DollarSign, TrendingUp, TrendingDown, Layers,
} from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { RoleGuard } from "@/components/common/RoleGuard";
import type { BudgetLineItem, CampaignChannel, Campaign } from "@/types";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

/* ─── constants ─────────────────────────────────────────── */
const TOOLTIP_STYLE = {
  contentStyle: {
    background: "#1e1e2e", border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "12px", fontSize: "12px", color: "#f8f8f2",
    boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
  },
  labelStyle: { color: "#a8a8b3", marginBottom: "4px" },
  itemStyle: { color: "#f8f8f2" },
};

const CHANNEL_LABELS: Record<string, string> = {
  google: "گوگل", instagram: "اینستاگرام", linkedin: "لینکدین",
  email: "ایمیل", sms: "پیامک", content: "محتوا", other: "سایر",
};

const CHANNEL_COLORS: Record<string, string> = {
  google: "#6366f1", instagram: "#ec4899", linkedin: "#3b82f6",
  email: "#8b5cf6", sms: "#14b8a6", content: "#f59e0b", other: "#6b7280",
};

const ALL_CHANNELS: CampaignChannel[] = ["google", "instagram", "linkedin", "email", "sms", "content", "other"];

const fmt = (n: number) =>
  n >= 1_000_000
    ? `${(n / 1_000_000).toFixed(1)} M`
    : n >= 1_000
    ? `${(n / 1_000).toFixed(0)} K`
    : n.toLocaleString("fa-IR");

/* ─── modal form blank ──────────────────────────────────── */
const BLANK_FORM = {
  name: "", channel: "google" as CampaignChannel, allocatedAmount: "",
  startDate: "", endDate: "", campaignId: "", notes: "",
};

/* ─── page ──────────────────────────────────────────────── */
export default function MarketingBudgetPage() {
  const [budget, setBudget] = useState({ totalBudget: 0, period: "دوره جاری", lineItems: [] as BudgetLineItem[] });
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [expandedChannels, setExpandedChannels] = useState<Set<string>>(new Set());
  const [editingBudget, setEditingBudget] = useState(false);
  const [totalInput, setTotalInput] = useState("0");
  const [modal, setModal] = useState<null | "add" | string>(null); // "add" | itemId for edit
  const [form, setForm] = useState(BLANK_FORM);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    apiClient.get<{ data: Campaign[] }>("/campaigns?perPage=100")
      .then(res => setCampaigns(res.data.data ?? []))
      .catch(() => setCampaigns([]));
  }, []);

  /* ─── derived ────────────────────────────────────────── */
  const spendByChannel = useMemo(() =>
    campaigns.reduce((acc, c) => {
      acc[c.channel] = (acc[c.channel] ?? 0) + c.metrics.spend;
      return acc;
    }, {} as Partial<Record<CampaignChannel, number>>),
  [campaigns]);

  const allocatedByChannel = useMemo(() =>
    budget.lineItems.reduce((acc, item) => {
      acc[item.channel] = (acc[item.channel] ?? 0) + item.allocatedAmount;
      return acc;
    }, {} as Partial<Record<CampaignChannel, number>>),
  [budget.lineItems]);

  const totalAllocated = useMemo(
    () => budget.lineItems.reduce((s, i) => s + i.allocatedAmount, 0),
    [budget.lineItems],
  );

  const totalSpent = useMemo(
    () => Object.values(spendByChannel).reduce((s, v) => s + (v ?? 0), 0),
    [spendByChannel],
  );

  const remaining = totalAllocated - totalSpent;

  /* pie data */
  const pieData = ALL_CHANNELS
    .filter(ch => (allocatedByChannel[ch] ?? 0) > 0)
    .map(ch => ({ name: CHANNEL_LABELS[ch], value: allocatedByChannel[ch]!, channel: ch }));

  /* channel rows */
  const channelRows = ALL_CHANNELS
    .filter(ch => (allocatedByChannel[ch] ?? 0) > 0)
    .map(ch => {
      const allocated = allocatedByChannel[ch] ?? 0;
      const spent = spendByChannel[ch] ?? 0;
      const rem = allocated - spent;
      const pct = allocated > 0 ? Math.min(100, Math.round((spent / allocated) * 100)) : 0;
      const items = budget.lineItems.filter(i => i.channel === ch);
      return { ch, allocated, spent, rem, pct, items };
    });

  /* ─── handlers ───────────────────────────────────────── */
  function toggleChannel(ch: string) {
    setExpandedChannels(prev => {
      const next = new Set(prev);
      next.has(ch) ? next.delete(ch) : next.add(ch);
      return next;
    });
  }

  function saveTotalBudget() {
    const n = Number(totalInput.replace(/,/g, ""));
    if (!isNaN(n) && n > 0) setBudget(b => ({ ...b, totalBudget: n }));
    setEditingBudget(false);
  }

  function openAdd() {
    setForm(BLANK_FORM);
    setModal("add");
  }

  function openEdit(item: BudgetLineItem) {
    setForm({
      name: item.name,
      channel: item.channel,
      allocatedAmount: String(item.allocatedAmount),
      startDate: item.startDate ?? "",
      endDate: item.endDate ?? "",
      campaignId: item.campaignId ?? "",
      notes: item.notes ?? "",
    });
    setModal(item.id);
  }

  function saveModal() {
    const amount = Number(String(form.allocatedAmount).replace(/,/g, ""));
    if (!form.name.trim() || isNaN(amount) || amount <= 0) return;

    if (modal === "add") {
      const newItem: BudgetLineItem = {
        id: `bl${Date.now()}`,
        channel: form.channel,
        name: form.name.trim(),
        allocatedAmount: amount,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
        campaignId: form.campaignId || undefined,
        notes: form.notes || undefined,
        createdAt: new Date().toISOString(),
      };
      setBudget(b => ({ ...b, lineItems: [...b.lineItems, newItem] }));
    } else if (modal) {
      setBudget(b => ({
        ...b,
        lineItems: b.lineItems.map(i =>
          i.id === modal
            ? {
                ...i,
                channel: form.channel,
                name: form.name.trim(),
                allocatedAmount: amount,
                startDate: form.startDate || undefined,
                endDate: form.endDate || undefined,
                campaignId: form.campaignId || undefined,
                notes: form.notes || undefined,
              }
            : i,
        ),
      }));
    }
    setModal(null);
  }

  function deleteItem(id: string) {
    setBudget(b => ({ ...b, lineItems: b.lineItems.filter(i => i.id !== id) }));
    setDeletingId(null);
  }

  /* ─── render ─────────────────────────────────────────── */
  return (
    <RoleGuard roles={["admin", "marketing", "accountant"]}>
      <div className="space-y-6">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <PieChartIcon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">بودجه تبلیغات</h1>
              <p className="text-sm text-muted-foreground">دوره: {budget.period}</p>
            </div>
          </div>
          <button onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
            <Plus className="w-4 h-4" />
            آیتم جدید
          </button>
        </motion.div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Budget — editable */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="card p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground">بودجه کل</p>
              <button onClick={() => { setEditingBudget(true); setTotalInput(String(budget.totalBudget)); }}
                className="text-muted-foreground hover:text-foreground transition-colors">
                <Pencil className="w-3.5 h-3.5" />
              </button>
            </div>
            {editingBudget ? (
              <div className="flex items-center gap-1 mt-1">
                <input
                  type="number"
                  value={totalInput}
                  onChange={e => setTotalInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") saveTotalBudget(); if (e.key === "Escape") setEditingBudget(false); }}
                  className="w-full bg-muted rounded-lg px-2 py-1 text-sm font-bold outline-none focus:ring-1 focus:ring-primary"
                  dir="ltr"
                  autoFocus
                />
                <button onClick={saveTotalBudget} className="text-green-500 hover:text-green-400"><Check className="w-4 h-4" /></button>
                <button onClick={() => setEditingBudget(false)} className="text-red-500 hover:text-red-400"><X className="w-4 h-4" /></button>
              </div>
            ) : (
              <>
                <p className="text-2xl font-bold" dir="ltr">{fmt(budget.totalBudget)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">تومان</p>
              </>
            )}
          </motion.div>

          {/* Allocated */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="card p-5">
            <div className="flex items-center gap-2 mb-2">
              <Layers className="w-3.5 h-3.5 text-blue-500" />
              <p className="text-xs text-muted-foreground">تخصیص‌یافته</p>
            </div>
            <p className="text-2xl font-bold text-blue-500" dir="ltr">{fmt(totalAllocated)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {budget.totalBudget > 0
                ? `${Math.round((totalAllocated / budget.totalBudget) * 100)}% از بودجه کل`
                : "—"}
            </p>
          </motion.div>

          {/* Spent */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="card p-5">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-3.5 h-3.5 text-orange-500" />
              <p className="text-xs text-muted-foreground">مصرف‌شده واقعی</p>
            </div>
            <p className="text-2xl font-bold text-orange-500" dir="ltr">{fmt(totalSpent)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {totalAllocated > 0
                ? `${Math.round((totalSpent / totalAllocated) * 100)}% از تخصیص‌یافته`
                : "—"}
            </p>
          </motion.div>

          {/* Remaining */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="card p-5">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className={`w-3.5 h-3.5 ${remaining < 0 ? "text-red-500" : "text-green-500"}`} />
              <p className="text-xs text-muted-foreground">مانده</p>
            </div>
            <p className={`text-2xl font-bold ${remaining < 0 ? "text-red-500" : "text-green-500"}`} dir="ltr">
              {fmt(Math.abs(remaining))}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{remaining < 0 ? "اضافه‌خرج" : "باقیمانده"}</p>
          </motion.div>
        </div>

        {/* Channel Table + Pie */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* Channel expandable table */}
          <div className="lg:col-span-3 card overflow-hidden">
            <div className="p-4 border-b border-border">
              <h2 className="text-sm font-semibold">تفکیک بودجه بر اساس کانال</h2>
            </div>

            <div className="divide-y divide-border/50">
              {channelRows.map(({ ch, allocated, spent, rem, pct, items }) => (
                <div key={ch}>
                  {/* Channel row */}
                  <button
                    onClick={() => toggleChannel(ch)}
                    className="w-full px-4 py-3 text-right hover:bg-muted/30 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ background: CHANNEL_COLORS[ch] ?? "#6b7280" }} />
                        <span className="text-sm font-medium">{CHANNEL_LABELS[ch] ?? ch}</span>
                        <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-md">
                          {items.length} آیتم
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-medium ${pct > 90 ? "text-red-500" : pct > 70 ? "text-orange-500" : "text-muted-foreground"}`}
                          dir="ltr">{pct}%</span>
                        {expandedChannels.has(ch) ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden mb-2">
                      <div className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, background: CHANNEL_COLORS[ch] ?? "#6366f1" }} />
                    </div>

                    {/* Numbers */}
                    <div className="flex items-center gap-4 text-xs" dir="ltr">
                      <span className="text-muted-foreground">{fmt(allocated)} تخصیص</span>
                      <span className="text-orange-500">{fmt(spent)} مصرف</span>
                      <span className={rem < 0 ? "text-red-500 font-semibold" : "text-green-500"}>
                        {fmt(Math.abs(rem))} {rem < 0 ? "اضافه" : "مانده"}
                      </span>
                    </div>
                  </button>

                  {/* Expanded: line items for this channel */}
                  <AnimatePresence>
                    {expandedChannels.has(ch) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden bg-muted/20"
                      >
                        <div className="px-4 py-2 space-y-1">
                          {items.map(item => (
                            <div key={item.id}
                              className="flex items-center justify-between py-1.5 px-3 rounded-lg hover:bg-muted/40 transition-colors">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{item.name}</p>
                                {(item.startDate || item.endDate) && (
                                  <p className="text-xs text-muted-foreground" dir="ltr">
                                    {item.startDate ?? "—"} → {item.endDate ?? "∞"}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-3 mr-3">
                                <span className="text-sm font-semibold" dir="ltr">{fmt(item.allocatedAmount)}</span>
                                <button onClick={(e) => { e.stopPropagation(); openEdit(item); }}
                                  className="text-muted-foreground hover:text-foreground transition-colors p-1">
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); setDeletingId(item.id); }}
                                  className="text-muted-foreground hover:text-red-500 transition-colors p-1">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                          <button onClick={openAdd}
                            className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors py-1.5 px-3">
                            <Plus className="w-3 h-3" /> افزودن آیتم
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}

              {channelRows.length === 0 && (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  هیچ آیتم بودجه‌ای وجود ندارد
                </div>
              )}
            </div>
          </div>

          {/* Pie Chart */}
          <div className="lg:col-span-2 card p-4">
            <h2 className="text-sm font-semibold mb-3">توزیع بودجه</h2>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%" cy="45%"
                    innerRadius={60} outerRadius={95}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={CHANNEL_COLORS[entry.channel] ?? "#6b7280"} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE.contentStyle}
                    labelStyle={TOOLTIP_STYLE.labelStyle}
                    itemStyle={TOOLTIP_STYLE.itemStyle}
                    formatter={(v: number) => [`${fmt(v)} تومان`, "بودجه تخصیصی"]}
                  />
                  <Legend
                    layout="horizontal"
                    align="center"
                    verticalAlign="bottom"
                    formatter={(value) => (
                      <span style={{ fontSize: 11, color: "#a8a8b3" }}>{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
                داده‌ای برای نمایش وجود ندارد
              </div>
            )}
          </div>
        </div>

        {/* Full Line Items Table */}
        <div className="card overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="text-sm font-semibold">تمام آیتم‌های بودجه</h2>
            <button onClick={openAdd}
              className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors font-medium">
              <Plus className="w-3.5 h-3.5" /> افزودن
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground w-8">#</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">شرح</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">کانال</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">بودجه</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">تاریخ شروع</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">تاریخ پایان</th>
                  <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">کمپین</th>
                  <th className="px-4 py-2.5 w-20"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {budget.lineItems.map((item, idx) => (
                  <motion.tr key={item.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 text-muted-foreground text-xs">{idx + 1}</td>
                    <td className="px-4 py-3 font-medium">{item.name}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          background: `${CHANNEL_COLORS[item.channel] ?? "#6b7280"}22`,
                          color: CHANNEL_COLORS[item.channel] ?? "#6b7280",
                        }}>
                        <span className="w-1.5 h-1.5 rounded-full"
                          style={{ background: CHANNEL_COLORS[item.channel] ?? "#6b7280" }} />
                        {CHANNEL_LABELS[item.channel] ?? item.channel}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold" dir="ltr">{fmt(item.allocatedAmount)}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs" dir="ltr">{item.startDate ?? "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs" dir="ltr">{item.endDate ?? "∞"}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {item.campaignId
                        ? (campaigns.find(c => c.id === item.campaignId)?.title ?? item.campaignId)
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => openEdit(item)}
                          className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setDeletingId(item.id)}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 transition-colors text-muted-foreground hover:text-red-500">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
                {budget.lineItems.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground text-sm">
                      هیچ آیتمی ثبت نشده — با دکمه «افزودن» شروع کنید
                    </td>
                  </tr>
                )}
              </tbody>
              {budget.lineItems.length > 0 && (
                <tfoot>
                  <tr className="border-t border-border bg-muted/30">
                    <td colSpan={3} className="px-4 py-2.5 text-xs font-medium text-muted-foreground text-right">
                      جمع کل ({budget.lineItems.length} آیتم)
                    </td>
                    <td className="px-4 py-2.5 font-bold" dir="ltr">{fmt(totalAllocated)}</td>
                    <td colSpan={4} />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>

      {/* ─── Add / Edit Modal ─────────────────────────────── */}
      <AnimatePresence>
        {modal !== null && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={e => { if (e.target === e.currentTarget) setModal(null); }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="card w-full max-w-lg p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-bold text-base">{modal === "add" ? "افزودن آیتم بودجه" : "ویرایش آیتم"}</h3>
                <button onClick={() => setModal(null)} className="text-muted-foreground hover:text-foreground transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium mb-1.5">شرح آیتم</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="مثال: گوگل سرچ برند"
                    className="w-full bg-muted rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                {/* Channel */}
                <div>
                  <label className="block text-sm font-medium mb-1.5">کانال</label>
                  <select
                    value={form.channel}
                    onChange={e => setForm(f => ({ ...f, channel: e.target.value as CampaignChannel }))}
                    className="w-full bg-muted rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    {ALL_CHANNELS.map(ch => (
                      <option key={ch} value={ch}>{CHANNEL_LABELS[ch] ?? ch}</option>
                    ))}
                  </select>
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-sm font-medium mb-1.5">بودجه تخصیصی (تومان)</label>
                  <input
                    type="number"
                    value={form.allocatedAmount}
                    onChange={e => setForm(f => ({ ...f, allocatedAmount: e.target.value }))}
                    placeholder="مثال: 5000000"
                    className="w-full bg-muted rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                    dir="ltr"
                  />
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">تاریخ شروع</label>
                    <input
                      type="date"
                      value={form.startDate}
                      onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                      className="w-full bg-muted rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5">تاریخ پایان</label>
                    <input
                      type="date"
                      value={form.endDate}
                      onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                      className="w-full bg-muted rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                      dir="ltr"
                    />
                  </div>
                </div>

                {/* Campaign */}
                <div>
                  <label className="block text-sm font-medium mb-1.5">کمپین مرتبط (اختیاری)</label>
                  <select
                    value={form.campaignId}
                    onChange={e => setForm(f => ({ ...f, campaignId: e.target.value }))}
                    className="w-full bg-muted rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="">— بدون کمپین —</option>
                    {campaigns.map(c => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium mb-1.5">یادداشت</label>
                  <textarea
                    value={form.notes}
                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    rows={2}
                    placeholder="توضیحات اضافی..."
                    className="w-full bg-muted rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={saveModal}
                  className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
                  {modal === "add" ? "افزودن" : "ذخیره"}
                </button>
                <button onClick={() => setModal(null)}
                  className="px-5 py-2.5 rounded-xl bg-muted text-sm font-medium hover:bg-muted/80 transition-colors">
                  لغو
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Delete Confirm ───────────────────────────────── */}
      <AnimatePresence>
        {deletingId && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="card w-full max-w-sm p-6 shadow-2xl text-center"
            >
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="font-bold mb-2">حذف آیتم</h3>
              <p className="text-sm text-muted-foreground mb-6">آیا مطمئن هستید؟ این عمل قابل برگشت نیست.</p>
              <div className="flex gap-3">
                <button onClick={() => deleteItem(deletingId)}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors">
                  حذف
                </button>
                <button onClick={() => setDeletingId(null)}
                  className="flex-1 py-2.5 rounded-xl bg-muted text-sm font-medium hover:bg-muted/80 transition-colors">
                  لغو
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </RoleGuard>
  );
}
