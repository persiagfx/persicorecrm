"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { RefreshCw, Calendar, Clock, X } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Invoice {
  id: string; invoiceNumber: string; total: number; status: string;
  isRecurring: boolean; recurringInterval: string | null; nextInvoiceDate: string | null;
  client: { companyName: string; contactName: string };
}

const INTERVAL_LABELS: Record<string, string> = { monthly: "ماهانه", quarterly: "فصلی", yearly: "سالانه", weekly: "هفتگی" };

export default function RecurringInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [dueSoonCount, setDueSoonCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ nextInvoiceDate: "", recurringInterval: "monthly" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiClient.get("/erp/recurring-invoices");
        setInvoices(res.data.data.recurring ?? []);
        setDueSoonCount(res.data.data.dueSoonCount ?? 0);
      } catch { toast.error("خطا در بارگذاری"); }
      finally { setLoading(false); }
    })();
  }, []);

  const handleSave = async () => {
    if (!editId) return;
    setSaving(true);
    try {
      await apiClient.put(`/erp/recurring-invoices/${editId}`, editForm);
      setInvoices(p => p.map(i => i.id === editId ? { ...i, ...editForm } : i));
      setEditId(null);
      toast.success("ذخیره شد");
    } catch { toast.error("خطا"); }
    finally { setSaving(false); }
  };

  const handleDisable = async (id: string) => {
    try {
      await apiClient.put(`/erp/recurring-invoices/${id}`, { isRecurring: false });
      setInvoices(p => p.filter(i => i.id !== id));
      toast.success("تکرار غیرفعال شد");
    } catch { toast.error("خطا"); }
  };

  const fmt = (n: number) => (n / 1_000_000).toFixed(1) + " م";

  return (
    <div className="space-y-6 max-w-4xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><RefreshCw className="w-6 h-6 text-primary" />فاکتورهای تکراری</h1>
        <p className="text-muted-foreground text-sm mt-0.5">مدیریت صدور خودکار فاکتورهای دوره‌ای</p>
      </motion.div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "کل فاکتور تکراری", value: invoices.length, color: "text-blue-400 bg-blue-500/10" },
          { label: "صدور در ۷ روز آینده", value: dueSoonCount, color: "text-amber-400 bg-amber-500/10" },
          { label: "ماهانه", value: invoices.filter(i => i.recurringInterval === "monthly").length, color: "text-emerald-400 bg-emerald-500/10" },
        ].map(s => (
          <div key={s.label} className="p-5 rounded-2xl bg-card border border-border">
            <p className={cn("text-xl font-bold", s.color.split(" ")[0])}>{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl bg-card border border-border overflow-hidden">
        <div className="p-4 border-b border-border"><h3 className="font-semibold text-foreground">فاکتورهای تکراری فعال</h3></div>
        {loading ? (
          <div className="p-6 space-y-3">{[1,2,3].map(i => <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />)}</div>
        ) : invoices.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground text-sm"><RefreshCw className="w-10 h-10 mx-auto mb-3 opacity-30" />فاکتور تکراری وجود ندارد</div>
        ) : (
          <div className="divide-y divide-border">
            {invoices.map(inv => {
              const isEdit = editId === inv.id;
              const nextDate = inv.nextInvoiceDate ? new Date(inv.nextInvoiceDate) : null;
              const isDue = nextDate && nextDate <= new Date(Date.now() + 7 * 86400000);
              return (
                <div key={inv.id} className="p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-foreground">{inv.client.companyName ?? inv.client.contactName}</span>
                        <span className="text-xs text-muted-foreground font-mono">{inv.invoiceNumber}</span>
                        {isDue && <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-xs">صدور نزدیک</span>}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><RefreshCw className="w-3 h-3" />{INTERVAL_LABELS[inv.recurringInterval ?? ""] ?? inv.recurringInterval ?? "—"}</span>
                        {nextDate && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />صدور بعدی: {nextDate.toLocaleDateString("fa-IR")}</span>}
                        <span className="font-medium text-foreground">{fmt(inv.total)}</span>
                      </div>
                    </div>
                    {!isEdit && (
                      <div className="flex items-center gap-2">
                        <button onClick={() => { setEditId(inv.id); setEditForm({ nextInvoiceDate: inv.nextInvoiceDate?.slice(0,10) ?? "", recurringInterval: inv.recurringInterval ?? "monthly" }); }}
                          className="px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground">
                          <Clock className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDisable(inv.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400"><X className="w-4 h-4" /></button>
                      </div>
                    )}
                  </div>
                  {isEdit && (
                    <div className="mt-3 flex items-center gap-2 flex-wrap">
                      <select value={editForm.recurringInterval} onChange={e => setEditForm(p => ({ ...p, recurringInterval: e.target.value }))}
                        className="px-3 py-1.5 rounded-lg bg-muted border border-border text-sm text-foreground">
                        {Object.entries(INTERVAL_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                      <input type="date" value={editForm.nextInvoiceDate} onChange={e => setEditForm(p => ({ ...p, nextInvoiceDate: e.target.value }))}
                        className="px-3 py-1.5 rounded-lg bg-muted border border-border text-sm text-foreground" />
                      <button onClick={handleSave} disabled={saving} className="px-3 py-1.5 rounded-lg gradient-brand text-black text-xs font-semibold">ذخیره</button>
                      <button onClick={() => setEditId(null)} className="px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground">بستن</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
