"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Users, Search, Shield, ShieldOff, Crown, Zap, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface ContentUser {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  plan: string;
  usedThisMonth: number;
  isActive: boolean;
  createdAt: string;
  _count: { generations: number };
}

const PLAN_LABELS: Record<string, string> = { FREE: "رایگان", PRO: "پرو", PLUS: "پلاس" };
const PLAN_ICONS: Record<string, React.ElementType> = { FREE: Sparkles, PRO: Zap, PLUS: Crown };
const PLAN_COLORS: Record<string, string> = { FREE: "text-white/40 bg-white/5", PRO: "text-violet-400 bg-violet-500/10", PLUS: "text-amber-400 bg-amber-500/10" };

export default function AdminContentUsersPage() {
  const [users, setUsers] = useState<ContentUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);

  const token = typeof window !== "undefined" ? localStorage.getItem("admin-token") || localStorage.getItem("crm-token") : null;

  useEffect(() => { fetchUsers(); }, [page, planFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), ...(search ? { search } : {}), ...(planFilter ? { plan: planFilter } : {}) });
      const res = await fetch(`/api/admin/content/users?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setUsers(data.data?.users ?? []);
      setPages(data.data?.pages ?? 1);
      setTotal(data.data?.total ?? 0);
    } catch {}
    finally { setLoading(false); }
  };

  const updateUser = async (id: string, updates: { plan?: string; isActive?: boolean }) => {
    await fetch(`/api/admin/content/users/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(updates),
    });
    setUsers((prev) => prev.map((u) => u.id === id ? { ...u, ...updates } : u));
    toast.success("بروزرسانی شد");
  };

  return (
    <div className="p-6" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Users className="w-5 h-5 text-violet-400" />
          <h1 className="text-xl font-bold text-white">کاربران Content</h1>
          <span className="text-white/30 text-sm">{total} کاربر</span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchUsers()}
            placeholder="جستجو نام، ایمیل، شماره..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pr-10 pl-4 py-2.5 text-white/70 placeholder-white/20 focus:outline-none focus:border-violet-500/40 text-sm" />
        </div>
        {["", "FREE", "PRO", "PLUS"].map((p) => (
          <button key={p} onClick={() => { setPlanFilter(p); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${planFilter === p ? "bg-violet-500/20 border-violet-500/30 text-violet-300" : "bg-white/3 border-white/8 text-white/40 hover:bg-white/5"}`}>
            {p ? PLAN_LABELS[p] : "همه"}
          </button>
        ))}
      </div>

      <div className="bg-white/3 border border-white/8 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/8">
              <th className="text-right px-4 py-3 text-white/40 font-medium">کاربر</th>
              <th className="text-right px-4 py-3 text-white/40 font-medium">پلن</th>
              <th className="text-right px-4 py-3 text-white/40 font-medium">مصرف ماه</th>
              <th className="text-right px-4 py-3 text-white/40 font-medium">کل تولید</th>
              <th className="text-right px-4 py-3 text-white/40 font-medium">وضعیت</th>
              <th className="text-right px-4 py-3 text-white/40 font-medium">تاریخ</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="border-b border-white/5">
                  <td className="px-4 py-3"><div className="h-4 bg-white/5 rounded animate-pulse w-32" /></td>
                  <td className="px-4 py-3"><div className="h-4 bg-white/5 rounded animate-pulse w-16" /></td>
                  <td className="px-4 py-3"><div className="h-4 bg-white/5 rounded animate-pulse w-12" /></td>
                  <td className="px-4 py-3"><div className="h-4 bg-white/5 rounded animate-pulse w-12" /></td>
                  <td className="px-4 py-3"><div className="h-4 bg-white/5 rounded animate-pulse w-16" /></td>
                  <td className="px-4 py-3"><div className="h-4 bg-white/5 rounded animate-pulse w-20" /></td>
                  <td className="px-4 py-3" />
                </tr>
              ))
            ) : users.map((u) => {
              const PlanIcon = PLAN_ICONS[u.plan] ?? Sparkles;
              return (
                <tr key={u.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-white/80 font-medium">{u.name}</p>
                      <p className="text-white/30 text-xs">{u.email ?? u.phone}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <select value={u.plan} onChange={(e) => updateUser(u.id, { plan: e.target.value })}
                      className={`text-xs px-2 py-1 rounded-lg border-0 focus:outline-none cursor-pointer ${PLAN_COLORS[u.plan]} bg-transparent`}>
                      {["FREE", "PRO", "PLUS"].map((p) => <option key={p} value={p} className="bg-[#0d0d16] text-white">{PLAN_LABELS[p]}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-white/50">{u.usedThisMonth}</td>
                  <td className="px-4 py-3 text-white/50">{u._count.generations}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${u.isActive ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"}`}>
                      {u.isActive ? "فعال" : "غیرفعال"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-white/30 text-xs">{new Date(u.createdAt).toLocaleDateString("fa-IR")}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => updateUser(u.id, { isActive: !u.isActive })}
                      className={`p-1.5 rounded-lg transition-all ${u.isActive ? "text-white/30 hover:text-rose-400 hover:bg-rose-500/10" : "text-white/30 hover:text-emerald-400 hover:bg-emerald-500/10"}`}>
                      {u.isActive ? <ShieldOff className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {!loading && users.length === 0 && (
          <div className="py-12 text-center text-white/30">هیچ کاربری یافت نشد</div>
        )}
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
            className="px-4 py-2 rounded-xl border border-white/10 text-white/40 hover:text-white/70 hover:bg-white/5 disabled:opacity-30 transition-all text-sm">قبلی</button>
          <span className="text-white/40 text-sm">{page} از {pages}</span>
          <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages}
            className="px-4 py-2 rounded-xl border border-white/10 text-white/40 hover:text-white/70 hover:bg-white/5 disabled:opacity-30 transition-all text-sm">بعدی</button>
        </div>
      )}
    </div>
  );
}
