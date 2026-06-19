"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CheckSquare2, Plus, Search, XCircle, CheckCircle2, AlertTriangle, X, Pencil, Trash2 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { StatCard } from "@/components/common/StatCard";
import { toJalali } from "@/lib/utils";
import { apiClient } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface QCheck { id: string; productionOrderRef?: string; productName: string; inspectorName: string; checkDate: string; result: "pass"|"fail"|"conditional"; defectType?: string; defectCount?: number; notes?: string; correctiveAction?: string; }

const RESULT_CFG = { pass: { label: "قبول", color: "text-emerald-400 bg-emerald-500/10" }, fail: { label: "رد", color: "text-red-400 bg-red-500/10" }, conditional: { label: "مشروط", color: "text-amber-400 bg-amber-500/10" } };
const DEFECT_TYPES = ["surface", "dimensional", "functional", "packaging", "other"];
const DEFECT_LABEL: Record<string, string> = { surface: "سطحی", dimensional: "ابعادی", functional: "عملکردی", packaging: "بسته‌بندی", other: "سایر" };

export default function QualityPage() {
  const [checks, setChecks] = useState<QCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<QCheck | undefined>();
  const [form, setForm] = useState({ productionOrderRef: "", productName: "", inspectorName: "", checkDate: new Date().toISOString().slice(0, 10), result: "pass" as QCheck["result"], defectType: "", defectCount: 0, notes: "", correctiveAction: "" });

  const load = useCallback(async () => { try { const r = await apiClient.get("/manufacturing/quality-checks"); setChecks(r.data.data ?? []); } catch { toast.error("خطا"); } finally { setLoading(false); } }, []);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    try {
      if (editing) await apiClient.put(`/manufacturing/quality-checks/${editing.id}`, form); else await apiClient.post("/manufacturing/quality-checks", form);
      toast.success("ذخیره شد"); setShowModal(false); setEditing(undefined); load();
    } catch { toast.error("خطا"); }
  };
  const del = async (id: string) => { if (!confirm("حذف؟")) return; try { await apiClient.delete(`/manufacturing/quality-checks/${id}`); toast.success("حذف شد"); load(); } catch { /**/ } };
  const open = (c?: QCheck) => { setEditing(c); setForm(c ? { productionOrderRef: c.productionOrderRef ?? "", productName: c.productName, inspectorName: c.inspectorName, checkDate: c.checkDate, result: c.result, defectType: c.defectType ?? "", defectCount: c.defectCount ?? 0, notes: c.notes ?? "", correctiveAction: c.correctiveAction ?? "" } : { productionOrderRef: "", productName: "", inspectorName: "", checkDate: new Date().toISOString().slice(0, 10), result: "pass", defectType: "", defectCount: 0, notes: "", correctiveAction: "" }); setShowModal(true); };

  const passRate = checks.length ? Math.round(checks.filter(c => c.result === "pass").length / checks.length * 100) : 0;
  const filtered = checks.filter(c => !search || c.productName.includes(search) || c.inspectorName.includes(search));
  const trendData = checks.slice(-14).map(c => ({ date: c.checkDate.slice(5), pass: c.result === "pass" ? 1 : 0, fail: c.result === "fail" ? 1 : 0 }));

  return (
    <div className="p-6 space-y-5 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold flex items-center gap-2"><CheckSquare2 className="w-6 h-6 text-primary" />کنترل کیفیت</h1></div>
        <button onClick={() => open()} className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-brand text-black text-sm font-semibold"><Plus className="w-4 h-4" /> بازرسی جدید</button>
      </div>
      <div className="grid grid-cols-4 gap-4">
        <StatCard title="کل بازرسی‌ها" value={checks.length} icon={CheckSquare2} color="blue" />
        <StatCard title="نرخ قبولی" value={`${passRate}%`} icon={CheckCircle2} color="green" />
        <StatCard title="رد شده" value={checks.filter(c => c.result === "fail").length} icon={XCircle} color="red" />
        <StatCard title="مشروط" value={checks.filter(c => c.result === "conditional").length} icon={AlertTriangle} color="amber" />
      </div>
      {trendData.length > 0 && (
        <div className="glass rounded-2xl border border-border p-5">
          <h3 className="font-semibold mb-4 text-sm">روند کیفیت (آخرین بازرسی‌ها)</h3>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={trendData}><XAxis dataKey="date" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} /><Tooltip /><Line type="monotone" dataKey="pass" stroke="#22c55e" name="قبول" dot={false} /><Line type="monotone" dataKey="fail" stroke="#ef4444" name="رد" dot={false} /></LineChart>
          </ResponsiveContainer>
        </div>
      )}
      <div className="relative"><Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="جستجو..." className="w-full pe-10 ps-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" /></div>
      <div className="glass rounded-2xl border border-border overflow-hidden">
        {loading ? <div className="p-12 text-center text-muted-foreground">در حال بارگذاری...</div> : (
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border">{["محصول", "بازرس", "تاریخ", "نتیجه", "نوع عیب", ""].map(h => <th key={h} className="text-right p-4 text-muted-foreground font-medium">{h}</th>)}</tr></thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                  <td className="p-4 font-medium">{c.productName}</td>
                  <td className="p-4 text-muted-foreground">{c.inspectorName}</td>
                  <td className="p-4 text-muted-foreground">{toJalali(c.checkDate)}</td>
                  <td className="p-4"><span className={cn("px-2.5 py-1 rounded-full text-xs font-medium", RESULT_CFG[c.result].color)}>{RESULT_CFG[c.result].label}</span></td>
                  <td className="p-4 text-muted-foreground">{c.defectType ? DEFECT_LABEL[c.defectType] ?? c.defectType : "—"}</td>
                  <td className="p-4"><div className="flex gap-1"><button onClick={() => open(c)} className="p-1.5 rounded-lg hover:bg-muted"><Pencil className="w-3.5 h-3.5 text-muted-foreground" /></button><button onClick={() => del(c.id)} className="p-1.5 rounded-lg hover:bg-destructive/10"><Trash2 className="w-3.5 h-3.5 text-destructive" /></button></div></td>
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
              <div className="flex items-center justify-between mb-5"><h2 className="text-lg font-bold">{editing ? "ویرایش بازرسی" : "بازرسی جدید"}</h2><button onClick={() => setShowModal(false)}><X className="w-4 h-4" /></button></div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input placeholder="نام محصول *" value={form.productName} onChange={e => setForm(f => ({ ...f, productName: e.target.value }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                  <input placeholder="نام بازرس *" value={form.inspectorName} onChange={e => setForm(f => ({ ...f, inspectorName: e.target.value }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input type="date" value={form.checkDate} onChange={e => setForm(f => ({ ...f, checkDate: e.target.value }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                  <select value={form.result} onChange={e => setForm(f => ({ ...f, result: e.target.value as QCheck["result"] }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary">
                    {Object.entries(RESULT_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                {form.result === "fail" && (
                  <div className="grid grid-cols-2 gap-3">
                    <select value={form.defectType} onChange={e => setForm(f => ({ ...f, defectType: e.target.value }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary">
                      <option value="">نوع عیب</option>
                      {DEFECT_TYPES.map(d => <option key={d} value={d}>{DEFECT_LABEL[d]}</option>)}
                    </select>
                    <input type="number" placeholder="تعداد معیوب" value={form.defectCount} onChange={e => setForm(f => ({ ...f, defectCount: Number(e.target.value) }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                  </div>
                )}
                <textarea placeholder="یادداشت" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary resize-none" />
                <textarea placeholder="اقدام اصلاحی" value={form.correctiveAction} onChange={e => setForm(f => ({ ...f, correctiveAction: e.target.value }))} rows={2} className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary resize-none" />
              </div>
              <div className="flex gap-3 mt-5"><button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl border border-border text-sm">انصراف</button><button onClick={save} className="flex-[2] py-2.5 rounded-xl gradient-brand text-black text-sm font-semibold">ذخیره</button></div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
