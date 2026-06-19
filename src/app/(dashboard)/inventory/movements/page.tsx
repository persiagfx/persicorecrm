"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowDownToLine, ArrowUpFromLine, RefreshCw, ArrowLeftRight, Plus, Search, X, ChevronDown } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Movement {
  id: string;
  itemId: string;
  item?: { name: string; unit: string };
  type: string;
  quantity: number;
  before: number;
  after: number;
  reason?: string;
  reference?: string;
  createdAt: string;
}

interface InventoryItem { id: string; name: string; unit: string; currentStock: number; }

const TYPE_CFG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  in:       { label: "ورودی",    color: "text-emerald-400 bg-emerald-500/10", icon: ArrowDownToLine },
  out:      { label: "خروجی",   color: "text-red-400 bg-red-500/10",         icon: ArrowUpFromLine },
  adjust:   { label: "تعدیل",   color: "text-amber-400 bg-amber-500/10",     icon: RefreshCw },
  transfer: { label: "انتقال",  color: "text-blue-400 bg-blue-500/10",       icon: ArrowLeftRight },
};

export default function MovementsPage() {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ itemId: "", type: "in", quantity: 0, reason: "", reference: "" });

  const load = useCallback(async () => {
    try {
      const [mr, ir] = await Promise.all([
        apiClient.get("/inventory/movements"),
        apiClient.get("/inventory"),
      ]);
      setMovements(mr.data.data ?? []);
      setItems(ir.data.data ?? []);
    } catch {
      toast.error("خطا در بارگذاری");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    try {
      await apiClient.post("/inventory/movements", form);
      toast.success("حرکت انبار ثبت شد");
      setShowModal(false);
      setForm({ itemId: "", type: "in", quantity: 0, reason: "", reference: "" });
      load();
    } catch {
      toast.error("خطا در ثبت");
    }
  };

  const filtered = movements.filter(m => {
    if (typeFilter !== "all" && m.type !== typeFilter) return false;
    if (search && !m.item?.name.includes(search) && !(m.reference ?? "").includes(search)) return false;
    return true;
  });

  const totalIn = movements.filter(m => m.type === "in").reduce((a, m) => a + m.quantity, 0);
  const totalOut = movements.filter(m => m.type === "out").reduce((a, m) => a + m.quantity, 0);

  return (
    <div className="p-6 space-y-5 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ArrowLeftRight className="w-6 h-6 text-primary" />حرکات انبار
        </h1>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-brand text-black text-sm font-semibold">
          <Plus className="w-4 h-4" /> ثبت حرکت
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {(Object.entries(TYPE_CFG)).map(([type, cfg]) => {
          const Icon = cfg.icon;
          const count = movements.filter(m => m.type === type).length;
          return (
            <div key={type} className="glass rounded-2xl p-4 border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Icon className={cn("w-4 h-4", cfg.color.split(" ")[0])} />
                <span className="text-sm text-muted-foreground">{cfg.label}</span>
              </div>
              <p className="text-xl font-bold">{count}</p>
            </div>
          );
        })}
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="جستجو در نام کالا..." className="w-full pe-10 ps-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary">
          <option value="all">همه نوع‌ها</option>
          {Object.entries(TYPE_CFG).map(([type, cfg]) => <option key={type} value={type}>{cfg.label}</option>)}
        </select>
      </div>

      <div className="glass rounded-2xl border border-border overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-muted-foreground">در حال بارگذاری...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <ArrowLeftRight className="w-10 h-10 mx-auto mb-3 opacity-30" /><p>حرکتی یافت نشد</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {["نوع", "کالا", "مقدار", "قبل", "بعد", "مرجع", "دلیل", "تاریخ"].map(h => (
                  <th key={h} className="text-right p-4 text-muted-foreground font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(m => {
                const cfg = TYPE_CFG[m.type] ?? { label: m.type, color: "text-muted-foreground bg-muted", icon: ArrowLeftRight };
                const Icon = cfg.icon;
                return (
                  <tr key={m.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                    <td className="p-4">
                      <span className={cn("flex items-center gap-1 px-2 py-0.5 rounded-full text-xs w-fit", cfg.color)}>
                        <Icon className="w-3 h-3" />{cfg.label}
                      </span>
                    </td>
                    <td className="p-4 font-medium">{m.item?.name ?? "—"}</td>
                    <td className="p-4">
                      <span className={cn("font-bold", m.type === "in" ? "text-emerald-400" : m.type === "out" ? "text-red-400" : "text-muted-foreground")}>
                        {m.type === "out" ? "-" : "+"}{m.quantity} {m.item?.unit}
                      </span>
                    </td>
                    <td className="p-4 text-muted-foreground">{m.before}</td>
                    <td className="p-4 text-muted-foreground">{m.after}</td>
                    <td className="p-4 font-mono text-xs text-muted-foreground">{m.reference ?? "—"}</td>
                    <td className="p-4 text-muted-foreground">{m.reason ?? "—"}</td>
                    <td className="p-4 text-muted-foreground text-xs">{new Date(m.createdAt).toLocaleDateString("fa-IR")}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="glass rounded-2xl p-6 w-full max-w-md border border-border">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold">ثبت حرکت انبار</h2>
                <button onClick={() => setShowModal(false)}><X className="w-4 h-4" /></button>
              </div>
              <div className="space-y-3">
                <select value={form.itemId} onChange={e => setForm(f => ({ ...f, itemId: e.target.value }))} className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary">
                  <option value="">انتخاب کالا *</option>
                  {items.map(i => <option key={i.id} value={i.id}>{i.name} (موجودی: {i.currentStock} {i.unit})</option>)}
                </select>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary">
                  {Object.entries(TYPE_CFG).map(([type, cfg]) => <option key={type} value={type}>{cfg.label}</option>)}
                </select>
                <input type="number" placeholder="مقدار *" value={form.quantity || ""} onChange={e => setForm(f => ({ ...f, quantity: Number(e.target.value) }))} className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                <input placeholder="شماره مرجع (اختیاری)" value={form.reference} onChange={e => setForm(f => ({ ...f, reference: e.target.value }))} className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                <input placeholder="دلیل (اختیاری)" value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl border border-border text-sm">انصراف</button>
                <button onClick={save} className="flex-[2] py-2.5 rounded-xl gradient-brand text-black text-sm font-semibold">ثبت</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
