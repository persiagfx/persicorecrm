"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "motion/react";
import { CheckSquare, Clock, Check, Filter } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface BankTx {
  id: string; type: string; amount: number; description: string; date: string;
  reference: string | null; reconciled: boolean; reconciledAt: string | null;
  account: { id: string; name: string; bankName: string; };
}
interface BankAccount { id: string; name: string; bankName: string; balance: number; }

export default function BankReconciliationPage() {
  const [transactions, setTransactions] = useState<BankTx[]>([]);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [stats, setStats] = useState({ unreconciled: 0, reconciledCount: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unreconciled" | "reconciled">("unreconciled");
  const [accountId, setAccountId] = useState("");
  const [saving, setSaving] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (accountId) params.set("accountId", accountId);
      if (filter !== "all") params.set("reconciled", filter === "reconciled" ? "true" : "false");
      const res = await apiClient.get(`/erp/bank-reconciliation?${params}`);
      setTransactions(res.data.data.transactions ?? []);
      setAccounts(res.data.data.accounts ?? []);
      setStats(res.data.data.stats ?? {});
    } catch { toast.error("خطا در بارگذاری"); }
    finally { setLoading(false); }
  }, [filter, accountId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleToggle = async (tx: BankTx) => {
    setSaving(tx.id);
    try {
      await apiClient.put(`/erp/bank-reconciliation/${tx.id}`, { reconciled: !tx.reconciled });
      setTransactions(p => p.map(t => t.id === tx.id ? { ...t, reconciled: !t.reconciled } : t));
      toast.success(tx.reconciled ? "علامت تطبیق برداشته شد" : "تطبیق ثبت شد");
    } catch { toast.error("خطا"); }
    finally { setSaving(null); }
  };

  const fmt = (n: number) => n.toLocaleString("fa-IR");

  return (
    <div className="space-y-6 max-w-5xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><CheckSquare className="w-6 h-6 text-primary" />تطبیق بانکی</h1>
          <p className="text-muted-foreground text-sm mt-0.5">مقایسه و تایید تراکنش‌های بانکی</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select value={accountId} onChange={e => setAccountId(e.target.value)}
            className="px-3 py-2 rounded-xl bg-card border border-border text-sm text-foreground focus:outline-none">
            <option value="">همه حساب‌ها</option>
            {accounts.map(a => <option key={a.id} value={a.id}>{a.name} — {a.bankName}</option>)}
          </select>
          <div className="flex p-1 rounded-xl bg-card border border-border gap-0.5">
            {(["all","unreconciled","reconciled"] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-all", filter === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
                {{ all: "همه", unreconciled: "تطبیق نشده", reconciled: "تطبیق شده" }[f]}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "تطبیق نشده", value: stats.unreconciled, color: "text-amber-400 bg-amber-500/10", icon: Clock },
          { label: "تطبیق شده", value: stats.reconciledCount, color: "text-emerald-400 bg-emerald-500/10", icon: Check },
          { label: "کل تراکنش", value: stats.total, color: "text-blue-400 bg-blue-500/10", icon: Filter },
        ].map(s => (
          <div key={s.label} className="p-5 rounded-2xl bg-card border border-border">
            <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mb-3", s.color)}><s.icon className="w-4 h-4" /></div>
            <p className="text-xl font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl bg-card border border-border overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold text-foreground">تراکنش‌ها</h3>
          <span className="text-xs text-muted-foreground">{transactions.length} ردیف</span>
        </div>
        {loading ? (
          <div className="p-6 space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-12 rounded-xl bg-muted animate-pulse" />)}</div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground text-sm"><CheckSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />تراکنشی یافت نشد</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>{["تاریخ","حساب","توضیح","مرجع","مبلغ","نوع","تطبیق"].map(h => (
                  <th key={h} className="text-right px-4 py-3 text-muted-foreground font-medium">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-border">
                {transactions.map(tx => (
                  <motion.tr key={tx.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className={cn("hover:bg-muted/30 transition-colors", tx.reconciled && "opacity-60")}>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(tx.date).toLocaleDateString("fa-IR")}</td>
                    <td className="px-4 py-3 text-foreground text-xs">{tx.account.name}</td>
                    <td className="px-4 py-3 text-foreground max-w-xs truncate">{tx.description}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{tx.reference ?? "—"}</td>
                    <td className={cn("px-4 py-3 font-semibold", tx.type === "credit" ? "text-emerald-400" : "text-red-400")}>
                      {tx.type === "debit" ? "-" : "+"}{fmt(tx.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", tx.type === "credit" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400")}>
                        {tx.type === "credit" ? "واریز" : "برداشت"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleToggle(tx)} disabled={saving === tx.id}
                        className={cn("w-8 h-8 rounded-lg flex items-center justify-center transition-all", tx.reconciled ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30" : "bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary")}>
                        {saving === tx.id ? <span className="w-3 h-3 rounded-full border border-current border-t-transparent animate-spin" /> : <Check className="w-4 h-4" />}
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
