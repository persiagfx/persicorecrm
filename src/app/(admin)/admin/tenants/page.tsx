"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "motion/react";
import {
  Building2, Search, RefreshCw, ChevronLeft, ChevronRight,
  CheckCircle2, AlertCircle, XCircle, Edit3, Users,
} from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { toJalali } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Tenant {
  id: string; name: string; slug: string; industry: string | null;
  plan: string; status: string; trialEndsAt: string | null;
  maxUsers: number; maxClients: number; ownerEmail: string | null;
  createdAt: string; _count: { users: number };
  payments: { amount: number; plan: string; status: string; createdAt: string }[];
}

const PLAN_COLOR: Record<string, string> = {
  trial: "bg-amber-500/15 text-amber-400 border-amber-500/20",
  starter: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  pro: "bg-violet-500/15 text-violet-400 border-violet-500/20",
  enterprise: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
};
const STATUS_CFG: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  active: { label: "فعال", color: "text-emerald-400", icon: CheckCircle2 },
  suspended: { label: "تعلیق", color: "text-amber-400", icon: AlertCircle },
  cancelled: { label: "لغو شده", color: "text-red-400", icon: XCircle },
};

export default function AdminTenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [editTenant, setEditTenant] = useState<Tenant | null>(null);
  const [editPlan, setEditPlan] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const perPage = 20;

  const fetchTenants = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      params.set("page", String(page));
      const res = await apiClient.get(`/admin/tenants?${params}`);
      setTenants(res.data.data ?? []);
      setTotal(res.data.meta?.total ?? 0);
    } catch { toast.error("خطا در بارگذاری"); }
    finally { setLoading(false); }
  }, [search, statusFilter, page]);

  useEffect(() => { fetchTenants(); }, [fetchTenants]);

  const handleSaveEdit = async () => {
    if (!editTenant) return;
    setSaving(true);
    try {
      await apiClient.patch(`/admin/tenants/${editTenant.id}`, { plan: editPlan, status: editStatus });
      setTenants(p => p.map(t => t.id === editTenant.id ? { ...t, plan: editPlan, status: editStatus } : t));
      toast.success("تغییرات ذخیره شد");
      setEditTenant(null);
    } catch { toast.error("خطا"); }
    finally { setSaving(false); }
  };

  const totalPages = Math.ceil(total / perPage);

  return (
    <div className="p-6 space-y-5">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-violet-400" />کسب‌وکارهای ثبت‌شده
          </h1>
          <p className="text-sm text-white/35 mt-0.5">{total} workspace در سیستم</p>
        </div>
        <button onClick={fetchTenants} disabled={loading}
          className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/50 hover:text-white transition-colors disabled:opacity-40">
          <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
        </button>
      </motion.div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 min-w-52">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="جستجوی نام کسب‌وکار..."
            className="w-full pe-9 ps-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-violet-500/50" />
        </div>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-violet-500/50 appearance-none">
          <option value="">همه وضعیت‌ها</option>
          <option value="active">فعال</option>
          <option value="suspended">تعلیق</option>
          <option value="cancelled">لغو شده</option>
        </select>
      </div>

      {/* Empty state */}
      {!loading && tenants.length === 0 && (
        <div className="py-20 text-center">
          <Building2 className="w-12 h-12 mx-auto mb-4 text-white/10" />
          <p className="text-white/30 text-sm">هنوز کسب‌وکاری ثبت نشده</p>
          <p className="text-white/15 text-xs mt-1">بعد از فعال‌سازی Multi-tenancy، کسب‌وکارهای جدید اینجا نمایش داده می‌شوند</p>
        </div>
      )}

      {/* Table */}
      {(loading || tenants.length > 0) && (
        <div className="rounded-2xl border border-white/[0.07] overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-white/[0.03]">
              <tr>
                {["کسب‌وکار", "پلن", "کاربران", "وضعیت", "تاریخ ثبت", "انقضا تریال", "عملیات"].map(h => (
                  <th key={h} className="text-right px-4 py-3 text-xs text-white/40 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {loading ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}><td colSpan={7} className="px-4 py-3">
                  <div className="h-8 rounded-lg bg-white/[0.04] animate-pulse" />
                </td></tr>
              )) : tenants.map(t => {
                const statusCfg = STATUS_CFG[t.status] ?? STATUS_CFG.active;
                const StatusIcon = statusCfg.icon;
                return (
                  <tr key={t.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600/30 to-fuchsia-600/30 flex items-center justify-center text-xs font-bold text-violet-300 border border-violet-500/20">
                          {t.name.slice(0, 2)}
                        </div>
                        <div>
                          <p className="text-xs font-medium text-white/80">{t.name}</p>
                          <p className="text-[10px] text-white/25 font-mono">{t.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("text-[10px] px-2 py-0.5 rounded-full border font-medium", PLAN_COLOR[t.plan] ?? "bg-white/10 text-white/40 border-white/10")}>
                        {t.plan}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-xs text-white/50">
                        <Users className="w-3 h-3" />{t._count.users} / {t.maxUsers}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("flex items-center gap-1 text-[10px] font-medium", statusCfg.color)}>
                        <StatusIcon className="w-3 h-3" />{statusCfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[10px] text-white/30">{toJalali(t.createdAt)}</td>
                    <td className="px-4 py-3 text-[10px] text-white/30">
                      {t.trialEndsAt ? toJalali(t.trialEndsAt) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => { setEditTenant(t); setEditPlan(t.plan); setEditStatus(t.status); }}
                        className="p-1.5 rounded-lg hover:bg-violet-500/10 text-white/30 hover:text-violet-400 transition-colors">
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-white/30 text-xs">{total} کسب‌وکار · صفحه {page} از {totalPages}</span>
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

      {/* Edit Modal */}
      {editTenant && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setEditTenant(null)}>
          <div className="w-full max-w-sm bg-[#13131d] border border-white/10 rounded-2xl p-6 space-y-4"
            onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-white">ویرایش: {editTenant.name}</h3>
            <div>
              <label className="block text-xs text-white/40 mb-1.5">پلن</label>
              <select value={editPlan} onChange={e => setEditPlan(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none">
                {["trial", "starter", "pro", "enterprise"].map(p => (
                  <option key={p} value={p} className="bg-[#1a1a2e]">{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-white/40 mb-1.5">وضعیت</label>
              <select value={editStatus} onChange={e => setEditStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none">
                <option value="active" className="bg-[#1a1a2e]">فعال</option>
                <option value="suspended" className="bg-[#1a1a2e]">تعلیق</option>
                <option value="cancelled" className="bg-[#1a1a2e]">لغو شده</option>
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setEditTenant(null)}
                className="flex-1 py-2 rounded-xl border border-white/10 bg-white/5 text-white/60 text-sm">انصراف</button>
              <button onClick={handleSaveEdit} disabled={saving}
                className="flex-1 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-sm font-semibold disabled:opacity-50">
                {saving ? "ذخیره..." : "ذخیره"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
