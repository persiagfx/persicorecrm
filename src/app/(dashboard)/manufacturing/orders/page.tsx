"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ClipboardList, Plus, Search, AlertCircle, CheckCircle2, Clock, X, Pencil, Trash2, Factory } from "lucide-react";
import { toJalali } from "@/lib/utils";
import { StatCard } from "@/components/common/StatCard";
import { apiClient } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Order { id: string; orderNumber: string; productName: string; productionLineId?: string; quantityOrdered: number; quantityProduced: number; startDate?: string; dueDate?: string; status: "planned"|"in_progress"|"completed"|"cancelled"; priority: "low"|"medium"|"high"|"urgent"; notes?: string; }
interface BOMItem { materialName: string; quantity: number; unit: string; }

const STATUS_CFG = { planned: { label: "برنامه‌ریزی", color: "text-blue-400 bg-blue-500/10" }, in_progress: { label: "در حال تولید", color: "text-amber-400 bg-amber-500/10" }, completed: { label: "تکمیل", color: "text-emerald-400 bg-emerald-500/10" }, cancelled: { label: "لغو", color: "text-red-400 bg-red-500/10" } };
const PRI_CFG = { low: "text-gray-400", medium: "text-blue-400", high: "text-amber-400", urgent: "text-red-400" };
const PRI_LABEL = { low: "کم", medium: "متوسط", high: "زیاد", urgent: "فوری" };

