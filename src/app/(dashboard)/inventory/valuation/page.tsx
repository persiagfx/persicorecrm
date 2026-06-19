"use client";

import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Package, TrendingUp, DollarSign, Search } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ValuationRow {
  id: string; name: string; sku: string | null; category: string; supplier: string;
  currentStock: number; unit: string; costPrice: number; sellPrice: number;
  totalCostValue: number; totalSellValue: number; profitPotential: number;
}
interface ValuationData { rows: ValuationRow[]; totalCost: number; totalSell: number; totalProfit: number; itemCount: number; }

const fmt = (n: number) => (n / 1_000_000).toFixed(2) + " م";

export default function InventoryValuationPage() {
  const [data, setData] = useState<ValuationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await apiClient.get("/inventory/valuation");
        setData(res.data.data);
      } catch { toast.error("خطا در بارگذاری"); }
      finally { setLoading(false); }
    })();
  }, []);

  const rows = (data?.rows ?? []).filter(r =>
    !search || r.name.toLowerCase().includes(search.toLowerCase()) || (r.sku ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-5xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><Package className="w-6 h-6 text-primary" />ارزیابی موجودی</h1>
          <p className="text-muted-foreground text-sm mt-0.5">ارزش کل موجودی انبار بر اساس قیمت تمام‌شده و فروش</p>
        </div>
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="جستجو..."
            className="pe-10 ps-4 py-2 rounded-xl bg-card border border-border text-sm text-foreground focus:outline-none w-44" />
        </div>
      </motion.div>

      {data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "تعداد اقلام", value: `${data.itemCount} قلم`, icon: Package, color: "text-blue-400 bg-blue-500/10" },
            { label: "ارزش خرید", value: fmt(data.totalCost), icon: DollarSign, color: "text-amber-400 bg-amber-500/10" },
            { label: "ارزش فروش", value: fmt(data.totalSell), icon: TrendingUp, color: "text-emerald-400 bg-emerald-500/10" },
            { label: "سود بالقوه", value: fmt(data.totalProfit), icon: TrendingUp, color: "text-purple-400 bg-purple-500/10" },
          ].map(c => (
            <div key={c.label} className="p-5 rounded-2xl bg-card border border-border">
              <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mb-3", c.color)}><c.icon className="w-4 h-4" /></div>
              <p className="text-xl font-bold text-foreground">{c.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{c.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-2xl bg-card border border-border overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h3 className="font-semibold text-foreground">جزئیات ارزیابی</h3>
          <span className="text-xs text-muted-foreground">{rows.length} قلم</span>
        </div>
        {loading ? (
          <div className="p-6 space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-12 rounded-xl bg-muted animate-pulse" />)}</div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground text-sm"><Package className="w-10 h-10 mx-auto mb-3 opacity-30" />کالایی یافت نشد</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>{["کالا","دسته‌بندی","موجودی","قیمت تمام‌شده","قیمت فروش","ارزش انبار","ارزش فروش","سود"].map(h => (
                  <th key={h} className="text-right px-3 py-3 text-muted-foreground font-medium whitespace-nowrap">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map(row => (
                  <motion.tr key={row.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="hover:bg-muted/30 transition-colors">
                    <td className="px-3 py-2.5">
                      <div>
                        <p className="font-medium text-foreground">{row.name}</p>
                        {row.sku && <p className="text-xs text-muted-foreground font-mono">{row.sku}</p>}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground text-xs">{row.category}</td>
                    <td className="px-3 py-2.5 text-foreground font-medium">{row.currentStock} {row.unit}</td>
                    <td className="px-3 py-2.5 text-muted-foreground">{(row.costPrice / 1000).toFixed(0)}ک</td>
                    <td className="px-3 py-2.5 text-muted-foreground">{(row.sellPrice / 1000).toFixed(0)}ک</td>
                    <td className="px-3 py-2.5 text-amber-400 font-medium">{fmt(row.totalCostValue)}</td>
                    <td className="px-3 py-2.5 text-emerald-400 font-medium">{fmt(row.totalSellValue)}</td>
                    <td className={cn("px-3 py-2.5 font-semibold", row.profitPotential >= 0 ? "text-emerald-400" : "text-red-400")}>{fmt(row.profitPotential)}</td>
                  </motion.tr>
                ))}
              </tbody>
              <tfoot className="border-t border-border bg-muted/30">
                <tr>
                  <td colSpan={5} className="px-3 py-3 font-semibold text-foreground">جمع کل</td>
                  <td className="px-3 py-3 font-bold text-amber-400">{data ? fmt(data.totalCost) : "—"}</td>
                  <td className="px-3 py-3 font-bold text-emerald-400">{data ? fmt(data.totalSell) : "—"}</td>
                  <td className="px-3 py-3 font-bold text-purple-400">{data ? fmt(data.totalProfit) : "—"}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
