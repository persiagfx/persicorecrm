"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { BarChart2, Plus, Search, TrendingUp, TrendingDown, DollarSign, FileText, X, Pencil, Trash2 } from "lucide-react";
import { formatPrice, toJalali } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { StatCard } from "@/components/common/StatCard";
import { apiClient } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface TradeRecord { id: string; tradeNumber: string; tradeType: "import"|"export"|"domestic"; counterparty: string; productDescription: string; quantity: number; unitPrice: number; currency: string; exchangeRate: number; totalAmountLocal: number; tradeDate: string; customsRef?: string; hsCode?: string; status: "draft"|"pending"|"cleared"|"completed"|"cancelled"; notes?: string; }

const STATUS_CFG = { draft: { label: "پیش‌نویس", color: "text-gray-400 bg-gray-500/10" }, pending: { label: "در انتظار", color: "text-amber-400 bg-amber-500/10" }, cleared: { label: "ترخیص شد", color: "text-blue-400 bg-blue-500/10" }, completed: { label: "تکمیل", color: "text-emerald-400 bg-emerald-500/10" }, cancelled: { label: "لغو", color: "text-red-400 bg-red-500/10" } };
const TYPE_CFG = { import: { label: "واردات", color: "text-violet-400" }, export: { label: "صادرات", color: "text-emerald-400" }, domestic: { label: "داخلی", color: "text-blue-400" } };
const CURRENCIES = ["IRR", "USD", "EUR", "AED", "CNY", "TRY"];

