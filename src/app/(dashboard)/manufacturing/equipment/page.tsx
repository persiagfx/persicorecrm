"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Wrench, Plus, Search, AlertTriangle, CheckCircle2, Settings, X, Pencil, Trash2, Calendar, Clock } from "lucide-react";
import { formatPrice, toJalali } from "@/lib/utils";
import { StatCard } from "@/components/common/StatCard";
import { apiClient } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Equipment { id: string; name: string; model?: string; serialNumber?: string; manufacturer?: string; purchaseDate?: string; location?: string; status: "running"|"idle"|"maintenance"|"decommissioned"; maintenanceIntervalDays?: number; nextMaintenanceDate?: string; notes?: string; }
interface MaintenanceRecord { id: string; equipmentId: string; date: string; maintenanceType: "preventive"|"corrective"|"emergency"; technician: string; cost: number; durationHours: number; description?: string; nextScheduled?: string; }

const STATUS_CFG = { running: { label: "در حال کار", color: "text-emerald-400 bg-emerald-500/10" }, idle: { label: "بیکار", color: "text-gray-400 bg-gray-500/10" }, maintenance: { label: "در تعمیر", color: "text-amber-400 bg-amber-500/10" }, decommissioned: { label: "متوقف", color: "text-red-400 bg-red-500/10" } };
const MT_LABEL = { preventive: "پیشگیرانه", corrective: "اصلاحی", emergency: "اضطراری" };

