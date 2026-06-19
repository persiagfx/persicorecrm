"use client";

import { useEffect, useState, useMemo } from "react";
import { motion } from "motion/react";
import {
  Building2, Users, DollarSign, BarChart3,
  ChevronUp, ChevronDown, ChevronsUpDown, Search, RefreshCw,
} from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { formatPrice, toJalali, cn } from "@/lib/utils";

interface TenantStat {
  id: string;
  name: string;
  slug: string;
  plan: string;
  status: string;
  userCount: number;
  clientCount: number;
  leadCount: number;
  invoiceCount: number;
  storageUsed: number;
  totalRevenue: number;
  lastActiveAt: string | null;
  createdAt: string;
}

interface Aggregate {
  totalTenants: number;
  activeTenants: number;
  totalRevenue: number;
}

interface AnalyticsData {
  tenants: TenantStat[];
  aggregate: Aggregate;
}

const PLAN_BADGE: Record<string, string> = {
  trial: "bg-zinc-700/60 text-zinc-300 border-zinc-600/40",
  starter: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  pro: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  enterprise: "bg-amber-500/20 text-amber-300 border-amber-500/30",
};

const PLAN_LABEL: Record<string, string> = {
  trial: "آزمایشی",
  starter: "پایه",
  pro: "حرفه‌ای",
  enterprise: "سازمانی",
};

const STATUS_BADGE: Record<string, string> = {
  active: "bg-emerald-500/15 text-emerald-400",
  suspended: "bg-red-500/15 text-red-400",
  cancelled: "bg-zinc-600/30 text-zinc-400",
};

const STATUS_LABEL: Record<string, string> = {
  active: "فعال",
  suspended: "معلق",
  cancelled: "لغو‌شده",
};

type SortKey = keyof Pick<TenantStat, "name" | "plan" | "userCount" | "clientCount" | "leadCount" | "invoiceCount" | "storageUsed" | "totalRevenue" | "lastActiveAt" | "createdAt">;

function formatBytes(bytes: number): string {
  if (bytes === 0) return "۰";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function StatCard({ label, value, sub, icon: Icon, color }: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; color: string;
}) {
  return (
    <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.15 }}
      className="p-5 rounded-2xl bg-white/[0.04] border border-white/[0.07] hover:border-white/15 transition-colors">
      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mb-3", color)}>
        <Icon className="w-4.5 h-4.5" />
      </div>
      <p className="text-2xl font-bold text-white tabular-nums">{value}</p>
      <p className="text-xs text-white/40 mt-0.5">{label}</p>
      {sub && <p className="text-[10px] text-white/25 mt-1">{sub}</p>}
    </motion.div>
  );
}

function SortIcon({ col, sortKey, dir }: { col: SortKey; sortKey: SortKey; dir: "asc" | "desc" }) {
  if (col !== sortKey) return <ChevronsUpDown className="w-3 h-3 text-white/20" />;
  return dir === "asc"
    ? <ChevronUp className="w-3 h-3 text-violet-400" />
    : <ChevronDown className="w-3 h-3 text-violet-400" />;
}

