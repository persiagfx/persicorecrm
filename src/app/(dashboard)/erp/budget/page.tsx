"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Wallet, Plus, Search, Pencil, Trash2, X, TrendingUp, TrendingDown, PieChart } from "lucide-react";
import { StatCard } from "@/components/common/StatCard";
import { apiClient } from "@/lib/api/client";
import { formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Budget {
  id: string;
  title: string;
  year: number;
  period: string;
  month?: number | null;
  amount: number;
  notes?: string | null;
  account?: { id: string; code: string; nameFa: string; type: string } | null;
  costCenter?: { id: string; code: string; name: string } | null;
}

interface Account { id: string; code: string; nameFa: string; type: string; }
interface CostCenter { id: string; code: string; name: string; }

const PERIOD_LABELS: Record<string, string> = {
  annual: "سالانه", q1: "فصل اول", q2: "فصل دوم", q3: "فصل سوم", q4: "فصل چهارم", monthly: "ماهانه",
};
const MONTH_NAMES = ["فروردین","اردیبهشت","خرداد","تیر","مرداد","شهریور","مهر","آبان","آذر","دی","بهمن","اسفند"];
const CURRENT_YEAR = new Date().getFullYear() + 621; // Jalali approx
const YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - 2 + i);

const EMPTY_FORM = { title: "", year: String(CURRENT_YEAR), period: "annual", month: "", accountId: "", costCenterId: "", amount: "", notes: "" };