export default function EquipmentPage() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showEqModal, setShowEqModal] = useState(false);
  const [showMaintModal, setShowMaintModal] = useState(false);
  const [editingEq, setEditingEq] = useState<Equipment | undefined>();
  const [selectedEq, setSelectedEq] = useState<Equipment | null>(null);
  const [eqForm, setEqForm] = useState({ name: "", model: "", serialNumber: "", manufacturer: "", purchaseDate: "", location: "", status: "idle" as Equipment["status"], maintenanceIntervalDays: 90, notes: "" });
  const [mForm, setMForm] = useState({ date: new Date().toISOString().slice(0, 10), maintenanceType: "preventive" as "preventive"|"corrective"|"emergency", technician: "", cost: 0, durationHours: 1, description: "", nextScheduled: "" });

  const load = useCallback(async () => { try { const r = await apiClient.get("/manufacturing/equipment"); setEquipment(r.data.data ?? []); } catch { toast.error("خطا"); } finally { setLoading(false); } }, []);
  useEffect(() => { load(); }, [load]);

  const loadRecords = async (eqId: string) => { try { const r = await apiClient.get(`/manufacturing/maintenance-records?equipmentId=${eqId}`); setRecords(r.data.data ?? []); } catch { /**/ } };

  const saveEq = async () => {
    try {
      if (editingEq) await apiClient.put(`/manufacturing/equipment/${editingEq.id}`, eqForm); else await apiClient.post("/manufacturing/equipment", eqForm);
      toast.success("ذخیره شد"); setShowEqModal(false); setEditingEq(undefined); load();
    } catch { toast.error("خطا"); }
  };

  const saveMaint = async () => {
    try {
      await apiClient.post("/manufacturing/maintenance-records", { ...mForm, equipmentId: selectedEq?.id });
      toast.success("رکورد اضافه شد"); setShowMaintModal(false);
      if (selectedEq) loadRecords(selectedEq.id);
    } catch { toast.error("خطا"); }
  };

  const del = async (id: string) => { if (!confirm("حذف؟")) return; try { await apiClient.delete(`/manufacturing/equipment/${id}`); toast.success("حذف شد"); load(); } catch { /**/ } };
  const openEq = (e?: Equipment) => { setEditingEq(e); setEqForm(e ? { name: e.name, model: e.model ?? "", serialNumber: e.serialNumber ?? "", manufacturer: e.manufacturer ?? "", purchaseDate: e.purchaseDate ?? "", location: e.location ?? "", status: e.status, maintenanceIntervalDays: e.maintenanceIntervalDays ?? 90, notes: e.notes ?? "" } : { name: "", model: "", serialNumber: "", manufacturer: "", purchaseDate: "", location: "", status: "idle", maintenanceIntervalDays: 90, notes: "" }); setShowEqModal(true); };

  const today = new Date().toISOString().slice(0, 10);
  const overdueMaint = equipment.filter(e => e.nextMaintenanceDate && e.nextMaintenanceDate < today);
  const filtered = equipment.filter(e => !search || e.name.includes(search) || (e.location ?? "").includes(search));

  return (
    <div className="p-6 space-y-5 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold flex items-center gap-2"><Wrench className="w-6 h-6 text-primary" />ماشین‌آلات و تجهیزات</h1></div>
        <button onClick={() => openEq()} className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-brand text-black text-sm font-semibold"><Plus className="w-4 h-4" /> تجهیز جدید</button>
      </div>
      <div className="grid grid-cols-4 gap-4">
        <StatCard title="کل تجهیزات" value={equipment.length} icon={Wrench} color="blue" />
        <StatCard title="در حال کار" value={equipment.filter(e => e.status === "running").length} icon={CheckCircle2} color="green" />
        <StatCard title="در تعمیر" value={equipment.filter(e => e.status === "maintenance").length} icon={Settings} color="amber" />
        <StatCard title="تعمیر معوق" value={overdueMaint.length} icon={AlertTriangle} color="red" />
      </div>
      {overdueMaint.length > 0 && <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"><AlertTriangle className="w-4 h-4 shrink-0" /><span>{overdueMaint.length} تجهیز نیاز به تعمیر دارد: {overdueMaint.map(e => e.name).join("، ")}</span></div>}
      <div className="relative"><Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="جستجو..." className="w-full pe-10 ps-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" /></div>
      <div className="grid grid-cols-2 gap-4">
        {filtered.map(e => {
          const overdue = e.nextMaintenanceDate && e.nextMaintenanceDate < today;
          return (
            <motion.div key={e.id} layout className="glass rounded-2xl border border-border p-5">
              <div className="flex items-start justify-between mb-3">
                <div><h3 className="font-semibold">{e.name}</h3>{e.model && <p className="text-xs text-muted-foreground">{e.manufacturer} · {e.model}</p>}</div>
                <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium", STATUS_CFG[e.status].color)}>{STATUS_CFG[e.status].label}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                {e.location && <span className="text-muted-foreground">📍 {e.location}</span>}
                {e.nextMaintenanceDate && <span className={cn(overdue ? "text-red-400" : "text-muted-foreground")}>🔧 {toJalali(e.nextMaintenanceDate)}</span>}
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setSelectedEq(e); loadRecords(e.id); }} className="flex-1 py-1.5 rounded-lg border border-border text-xs hover:bg-muted">تاریخچه تعمیر</button>
                <button onClick={() => { setSelectedEq(e); setShowMaintModal(true); }} className="flex-1 py-1.5 rounded-lg bg-primary/10 text-primary text-xs hover:bg-primary/20">افزودن تعمیر</button>
                <button onClick={() => openEq(e)} className="p-1.5 rounded-lg hover:bg-muted"><Pencil className="w-3.5 h-3.5 text-muted-foreground" /></button>
                <button onClick={() => del(e.id)} className="p-1.5 rounded-lg hover:bg-destructive/10"><Trash2 className="w-3.5 h-3.5 text-destructive" /></button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Maintenance history panel */}
      <AnimatePresence>
        {selectedEq && !showMaintModal && (
          <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }} className="fixed top-0 left-0 h-full w-96 glass border-r border-border z-40 overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-5"><h2 className="font-bold">تاریخچه: {selectedEq.name}</h2><button onClick={() => setSelectedEq(null)}><X className="w-5 h-5" /></button></div>
            {records.length === 0 ? <p className="text-muted-foreground text-sm text-center py-8">تعمیری ثبت نشده</p> : (
              <div className="space-y-3">
                {records.map(r => (
                  <div key={r.id} className="p-3 rounded-xl bg-muted/50 border border-border/50 text-sm">
                    <div className="flex justify-between mb-1"><span className="font-medium">{MT_LABEL[r.maintenanceType]}</span><span className="text-muted-foreground">{toJalali(r.date)}</span></div>
                    <p className="text-muted-foreground text-xs">تکنسین: {r.technician} · {r.durationHours} ساعت · {formatPrice(r.cost)}</p>
                    {r.description && <p className="text-xs mt-1">{r.description}</p>}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Equipment Modal */}
      <AnimatePresence>
        {showEqModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setShowEqModal(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="glass rounded-2xl p-6 w-full max-w-lg border border-border max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5"><h2 className="text-lg font-bold">{editingEq ? "ویرایش تجهیز" : "تجهیز جدید"}</h2><button onClick={() => setShowEqModal(false)}><X className="w-4 h-4" /></button></div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input placeholder="نام *" value={eqForm.name} onChange={e => setEqForm(f => ({ ...f, name: e.target.value }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                  <input placeholder="مدل" value={eqForm.model} onChange={e => setEqForm(f => ({ ...f, model: e.target.value }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input placeholder="سازنده" value={eqForm.manufacturer} onChange={e => setEqForm(f => ({ ...f, manufacturer: e.target.value }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                  <input placeholder="شماره سریال" value={eqForm.serialNumber} onChange={e => setEqForm(f => ({ ...f, serialNumber: e.target.value }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input placeholder="مکان" value={eqForm.location} onChange={e => setEqForm(f => ({ ...f, location: e.target.value }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                  <select value={eqForm.status} onChange={e => setEqForm(f => ({ ...f, status: e.target.value as Equipment["status"] }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary">
                    {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-xs text-muted-foreground mb-1">تاریخ خرید</label><input type="date" value={eqForm.purchaseDate} onChange={e => setEqForm(f => ({ ...f, purchaseDate: e.target.value }))} className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" /></div>
                  <input type="number" placeholder="بازه تعمیر (روز)" value={eqForm.maintenanceIntervalDays} onChange={e => setEqForm(f => ({ ...f, maintenanceIntervalDays: Number(e.target.value) }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary mt-5" />
                </div>
                <textarea placeholder="یادداشت" value={eqForm.notes} onChange={e => setEqForm(f => ({ ...f, notes: e.target.value }))} rows={2} className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary resize-none" />
              </div>
              <div className="flex gap-3 mt-5"><button onClick={() => setShowEqModal(false)} className="flex-1 py-2.5 rounded-xl border border-border text-sm">انصراف</button><button onClick={saveEq} className="flex-[2] py-2.5 rounded-xl gradient-brand text-black text-sm font-semibold">ذخیره</button></div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Maintenance Modal */}
      <AnimatePresence>
        {showMaintModal && selectedEq && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setShowMaintModal(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="glass rounded-2xl p-6 w-full max-w-md border border-border">
              <div className="flex items-center justify-between mb-5"><h2 className="text-lg font-bold">افزودن تعمیر — {selectedEq.name}</h2><button onClick={() => setShowMaintModal(false)}><X className="w-4 h-4" /></button></div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input type="date" value={mForm.date} onChange={e => setMForm(f => ({ ...f, date: e.target.value }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                  <select value={mForm.maintenanceType} onChange={e => setMForm(f => ({ ...f, maintenanceType: e.target.value as "preventive"|"corrective"|"emergency" }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary">
                    {Object.entries(MT_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input placeholder="تکنسین" value={mForm.technician} onChange={e => setMForm(f => ({ ...f, technician: e.target.value }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                  <input type="number" placeholder="ساعت کار" value={mForm.durationHours} onChange={e => setMForm(f => ({ ...f, durationHours: Number(e.target.value) }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                </div>
                <input type="number" placeholder="هزینه (تومان)" value={mForm.cost || ""} onChange={e => setMForm(f => ({ ...f, cost: Number(e.target.value) }))} className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                <textarea placeholder="شرح عملیات" value={mForm.description} onChange={e => setMForm(f => ({ ...f, description: e.target.value }))} rows={2} className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary resize-none" />
                <div><label className="block text-xs text-muted-foreground mb-1">تعمیر بعدی</label><input type="date" value={mForm.nextScheduled} onChange={e => setMForm(f => ({ ...f, nextScheduled: e.target.value }))} className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" /></div>
              </div>
              <div className="flex gap-3 mt-5"><button onClick={() => setShowMaintModal(false)} className="flex-1 py-2.5 rounded-xl border border-border text-sm">انصراف</button><button onClick={saveMaint} className="flex-[2] py-2.5 rounded-xl gradient-brand text-black text-sm font-semibold">ذخیره</button></div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
