"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Activity, User, Briefcase, FileText, Zap, FolderOpen,
  Download, Search, Filter, RefreshCw, Globe, Monitor,
  ChevronDown, ChevronUp, ArrowLeftRight, Shield, Info,
  Calendar,
} from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { timeAgo, toJalali } from "@/lib/utils";
import { useAuth } from "@/lib/auth/context";
import { USER_ROLES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { ActivityEntityType, UserRole } from "@/types";
import * as XLSX from "xlsx";
import { toast } from "sonner";

const entityIcons: Record<string, React.ElementType> = {
  lead: Zap, client: User, project: Briefcase, task: Activity,
  invoice: FileText, contract: FileText, ticket: Activity,
  file: FolderOpen, user: User, expense: FileText,
};

const entityColors: Record<string, string> = {
  lead: "bg-blue-500/10 text-blue-400",
  client: "bg-purple-500/10 text-purple-400",
  project: "bg-amber-500/10 text-amber-500",
  task: "bg-emerald-500/10 text-emerald-500",
  invoice: "bg-teal-500/10 text-teal-400",
  contract: "bg-indigo-500/10 text-indigo-400",
  ticket: "bg-red-500/10 text-red-400",
  file: "bg-sky-500/10 text-sky-400",
  user: "bg-rose-500/10 text-rose-400",
  expense: "bg-orange-500/10 text-orange-400",
};

const entityLabels: Record<string, string> = {
  lead: "لید", client: "مشتری", project: "پروژه", task: "تسک",
  invoice: "فاکتور", contract: "قرارداد", ticket: "تیکت",
  file: "فایل", user: "کاربر", expense: "هزینه",
};

const DATE_FILTERS = [
  { label: "همه", value: "all" },
  { label: "امروز", value: "today" },
  { label: "هفته جاری", value: "week" },
  { label: "ماه جاری", value: "month" },
];

type DiffData = Record<string, unknown>;

interface LogEntry {
  id: string;
  description: string;
  entityType: string;
  entityId: string;
  entityName: string;
  action: string;
  createdAt: string;
  ip: string | null;
  userAgent: string | null;
  before: DiffData | null;
  after: DiffData | null;
  metadata: Record<string, unknown> | null;
  actor?: { id: string; name: string; avatar: string | null; role: string; color?: string };
}

interface TeamUser { id: string; name: string; role: string; }

function parseUA(ua: string | null): string {
  if (!ua) return "نامشخص";
  if (ua.includes("Chrome")) return "Chrome";
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Safari")) return "Safari";
  if (ua.includes("Edge")) return "Edge";
  if (ua.includes("Postman")) return "Postman";
  return ua.slice(0, 30);
}

// Show changed fields between before and after
function DiffViewer({ before, after }: { before: DiffData | null; after: DiffData | null }) {
  if (!before && !after) return null;

  const allKeys = new Set([
    ...Object.keys(before ?? {}),
    ...Object.keys(after ?? {}),
  ]);

  const sensitiveKeys = ["passwordHash", "signatureDataUrl", "adminSignatureDataUrl", "clientSignatureDataUrl"];
  const changedKeys = [...allKeys].filter((k) => {
    if (sensitiveKeys.includes(k)) return false;
    const bVal = JSON.stringify((before ?? {})[k]);
    const aVal = JSON.stringify((after ?? {})[k]);
    return bVal !== aVal;
  });

  if (changedKeys.length === 0) return null;

  const formatValue = (val: unknown) => {
    if (val === null || val === undefined) return <span className="text-muted-foreground italic">خالی</span>;
    if (typeof val === "boolean") return <span className={val ? "text-emerald-400" : "text-red-400"}>{val ? "بله" : "خیر"}</span>;
    if (typeof val === "object") return <span className="text-xs font-mono text-muted-foreground">[شیء]</span>;
    const str = String(val);
    return <span className="break-all">{str.length > 60 ? str.slice(0, 60) + "..." : str}</span>;
  };

  return (
    <div className="mt-3 rounded-xl border border-border overflow-hidden">
      <div className="flex items-center gap-1.5 px-3 py-2 bg-muted/50 border-b border-border">
        <ArrowLeftRight className="w-3 h-3 text-primary" />
        <span className="text-xs font-medium text-muted-foreground">تغییرات ({changedKeys.length} فیلد)</span>
      </div>
      <div className="divide-y divide-border">
        {changedKeys.slice(0, 8).map((key) => (
          <div key={key} className="grid grid-cols-3 gap-2 px-3 py-2 text-xs">
            <span className="text-muted-foreground font-mono truncate">{key}</span>
            <div className="text-red-400/80 line-through">{formatValue((before ?? {})[key])}</div>
            <div className="text-emerald-400">{formatValue((after ?? {})[key])}</div>
          </div>
        ))}
        {changedKeys.length > 8 && (
          <div className="px-3 py-2 text-xs text-muted-foreground">+{changedKeys.length - 8} فیلد دیگر</div>
        )}
      </div>
    </div>
  );
}

export default function ActivityPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [allUsers, setAllUsers] = useState<TeamUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [entityFilter, setEntityFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [actorFilter, setActorFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const PER_PAGE = 30;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        ...(entityFilter !== "all" ? { entityType: entityFilter } : {}),
        ...(actorFilter !== "all" ? { actorId: actorFilter } : {}),
      });

      // Date range filter
      if (dateFilter !== "all") {
        const now = new Date();
        if (dateFilter === "today") {
          params.set("dateFrom", now.toISOString().split("T")[0]);
          params.set("dateTo", now.toISOString().split("T")[0]);
        } else if (dateFilter === "week") {
          const w = new Date(now);
          w.setDate(now.getDate() - 7);
          params.set("dateFrom", w.toISOString().split("T")[0]);
        } else if (dateFilter === "month") {
          params.set("dateFrom", `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`);
        }
      }

      const [logsRes, usersRes] = await Promise.all([
        apiClient.get(`/activities?${params}`),
        allUsers.length === 0 ? apiClient.get("/users") : Promise.resolve({ data: { data: allUsers } }),
      ]);

      let data: LogEntry[] = logsRes.data.data ?? [];
      if (allUsers.length === 0) setAllUsers(usersRes.data.data ?? []);
      setTotal(logsRes.data.meta?.total ?? data.length);

      if (search) {
        data = data.filter((l) =>
          l.description?.includes(search) ||
          l.entityName?.includes(search) ||
          l.ip?.includes(search) ||
          l.actor?.name?.includes(search)
        );
      }

      setLogs(data);
    } catch { toast.error("خطا در بارگذاری لاگ"); }
    finally { setLoading(false); }
  }, [page, entityFilter, search, actorFilter, dateFilter, allUsers]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const exportToExcel = () => {
    const rows = logs.map((l) => ({
      کاربر: l.actor?.name ?? "",
      نقش: l.actor?.role ? USER_ROLES[l.actor.role as UserRole]?.label ?? l.actor.role : "",
      رویداد: l.description,
      موجودیت: entityLabels[l.entityType] ?? l.entityType,
      نام: l.entityName,
      عملیات: l.action,
      آدرس_IP: l.ip ?? "",
      مرورگر: parseUA(l.userAgent),
      تاریخ: toJalali(l.createdAt),
      زمان: new Date(l.createdAt).toLocaleTimeString("fa-IR"),
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "لاگ حسابرسی");
    XLSX.writeFile(wb, `audit-trail-${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  const hasDiff = (log: LogEntry) => log.before || log.after;

  return (
    <div className="space-y-5 max-w-4xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            {isAdmin ? "لاگ حسابرسی (Audit Trail)" : "لاگ فعالیت"}
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {isAdmin ? "تمام رویدادها با IP، مرورگر و تغییرات قبل/بعد" : "فعالیت‌های شما در سیستم"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchLogs} disabled={loading}
            className="p-2 rounded-xl bg-muted border border-border text-muted-foreground hover:text-foreground disabled:opacity-50">
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          </button>
          {isAdmin && (
            <button onClick={exportToExcel}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm text-foreground hover:bg-muted transition-colors">
              <Download className="w-4 h-4" />خروجی Excel
            </button>
          )}
        </div>
      </motion.div>

      {/* فیلترها */}
      <div className="p-4 rounded-2xl bg-card border border-border space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Filter className="w-4 h-4" /><span>فیلترها</span>
        </div>
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="جستجو در رویدادها، IP، نام..."
              className="w-full pr-9 pl-3 py-2 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
          <select value={entityFilter} onChange={(e) => { setEntityFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none">
            <option value="all">همه موجودیت‌ها</option>
            {Object.entries(entityLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <div className="flex gap-1 p-1 bg-muted rounded-xl">
            {DATE_FILTERS.map((f) => (
              <button key={f.value} onClick={() => { setDateFilter(f.value); setPage(1); }}
                className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                  dateFilter === f.value ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
                {f.label}
              </button>
            ))}
          </div>
          {isAdmin && (
            <select value={actorFilter} onChange={(e) => { setActorFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none">
              <option value="all">همه کاربران</option>
              {allUsers.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{logs.length} رویداد نمایش داده می‌شود (کل: {total})</p>
      </div>

      {/* لیست */}
      <div className="space-y-2">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-card border border-border animate-pulse" />
          ))
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground text-sm">رویدادی یافت نشد</div>
        ) : (
          logs.map((log, i) => {
            const IconComp = entityIcons[log.entityType] ?? Activity;
            const colorClass = entityColors[log.entityType] ?? "bg-muted text-muted-foreground";
            const isExpanded = expandedId === log.id;
            const hasDetails = isAdmin && (hasDiff(log) || log.ip || log.userAgent);

            return (
              <motion.div key={log.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(i * 0.02, 0.3) }}
                className="rounded-2xl bg-card border border-border hover:border-primary/20 transition-colors overflow-hidden">

                <div className="flex items-start gap-4 p-4">
                  {/* Actor avatar */}
                  <div className="w-9 h-9 rounded-full gradient-brand flex items-center justify-center text-sm font-bold text-black shrink-0">
                    {log.actor?.name?.slice(0, 1) ?? "?"}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="text-sm font-medium text-foreground">{log.actor?.name}</span>
                      {isAdmin && log.actor && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                          {USER_ROLES[log.actor.role as UserRole]?.label ?? log.actor.role}
                        </span>
                      )}
                      {isAdmin && log.ip && (
                        <span className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400">
                          <Globe className="w-2.5 h-2.5" />{log.ip}
                        </span>
                      )}
                      {isAdmin && log.userAgent && (
                        <span className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                          <Monitor className="w-2.5 h-2.5" />{parseUA(log.userAgent)}
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-muted-foreground leading-relaxed">{log.description}</p>

                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${colorClass}`}>
                        <IconComp className="w-2.5 h-2.5" />{log.entityName}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        {entityLabels[log.entityType] ?? log.entityType}
                      </span>
                      <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground">
                        <Calendar className="w-2.5 h-2.5" />{timeAgo(log.createdAt)}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono">{log.action}</span>
                    </div>
                  </div>

                  {/* Expand button */}
                  {hasDetails && (
                    <button onClick={() => setExpandedId(isExpanded ? null : log.id)}
                      className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors shrink-0">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  )}
                  {!hasDetails && isAdmin && (
                    <Info className="w-3 h-3 text-muted-foreground/30 shrink-0 mt-1" />
                  )}
                </div>

                {/* Expanded details */}
                <AnimatePresence>
                  {isExpanded && isAdmin && (
                    <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
                      className="overflow-hidden border-t border-border">
                      <div className="p-4 space-y-3 bg-muted/20">
                        {/* IP + UA details */}
                        {(log.ip || log.userAgent) && (
                          <div className="grid grid-cols-2 gap-3">
                            {log.ip && (
                              <div className="p-3 rounded-xl bg-card border border-border">
                                <div className="flex items-center gap-1.5 mb-1">
                                  <Globe className="w-3 h-3 text-blue-400" />
                                  <span className="text-xs font-medium text-muted-foreground">آدرس IP</span>
                                </div>
                                <code className="text-sm font-mono text-foreground" dir="ltr">{log.ip}</code>
                              </div>
                            )}
                            {log.userAgent && (
                              <div className="p-3 rounded-xl bg-card border border-border">
                                <div className="flex items-center gap-1.5 mb-1">
                                  <Monitor className="w-3 h-3 text-purple-400" />
                                  <span className="text-xs font-medium text-muted-foreground">مرورگر / کلاینت</span>
                                </div>
                                <p className="text-xs text-foreground font-mono leading-relaxed line-clamp-2" dir="ltr">
                                  {log.userAgent}
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Timestamp detail */}
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          <span>{toJalali(log.createdAt)}</span>
                          <span dir="ltr">{new Date(log.createdAt).toLocaleTimeString("fa-IR")}</span>
                        </div>

                        {/* Before/after diff */}
                        <DiffViewer before={log.before} after={log.after} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {total > PER_PAGE && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
            className="px-4 py-2 rounded-xl border border-border text-sm disabled:opacity-40 hover:bg-muted transition-colors">
            قبلی
          </button>
          <span className="text-sm text-muted-foreground">صفحه {page} از {Math.ceil(total / PER_PAGE)}</span>
          <button onClick={() => setPage((p) => p + 1)} disabled={page >= Math.ceil(total / PER_PAGE)}
            className="px-4 py-2 rounded-xl border border-border text-sm disabled:opacity-40 hover:bg-muted transition-colors">
            بعدی
          </button>
        </div>
      )}
    </div>
  );
}
