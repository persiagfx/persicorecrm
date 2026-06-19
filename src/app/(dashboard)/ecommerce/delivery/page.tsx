"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Truck, Plus, Search, MapPin, CheckCircle2, Clock, AlertTriangle, X, Pencil, Trash2 } from "lucide-react";
import { toJalali } from "@/lib/utils";
import { StatCard } from "@/components/common/StatCard";
import { apiClient } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Delivery { id: string; deliveryNumber: string; orderId?: string; orderNumber?: string; customerName: string; deliveryAddress: string; courierName?: string; courierPhone?: string; trackingCode?: string; scheduledDate?: string; deliveredAt?: string; status: "pending"|"assigned"|"picked_up"|"in_transit"|"delivered"|"failed"|"returned"; notes?: string; }

const STATUS_CFG = { pending: { label: "در انتظار", color: "text-gray-400 bg-gray-500/10" }, assigned: { label: "تخصیص داده شد", color: "text-blue-400 bg-blue-500/10" }, picked_up: { label: "تحویل گرفته شد", color: "text-violet-400 bg-violet-500/10" }, in_transit: { label: "در راه", color: "text-amber-400 bg-amber-500/10" }, delivered: { label: "تحویل داده شد", color: "text-emerald-400 bg-emerald-500/10" }, failed: { label: "ناموفق", color: "text-red-400 bg-red-500/10" }, returned: { label: "مرجوعی", color: "text-orange-400 bg-orange-500/10" } };

