"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Trash2, Plus, Search, X, Pencil } from "lucide-react";
import { formatPrice, toJalali } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { StatCard } from "@/components/common/StatCard";
import { apiClient } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface WasteRecord { id: string; productionOrderRef?: string; productName: string; wasteType: "raw_material"|"finished"|"packaging"|"chemical"|"other"; quantityKg: number; unitCostPerKg: number; disposalMethod: "recycle"|"landfill"|"incinerate"|"sell"; notes?: string; createdAt: string; }

const WASTE_LABEL = { raw_material: "مواد اولیه", finished: "محصول نهایی", packaging: "بسته‌بندی", chemical: "شیمیایی", other: "سایر" };
const DISPOSAL_LABEL = { recycle: "بازیافت", landfill: "دفن", incinerate: "سوزاندن", sell: "فروش" };
const COLORS = ["#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

export default function WastePage() {
  const [records, setRecords] = useState<WasteRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<WasteRecord | undefined>();
  const [form, setForm] = useState({ productionOrderRef: "", productName: "", wasteType: "raw_material" as WasteRecord["wasteType"], quantityKg: 0, unitCostPerKg: 0, disposalMethod: "recycle" as WasteRecord["disposalMethod"], notes: "" });

  const load = useCallback(async () => { try { const r = await apiClient.get("/manufacturing/waste-records"); setRecords(r.data.data ?? []); } catch { toast.error("خطا"); } finally { setLoading(false); } }, []);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    try {
      if (editing) await apiClient.put(`/manufacturing/waste-records/${editing.id}`, form); else await apiClient.post("/manufacturing/waste-records", form);
      toast.success("ذخیره شد"); setShowModal(false); setEditing(undefined); load();
    } catch { toast.error("خطا"); }
  };

  const del = async (id: string) => { if (!confirm("حذف؟")) return; try { await apiClient.delete(`/manufacturing/waste-records/${id}`); toast.success("حذف شد"); load(); } catch { /**/ } };
  const open = (r?: WasteRecord) => { setEditing(r); setForm(r ? { productionOrderRef: r.productionOrderRef ?? "", productName: r.productName, wasteType: r.wasteType, quantityKg: r.quantityKg, unitCostPerKg: r.unitCostPerKg, disposalMethod: r.disposalMethod, notes: r.notes ?? "" } : { productionOrderRef: "", productName: "", wasteType: "raw_material", quantityKg: 0, unitCostPerKg: 0, disposalMethod: "recycle", notes: "" }); setShowModal(true); };

  const totalKg = records.reduce((a, r) => a + r.quantityKg, 0);
  const totalCost = records.reduce((a, r) => a + r.quantityKg * r.unitCostPerKg, 0);
  const recycled = records.filter(r => r.disposalMethod === "recycle").reduce((a, r) => a + r.quantityKg, 0);
  const filtered = records.filter(r => !search || r.productName.includes(search));

  const byType = Object.entries(WASTE_LABEL).map(([k, label]) => ({ name: label, value: records.filter(r => r.wasteType === k).reduce((a, r) => a + r.quantityKg, 0) })).filter(d => d.value > 0);
  const byMonth = records.reduce<Record<string, number>>((acc, r) => { const m = r.createdAt.slice(0, 7); acc[m] = (acc[m] ?? 0) + r.quantityKg; return acc; }, {});
  const monthData = Object.entries(byMonth).sort().slice(-6).map(([m, kg]) => ({ month: m.slice(5), kg }));

  return (
    <div className="p-6 space-y-5 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold flex items-center gap-2"><Trash2 className="w-6 h-6 text-primary" />مدیریت ضایعات</h1></div>
        <button onClick={() => open()} className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-brand text-black text-sm font-semibold"><Plus className="w-4 h-4" /> ثبت ضایعات</button>
      </div>
      <div className="grid grid-cols-4 gap-4">
        <StatCard title="کل ضایعات (کگ)" value={`${totalKg.toFixed(1)}`} icon={Trash2} color="red" />
        <StatCard title="هزینه ضایعات" value={formatPrice(totalCost)} icon={Trash2} color="amber" />
        <StatCard title="بازیافت شده (کگ)" value={`${recycled.toFixed(1)}`} icon={Trash2} color="green" />
        <StatCard title="رکوردها" value={records.length} icon={Trash2} color="blue" />
      </div>
      <div className="grid grid-cols-2 gap-5">
        <div className="glass rounded-2xl border border-border p-5">
          <h3 className="font-semibold mb-4 text-sm">ضایعات ماهانه (کگ)</h3>
          {monthData.length === 0 ? <p className="text-muted-foreground text-sm text-center py-8">داده‌ای وجود ندارد</p> : <ResponsiveContainer width="100%" height={160}><BarChart data={monthData}><XAxis dataKey="month" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} /><Tooltip /><Bar dataKey="kg" fill="#ef4444" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer>}
        </div>
        <div className="glass rounded-2xl border border-border p-5">
          <h3 className="font-semibold mb-4 text-sm">ضایعات بر اساس نوع</h3>
          {byType.length === 0 ? <p className="text-muted-foreground text-sm text-center py-8">داده‌ای وجود ندارد</p> : <ResponsiveContainer width="100%" height={160}><PieChart><Pie data={byType} cx="50%" cy="50%" outerRadius={70} dataKey="value" nameKey="name">{byType.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer>}
        </div>
      </div>
      <div className="relative"><Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="جستجو..." className="w-full pe-10 ps-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" /></div>
      <div className="glass rounded-2xl border border-border overflow-hidden">
        {loading ? <div className="p-12 text-center text-muted-foreground">در حال بارگذاری...</div> : (
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border">{["محصول", "نوع", "مقدار (کگ)", "هزینه واحد", "روش دفع", "تاریخ", ""].map(h => <th key={h} className="text-right p-4 text-muted-foreground font-medium">{h}</th>)}</tr></thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                  <td className="p-4 font-medium">{r.productName}</td>
                  <td className="p-4"><span className="px-2 py-0.5 rounded-full text-xs bg-muted">{WASTE_LABEL[r.wasteType]}</span></td>
                  <td className="p-4">{r.quantityKg} کگ</td>
                  <td className="p-4 text-muted-foreground">{formatPrice(r.unitCostPerKg)}</td>
                  <td className="p-4"><span className="px-2 py-0.5 rounded-full text-xs bg-muted">{DISPOSAL_LABEL[r.disposalMethod]}</span></td>
                  <td className="p-4 text-muted-foreground">{toJalali(r.createdAt)}</td>
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
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="glass rounded-2xl p-6 w-full max-w-md border border-border">
              <div className="flex items-center justify-between mb-5"><h2 className="text-lg font-bold">{editing ? "ویرایش" : "ثبت ضایعات"}</h2><button onClick={() => setShowModal(false)}><X className="w-4 h-4" /></button></div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input placeholder="نام محصول *" value={form.productName} onChange={e => setForm(f => ({ ...f, productName: e.target.value }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                  <input placeholder="شماره سفارش" value={form.productionOrderRef} onChange={e => setForm(f => ({ ...f, productionOrderRef: e.target.value }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <select value={form.wasteType} onChange={e => setForm(f => ({ ...f, wasteType: e.target.value as WasteRecord["wasteType"] }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary">
                    {Object.entries(WASTE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                  <select value={form.disposalMethod} onChange={e => setForm(f => ({ ...f, disposalMethod: e.target.value as WasteRecord["disposalMethod"] }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary">
                    {Object.entries(DISPOSAL_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input type="number" placeholder="مقدار (کگ)" value={form.quantityKg || ""} onChange={e => setForm(f => ({ ...f, quantityKg: Number(e.target.value) }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                  <input type="number" placeholder="هزینه واحد (تومان/کگ)" value={form.unitCostPerKg || ""} onChange={e => setForm(f => ({ ...f, unitCostPerKg: Number(e.target.value) }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
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
