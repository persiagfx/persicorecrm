"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { BarChart2, Eye, MousePointerClick, ShoppingCart, TrendingUp, DollarSign } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { RoleGuard } from "@/components/common/RoleGuard";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";
import type { Campaign } from "@/types";

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

const CHANNEL_LABELS: Record<string, string> = {
  google: "گوگل", instagram: "اینستاگرام", linkedin: "لینکدین",
  email: "ایمیل", sms: "پیامک", content: "محتوا", other: "سایر",
};

const COLORS = ["#6366f1", "#ec4899", "#3b82f6", "#8b5cf6", "#14b8a6", "#f59e0b"];

export default function MarketingAnalyticsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get<{ data: Campaign[] }>("/campaigns?perPage=100")
      .then(res => setCampaigns(res.data.data ?? []))
      .catch(() => setCampaigns([]))
      .finally(() => setLoading(false));
  }, []);

  const total = campaigns.reduce((acc, c) => ({
    impressions: acc.impressions + c.metrics.impressions,
    clicks: acc.clicks + c.metrics.clicks,
    conversions: acc.conversions + c.metrics.conversions,
    spend: acc.spend + c.metrics.spend,
    revenue: acc.revenue + c.metrics.revenue,
  }), { impressions: 0, clicks: 0, conversions: 0, spend: 0, revenue: 0 });

  const ctr = total.impressions > 0 ? ((total.clicks / total.impressions) * 100).toFixed(2) : "0";
  const cpc = total.clicks > 0 ? Math.round(total.spend / total.clicks) : 0;
  const roi = total.spend > 0 ? Math.round(((total.revenue - total.spend) / total.spend) * 100) : 0;
  const cvr = total.clicks > 0 ? ((total.conversions / total.clicks) * 100).toFixed(2) : "0";

  // Channel comparison
  const channelData = Object.entries(
    campaigns.reduce((acc, c) => {
      const ch = c.channel;
      if (!acc[ch]) acc[ch] = { impressions: 0, clicks: 0, conversions: 0, spend: 0, revenue: 0 };
      acc[ch].impressions += c.metrics.impressions;
      acc[ch].clicks += c.metrics.clicks;
      acc[ch].conversions += c.metrics.conversions;
      acc[ch].spend += c.metrics.spend;
      acc[ch].revenue += c.metrics.revenue;
      return acc;
    }, {} as Record<string, typeof total>)
  ).map(([ch, m]) => ({
    channel: CHANNEL_LABELS[ch] ?? ch,
    roi: m.spend > 0 ? Math.round(((m.revenue - m.spend) / m.spend) * 100) : 0,
    conversions: m.conversions,
    spend: Math.round(m.spend / 1_000_000),
    revenue: Math.round(m.revenue / 1_000_000),
  })).sort((a, b) => b.roi - a.roi);

  // Trend (placeholder until a real trend API exists)
  const trendData = [
    { month: "دی", impressions: 45000, clicks: 2700, conversions: 27 },
    { month: "بهمن", impressions: 62000, clicks: 3720, conversions: 37 },
    { month: "اسفند", impressions: 58000, clicks: 3480, conversions: 35 },
    { month: "فروردین", impressions: 85000, clicks: 5100, conversions: 51 },
    { month: "اردیبهشت", impressions: 145000, clicks: 8700, conversions: 87 },
  ];

  const topCampaigns = [...campaigns]
    .filter(c => c.metrics.spend > 0)
    .map(c => ({
      ...c,
      roi: Math.round(((c.metrics.revenue - c.metrics.spend) / c.metrics.spend) * 100),
    }))
    .sort((a, b) => b.roi - a.roi)
    .slice(0, 5);

  return (
    <RoleGuard roles={["admin", "marketing", "sales_manager"]}>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <BarChart2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">آنالیتیکس مارکتینگ</h1>
            <p className="text-sm text-muted-foreground">تحلیل جامع عملکرد کمپین‌ها</p>
          </div>
        </motion.div>

        {loading ? (
          <div className="card p-16 flex items-center justify-center text-muted-foreground text-sm">
            در حال بارگذاری...
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
              {[
                { label: "ایمپرشن", value: (total.impressions / 1000).toFixed(0) + "K", icon: Eye, color: "text-blue-500" },
                { label: "کلیک", value: total.clicks.toLocaleString("fa-IR"), icon: MousePointerClick, color: "text-green-500" },
                { label: "نرخ کلیک", value: ctr + "%", icon: TrendingUp, color: "text-purple-500" },
                { label: "تبدیل", value: total.conversions.toLocaleString("fa-IR"), icon: ShoppingCart, color: "text-orange-500" },
                { label: "هزینه هر کلیک", value: cpc.toLocaleString("fa-IR") + "ت", icon: DollarSign, color: "text-red-500" },
                { label: "ROI کل", value: roi + "%", icon: TrendingUp, color: roi > 0 ? "text-green-500" : "text-red-500" },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="card p-4">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Icon className={`w-3.5 h-3.5 ${color}`} />
                    <span className="text-xs text-muted-foreground">{label}</span>
                  </div>
                  <p className="text-lg font-bold">{value}</p>
                </div>
              ))}
            </div>

            {/* Trend Chart */}
            <div className="card p-4">
              <h2 className="text-sm font-semibold mb-4">روند ماهانه ایمپرشن و کلیک</h2>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} width={55} />
                  <Tooltip contentStyle={TOOLTIP_STYLE.contentStyle} labelStyle={TOOLTIP_STYLE.labelStyle} itemStyle={TOOLTIP_STYLE.itemStyle} />
                  <Line type="monotone" dataKey="impressions" stroke="#6366f1" strokeWidth={2} dot={false} name="ایمپرشن" />
                  <Line type="monotone" dataKey="clicks" stroke="#10b981" strokeWidth={2} dot={false} name="کلیک" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Channel Comparison */}
              <div className="card p-4">
                <h2 className="text-sm font-semibold mb-4">مقایسه ROI کانال‌ها</h2>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={channelData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis dataKey="channel" type="category" tick={{ fontSize: 11 }} width={90} />
                    <Tooltip contentStyle={TOOLTIP_STYLE.contentStyle} labelStyle={TOOLTIP_STYLE.labelStyle} itemStyle={TOOLTIP_STYLE.itemStyle} formatter={(v) => [`${v}%`, "ROI"]} />
                    <Bar dataKey="roi" name="ROI %" radius={[0, 4, 4, 0]}>
                      {channelData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Top Campaigns */}
              <div className="card overflow-hidden">
                <div className="p-4 border-b border-border">
                  <h2 className="text-sm font-semibold">برترین کمپین‌ها بر اساس ROI</h2>
                </div>
                <div className="divide-y divide-border/50">
                  {topCampaigns.map((c, i) => (
                    <div key={c.id} className="flex items-center gap-3 p-3">
                      <span className="text-lg font-bold text-muted-foreground w-6" dir="ltr">#{(i + 1).toLocaleString("fa-IR")}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{c.title}</p>
                        <p className="text-xs text-muted-foreground">{CHANNEL_LABELS[c.channel]} · {c.metrics.conversions} تبدیل</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-bold ${c.roi > 0 ? "text-green-500" : "text-red-500"}`}>{c.roi}%</p>
                        <p className="text-xs text-muted-foreground">ROI</p>
                      </div>
                    </div>
                  ))}
                  {topCampaigns.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">داده‌ای یافت نشد</p>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </RoleGuard>
  );
}