export default function TradeRecordsPage() {
  const [records, setRecords] = useState<TradeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<TradeRecord | undefined>();
  const [form, setForm] = useState({ tradeNumber: "", tradeType: "import" as TradeRecord["tradeType"], counterparty: "", productDescription: "", quantity: 1, unitPrice: 0, currency: "USD", exchangeRate: 1, customsRef: "", hsCode: "", status: "draft" as TradeRecord["status"], tradeDate: new Date().toISOString().slice(0, 10), notes: "" });

  const load = useCallback(async () => { try { const r = await apiClient.get("/trading/trade-records"); setRecords(r.data.data ?? []); } catch { toast.error("خطا"); } finally { setLoading(false); } }, []);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    try {
      const total = form.quantity * form.unitPrice * form.exchangeRate;
      const data = { ...form, totalAmountLocal: total };
      if (editing) await apiClient.put(`/trading/trade-records/${editing.id}`, data); else await apiClient.post("/trading/trade-records", data);
      toast.success("ذخیره شد"); setShowModal(false); setEditing(undefined); load();
    } catch { toast.error("خطا"); }
  };
  const del = async (id: string) => { if (!confirm("حذف؟")) return; try { await apiClient.delete(`/trading/trade-records/${id}`); toast.success("حذف شد"); load(); } catch { /**/ } };
  const open = (r?: TradeRecord) => { setEditing(r); setForm(r ? { tradeNumber: r.tradeNumber, tradeType: r.tradeType, counterparty: r.counterparty, productDescription: r.productDescription, quantity: r.quantity, unitPrice: r.unitPrice, currency: r.currency, exchangeRate: r.exchangeRate, customsRef: r.customsRef ?? "", hsCode: r.hsCode ?? "", status: r.status, tradeDate: r.tradeDate, notes: r.notes ?? "" } : { tradeNumber: `TR-${Date.now().toString().slice(-6)}`, tradeType: "import", counterparty: "", productDescription: "", quantity: 1, unitPrice: 0, currency: "USD", exchangeRate: 1, customsRef: "", hsCode: "", status: "draft", tradeDate: new Date().toISOString().slice(0, 10), notes: "" }); setShowModal(true); };

  const filtered = records.filter(r => { if (typeFilter !== "all" && r.tradeType !== typeFilter) return false; if (search && !r.tradeNumber.includes(search) && !r.counterparty.includes(search) && !r.productDescription.includes(search)) return false; return true; });
  const totalImport = records.filter(r => r.tradeType === "import").reduce((a, r) => a + r.totalAmountLocal, 0);
  const totalExport = records.filter(r => r.tradeType === "export").reduce((a, r) => a + r.totalAmountLocal, 0);

  const byMonth = records.reduce<Record<string, { import: number; export: number }>>((acc, r) => { const m = r.tradeDate.slice(0, 7); if (!acc[m]) acc[m] = { import: 0, export: 0 }; if (r.tradeType === "import") acc[m].import += r.totalAmountLocal; if (r.tradeType === "export") acc[m].export += r.totalAmountLocal; return acc; }, {});
  const chartData = Object.entries(byMonth).sort().slice(-6).map(([m, v]) => ({ month: m.slice(5), ...v }));

  return (
    <div className="p-6 space-y-5 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold flex items-center gap-2"><BarChart2 className="w-6 h-6 text-primary" />رکوردهای تجاری</h1></div>
        <button onClick={() => open()} className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-brand text-black text-sm font-semibold"><Plus className="w-4 h-4" /> رکورد جدید</button>
      </div>
      <div className="grid grid-cols-4 gap-4">
        <StatCard title="کل رکوردها" value={records.length} icon={FileText} color="blue" />
        <StatCard title="ارزش واردات" value={formatPrice(totalImport)} icon={TrendingDown} color="red" />
        <StatCard title="ارزش صادرات" value={formatPrice(totalExport)} icon={TrendingUp} color="green" />
        <StatCard title="مانده تراز" value={formatPrice(totalExport - totalImport)} icon={DollarSign} color="amber" />
      </div>
      {chartData.length > 0 && (
        <div className="glass rounded-2xl border border-border p-5">
          <h3 className="font-semibold mb-4 text-sm">واردات / صادرات ماهانه</h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={chartData}><XAxis dataKey="month" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} /><Tooltip /><Bar dataKey="import" fill="#ef4444" name="واردات" radius={[3, 3, 0, 0]} /><Bar dataKey="export" fill="#22c55e" name="صادرات" radius={[3, 3, 0, 0]} /></BarChart>
          </ResponsiveContainer>
        </div>
      )}
      <div className="flex gap-3">
        <div className="relative flex-1"><Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="جستجو..." className="w-full pe-10 ps-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" /></div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary">
          <option value="all">همه انواع</option>
          {Object.entries(TYPE_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>
      <div className="glass rounded-2xl border border-border overflow-hidden">
        {loading ? <div className="p-12 text-center text-muted-foreground">در حال بارگذاری...</div> : filtered.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground"><BarChart2 className="w-10 h-10 mx-auto mb-3 opacity-30" /><p>رکوردی یافت نشد</p></div>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border">{["شماره", "نوع", "طرف مقابل", "کالا", "مقدار", "ارزش کل", "تاریخ", "وضعیت", ""].map(h => <th key={h} className="text-right p-4 text-muted-foreground font-medium whitespace-nowrap">{h}</th>)}</tr></thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                  <td className="p-4 font-mono text-xs">{r.tradeNumber}</td>
                  <td className="p-4"><span className={cn("text-xs font-medium", TYPE_CFG[r.tradeType].color)}>{TYPE_CFG[r.tradeType].label}</span></td>
                  <td className="p-4 font-medium">{r.counterparty}</td>
                  <td className="p-4 text-muted-foreground max-w-xs truncate">{r.productDescription}</td>
                  <td className="p-4 text-muted-foreground">{r.quantity}</td>
                  <td className="p-4">{formatPrice(r.totalAmountLocal)}</td>
                  <td className="p-4 text-muted-foreground whitespace-nowrap">{toJalali(r.tradeDate)}</td>
                  <td className="p-4"><span className={cn("px-2.5 py-1 rounded-full text-xs font-medium", STATUS_CFG[r.status].color)}>{STATUS_CFG[r.status].label}</span></td>
                  <td className="p-4"><div className="flex gap-1"><button onClick={() => open(r)} className="p-1.5 rounded-lg hover:bg-muted"><Pencil className="w-3.5 h-3.5 text-muted-foreground" /></button><button onClick={() => del(r.id)} className="p-1.5 rounded-lg hover:bg-destructive/10"><Trash2 className="w-3.5 h-3.5 text-destructive" /></button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="glass rounded-2xl p-6 w-full max-w-lg border border-border max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5"><h2 className="text-lg font-bold">{editing ? "ویرایش رکورد" : "رکورد تجاری جدید"}</h2><button onClick={() => setShowModal(false)}><X className="w-4 h-4" /></button></div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input placeholder="شماره رکورد" value={form.tradeNumber} onChange={e => setForm(f => ({ ...f, tradeNumber: e.target.value }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                  <select value={form.tradeType} onChange={e => setForm(f => ({ ...f, tradeType: e.target.value as TradeRecord["tradeType"] }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary">
                    {Object.entries(TYPE_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <input placeholder="طرف مقابل (شرکت/فرد) *" value={form.counterparty} onChange={e => setForm(f => ({ ...f, counterparty: e.target.value }))} className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                <textarea placeholder="توضیح کالا *" value={form.productDescription} onChange={e => setForm(f => ({ ...f, productDescription: e.target.value }))} rows={2} className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary resize-none" />
                <div className="grid grid-cols-3 gap-3">
                  <input type="number" placeholder="مقدار" value={form.quantity || ""} onChange={e => setForm(f => ({ ...f, quantity: Number(e.target.value) }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                  <input type="number" placeholder="قیمت واحد" value={form.unitPrice || ""} onChange={e => setForm(f => ({ ...f, unitPrice: Number(e.target.value) }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                  <select value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary">
                    {CURRENCIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input type="number" placeholder="نرخ ارز" value={form.exchangeRate || ""} onChange={e => setForm(f => ({ ...f, exchangeRate: Number(e.target.value) }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                  <div className="px-3 py-2 rounded-xl bg-muted/50 border border-border text-sm text-muted-foreground flex items-center">کل: {formatPrice(form.quantity * form.unitPrice * form.exchangeRate)}</div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input placeholder="شماره گمرک" value={form.customsRef} onChange={e => setForm(f => ({ ...f, customsRef: e.target.value }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                  <input placeholder="کد HS" value={form.hsCode} dir="ltr" onChange={e => setForm(f => ({ ...f, hsCode: e.target.value }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input type="date" value={form.tradeDate} onChange={e => setForm(f => ({ ...f, tradeDate: e.target.value }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as TradeRecord["status"] }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary">
                    {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <textarea placeholder="یادداشت" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary resize-none" />
              </div>
              <div className="flex gap-3 mt-5"><button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl border border-border text-sm">انصراف</button><button onClick={save} className="flex-[2] py-2.5 rounded-xl gradient-brand text-black text-sm font-semibold">ذخیره</button></div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
