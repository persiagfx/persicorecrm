"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Invoice { id: string; invoiceNumber: string; total: number; dueDate: string; status: string; client: { companyName: string; contactName: string }; }
interface Bucket { label: string; items: Invoice[]; total: number; }
interface AgingData { buckets: Record<string, Bucket>; summary: { key: string; label: string; count: number; total: number }[]; totalOutstanding: number; }

const BUCKET_ORDER = ["current","days30","days60","days90","over90"];
const BUCKET_COLORS: Record<string, string> = {
  current: "text-emerald-400 bg-emerald-500/10",
  days30: "text-amber-400 bg-amber-500/10",
  days60: "text-orange-400 bg-orange-500/10",
  days90: "text-red-400 bg-red-500/10",
  over90: "text-rose-400 bg-rose-500/10",
};

export default function AgingReportPage() {
  const [data, setData] = useState<AgingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>("days30");

  useEffect(() => {
    (async () => {
      try {
        const res = await apiClient.get("/erp/aging-report");
        setData(res.data.data);
      } catch { toast.error("خطا در بارگذاری"); }
      finally { setLoading(false); }
    })();
  }, []);

  const fmt = (n: number) => (n / 1_000_000).toFixed(1) + " م";

  return (
    <div className="space-y-6 max-w-4xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><AlertTriangle className="w-6 h-6 text-primary" />گزارش سنی مطالبات</h1>
        <p className="text-muted-foreground text-sm mt-0.5">تحلیل فاکتورهای پرداخت‌نشده بر اساس مدت زمان تاخیر</p>
      </motion.div>

      {loading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 rounded-2xl bg-card animate-pulse border border-border" />)}</div>
      ) : data ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {data.summary.map(s => (
              <div key={s.key} className={cn("p-4 rounded-2xl border border-border", BUCKET_COLORS[s.key].split(" ")[1])}>
                <p className={cn("text-lg font-bold", BUCKET_COLORS[s.key].split(" ")[0])}>{fmt(s.total)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
                <p className="text-xs text-muted-foreground">{s.count} فاکتور</p>
              </div>
            ))}
          </div>

          <div className="p-4 rounded-2xl bg-card border border-border flex items-center justify-between">
            <span className="font-semibold text-foreground">جمع کل مطالبات معوق</span>
            <span className="text-xl font-bold text-red-400">{fmt(data.totalOutstanding)}</span>
          </div>

          <div className="space-y-3">
            {BUCKET_ORDER.map(key => {
              const bucket = data.buckets[key];
              if (!bucket || bucket.items.length === 0) return null;
              const isOpen = expanded === key;
              return (
                <motion.div key={key} className="rounded-2xl bg-card border border-border overflow-hidden">
                  <button className="w-full p-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
                    onClick={() => setExpanded(isOpen ? null : key)}>
                    <div className="flex items-center gap-3">
                      <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium", BUCKET_COLORS[key])}>{bucket.label}</span>
                      <span className="text-sm text-muted-foreground">{bucket.items.length} فاکتور</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={cn("font-bold", BUCKET_COLORS[key].split(" ")[0])}>{fmt(bucket.total)}</span>
                      {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </div>
                  </button>
                  {isOpen && (
                    <div className="border-t border-border overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                          <tr>{["شماره فاکتور","مشتری","سررسید","مبلغ","روز تاخیر"].map(h => (
                            <th key={h} className="text-right px-4 py-2.5 text-muted-foreground font-medium">{h}</th>
                          ))}</tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {bucket.items.map(inv => {
                            const days = Math.floor((Date.now() - new Date(inv.dueDate).getTime()) / 86400000);
                            return (
                              <tr key={inv.id} className="hover:bg-muted/30">
                                <td className="px-4 py-2.5 text-foreground font-mono text-xs">{inv.invoiceNumber}</td>
                                <td className="px-4 py-2.5 text-foreground">{inv.client.companyName ?? inv.client.contactName}</td>
                                <td className="px-4 py-2.5 text-muted-foreground text-xs">{new Date(inv.dueDate).toLocaleDateString("fa-IR")}</td>
                                <td className="px-4 py-2.5 font-semibold text-foreground">{fmt(inv.total)}</td>
                                <td className="px-4 py-2.5">
                                  {days > 0 ? <span className="text-red-400 font-medium">{days} روز</span> : <span className="text-emerald-400 text-xs">نرسیده</span>}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </>
      ) : null}
    </div>
  );
}