export default function ManufacturingOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [lines, setLines] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Order | undefined>();
  const [bomItems, setBomItems] = useState<BOMItem[]>([{ materialName: "", quantity: 1, unit: "کیلوگرم" }]);
  const [form, setForm] = useState({ productName: "", productionLineId: "", quantityOrdered: 1, quantityProduced: 0, startDate: "", dueDate: "", status: "planned" as Order["status"], priority: "medium" as Order["priority"], notes: "" });

  const load = useCallback(async () => {
    try {
      const [or, lr] = await Promise.all([apiClient.get("/manufacturing/orders"), apiClient.get("/manufacturing/lines")]);
      setOrders(or.data.data ?? []); setLines(lr.data.data ?? []);
    } catch { toast.error("خطا"); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    try {
      const data = { ...form, bomItems: bomItems.filter(b => b.materialName.trim()) };
      if (editing) await apiClient.put(`/manufacturing/orders/${editing.id}`, data); else await apiClient.post("/manufacturing/orders", data);
      toast.success("ذخیره شد"); setShowModal(false); setEditing(undefined); load();
    } catch { toast.error("خطا"); }
  };

  const del = async (id: string) => { if (!confirm("حذف؟")) return; try { await apiClient.delete(`/manufacturing/orders/${id}`); toast.success("حذف شد"); load(); } catch { /**/ } };

  const open = (o?: Order) => {
    setEditing(o);
    setForm(o ? { productName: o.productName, productionLineId: o.productionLineId ?? "", quantityOrdered: o.quantityOrdered, quantityProduced: o.quantityProduced, startDate: o.startDate ?? "", dueDate: o.dueDate ?? "", status: o.status, priority: o.priority, notes: o.notes ?? "" } : { productName: "", productionLineId: "", quantityOrdered: 1, quantityProduced: 0, startDate: "", dueDate: "", status: "planned", priority: "medium", notes: "" });
    setBomItems([{ materialName: "", quantity: 1, unit: "کیلوگرم" }]);
    setShowModal(true);
  };

  const filtered = orders.filter(o => !search || o.productName.includes(search) || o.orderNumber.includes(search));

  return (
    <div className="p-6 space-y-5 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold flex items-center gap-2"><ClipboardList className="w-6 h-6 text-primary" />دستور تولید</h1></div>
        <button onClick={() => open()} className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-brand text-black text-sm font-semibold"><Plus className="w-4 h-4" /> دستور جدید</button>
      </div>
      <div className="grid grid-cols-4 gap-4">
        <StatCard title="کل سفارشات" value={orders.length} icon={ClipboardList} color="blue" />
        <StatCard title="در حال تولید" value={orders.filter(o => o.status === "in_progress").length} icon={Factory} color="amber" />
        <StatCard title="تکمیل شده" value={orders.filter(o => o.status === "completed").length} icon={CheckCircle2} color="green" />
        <StatCard title="تاخیر" value={orders.filter(o => o.dueDate && new Date(o.dueDate) < new Date() && o.status !== "completed").length} icon={AlertCircle} color="red" />
      </div>
      <div className="relative"><Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="جستجو..." className="w-full pe-10 ps-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" /></div>
      <div className="glass rounded-2xl border border-border overflow-hidden">
        {loading ? <div className="p-12 text-center text-muted-foreground">در حال بارگذاری...</div> : (
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border">{["شماره", "محصول", "مقدار", "تاریخ شروع", "موعد تحویل", "اولویت", "وضعیت", ""].map(h => <th key={h} className="text-right p-4 text-muted-foreground font-medium">{h}</th>)}</tr></thead>
            <tbody>
              {filtered.map(o => (
                <tr key={o.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                  <td className="p-4 font-mono text-xs">{o.orderNumber}</td>
                  <td className="p-4 font-medium">{o.productName}</td>
                  <td className="p-4">{o.quantityProduced}/{o.quantityOrdered}</td>
                  <td className="p-4 text-muted-foreground">{o.startDate ? toJalali(o.startDate) : "—"}</td>
                  <td className="p-4 text-muted-foreground">{o.dueDate ? toJalali(o.dueDate) : "—"}</td>
                  <td className="p-4"><span className={cn("text-xs font-medium", PRI_CFG[o.priority])}>{PRI_LABEL[o.priority]}</span></td>
                  <td className="p-4"><span className={cn("px-2.5 py-1 rounded-full text-xs font-medium", STATUS_CFG[o.status].color)}>{STATUS_CFG[o.status].label}</span></td>
                  <td className="p-4"><div className="flex gap-1"><button onClick={() => open(o)} className="p-1.5 rounded-lg hover:bg-muted"><Pencil className="w-3.5 h-3.5 text-muted-foreground" /></button><button onClick={() => del(o.id)} className="p-1.5 rounded-lg hover:bg-destructive/10"><Trash2 className="w-3.5 h-3.5 text-destructive" /></button></div></td>
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
              <div className="flex items-center justify-between mb-5"><h2 className="text-lg font-bold">{editing ? "ویرایش دستور" : "دستور تولید جدید"}</h2><button onClick={() => setShowModal(false)}><X className="w-4 h-4" /></button></div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input placeholder="نام محصول *" value={form.productName} onChange={e => setForm(f => ({ ...f, productName: e.target.value }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                  <select value={form.productionLineId} onChange={e => setForm(f => ({ ...f, productionLineId: e.target.value }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary">
                    <option value="">انتخاب خط تولید</option>
                    {lines.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input type="number" placeholder="مقدار سفارش" value={form.quantityOrdered} onChange={e => setForm(f => ({ ...f, quantityOrdered: Number(e.target.value) }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                  <input type="number" placeholder="تولید شده" value={form.quantityProduced} onChange={e => setForm(f => ({ ...f, quantityProduced: Number(e.target.value) }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                  <input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as Order["priority"] }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary">
                    {Object.entries(PRI_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as Order["status"] }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary">
                    {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-2">لیست مواد (BOM)</p>
                  {bomItems.map((b, i) => (
                    <div key={i} className="flex gap-2 mb-2">
                      <input placeholder="نام ماده" value={b.materialName} onChange={e => { const n = [...bomItems]; n[i].materialName = e.target.value; setBomItems(n); }} className="flex-1 px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                      <input type="number" placeholder="مقدار" value={b.quantity} onChange={e => { const n = [...bomItems]; n[i].quantity = Number(e.target.value); setBomItems(n); }} className="w-20 px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                      <button onClick={() => setBomItems(bomItems.filter((_, j) => j !== i))} className="p-2 rounded-lg hover:bg-destructive/10 text-destructive"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                  <button onClick={() => setBomItems([...bomItems, { materialName: "", quantity: 1, unit: "کیلوگرم" }])} className="text-xs text-primary hover:underline">+ افزودن ماده</button>
                </div>
              </div>
              <div className="flex gap-3 mt-5"><button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl border border-border text-sm">انصراف</button><button onClick={save} className="flex-[2] py-2.5 rounded-xl gradient-brand text-black text-sm font-semibold">ذخیره</button></div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
