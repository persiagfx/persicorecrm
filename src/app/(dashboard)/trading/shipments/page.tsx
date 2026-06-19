"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Ship, Plus, Search, Truck, CheckCircle2, AlertTriangle, Clock, X, Pencil, Trash2, Package } from "lucide-react";
import { formatPrice, toJalali } from "@/lib/utils";
import { StatCard } from "@/components/common/StatCard";
import { apiClient } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Shipment { id: string; shipmentNumber: string; origin: string; destination: string; carrier: string; trackingNumber?: string; departureDate?: string; eta?: string; actualArrival?: string; totalWeight?: number; totalValue?: number; status: "preparing"|"in_transit"|"customs"|"delivered"|"delayed"; notes?: string; }

const STATUS_CFG = { preparing: { label: "آماده‌سازی", color: "text-blue-400 bg-blue-500/10" }, in_transit: { label: "در حمل", color: "text-amber-400 bg-amber-500/10" }, customs: { label: "گمرک", color: "text-violet-400 bg-violet-500/10" }, delivered: { label: "تحویل داده شد", color: "text-emerald-400 bg-emerald-500/10" }, delayed: { label: "تاخیر", color: "text-red-400 bg-red-500/10" } };
const CARRIERS = ["DHL", "FedEx", "ایران پست", "ملی", "Post", "سایر"];

