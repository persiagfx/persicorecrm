"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "motion/react";
import {
  Users, Search, Shield, ShieldOff, ChevronLeft, ChevronRight, RefreshCw, UserCheck, UserX,
} from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { toJalali, timeAgo } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { USER_ROLES } from "@/lib/constants";
import type { UserRole } from "@/types";

interface AdminUser {
  id: string; name: string; email: string; role: string;
  avatar: string | null; isActive: boolean; createdAt: string;
  lastLoginAt: string | null; walletBalance: number; tenantId: string | null;
  tenant: { id: string; name: string; plan: string } | null;
}

const ROLE_COLOR: Record<string, string> = {
  admin: "bg-violet-500/20 text-violet-300",
  accountant: "bg-blue-500/20 text-blue-300",
  hr: "bg-cyan-500/20 text-cyan-300",
  sales_rep: "bg-emerald-500/20 text-emerald-300",
  sales_manager: "bg-amber-500/20 text-amber-300",
  project_manager: "bg-orange-500/20 text-orange-300",
  developer: "bg-pink-500/20 text-pink-300",
  designer: "bg-rose-500/20 text-rose-300",
  support: "bg-teal-500/20 text-teal-300",
};

const ROLES = Object.entries(USER_ROLES).map(([k, v]) => ({ value: k, label: v.label }));

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 20;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (roleFilter) params.set("role", roleFilter);
      if (statusFilter) params.set("status", statusFilter);
      params.set("page", String(page));
      const res = await apiClient.get(`/admin/users?${params}`);
      setUsers(res.data.data ?? []);
      setTotal(res.data.meta?.total ?? 0);
    } catch { toast.error("خطا در بارگذاری کاربران"); }
    finally { setLoading(false); }
  }, [search, roleFilter, statusFilter, page]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleToggleActive = async (user: AdminUser) => {
    try {
      await apiClient.patch(`/admin/users/${user.id}`, { isActive: !user.isActive });
      setUsers(p => p.map(u => u.id === user.id ? { ...u, isActive: !u.isActive } : u));
      toast.success(user.isActive ? "کاربر غیرفعال شد" : "کاربر فعال شد");
    } catch { toast.error("خطا"); }
  };

  const handleRoleChange = async (userId: string, role: string) => {
    try {
      await apiClient.patch(`/admin/users/${userId}`, { role });
      setUsers(p => p.map(u => u.id === userId ? { ...u, role } : u));
      toast.success("نقش تغییر کرد");
    } catch { toast.error("خطا"); }
  };

  const totalPages = Math.ceil(total / perPage);

  return (
    <div className="p-6 space-y-5">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" />مدیریت کاربران
          </h1>
          <p className="text-sm text-white/35 mt-0.5">{total} کاربر در سیستم</p>
        </div>
        <button onClick={fetchUsers} disabled={loading}
          className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/50 hover:text-white transition-colors disabled:opacity-40">
          <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
        </button>
      </motion.div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-52">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="جستجوی نام یا ایمیل..."
            className="w-full pe-9 ps-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-violet-500/50" />
        </div>
        <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-violet-500/50 appearance-none">
          <option value="">همه نقش‌ها</option>
          {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-violet-500/50 appearance-none">
          <option value="">همه وضعیت‌ها</option>
          <option value="active">فعال</option>
          <option value="inactive">غیرفعال</option>
        </select>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-white/[0.07] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/[0.03]">
            <tr>
              {["کاربر", "نقش", "Workspace", "آخرین ورود", "وضعیت", "عملیات"].map(h => (
                <th key={h} className="text-right px-4 py-3 text-xs text-white/40 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {loading ? Array.from({ length: 6 }).map((_, i) => (
              <tr key={i}><td colSpan={6} className="px-4 py-3">
                <div className="h-8 rounded-lg bg-white/[0.04] animate-pulse" />
              </td></tr>
            )) : users.map(u => (
              <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                      {u.name.slice(0, 1)}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-white/80">{u.name}</p>
                      <p className="text-[10px] text-white/30">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <select value={u.role}
                    onChange={e => handleRoleChange(u.id, e.target.value)}
                    className={cn("text-[10px] px-2 py-1 rounded-lg font-medium border-0 bg-transparent cursor-pointer focus:outline-none",
                      ROLE_COLOR[u.role] ?? "bg-white/10 text-white/40")}>
                    {ROLES.map(r => <option key={r.value} value={r.value} className="bg-[#1a1a2e] text-white">{r.label}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3">
                  {u.tenant ? (
                    <div>
                      <p className="text-xs text-white/60">{u.tenant.name}</p>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-400">{u.tenant.plan}</span>
                    </div>
                  ) : <span className="text-[10px] text-white/20">—</span>}
                </td>
                <td className="px-4 py-3 text-[10px] text-white/30">
                  {u.lastLoginAt ? timeAgo(u.lastLoginAt) : "هرگز"}
                </td>
                <td className="px-4 py-3">
                  <span className={cn("flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full w-fit",
                    u.isActive ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400")}>
                    <span className={cn("w-1.5 h-1.5 rounded-full", u.isActive ? "bg-emerald-400" : "bg-red-400")} />
                    {u.isActive ? "فعال" : "غیرفعال"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => handleToggleActive(u)}
                    title={u.isActive ? "غیرفعال کردن" : "فعال کردن"}
                    className={cn("p-1.5 rounded-lg transition-colors",
                      u.isActive
                        ? "hover:bg-red-500/10 text-white/30 hover:text-red-400"
                        : "hover:bg-emerald-500/10 text-white/30 hover:text-emerald-400")}>
                    {u.isActive ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                  </button>
                </td>
              </tr>
            ))}
            {!loading && users.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-white/20 text-sm">کاربری یافت نشد</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-white/30 text-xs">{total} کاربر · صفحه {page} از {totalPages}</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-white/50 hover:text-white disabled:opacity-30 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-white/50 hover:text-white disabled:opacity-30 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
