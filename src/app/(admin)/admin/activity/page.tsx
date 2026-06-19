"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "motion/react";
import {
  Activity, Search, RefreshCw, ChevronLeft, ChevronRight,
  User, FileText, DollarSign, Briefcase, CheckSquare, MessageSquare, Clock,
} from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { timeAgo, toJalali } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ActivityItem {
  id: string; action: string; entityType: string; entityId: string;
  entityName: string; description: string; createdAt: string;
  actor: { id: string; name: string; email: string; avatar: string | null; role: string } | null;
}

const ENTITY_ICON: Record<string, { icon: typeof User; color: string }> = {
  user: { icon: User, color: "text-blue-400 bg-blue-500/10" },
  client: { icon: Briefcase, color: "text-emerald-400 bg-emerald-500/10" },
  invoice: { icon: DollarSign, color: "text-amber-400 bg-amber-500/10" },
  project: { icon: FileText, color: "text-violet-400 bg-violet-500/10" },
  task: { icon: CheckSquare, color: "text-cyan-400 bg-cyan-500/10" },
  ticket: { icon: MessageSquare, color: "text-rose-400 bg-rose-500/10" },
  contract: { icon: FileText, color: "text-orange-400 bg-orange-500/10" },
  lead: { icon: User, color: "text-pink-400 bg-pink-500/10" },
};

const ACTION_COLOR: Record<string, string> = {
  created: "text-emerald-400",
  updated: "text-blue-400",
  deleted: "text-red-400",
  login: "text-violet-400",
  logout: "text-white/30",
  closed: "text-amber-400",
  completed: "text-emerald-400",
  sent: "text-blue-400",
  approved: "text-emerald-400",
  rejected: "text-red-400",
};

const ACTION_LABEL: Record<string, string> = {
  created: "ایجاد کرد",
  updated: "ویرایش کرد",
  deleted: "حذف کرد",
  login: "وارد شد",
  logout: "خارج شد",
  closed: "بست",
  completed: "کامل کرد",
  sent: "ارسال کرد",
  approved: "تایید کرد",
  rejected: "رد کرد",
};

export default function AdminActivityPage() {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [entityFilter, setEntityFilter] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 30;

  const fetchActivity = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (entityFilter) params.set("entityType", entityFilter);
      if (actionFilter) params.set("action", actionFilter);
      params.set("page", String(page));
      params.set("perPage", String(perPage));
      const res = await apiClient.get(`/admin/activity?${params}`);
      setItems(res.data.data ?? []);
      setTotal(res.data.meta?.total ?? 0);
    } catch { toast.error("خطا در بارگذاری"); }
    finally { setLoading(false); }
  }, [search, entityFilter, actionFilter, page]);

  useEffect(() => { fetchActivity(); }, [fetchActivity]);

  const totalPages = Math.ceil(total / perPage);

  const getEntityCfg = (type: string) => ENTITY_ICON[type] ?? { icon: Clock, color: "text-white/40 bg-white/5" };

  return (
    <div className="p-6 space-y-5">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-400" />لاگ فعالیت‌ها
          </h1>
          <p className="text-sm text-white/35 mt-0.5">{total.toLocaleString("fa-IR")} رویداد ثبت‌شده</p>
        </div>
        <button onClick={fetchActivity} disabled={loading}
          className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/50 hover:text-white transition-colors disabled:opacity-40">
          <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
        </button>
      </motion.div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-52">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="جستجوی کاربر یا آیتم..."
            className="w-full pe-9 ps-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-violet-500/50" />
        </div>
        <select value={entityFilter} onChange={e => { setEntityFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none appearance-none">
          <option value="">همه انواع</option>
          {Object.keys(ENTITY_ICON).map(k => (
            <option key={k} value={k}>{k}</option>
          ))}
        </select>
        <select value={actionFilter} onChange={e => { setActionFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none appearance-none">
          <option value="">همه اکشن‌ها</option>
          {Object.entries(ACTION_LABEL).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>

      {/* Activity Feed */}
      {!loading && items.length === 0 && (
        <div className="py-20 text-center">
          <Activity className="w-12 h-12 mx-auto mb-4 text-white/10" />
          <p className="text-white/30 text-sm">فعالیتی یافت نشد</p>
          <p className="text-white/15 text-xs mt-1">رویدادهای سیستم اینجا ثبت می‌شوند</p>
        </div>
      )}

      <div className="space-y-1">
        {loading ? Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-14 rounded-xl bg-white/[0.03] animate-pulse" />
        )) : items.map((item, idx) => {
          const entityCfg = getEntityCfg(item.entityType);
          const EntityIcon = entityCfg.icon;
          const actionColor = ACTION_COLOR[item.action] ?? "text-white/40";
          const actionLabel = ACTION_LABEL[item.action] ?? item.action;

          return (
            <motion.div key={item.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.02 }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/[0.02] transition-colors group">

              {/* Entity icon */}
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", entityCfg.color)}>
                <EntityIcon className="w-3.5 h-3.5" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {item.actor ? (
                    <span className="text-xs font-medium text-white/70">{item.actor.name}</span>
                  ) : (
                    <span className="text-xs font-medium text-white/30">سیستم</span>
                  )}
                  <span className={cn("text-[10px] font-medium", actionColor)}>{actionLabel}</span>
                  {item.entityName && (
                    <>
                      <span className="text-[10px] text-white/20">›</span>
                      <span className="text-[10px] text-white/50 truncate max-w-[200px]">{item.entityName}</span>
                    </>
                  )}
                  <span className="text-[9px] text-white/20 bg-white/5 px-1.5 py-0.5 rounded">{item.entityType}</span>
                </div>
                {item.description && (
                  <p className="text-[10px] text-white/20 mt-0.5 truncate">{item.description}</p>
                )}
              </div>

              {/* Time */}
              <div className="text-right shrink-0">
                <p className="text-[10px] text-white/25 group-hover:text-white/40 transition-colors">
                  {timeAgo(item.createdAt)}
                </p>
                <p className="text-[9px] text-white/15">{toJalali(item.createdAt)}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm pt-2 border-t border-white/[0.06]">
          <span className="text-white/30 text-xs">{total.toLocaleString("fa-IR")} رویداد · صفحه {page} از {totalPages}</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-white/50 hover:text-white disabled:opacity-30">
              <ChevronRight className="w-4 h-4" />
            </button>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-white/50 hover:text-white disabled:opacity-30">
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
