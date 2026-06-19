"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Key, Plus, Search, AlertTriangle, CheckCircle2, X, Pencil, Trash2, Eye, EyeOff, Calendar } from "lucide-react";
import { formatPrice, toJalali } from "@/lib/utils";
import { StatCard } from "@/components/common/StatCard";
import { apiClient } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface License { id: string; softwareName: string; vendor: string; licenseKey?: string; licenseType: "perpetual"|"subscription"|"trial"; seats: number; usedSeats: number; purchaseDate?: string; expiryDate?: string; annualCost: number; assignedTo?: string; notes?: string; }

const TYPE_LABEL = { perpetual: "دائمی", subscription: "اشتراکی", trial: "آزمایشی" };

function daysUntil(date?: string) { if (!date) return null; const d = Math.ceil((new Date(date).getTime() - Date.now()) / 86400000); return d; }

export default function LicensesPage() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<License | undefined>();
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});
  const [form, setForm] = useState({ softwareName: "", vendor: "", licenseKey: "", licenseType: "subscription" as License["licenseType"], seats: 1, usedSeats: 0, purchaseDate: "", expiryDate: "", annualCost: 0, assignedTo: "", notes: "" });

  const load = useCallback(async () => { try { const r = await apiClient.get("/it/licenses"); setLicenses(r.data.data ?? []); } catch { toast.error("خطا"); } finally { setLoading(false); } }, []);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    try {
      if (editing) await apiClient.put(`/it/licenses/${editing.id}`, form); else await apiClient.post("/it/licenses", form);
      toast.success("ذخیره شد"); setShowModal(false); setEditing(undefined); load();
    } catch { toast.error("خطا"); }
  };

  const del = async (id: string) => { if (!confirm("حذف؟")) return; try { await apiClient.delete(`/it/licenses/${id}`); toast.success("حذف شد"); load(); } catch { /**/ } };
  const open = (l?: License) => { setEditing(l); setForm(l ? { softwareName: l.softwareName, vendor: l.vendor, licenseKey: l.licenseKey ?? "", licenseType: l.licenseType, seats: l.seats, usedSeats: l.usedSeats, purchaseDate: l.purchaseDate ?? "", expiryDate: l.expiryDate ?? "", annualCost: l.annualCost, assignedTo: l.assignedTo ?? "", notes: l.notes ?? "" } : { softwareName: "", vendor: "", licenseKey: "", licenseType: "subscription", seats: 1, usedSeats: 0, purchaseDate: "", expiryDate: "", annualCost: 0, assignedTo: "", notes: "" }); setShowModal(true); };

  const expiringSoon = licenses.filter(l => { const d = daysUntil(l.expiryDate); return d !== null && d >= 0 && d <= 30; });
  const expired = licenses.filter(l => { const d = daysUntil(l.expiryDate); return d !== null && d < 0; });
  const filtered = licenses.filter(l => !search || l.softwareName.toLowerCase().includes(search.toLowerCase()) || l.vendor.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6 space-y-5 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold flex items-center gap-2"><Key className="w-6 h-6 text-primary" />لایسنس نرم‌افزار</h1></div>
        <button onClick={() => open()} className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-brand text-black text-sm font-semibold"><Plus className="w-4 h-4" /> لایسنس جدید</button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <StatCard title="کل لایسنس‌ها" value={licenses.length} icon={Key} color="blue" />
        <StatCard title="منقضی شده" value={expired.length} icon={AlertTriangle} color="red" />
        <StatCard title="منقضی می‌شود (۳۰ روز)" value={expiringSoon.length} icon={Calendar} color="amber" />
        <StatCard title="هزینه سالانه" value={formatPrice(licenses.reduce((a, l) => a + l.annualCost, 0))} icon={Key} color="green" />
      </div>

      {expiringSoon.length > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{expiringSoon.length} لایسنس در ۳۰ روز آینده منقضی می‌شود: {expiringSoon.map(l => l.softwareName).join("، ")}</span>
        </div>
      )}

      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="جستجو..." className="w-full pe-10 ps-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
      </div>

      <div className="glass rounded-2xl border border-border overflow-hidden">
        {loading ? <div className="p-12 text-center text-muted-foreground">در حال بارگذاری...</div> : (
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border">{["نرم‌افزار", "نوع", "صندلی", "کلید لایسنس", "انقضا", "هزینه سالانه", ""].map(h => <th key={h} className="text-right p-4 text-muted-foreground font-medium">{h}</th>)}</tr></thead>
            <tbody>
              {filtered.map(l => {
                const days = daysUntil(l.expiryDate);
                const expColor = days === null ? "" : days < 0 ? "text-red-400" : days <= 30 ? "text-amber-400" : "text-muted-foreground";
                return (
                  <tr key={l.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                    <td className="p-4"><p className="font-medium">{l.softwareName}</p><p className="text-xs text-muted-foreground">{l.vendor}</p></td>
                    <td className="p-4"><span className="px-2 py-0.5 rounded-full text-xs bg-muted">{TYPE_LABEL[l.licenseType]}</span></td>
                    <td className="p-4">{l.usedSeats}/{l.seats}</td>
                    <td className="p-4">
                      {l.licenseKey ? (
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs">{showKey[l.id] ? l.licenseKey : "••••••••"}</span>
                          <button onClick={() => setShowKey(s => ({ ...s, [l.id]: !s[l.id] }))} className="text-muted-foreground hover:text-foreground">{showKey[l.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}</button>
                        </div>
                      ) : "—"}
                    </td>
                    <td className={cn("p-4", expColor)}>{l.expiryDate ? toJalali(l.expiryDate) : "دائمی"}</td>
                    <td className="p-4">{formatPrice(l.annualCost)}</td>
                    <td className="p-4">
                      <div className="flex gap-1">
                        <button onClick={() => open(l)} className="p-1.5 rounded-lg hover:bg-muted"><Pencil className="w-3.5 h-3.5 text-muted-foreground" /></button>
                        <button onClick={() => del(l.id)} className="p-1.5 rounded-lg hover:bg-destructive/10"><Trash2 className="w-3.5 h-3.5 text-destructive" /></button>
                      </div>
                    </td>
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
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="glass rounded-2xl p-6 w-full max-w-lg border border-border max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5"><h2 className="text-lg font-bold">{editing ? "ویرایش لایسنس" : "لایسنس جدید"}</h2><button onClick={() => setShowModal(false)}><X className="w-4 h-4" /></button></div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input placeholder="نام نرم‌افزار *" value={form.softwareName} onChange={e => setForm(f => ({ ...f, softwareName: e.target.value }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                  <input placeholder="تامین‌کننده" value={form.vendor} onChange={e => setForm(f => ({ ...f, vendor: e.target.value }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                </div>
                <input placeholder="کلید لایسنس" value={form.licenseKey} onChange={e => setForm(f => ({ ...f, licenseKey: e.target.value }))} dir="ltr" className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm font-mono focus:outline-none focus:border-primary" />
                <div className="grid grid-cols-3 gap-3">
                  <select value={form.licenseType} onChange={e => setForm(f => ({ ...f, licenseType: e.target.value as License["licenseType"] }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary">
                    {Object.entries(TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                  <input type="number" placeholder="صندلی" value={form.seats} onChange={e => setForm(f => ({ ...f, seats: Number(e.target.value) }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                  <input type="number" placeholder="استفاده شده" value={form.usedSeats} onChange={e => setForm(f => ({ ...f, usedSeats: Number(e.target.value) }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-xs text-muted-foreground mb-1">تاریخ خرید</label><input type="date" value={form.purchaseDate} onChange={e => setForm(f => ({ ...f, purchaseDate: e.target.value }))} className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" /></div>
                  <div><label className="block text-xs text-muted-foreground mb-1">تاریخ انقضا</label><input type="date" value={form.expiryDate} onChange={e => setForm(f => ({ ...f, expiryDate: e.target.value }))} className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input type="number" placeholder="هزینه سالانه (تومان)" value={form.annualCost || ""} onChange={e => setForm(f => ({ ...f, annualCost: Number(e.target.value) }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                  <input placeholder="اختصاص به تیم" value={form.assignedTo} onChange={e => setForm(f => ({ ...f, assignedTo: e.target.value }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
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