export default function UsageAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const fetchData = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    apiClient.get(`/admin/usage-analytics?${params.toString()}`)
      .then((r) => setData(r.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const filtered = useMemo(() => {
    if (!data) return [];
    let list = data.tenants.filter((t) =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.slug.toLowerCase().includes(search.toLowerCase())
    );
    list = [...list].sort((a, b) => {
      const av = a[sortKey] ?? "";
      const bv = b[sortKey] ?? "";
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [data, search, sortKey, sortDir]);

  const agg = data?.aggregate;
  const avgUsers = agg && agg.totalTenants > 0
    ? (data!.tenants.reduce((s, t) => s + t.userCount, 0) / agg.totalTenants).toFixed(1)
    : "—";

  const cols: { key: SortKey; label: string }[] = [
    { key: "name", label: "نام" },
    { key: "plan", label: "پلن" },
    { key: "userCount", label: "کاربران" },
    { key: "clientCount", label: "مشتریان" },
    { key: "leadCount", label: "لیدها" },
    { key: "invoiceCount", label: "فاکتورها" },
    { key: "storageUsed", label: "فضا" },
    { key: "totalRevenue", label: "درآمد" },
    { key: "lastActiveAt", label: "آخرین فعالیت" },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">آنالیتیکس مصرف</h1>
          <p className="text-sm text-white/35 mt-0.5">آمار مصرف به تفکیک کسب‌وکار</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white/60 text-xs focus:outline-none focus:border-violet-500/50"
            placeholder="از تاریخ"
          />
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white/60 text-xs focus:outline-none focus:border-violet-500/50"
            placeholder="تا تاریخ"
          />
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white/50 hover:text-white text-xs transition-colors disabled:opacity-40"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
            اعمال فیلتر
          </button>
        </div>
      </motion.div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="کل کسب‌وکارها"
          value={loading ? "—" : (agg?.totalTenants ?? 0)}
          icon={Building2}
          color="bg-violet-500/20 text-violet-400"
        />
        <StatCard
          label="کسب‌وکارهای فعال"
          value={loading ? "—" : (agg?.activeTenants ?? 0)}
          sub="فعالیت ۳۰ روز اخیر"
          icon={BarChart3}
          color="bg-emerald-500/20 text-emerald-400"
        />
        <StatCard
          label="درآمد کل (پرداخت‌شده)"
          value={loading ? "—" : formatPrice(agg?.totalRevenue ?? 0, true)}
          icon={DollarSign}
          color="bg-amber-500/20 text-amber-400"
        />
        <StatCard
          label="میانگین کاربر / کسب‌وکار"
          value={loading ? "—" : avgUsers}
          icon={Users}
          color="bg-blue-500/20 text-blue-400"
        />
      </div>

      {/* Search + table */}
      <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] overflow-hidden">
        <div className="p-4 border-b border-white/[0.06] flex items-center gap-3">
          <Search className="w-4 h-4 text-white/30 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="جستجو بر اساس نام یا اسلاگ..."
            className="flex-1 bg-transparent text-sm text-white placeholder-white/25 focus:outline-none"
          />
          {!loading && (
            <span className="text-xs text-white/25 shrink-0">{filtered.length} کسب‌وکار</span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                {cols.map((c) => (
                  <th
                    key={c.key}
                    onClick={() => toggleSort(c.key)}
                    className="px-4 py-3 text-right text-[11px] font-semibold text-white/30 uppercase tracking-wide cursor-pointer hover:text-white/60 transition-colors whitespace-nowrap select-none"
                  >
                    <span className="flex items-center gap-1.5 justify-end">
                      {c.label}
                      <SortIcon col={c.key} sortKey={sortKey} dir={sortDir} />
                    </span>
                  </th>
                ))}
                <th className="px-4 py-3 text-right text-[11px] font-semibold text-white/30 uppercase tracking-wide whitespace-nowrap">
                  وضعیت
                </th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-white/[0.04]">
                    {Array.from({ length: 10 }).map((__, j) => (
                      <td key={j} className="px-4 py-3.5">
                        <div className="h-4 rounded bg-white/[0.06] animate-pulse" style={{ width: `${40 + (j * 13) % 50}%` }} />
                      </td>
                    ))}
                  </tr>
                ))
                : filtered.length === 0
                ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-12 text-center text-white/25 text-sm">
                      نتیجه‌ای یافت نشد
                    </td>
                  </tr>
                )
                : filtered.map((t) => (
                  <motion.tr
                    key={t.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="border-b border-white/[0.04] hover:bg-white/[0.025] transition-colors"
                  >
                    {/* نام */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-medium text-white/85">{t.name}</p>
                        <p className="text-[10px] text-white/30 mt-0.5">{t.slug}</p>
                      </div>
                    </td>
                    {/* پلن */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border",
                        PLAN_BADGE[t.plan] ?? "bg-zinc-700/50 text-zinc-300 border-zinc-600/40"
                      )}>
                        {PLAN_LABEL[t.plan] ?? t.plan}
                      </span>
                    </td>
                    {/* کاربران */}
                    <td className="px-4 py-3.5 text-right text-white/70 tabular-nums">{t.userCount.toLocaleString("fa-IR")}</td>
                    {/* مشتریان */}
                    <td className="px-4 py-3.5 text-right text-white/70 tabular-nums">{t.clientCount.toLocaleString("fa-IR")}</td>
                    {/* لیدها */}
                    <td className="px-4 py-3.5 text-right text-white/70 tabular-nums">{t.leadCount.toLocaleString("fa-IR")}</td>
                    {/* فاکتورها */}
                    <td className="px-4 py-3.5 text-right text-white/70 tabular-nums">{t.invoiceCount.toLocaleString("fa-IR")}</td>
                    {/* فضا */}
                    <td className="px-4 py-3.5 text-right text-white/50 tabular-nums text-xs">{formatBytes(t.storageUsed)}</td>
                    {/* درآمد */}
                    <td className="px-4 py-3.5 text-right text-emerald-400 tabular-nums text-xs font-semibold">
                      {formatPrice(t.totalRevenue, true)}
                    </td>
                    {/* آخرین فعالیت */}
                    <td className="px-4 py-3.5 text-right text-white/35 text-xs whitespace-nowrap">
                      {t.lastActiveAt ? toJalali(t.lastActiveAt) : "—"}
                    </td>
                    {/* وضعیت */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className={cn(
                        "inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium",
                        STATUS_BADGE[t.status] ?? "bg-zinc-600/30 text-zinc-400"
                      )}>
                        {STATUS_LABEL[t.status] ?? t.status}
                      </span>
                    </td>
                  </motion.tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
