"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ClipboardList, Plus, X, ChevronDown, ChevronUp, Check, AlertTriangle } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface StockItem { itemId: string; name: string; sku: string; unit: string; systemQty: number; countedQty: number | null; costPrice: number; difference: number | null; }
interface StockCount { id: string; name: string; date: string; status: string; items: StockItem[]; notes: string | null; conductedBy: string | null; }

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  draft: { label: "پیش‌نویس", color: "bg-muted text-muted-foreground" },
  in_progress: { label: "در جریان", color: "bg-blue-500/10 text-blue-400" },
  completed: { label: "تکمیل", color: "bg-emerald-500/10 text-emerald-400" },
};

export default function StockCountPage() {
  const [counts, setCounts] = useState<StockCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newForm, setNewForm] = useState({ name: "", notes: "", conductedBy: "" });
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingCount, setEditingCount] = useState<StockCount | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/inventory/stock-count");
      setCounts(res.data.data ?? []);
    } catch { toast.error("خطا در بارگذاری"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreate = async () => {
    if (!newForm.name.trim()) { toast.error("نام شمارش الزامی است"); return; }
    setSaving(true);
    try {
      const res = await apiClient.post("/inventory/stock-count", newForm);
      setCounts(p => [res.data.data, ...p]);
      setShowModal(false);
      setNewForm({ name: "", notes: "", conductedBy: "" });
      setExpandedId(res.data.data.id);
      setEditingCount(res.data.data);
      toast.success("شمارش ایجاد شد");
    } catch { toast.error("خطا"); }
    finally { setSaving(false); }
  };

  const handleUpdateQty = (itemId: string, qty: string) => {
    if (!editingCount) return;
    const updatedItems = editingCount.items.map(item =>
      item.itemId === itemId ? { ...item, countedQty: qty === "" ? null : Number(qty), difference: qty === "" ? null : Number(qty) - item.systemQty } : item
    );
    setEditingCount({ ...editingCount, items: updatedItems });
  };

  const handleSaveCount = async (complete = false) => {
    if (!editingCount) return;
    setSaving(true);
    try {
      const status = complete ? "completed" : "in_progress";
      await apiClient.put(`/inventory/stock-count/${editingCount.id}`, {
        items: editingCount.items,
        status,
        applyAdjustments: complete,
      });
      setCounts(p => p.map(c => c.id === editingCount.id ? { ...editingCount, status } : c));
      if (complete) {
        setEditingCount(null);
        setExpandedId(null);
        toast.success("شمارش تکمیل و موجودی به‌روز شد");
      } else {
        toast.success("ذخیره شد");
      }
    } catch { toast.error("خطا در ذخیره"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("حذف شود؟")) return;
    try {
      await apiClient.delete(`/inventory/stock-count/${id}`);
      setCounts(p => p.filter(c => c.id !== id));
      toast.success("حذف شد");
    } catch { toast.error("خطا"); }
  };

  const countItems = (count: StockCount) => {
    const filled = count.items.filter(i => i.countedQty !== null).length;
    return { filled, total: count.items.length, percent: count.items.length > 0 ? (filled / count.items.length) * 100 : 0 };
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2"><ClipboardList className="w-6 h-6 text-primary" />شمارش موجودی</h1>
          <p className="text-muted-foreground text-sm mt-0.5">انجام سرشماری فیزیکی انبار و تطبیق با سیستم</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-brand text-black text-sm font-semibold gold-glow">
          <Plus className="w-4 h-4" />شمارش جدید
        </button>
      </motion.div>

      {loading ? (
        <div className="space-y-3">{[1,2].map(i => <div key={i} className="h-20 rounded-2xl bg-card animate-pulse border border-border" />)}</div>
      ) : counts.length === 0 ? (
        <div className="p-12 text-center text-muted-foreground"><ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-30" />هنوز شمارشی انجام نشده</div>
      ) : (
        <div className="space-y-3">
          {counts.map(count => {
            const progress = countItems(count);
            const isExpanded = expandedId === count.id;
            const editCount = editingCount?.id === count.id ? editingCount : count;
            const discrepancies = editCount.items.filter(i => i.difference !== null && i.difference !== 0).length;
            return (
              <motion.div key={count.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="rounded-2xl bg-card border border-border overflow-hidden">
                <div className="p-4 flex items-center gap-4 cursor-pointer" onClick={() => { setExpandedId(isExpanded ? null : count.id); if (!isExpanded) setEditingCount(count); }}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-foreground">{count.name}</span>
                      <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", STATUS_MAP[count.status]?.color)}>{STATUS_MAP[count.status]?.label}</span>
                      {discrepancies > 0 && <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-xs"><AlertTriangle className="w-3 h-3" />{discrepancies} مغایرت</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${progress.percent}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground">{progress.filled}/{progress.total} تایید شده</span>
                      <span className="text-xs text-muted-foreground">{new Date(count.date).toLocaleDateString("fa-IR")}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {count.status !== "completed" && (
                      <button onClick={e => { e.stopPropagation(); handleDelete(count.id); }}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400"><X className="w-4 h-4" /></button>
                    )}
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </div>
                </div>
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      className="border-t border-border overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-muted/50">
                            <tr>{["کالا","SKU","واحد","موجودی سیستم","موجودی شمارش","اختلاف"].map(h => (
                              <th key={h} className="text-right px-4 py-2.5 text-muted-foreground font-medium">{h}</th>
                            ))}</tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {editCount.items.map(item => (
                              <tr key={item.itemId} className={cn("hover:bg-muted/20", item.difference !== null && item.difference !== 0 && "bg-amber-500/5")}>
                                <td className="px-4 py-2.5 font-medium text-foreground">{item.name}</td>
                                <td className="px-4 py-2.5 text-muted-foreground font-mono text-xs">{item.sku || "—"}</td>
                                <td className="px-4 py-2.5 text-muted-foreground">{item.unit}</td>
                                <td className="px-4 py-2.5 text-foreground">{item.systemQty}</td>
                                <td className="px-4 py-2.5">
                                  {count.status === "completed" ? (
                                    <span className="text-foreground">{item.countedQty ?? "—"}</span>
                                  ) : (
                                    <input type="number" value={item.countedQty ?? ""} onChange={e => handleUpdateQty(item.itemId, e.target.value)}
                                      placeholder="وارد کنید"
                                      className="w-24 px-2 py-1 rounded-lg bg-background border border-border text-sm text-foreground" />
                                  )}
                                </td>
                                <td className="px-4 py-2.5">
                                  {item.difference !== null ? (
                                    <span className={cn("font-semibold", item.difference > 0 ? "text-emerald-400" : item.difference < 0 ? "text-red-400" : "text-muted-foreground")}>
                                      {item.difference > 0 ? "+" : ""}{item.difference}
                                    </span>
                                  ) : <span className="text-muted-foreground">—</span>}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {count.status !== "completed" && (
                        <div className="p-4 border-t border-border flex items-center justify-end gap-3">
                          <button onClick={() => handleSaveCount(false)} disabled={saving}
                            className="px-4 py-2 rounded-xl border border-border text-sm text-foreground hover:bg-muted disabled:opacity-60">ذخیره پیش‌نویس</button>
                          <button onClick={() => handleSaveCount(true)} disabled={saving}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-brand text-black text-sm font-semibold gold-glow disabled:opacity-60">
                            <Check className="w-4 h-4" />تکمیل و اعمال اصلاحیه
                          </button>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-sm bg-card border border-border rounded-2xl p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between"><h3 className="font-bold text-foreground">شمارش موجودی جدید</h3><button onClick={() => setShowModal(false)}><X className="w-4 h-4 text-muted-foreground" /></button></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">نام شمارش *</label>
              <input value={newForm.name} onChange={e => setNewForm(p => ({ ...p, name: e.target.value }))} placeholder="مثلاً: شمارش پایان ماه"
                className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-foreground text-sm" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">مسئول</label>
              <input value={newForm.conductedBy} onChange={e => setNewForm(p => ({ ...p, conductedBy: e.target.value }))} placeholder="نام مسئول شمارش"
                className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-foreground text-sm" /></div>
            <div><label className="text-xs text-muted-foreground mb-1 block">یادداشت</label>
              <textarea value={newForm.notes} onChange={e => setNewForm(p => ({ ...p, notes: e.target.value }))} rows={2}
                className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-foreground text-sm resize-none" /></div>
            <p className="text-xs text-muted-foreground">تمام کالاهای فعال انبار به صورت خودکار بارگذاری می‌شوند.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl border border-border bg-muted text-foreground text-sm">انصراف</button>
              <button onClick={handleCreate} disabled={saving} className="flex-1 py-2.5 rounded-xl gradient-brand text-black font-semibold text-sm gold-glow disabled:opacity-60">{saving ? "ایجاد..." : "ایجاد"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