export default function ShipmentsPage() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Shipment | undefined>();
  const [form, setForm] = useState({ shipmentNumber: "", origin: "", destination: "", carrier: CARRIERS[0], trackingNumber: "", departureDate: "", eta: "", totalWeight: 0, totalValue: 0, status: "preparing" as Shipment["status"], notes: "" });

  const load = useCallback(async () => { try { const r = await apiClient.get("/trading/shipments"); setShipments(r.data.data ?? []); } catch { toast.error("خطا"); } finally { setLoading(false); } }, []);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    try {
      if (editing) await apiClient.put(`/trading/shipments/${editing.id}`, form); else await apiClient.post("/trading/shipments", form);
      toast.success("ذخیره شد"); setShowModal(false); setEditing(undefined); load();
    } catch { toast.error("خطا"); }
  };
  const del = async (id: string) => { if (!confirm("حذف؟")) return; try { await apiClient.delete(`/trading/shipments/${id}`); toast.success("حذف شد"); load(); } catch { /**/ } };
  const open = (s?: Shipment) => { setEditing(s); setForm(s ? { shipmentNumber: s.shipmentNumber, origin: s.origin, destination: s.destination, carrier: s.carrier, trackingNumber: s.trackingNumber ?? "", departureDate: s.departureDate ?? "", eta: s.eta ?? "", totalWeight: s.totalWeight ?? 0, totalValue: s.totalValue ?? 0, status: s.status, notes: s.notes ?? "" } : { shipmentNumber: `SH-${Date.now().toString().slice(-6)}`, origin: "", destination: "", carrier: CARRIERS[0], trackingNumber: "", departureDate: "", eta: "", totalWeight: 0, totalValue: 0, status: "preparing", notes: "" }); setShowModal(true); };

  const filtered = shipments.filter(s => {
    if (statusFilter !== "all" && s.status !== statusFilter) return false;
    if (search && !s.shipmentNumber.includes(search) && !s.origin.includes(search) && !s.destination.includes(search)) return false;
    return true;
  });

  return (
    <div className="p-6 space-y-5 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold flex items-center gap-2"><Ship className="w-6 h-6 text-primary" />مدیریت محموله‌ها</h1></div>
        <button onClick={() => open()} className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-brand text-black text-sm font-semibold"><Plus className="w-4 h-4" /> محموله جدید</button>
      </div>
      <div className="grid grid-cols-4 gap-4">
        <StatCard title="کل محموله‌ها" value={shipments.length} icon={Ship} color="blue" />
        <StatCard title="در حمل" value={shipments.filter(s => s.status === "in_transit").length} icon={Truck} color="amber" />
        <StatCard title="تحویل داده شده" value={shipments.filter(s => s.status === "delivered").length} icon={CheckCircle2} color="green" />
        <StatCard title="تاخیر" value={shipments.filter(s => s.status === "delayed").length} icon={AlertTriangle} color="red" />
      </div>
      <div className="flex gap-3">
        <div className="relative flex-1"><Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="جستجو..." className="w-full pe-10 ps-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" /></div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary">
          <option value="all">همه وضعیت‌ها</option>
          {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>
      <div className="glass rounded-2xl border border-border overflow-hidden">
        {loading ? <div className="p-12 text-center text-muted-foreground">در حال بارگذاری...</div> : filtered.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground"><Ship className="w-10 h-10 mx-auto mb-3 opacity-30" /><p>محموله‌ای یافت نشد</p></div>
        ) : (
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border">{["شماره", "مسیر", "حامل", "کد رهگیری", "تاریخ ارسال", "ETA", "ارزش", "وضعیت", ""].map(h => <th key={h} className="text-right p-4 text-muted-foreground font-medium whitespace-nowrap">{h}</th>)}</tr></thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                  <td className="p-4 font-mono text-xs">{s.shipmentNumber}</td>
                  <td className="p-4"><p className="font-medium">{s.origin} → {s.destination}</p></td>
                  <td className="p-4 text-muted-foreground">{s.carrier}</td>
                  <td className="p-4 font-mono text-xs text-muted-foreground">{s.trackingNumber ?? "—"}</td>
                  <td className="p-4 text-muted-foreground whitespace-nowrap">{s.departureDate ? toJalali(s.departureDate) : "—"}</td>
                  <td className="p-4 text-muted-foreground whitespace-nowrap">{s.eta ? toJalali(s.eta) : "—"}</td>
                  <td className="p-4 text-muted-foreground">{s.totalValue ? formatPrice(s.totalValue) : "—"}</td>
                  <td className="p-4"><span className={cn("px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap", STATUS_CFG[s.status].color)}>{STATUS_CFG[s.status].label}</span></td>
                  <td className="p-4"><div className="flex gap-1"><button onClick={() => open(s)} className="p-1.5 rounded-lg hover:bg-muted"><Pencil className="w-3.5 h-3.5 text-muted-foreground" /></button><button onClick={() => del(s.id)} className="p-1.5 rounded-lg hover:bg-destructive/10"><Trash2 className="w-3.5 h-3.5 text-destructive" /></button></div></td>
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
              <div className="flex items-center justify-between mb-5"><h2 className="text-lg font-bold">{editing ? "ویرایش محموله" : "محموله جدید"}</h2><button onClick={() => setShowModal(false)}><X className="w-4 h-4" /></button></div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input placeholder="شماره محموله" value={form.shipmentNumber} onChange={e => setForm(f => ({ ...f, shipmentNumber: e.target.value }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                  <select value={form.carrier} onChange={e => setForm(f => ({ ...f, carrier: e.target.value }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary">
                    {CARRIERS.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input placeholder="مبدأ" value={form.origin} onChange={e => setForm(f => ({ ...f, origin: e.target.value }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                  <input placeholder="مقصد" value={form.destination} onChange={e => setForm(f => ({ ...f, destination: e.target.value }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                </div>
                <input placeholder="کد رهگیری" value={form.trackingNumber} onChange={e => setForm(f => ({ ...f, trackingNumber: e.target.value }))} dir="ltr" className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-xs text-muted-foreground mb-1">تاریخ ارسال</label><input type="date" value={form.departureDate} onChange={e => setForm(f => ({ ...f, departureDate: e.target.value }))} className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" /></div>
                  <div><label className="block text-xs text-muted-foreground mb-1">تاریخ تحویل تخمینی</label><input type="date" value={form.eta} onChange={e => setForm(f => ({ ...f, eta: e.target.value }))} className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input type="number" placeholder="وزن کل (کگ)" value={form.totalWeight || ""} onChange={e => setForm(f => ({ ...f, totalWeight: Number(e.target.value) }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                  <input type="number" placeholder="ارزش کل (تومان)" value={form.totalValue || ""} onChange={e => setForm(f => ({ ...f, totalValue: Number(e.target.value) }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                </div>
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as Shipment["status"] }))} className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary">
                  {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
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
