"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Layers, Plus, Search, Trash2, Pencil, X, Package } from "lucide-react";
import { StatCard } from "@/components/common/StatCard";
import { apiClient } from "@/lib/api/client";
import { toast } from "sonner";

interface BOMItem { id: string; productName: string; materialName: string; quantity: number; unit: string; unitCost: number; notes?: string; productionOrderId?: string; }

const UNITS = ["عدد", "کیلوگرم", "گرم", "متر", "لیتر", "بسته", "رول", "جفت"];

export default function BOMPage() {
  const [items, setItems] = useState<BOMItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<BOMItem | undefined>();
  const [form, setForm] = useState({ productName: "", materialName: "", quantity: 1, unit: "عدد", unitCost: 0, notes: "" });

  const load = useCallback(async () => {
    try {
      const r = await apiClient.get("/manufacturing/bom");
      setItems(r.data.data ?? []);
    } catch { toast.error("خطا در بارگذاری"); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    try {
      if (editing) await apiClient.put(`/manufacturing/bom/${editing.id}`, form);
      else await apiClient.post("/manufacturing/bom", form);
      toast.success("ذخیره شد"); setShowModal(false); setEditing(undefined); load();
    } catch { toast.error("خطا"); }
  };

  const del = async (id: string) => {
    if (!confirm("حذف؟")) return;
    try { await apiClient.delete(`/manufacturing/bom/${id}`); toast.success("حذف شد"); load(); } catch { /**/ }
  };

  const open = (item?: BOMItem) => {
    setEditing(item);
    setForm(item ? { productName: item.productName, materialName: item.materialName, quantity: item.quantity, unit: item.unit, unitCost: item.unitCost, notes: item.notes ?? "" } : { productName: "", materialName: "", quantity: 1, unit: "عدد", unitCost: 0, notes: "" });
    setShowModal(true);
  };

  const filtered = items.filter(i => !search || i.productName.includes(search) || i.materialName.includes(search));
  const totalMaterials = new Set(items.map(i => i.materialName)).size;
  const totalProducts = new Set(items.map(i => i.productName)).size;

  const inp = "w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary";

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Layers className="w-6 h-6 text-primary" />فهرست مواد اولیه (BOM)</h1>
        <button onClick={() => open()} className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-brand text-black text-sm font-semibold"><Plus className="w-4 h-4" /> ماده اولیه جدید</button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard title="کل رکوردها" value={items.length} icon={Layers} color="violet" />
        <StatCard title="محصولات تعریف‌شده" value={totalProducts} icon={Package} color="blue" />
        <StatCard title="مواد اولیه یکتا" value={totalMaterials} icon={Package} color="emerald" />
      </div>

      <div className="glass rounded-2xl border border-border p-4">
        <div className="flex gap-3 mb-4">
          <div className="relative flex-1"><Search className="absolute right-3 top-2.5 w-4 h-4 text-muted-foreground" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="جستجو..." className={`${inp} pr-9`} /></div>
        </div>

        {loading ? <p className="text-center text-muted-foreground py-12">در حال بارگذاری...</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border text-muted-foreground text-right">
                <th className="pb-3 pr-2">محصول</th><th className="pb-3">ماده اولیه</th><th className="pb-3">مقدار</th><th className="pb-3">واحد</th><th className="pb-3">هزینه واحد</th><th className="pb-3">یادداشت</th><th className="pb-3"></th>
              </tr></thead>
              <tbody className="divide-y divide-border">
                {filtered.map(item => (
                  <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                    <td className="py-3 pr-2 font-medium">{item.productName}</td>
                    <td className="py-3 text-muted-foreground">{item.materialName}</td>
                    <td className="py-3">{item.quantity}</td>
                    <td className="py-3">{item.unit}</td>
                    <td className="py-3">{item.unitCost > 0 ? item.unitCost.toLocaleString() : "—"}</td>
                    <td className="py-3 text-muted-foreground text-xs max-w-[200px] truncate">{item.notes ?? "—"}</td>
                    <td className="py-3">
                      <div className="flex gap-1">
                        <button onClick={() => open(item)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={() => del(item.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!filtered.length && <tr><td colSpan={7} className="py-12 text-center text-muted-foreground">رکوردی یافت نشد</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="glass rounded-2xl border border-border w-full max-w-lg p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">{editing ? "ویرایش ماده اولیه" : "ماده اولیه جدید"}</h2>
                <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2"><label className="text-xs text-muted-foreground mb-1 block">نام محصول</label><input value={form.productName} onChange={e => setForm({ ...form, productName: e.target.value })} className={inp} placeholder="مثلاً: صندلی اداری" /></div>
                <div className="col-span-2"><label className="text-xs text-muted-foreground mb-1 block">ماده اولیه</label><input value={form.materialName} onChange={e => setForm({ ...form, materialName: e.target.value })} className={inp} placeholder="مثلاً: فولاد گالوانیزه" /></div>
                <div><label className="text-xs text-muted-foreground mb-1 block">مقدار</label><input type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: +e.target.value })} className={inp} /></div>
                <div><label className="text-xs text-muted-foreground mb-1 block">واحد</label><select value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} className={inp}>{UNITS.map(u => <option key={u}>{u}</option>)}</select></div>
                <div><label className="text-xs text-muted-foreground mb-1 block">هزینه واحد (ریال)</label><input type="number" value={form.unitCost} onChange={e => setForm({ ...form, unitCost: +e.target.value })} className={inp} /></div>
                <div><label className="text-xs text-muted-foreground mb-1 block">یادداشت</label><input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className={inp} /></div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={save} className="flex-1 py-2.5 rounded-xl gradient-brand text-black text-sm font-semibold">ذخیره</button>
                <button onClick={() => setShowModal(false)} className="px-4 py-2.5 rounded-xl border border-border text-sm">انصراف</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