export default function DeliveryPage() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<Delivery | undefined>();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Delivery | undefined>();
  const [form, setForm] = useState({ deliveryNumber: "", orderNumber: "", customerName: "", deliveryAddress: "", courierName: "", courierPhone: "", trackingCode: "", scheduledDate: "", status: "pending" as Delivery["status"], notes: "" });

  const load = useCallback(async () => { try { const r = await apiClient.get("/ecommerce/deliveries"); setDeliveries(r.data.data ?? []); } catch { toast.error("خطا"); } finally { setLoading(false); } }, []);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    try {
      if (editing) await apiClient.put(`/ecommerce/deliveries/${editing.id}`, form); else await apiClient.post("/ecommerce/deliveries", form);
      toast.success("ذخیره شد"); setShowModal(false); setEditing(undefined); load();
    } catch { toast.error("خطا"); }
  };
  const del = async (id: string) => { if (!confirm("حذف؟")) return; try { await apiClient.delete(`/ecommerce/deliveries/${id}`); toast.success("حذف شد"); if (selected?.id === id) setSelected(undefined); load(); } catch { /**/ } };
  const open = (d?: Delivery) => { setEditing(d); setForm(d ? { deliveryNumber: d.deliveryNumber, orderNumber: d.orderNumber ?? "", customerName: d.customerName, deliveryAddress: d.deliveryAddress, courierName: d.courierName ?? "", courierPhone: d.courierPhone ?? "", trackingCode: d.trackingCode ?? "", scheduledDate: d.scheduledDate ?? "", status: d.status, notes: d.notes ?? "" } : { deliveryNumber: `DEL-${Date.now().toString().slice(-6)}`, orderNumber: "", customerName: "", deliveryAddress: "", courierName: "", courierPhone: "", trackingCode: "", scheduledDate: "", status: "pending", notes: "" }); setShowModal(true); };

  const filtered = deliveries.filter(d => { if (statusFilter !== "all" && d.status !== statusFilter) return false; if (search && !d.deliveryNumber.includes(search) && !d.customerName.includes(search) && !(d.trackingCode ?? "").includes(search)) return false; return true; });

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold flex items-center gap-2"><Truck className="w-6 h-6 text-primary" />مدیریت تحویل</h1></div>
        <button onClick={() => open()} className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-brand text-black text-sm font-semibold"><Plus className="w-4 h-4" /> تحویل جدید</button>
      </div>
      <div className="grid grid-cols-4 gap-4">
        <StatCard title="کل تحویل‌ها" value={deliveries.length} icon={Truck} color="blue" />
        <StatCard title="در راه" value={deliveries.filter(d => d.status === "in_transit").length} icon={Truck} color="amber" />
        <StatCard title="تحویل داده شده" value={deliveries.filter(d => d.status === "delivered").length} icon={CheckCircle2} color="green" />
        <StatCard title="ناموفق" value={deliveries.filter(d => d.status === "failed").length} icon={AlertTriangle} color="red" />
      </div>
      <div className="flex gap-3">
        <div className="relative flex-1"><Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="جستجو..." className="w-full pe-10 ps-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" /></div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary">
          <option value="all">همه وضعیت‌ها</option>
          {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>
      <div className="flex gap-5">
        <div className="flex-1 glass rounded-2xl border border-border overflow-hidden">
          {loading ? <div className="p-12 text-center text-muted-foreground">در حال بارگذاری...</div> : filtered.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground"><Truck className="w-10 h-10 mx-auto mb-3 opacity-30" /><p>تحویلی یافت نشد</p></div>
          ) : (
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border">{["شماره", "مشتری", "پیک", "کد رهگیری", "تاریخ برنامه", "وضعیت", ""].map(h => <th key={h} className="text-right p-4 text-muted-foreground font-medium">{h}</th>)}</tr></thead>
              <tbody>
                {filtered.map(d => (
                  <tr key={d.id} onClick={() => setSelected(d)} className={cn("border-b border-border hover:bg-muted/30 transition-colors cursor-pointer", selected?.id === d.id && "bg-muted/50")}>
                    <td className="p-4 font-mono text-xs">{d.deliveryNumber}</td>
                    <td className="p-4"><p className="font-medium">{d.customerName}</p><p className="text-xs text-muted-foreground truncate max-w-[160px]">{d.deliveryAddress}</p></td>
                    <td className="p-4 text-muted-foreground">{d.courierName ?? "—"}</td>
                    <td className="p-4 font-mono text-xs text-muted-foreground">{d.trackingCode ?? "—"}</td>
                    <td className="p-4 text-muted-foreground whitespace-nowrap">{d.scheduledDate ? toJalali(d.scheduledDate) : "—"}</td>
                    <td className="p-4"><span className={cn("px-2.5 py-1 rounded-full text-xs font-medium", STATUS_CFG[d.status].color)}>{STATUS_CFG[d.status].label}</span></td>
                    <td className="p-4"><div className="flex gap-1"><button onClick={e => { e.stopPropagation(); open(d); }} className="p-1.5 rounded-lg hover:bg-muted"><Pencil className="w-3.5 h-3.5 text-muted-foreground" /></button><button onClick={e => { e.stopPropagation(); del(d.id); }} className="p-1.5 rounded-lg hover:bg-destructive/10"><Trash2 className="w-3.5 h-3.5 text-destructive" /></button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {selected && (
          <div className="w-72 shrink-0 glass rounded-2xl border border-border p-5 space-y-4">
            <div className="flex items-center justify-between"><p className="font-mono text-sm">{selected.deliveryNumber}</p><button onClick={() => setSelected(undefined)}><X className="w-4 h-4 text-muted-foreground" /></button></div>
            <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium inline-block", STATUS_CFG[selected.status].color)}>{STATUS_CFG[selected.status].label}</span>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">مشتری</span><span>{selected.customerName}</span></div>
              {selected.orderNumber && <div className="flex justify-between"><span className="text-muted-foreground">سفارش</span><span className="font-mono text-xs">{selected.orderNumber}</span></div>}
              {selected.courierName && <div className="flex justify-between"><span className="text-muted-foreground">پیک</span><span>{selected.courierName}</span></div>}
              {selected.courierPhone && <div className="flex justify-between"><span className="text-muted-foreground">تلفن پیک</span><span dir="ltr">{selected.courierPhone}</span></div>}
              {selected.trackingCode && <div className="flex justify-between"><span className="text-muted-foreground">رهگیری</span><span className="font-mono text-xs">{selected.trackingCode}</span></div>}
              {selected.scheduledDate && <div className="flex justify-between"><span className="text-muted-foreground">برنامه</span><span>{toJalali(selected.scheduledDate)}</span></div>}
              {selected.deliveredAt && <div className="flex justify-between"><span className="text-muted-foreground">تحویل</span><span>{toJalali(selected.deliveredAt)}</span></div>}
            </div>
            <div><p className="text-xs text-muted-foreground mb-1"><MapPin className="w-3 h-3 inline ml-1" />آدرس</p><p className="text-sm">{selected.deliveryAddress}</p></div>
            {selected.notes && <div className="text-xs text-muted-foreground border-t border-border pt-3">{selected.notes}</div>}
          </div>
        )}
      </div>
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="glass rounded-2xl p-6 w-full max-w-lg border border-border max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5"><h2 className="text-lg font-bold">{editing ? "ویرایش تحویل" : "تحویل جدید"}</h2><button onClick={() => setShowModal(false)}><X className="w-4 h-4" /></button></div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input placeholder="شماره تحویل" value={form.deliveryNumber} onChange={e => setForm(f => ({ ...f, deliveryNumber: e.target.value }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                  <input placeholder="شماره سفارش" value={form.orderNumber} onChange={e => setForm(f => ({ ...f, orderNumber: e.target.value }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                </div>
                <input placeholder="نام مشتری *" value={form.customerName} onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))} className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                <textarea placeholder="آدرس تحویل *" value={form.deliveryAddress} onChange={e => setForm(f => ({ ...f, deliveryAddress: e.target.value }))} rows={2} className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary resize-none" />
                <div className="grid grid-cols-2 gap-3">
                  <input placeholder="نام پیک" value={form.courierName} onChange={e => setForm(f => ({ ...f, courierName: e.target.value }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                  <input placeholder="تلفن پیک" value={form.courierPhone} onChange={e => setForm(f => ({ ...f, courierPhone: e.target.value }))} dir="ltr" className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                </div>
                <input placeholder="کد رهگیری" value={form.trackingCode} onChange={e => setForm(f => ({ ...f, trackingCode: e.target.value }))} dir="ltr" className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-xs text-muted-foreground mb-1">تاریخ برنامه‌ریزی</label><input type="date" value={form.scheduledDate} onChange={e => setForm(f => ({ ...f, scheduledDate: e.target.value }))} className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" /></div>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as Delivery["status"] }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary self-end">
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
