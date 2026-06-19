"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "motion/react";
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface MonthData { month: number; inflow: number; outflow: number; net: number; }
interface CashFlowData { year: number; months: MonthData[]; totalInflow: number; totalOutflow: number; netCashFlow: number; }

const MONTH_NAMES = ["فروردین","اردیبهشت","خرداد","تیر","مرداد","شهریور","مهر","آبان","آذر","دی","بهمن","اسفند"];
const fmt = (n: number) => (n / 1_000_000).toFixed(1) + " م";

export default function CashFlowPage() {
  const [data, setData] = useState<CashFlowData | null>(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/erp/cash-flow?year=${year}`);
      setData(res.data.data);
    } catch { toast.error("خطا در بارگذاری"); }
    finally { setLoading(false); }
  }, [year]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const maxVal = data ? Math.max(...data.months.map(m => Math.max(m.inflow, m.outflow))) : 1;

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  return (
    <div className="space-y-6 max-w-4xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><DollarSign className="w-6 h-6 text-primary" />جریان نقدی</h1>
          <p className="text-muted-foreground text-sm mt-0.5">تحلیل ورود و خروج پول بر اساس تراکنش‌های بانکی</p>
        </div>
        <select value={year} onChange={e => setYear(Number(e.target.value))}
          className="px-4 py-2 rounded-xl bg-card border border-border text-sm text-foreground focus:outline-none">
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </motion.div>

      {data && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "جمع ورودی", value: fmt(data.totalInflow), icon: TrendingUp, color: "text-emerald-400 bg-emerald-500/10" },
            { label: "جمع خروجی", value: fmt(data.totalOutflow), icon: TrendingDown, color: "text-red-400 bg-red-500/10" },
            { label: "خالص جریان", value: fmt(data.netCashFlow), icon: DollarSign, color: data.netCashFlow >= 0 ? "text-emerald-400 bg-emerald-500/10" : "text-red-400 bg-red-500/10" },
          ].map(c => (
            <div key={c.label} className="p-5 rounded-2xl bg-card border border-border">
              <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center mb-3", c.color)}><c.icon className="w-4 h-4" /></div>
              <p className="text-xl font-bold text-foreground">{c.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{c.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="p-6 rounded-2xl bg-card border border-border">
        <h3 className="font-semibold text-foreground mb-6">نمودار ماهانه</h3>
        {loading ? (
          <div className="h-48 flex items-end gap-2">{Array.from({length:12}).map((_,i) => <div key={i} className="flex-1 rounded-t-lg bg-muted animate-pulse" style={{height: `${30+Math.random()*70}%`}} />)}</div>
        ) : data ? (
          <div className="space-y-1">
            <div className="flex items-end gap-1.5 h-48">
              {data.months.map((m, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                  <div className="w-full flex flex-col justify-end gap-0.5" style={{ height: "100%" }}>
                    <div className="w-full rounded-t-sm bg-emerald-500/60 transition-all" style={{ height: `${maxVal > 0 ? (m.inflow / maxVal) * 100 : 0}%` }} title={`ورودی: ${fmt(m.inflow)}`} />
                    <div className="w-full rounded-t-sm bg-red-500/60 transition-all" style={{ height: `${maxVal > 0 ? (m.outflow / maxVal) * 100 : 0}%`, marginTop: "2px" }} title={`خروجی: ${fmt(m.outflow)}`} />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-1.5">
              {MONTH_NAMES.map((name, i) => (
                <div key={i} className="flex-1 text-center text-xs text-muted-foreground">{name.slice(0,3)}</div>
              ))}
            </div>
          </div>
        ) : null}
        <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-emerald-500/60 inline-block" />ورودی (واریز)</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-red-500/60 inline-block" />خروجی (برداشت)</span>
        </div>
      </div>

      {data && (
        <div className="rounded-2xl bg-card border border-border overflow-hidden">
          <div className="p-4 border-b border-border"><h3 className="font-semibold text-foreground">جزئیات ماهانه</h3></div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>{["ماه","ورودی","خروجی","خالص"].map(h => <th key={h} className="text-right px-4 py-3 text-muted-foreground font-medium">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data.months.map((m, i) => (
                  <tr key={i} className="hover:bg-muted/30">
                    <td className="px-4 py-2.5 font-medium text-foreground">{MONTH_NAMES[i]}</td>
                    <td className="px-4 py-2.5 text-emerald-400">{m.inflow > 0 ? fmt(m.inflow) : "—"}</td>
                    <td className="px-4 py-2.5 text-red-400">{m.outflow > 0 ? fmt(m.outflow) : "—"}</td>
                    <td className={cn("px-4 py-2.5 font-semibold", m.net >= 0 ? "text-emerald-400" : "text-red-400")}>{m.net !== 0 ? fmt(m.net) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