export default function BudgetPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [yearFilter, setYearFilter] = useState(String(CURRENT_YEAR));
  const [periodFilter, setPeriodFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Budget | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (yearFilter !== "all") params.set("year", yearFilter);
      if (periodFilter !== "all") params.set("period", periodFilter);

      const [br, ar, cr] = await Promise.all([
        apiClient.get(`/erp/budget?${params}`),
        apiClient.get("/erp/chart-of-accounts"),
        apiClient.get("/erp/cost-centers?flat=true"),
      ]);
      setBudgets(br.data.data ?? []);
      setAccounts((ar.data.data?.accounts ?? ar.data.data ?? []).slice(0, 200));
      setCostCenters(cr.data.data ?? []);
    } catch { toast.error("خطا در بارگذاری"); } finally { setLoading(false); }
  }, [yearFilter, periodFilter]);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setShowModal(true); };
  const openEdit = (b: Budget) => {
    setEditing(b);
    setForm({
      title: b.title, year: String(b.year), period: b.period,
      month: b.month ? String(b.month) : "",
      accountId: b.account?.id ?? "", costCenterId: b.costCenter?.id ?? "",
      amount: String(b.amount), notes: b.notes ?? "",
    });
    setShowModal(true);
  };

  const save = async () => {
    if (!form.title.trim() || !form.year || !form.amount) { toast.error("عنوان، سال و مبلغ الزامی است"); return; }
    try {
      const data = {
        title: form.title.trim(), year: Number(form.year), period: form.period,
        month: form.month ? Number(form.month) : null,
        accountId: form.accountId || null, costCenterId: form.costCenterId || null,
        amount: Number(form.amount.replace(/,/g, "")), notes: form.notes || null,
      };
      if (editing) await apiClient.put(`/erp/budget/${editing.id}`, data);
      else await apiClient.post("/erp/budget", data);
      toast.success(editing ? "بروزرسانی شد" : "بودجه ثبت شد");
      setShowModal(false); load();
    } catch { toast.error("خطا در ذخیره"); }
  };

  const del = async (id: string) => {
    if (!confirm("حذف شود؟")) return;
    try { await apiClient.delete(`/erp/budget/${id}`); toast.success("حذف شد"); load(); } catch { toast.error("خطا"); }
  };

  const filtered = budgets.filter(b =>
    !search || b.title.includes(search) || b.account?.nameFa?.includes(search) || b.costCenter?.name?.includes(search)
  );

  const totalBudget = filtered.reduce((s, b) => s + b.amount, 0);
  const expenseBudget = filtered.filter(b => b.account?.type === "expense").reduce((s, b) => s + b.amount, 0);
  const revenueBudget = filtered.filter(b => b.account?.type === "revenue").reduce((s, b) => s + b.amount, 0);

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Wallet className="w-6 h-6 text-primary" /> بودجه‌ریزی
        </h1>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 text-sm font-medium">
          <Plus className="w-4 h-4" /> بودجه جدید
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard title="کل بودجه" value={formatPrice(totalBudget)} icon={Wallet} color="indigo" />
        <StatCard title="بودجه هزینه" value={formatPrice(expenseBudget)} icon={TrendingDown} color="red" />
        <StatCard title="بودجه درآمد" value={formatPrice(revenueBudget)} icon={TrendingUp} color="green" />
      </div>

      <div className="bg-white/[0.03] border border-white/10 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-white/10 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="جستجو..."
              className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pr-9 pl-3 text-sm outline-none focus:border-primary/50" />
          </div>
          <select value={yearFilter} onChange={e => setYearFilter(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary/50">
            <option value="all">همه سال‌ها</option>
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select value={periodFilter} onChange={e => setPeriodFilter(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary/50">
            <option value="all">همه دوره‌ها</option>
            {Object.entries(PERIOD_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">در حال بارگذاری...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <PieChart className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>بودجه‌ای یافت نشد</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 border-b border-white/5 bg-white/[0.02]">
                <th className="text-right py-2 px-4">عنوان</th>
                <th className="text-right py-2 px-4">حساب</th>
                <th className="text-right py-2 px-4">مرکز هزینه</th>
                <th className="text-right py-2 px-4">سال / دوره</th>
                <th className="text-right py-2 px-4">مبلغ (ریال)</th>
                <th className="py-2 px-4" />
              </tr>
            </thead>
            <tbody>
              {filtered.map(b => (
                <tr key={b.id} className="border-b border-white/5 hover:bg-white/[0.02] group">
                  <td className="py-2.5 px-4 font-medium">{b.title}</td>
                  <td className="py-2.5 px-4">
                    {b.account ? (
                      <span className="text-xs">
                        <span className="text-indigo-400 font-mono">{b.account.code}</span>
                        <span className="text-gray-400 mr-1">{b.account.nameFa}</span>
                      </span>
                    ) : <span className="text-gray-500 text-xs">—</span>}
                  </td>
                  <td className="py-2.5 px-4">
                    {b.costCenter
                      ? <span className="text-xs text-gray-300">{b.costCenter.name}</span>
                      : <span className="text-gray-500 text-xs">—</span>}
                  </td>
                  <td className="py-2.5 px-4">
                    <span className="text-xs">{b.year}</span>
                    <span className="text-xs text-gray-500 mr-1">/ {PERIOD_LABELS[b.period] ?? b.period}</span>
                    {b.period === "monthly" && b.month && <span className="text-xs text-gray-500">({MONTH_NAMES[b.month - 1]})</span>}
                  </td>
                  <td className="py-2.5 px-4 font-mono text-emerald-400">{formatPrice(b.amount)}</td>
                  <td className="py-2.5 px-4">
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                      <button onClick={() => openEdit(b)} className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-white"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => del(b.id)} className="p-1.5 rounded hover:bg-red-500/20 text-gray-400 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            onClick={e => e.target === e.currentTarget && setShowModal(false)}
          >
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-6 w-full max-w-lg space-y-4"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">{editing ? "ویرایش بودجه" : "بودجه جدید"}</h2>
                <button onClick={() => setShowModal(false)} className="p-1.5 rounded hover:bg-white/10 text-gray-400"><X className="w-4 h-4" /></button>
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1 block">عنوان *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="مثال: بودجه هزینه‌های عملیاتی ۱۴۰۳"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary/50" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">سال *</label>
                  <select value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary/50">
                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">دوره</label>
                  <select value={form.period} onChange={e => setForm(f => ({ ...f, period: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary/50">
                    {Object.entries(PERIOD_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              </div>

              {form.period === "monthly" && (
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">ماه</label>
                  <select value={form.month} onChange={e => setForm(f => ({ ...f, month: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary/50">
                    <option value="">انتخاب ماه...</option>
                    {MONTH_NAMES.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                  </select>
                </div>
              )}

              <div>
                <label className="text-xs text-gray-400 mb-1 block">حساب (اختیاری)</label>
                <select value={form.accountId} onChange={e => setForm(f => ({ ...f, accountId: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary/50">
                  <option value="">— بدون حساب —</option>
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.code} — {a.nameFa}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1 block">مرکز هزینه (اختیاری)</label>
                <select value={form.costCenterId} onChange={e => setForm(f => ({ ...f, costCenterId: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary/50">
                  <option value="">— بدون مرکز هزینه —</option>
                  {costCenters.map(c => <option key={c.id} value={c.id}>{c.code} — {c.name}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1 block">مبلغ (ریال) *</label>
                <input value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                  placeholder="مثال: 5000000000"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary/50" />
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1 block">یادداشت</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={2} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary/50 resize-none" />
              </div>

              <div className="flex gap-2 pt-2">
                <button onClick={save} className="flex-1 bg-primary text-white rounded-lg py-2 text-sm font-medium hover:opacity-90">ذخیره</button>
                <button onClick={() => setShowModal(false)} className="px-4 py-2 border border-white/10 rounded-lg text-sm hover:bg-white/5">انصراف</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
