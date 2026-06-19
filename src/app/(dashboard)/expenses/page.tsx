"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Receipt, Plus, TrendingDown, Lock, X, Pencil, Trash2, CheckCircle2, XCircle, Clock, RefreshCw } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { formatPrice, toJalali } from "@/lib/utils";
import { EXPENSE_CATEGORIES, DATA_VIZ_COLORS } from "@/lib/constants";
import { StatCard } from "@/components/common/StatCard";
import { apiClient } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth/context";
import { toast } from "sonner";
import type { ExpenseCategory } from "@/types";

type ApprovalStatus = "pending" | "approved" | "rejected";

interface Expense {
  id: string; title: string; amount: number; category: ExpenseCategory;
  date: string; paidById: string; notes?: string; createdAt: string;
  approvalStatus: ApprovalStatus;
  paidBy?: { id: string; name: string; avatar: string | null };
}

interface TeamUser { id: string; name: string; }

const APPROVAL_CFG: Record<ApprovalStatus, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  pending: { label: "در انتظار", icon: Clock, color: "text-amber-400", bg: "bg-amber-500/10" },
  approved: { label: "تایید شد", icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10" },
  rejected: { label: "رد شد", icon: XCircle, color: "text-red-400", bg: "bg-red-500/10" },
};

function AddExpenseModal({ onClose, onSave, users }: { onClose: () => void; onSave: (e: Expense) => void; users: TeamUser[] }) {
  const [title, setTitle] = useState(""); const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("other");
  const [paidById, setPaidById] = useState(users[0]?.id ?? "");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState(""); const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !amount) return;
    setSaving(true);
    try {
      const res = await apiClient.post("/expenses", { title: title.trim(), amount: Number(amount), category, paidById, date, notes: notes.trim() || undefined });
      onSave(res.data.data);
      onClose();
    } catch { toast.error("خطا در ثبت هزینه"); }
    finally { setSaving(false); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        onClick={(e) => e.stopPropagation()} className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-bold text-foreground flex items-center gap-2"><Receipt className="w-4 h-4 text-primary" />ثبت هزینه جدید</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted text-muted-foreground"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">عنوان *</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="مثال: اجاره دفتر"
              className="w-full px-4 py-2.5 rounded-xl bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">مبلغ (تومان) *</label>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0"
                className="w-full px-4 py-2.5 rounded-xl bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">دسته</label>
              <select value={category} onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-foreground text-sm focus:outline-none">
                {Object.entries(EXPENSE_CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">تاریخ</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-muted border border-border text-foreground text-sm focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">پرداخت‌کننده</label>
              <select value={paidById} onChange={(e) => setPaidById(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-foreground text-sm focus:outline-none">
                {users.map((u) => <option key={u.id} value={u.id}>{u.name.split(" ")[0]}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">یادداشت</label>
            <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="توضیحات اختیاری..."
              className="w-full px-4 py-2.5 rounded-xl bg-muted border border-border text-foreground text-sm focus:outline-none" />
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border bg-muted text-foreground text-sm">انصراف</button>
            <button onClick={handleSubmit} disabled={!title.trim() || !amount || saving}
              className="flex-1 py-2.5 rounded-xl gradient-brand text-black font-semibold text-sm gold-glow disabled:opacity-40 disabled:cursor-not-allowed">
              {saving ? "در حال ثبت..." : "ثبت هزینه"}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function ExpensesPage() {
  const { user } = useAuth();
  const canApprove = ["admin", "accountant"].includes(user?.role ?? "");
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [users, setUsers] = useState<TeamUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<ExpenseCategory | "all">("all");
  const [approvalFilter, setApprovalFilter] = useState<ApprovalStatus | "all">("all");
  const [showAdd, setShowAdd] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [expRes, usersRes] = await Promise.all([apiClient.get("/expenses?perPage=100"), users.length === 0 ? apiClient.get("/users") : Promise.resolve({ data: { data: users } })]);
      setExpenses(expRes.data.data ?? []);
      if (users.length === 0) setUsers(usersRes.data.data ?? []);
    } catch { toast.error("خطا در بارگذاری"); }
    finally { setLoading(false); }
  }, [users]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleApproval = async (id: string, status: ApprovalStatus) => {
    try {
      await apiClient.put(`/expenses/${id}`, { approvalStatus: status });
      setExpenses((p) => p.map((e) => e.id === id ? { ...e, approvalStatus: status } : e));
      toast.success(status === "approved" ? "هزینه تایید شد" : "هزینه رد شد");
    } catch { toast.error("خطا"); }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete(`/expenses/${id}`);
      setExpenses((p) => p.filter((e) => e.id !== id));
      toast.success("هزینه حذف شد");
    } catch { toast.error("خطا در حذف"); }
  };

  const filtered = expenses.filter((e) =>
    (categoryFilter === "all" || e.category === categoryFilter) &&
    (approvalFilter === "all" || e.approvalStatus === approvalFilter)
  );

  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const pending = expenses.filter((e) => e.approvalStatus === "pending").length;
  const pieData = Object.entries(EXPENSE_CATEGORIES).map(([key, val]) => ({
    name: val.label, value: expenses.filter((e) => e.category === key).reduce((s, e) => s + e.amount, 0),
  })).filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><Receipt className="w-6 h-6 text-primary" />هزینه‌های شرکت</h1>
          <p className="text-muted-foreground text-sm mt-0.5">{expenses.length} هزینه ثبت‌شده</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchData} disabled={loading} className="p-2 rounded-xl bg-muted border border-border text-muted-foreground hover:text-foreground disabled:opacity-50">
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          </button>
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-brand text-black font-semibold text-sm gold-glow">
            <Plus className="w-4 h-4" />ثبت هزینه
          </button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="کل هزینه‌ها" value={total} icon={TrendingDown} />
        <div className="p-6 rounded-2xl bg-card border border-border">
          <h3 className="text-sm text-muted-foreground mb-4">توزیع دسته‌ها</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={100}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={45} dataKey="value">
                  {pieData.map((_, i) => <Cell key={i} fill={DATA_VIZ_COLORS[i]} />)}
                </Pie>
                <Tooltip formatter={(v) => formatPrice(Number(v), true)} contentStyle={{ background: "hsl(240 10% 6%)", border: "1px solid hsl(240 6% 14%)", borderRadius: 12, fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="h-[100px] flex items-center justify-center text-muted-foreground text-sm">بدون داده</div>}
        </div>
        <div className="p-6 rounded-2xl bg-card border border-border space-y-3">
          <h3 className="text-sm text-muted-foreground">وضعیت تایید</h3>
          {(["pending", "approved", "rejected"] as ApprovalStatus[]).map((s) => {
            const cfg = APPROVAL_CFG[s]; const count = expenses.filter((e) => e.approvalStatus === s).length;
            return (
              <div key={s} className="flex items-center justify-between text-sm">
                <span className={cn("flex items-center gap-1.5", cfg.color)}><cfg.icon className="w-3.5 h-3.5" />{cfg.label}</span>
                <span className="font-semibold text-foreground">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* فیلترها */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1 p-1 bg-muted rounded-xl">
          {["all", "pending", "approved", "rejected"].map((s) => (
            <button key={s} onClick={() => setApprovalFilter(s as ApprovalStatus | "all")}
              className={cn("px-3 py-1 rounded-lg text-xs font-medium transition-all",
                approvalFilter === s ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
              {s === "all" ? "همه" : APPROVAL_CFG[s as ApprovalStatus].label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => setCategoryFilter("all")}
            className={cn("px-3 py-1.5 rounded-xl text-sm border transition-all", categoryFilter === "all" ? "bg-primary/10 text-primary border-primary/30" : "bg-card text-muted-foreground border-border")}>
            همه
          </button>
          {Object.entries(EXPENSE_CATEGORIES).map(([key, val]) => (
            <button key={key} onClick={() => setCategoryFilter(key as ExpenseCategory)}
              className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm border transition-all", categoryFilter === key ? "bg-primary/10 text-primary border-primary/30" : "bg-card text-muted-foreground border-border")}>
              <span>{val.icon}</span>{val.label}
            </button>
          ))}
        </div>
      </div>

      {/* جدول */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">{[1,2,3,4].map((i) => <div key={i} className="h-12 rounded-xl bg-muted animate-pulse" />)}</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {["عنوان","دسته","مبلغ","تاریخ","پرداخت‌کننده","وضعیت",""].map((h) => (
                  <th key={h} className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((expense) => {
                const cat = EXPENSE_CATEGORIES[expense.category] ?? { icon: "📦", label: expense.category };
                const approvalCfg = APPROVAL_CFG[expense.approvalStatus];
                return (
                  <tr key={expense.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors group">
                    <td className="px-4 py-3 font-medium text-foreground">{expense.title}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <span className="flex items-center gap-1.5">{cat.icon} {cat.label}</span>
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground tabular-nums">{formatPrice(expense.amount, true)}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{toJalali(expense.date)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full gradient-brand flex items-center justify-center text-[10px] font-bold text-black">
                          {expense.paidBy?.name?.slice(0, 1) ?? "?"}
                        </div>
                        <span className="text-xs text-muted-foreground">{expense.paidBy?.name?.split(" ")[0]}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium w-fit", approvalCfg.bg, approvalCfg.color)}>
                        <approvalCfg.icon className="w-3 h-3" />{approvalCfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {canApprove && expense.approvalStatus === "pending" && (
                          <>
                            <button onClick={() => handleApproval(expense.id, "approved")}
                              className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-muted-foreground hover:text-emerald-400 transition-colors" title="تایید">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleApproval(expense.id, "rejected")}
                              className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors" title="رد">
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleDelete(expense.id)}
                            className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground text-sm">هزینه‌ای ثبت نشده</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <AnimatePresence>
        {showAdd && <AddExpenseModal users={users} onClose={() => setShowAdd(false)} onSave={(e) => { setExpenses((p) => [e, ...p]); }} />}
      </AnimatePresence>
    </div>
  );
}
