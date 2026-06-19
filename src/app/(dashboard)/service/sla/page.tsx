"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Shield, Plus, X, Pencil, Trash2, Clock, CheckCircle2, AlertCircle, Zap } from "lucide-react";
import { StatCard } from "@/components/common/StatCard";
import { apiClient } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface SLAPolicy { id: string; policyName: string; description?: string; targetSegment: string; responseTimeHours: number; resolutionTimeHours: number; escalationAfterHours: number; priority: "low"|"medium"|"high"|"critical"; penaltyPercent?: number; isActive: boolean; }

const PRI_COLORS = { low: "from-gray-500/20 to-gray-500/5 border-gray-500/30", medium: "from-blue-500/20 to-blue-500/5 border-blue-500/30", high: "from-amber-500/20 to-amber-500/5 border-amber-500/30", critical: "from-red-500/20 to-red-500/5 border-red-500/30" };
const PRI_BADGE = { low: "text-gray-400 bg-gray-500/10", medium: "text-blue-400 bg-blue-500/10", high: "text-amber-400 bg-amber-500/10", critical: "text-red-400 bg-red-500/10" };
const PRI_LABEL = { low: "کم", medium: "متوسط", high: "بالا", critical: "بحرانی" };
const SEGMENTS = ["همه مشتریان", "VIP", "سازمانی", "عمومی", "صادرات", "دولتی"];

export default function SLAPage() {
  const [policies, setPolicies] = useState<SLAPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<SLAPolicy | undefined>();
  const [form, setForm] = useState({ policyName: "", description: "", targetSegment: "همه مشتریان", responseTimeHours: 4, resolutionTimeHours: 24, escalationAfterHours: 8, priority: "medium" as SLAPolicy["priority"], penaltyPercent: 0, isActive: true });

  const load = useCallback(async () => { try { const r = await apiClient.get("/service/sla-policies"); setPolicies(r.data.data ?? []); } catch { toast.error("خطا"); } finally { setLoading(false); } }, []);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    try {
      if (editing) await apiClient.put(`/service/sla-policies/${editing.id}`, form); else await apiClient.post("/service/sla-policies", form);
      toast.success("ذخیره شد"); setShowModal(false); setEditing(undefined); load();
    } catch { toast.error("خطا"); }
  };
  const del = async (id: string) => { if (!confirm("حذف؟")) return; try { await apiClient.delete(`/service/sla-policies/${id}`); toast.success("حذف شد"); load(); } catch { /**/ } };
  const open = (p?: SLAPolicy) => { setEditing(p); setForm(p ? { policyName: p.policyName, description: p.description ?? "", targetSegment: p.targetSegment, responseTimeHours: p.responseTimeHours, resolutionTimeHours: p.resolutionTimeHours, escalationAfterHours: p.escalationAfterHours, priority: p.priority, penaltyPercent: p.penaltyPercent ?? 0, isActive: p.isActive } : { policyName: "", description: "", targetSegment: "همه مشتریان", responseTimeHours: 4, resolutionTimeHours: 24, escalationAfterHours: 8, priority: "medium", penaltyPercent: 0, isActive: true }); setShowModal(true); };

  const formatHours = (h: number) => h >= 24 ? `${Math.floor(h / 24)} روز${h % 24 ? ` و ${h % 24} ساعت` : ""}` : `${h} ساعت`;

  return (
    <div className="p-6 space-y-5 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold flex items-center gap-2"><Shield className="w-6 h-6 text-primary" />سیاست‌های SLA</h1></div>
        <button onClick={() => open()} className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-brand text-black text-sm font-semibold"><Plus className="w-4 h-4" /> سیاست جدید</button>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <StatCard title="کل سیاست‌ها" value={policies.length} icon={Shield} color="blue" />
        <StatCard title="فعال" value={policies.filter(p => p.isActive).length} icon={CheckCircle2} color="green" />
        <StatCard title="با جریمه" value={policies.filter(p => (p.penaltyPercent ?? 0) > 0).length} icon={AlertCircle} color="amber" />
      </div>
      {loading ? <div className="p-12 text-center text-muted-foreground glass rounded-2xl border border-border">در حال بارگذاری...</div> : policies.length === 0 ? (
        <div className="p-12 text-center text-muted-foreground glass rounded-2xl border border-border"><Shield className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>سیاستی تعریف نشده</p><p className="text-sm mt-1">با کلیک روی «سیاست جدید» شروع کنید</p></div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {policies.map(p => (
            <div key={p.id} className={cn("rounded-2xl border p-5 bg-gradient-to-br transition-all", PRI_COLORS[p.priority], !p.isActive && "opacity-60")}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-base">{p.policyName}</h3>
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", PRI_BADGE[p.priority])}>{PRI_LABEL[p.priority]}</span>
                    <span className={cn("px-2 py-0.5 rounded-full text-xs", p.isActive ? "text-emerald-400 bg-emerald-500/10" : "text-gray-400 bg-gray-500/10")}>{p.isActive ? "فعال" : "غیرفعال"}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{p.targetSegment} · {p.description || "بدون توضیح"}</p>
                </div>
                <div className="flex gap-1"><button onClick={() => open(p)} className="p-1.5 rounded-lg hover:bg-black/20"><Pencil className="w-3.5 h-3.5 text-muted-foreground" /></button><button onClick={() => del(p.id)} className="p-1.5 rounded-lg hover:bg-destructive/10"><Trash2 className="w-3.5 h-3.5 text-destructive" /></button></div>
              </div>
              <div className="grid grid-cols-4 gap-4 mt-4">
                <div className="glass rounded-xl p-3 text-center border border-white/10">
                  <Zap className="w-4 h-4 text-primary mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">زمان پاسخ</p>
                  <p className="font-semibold text-sm mt-0.5">{formatHours(p.responseTimeHours)}</p>
                </div>
                <div className="glass rounded-xl p-3 text-center border border-white/10">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">زمان حل</p>
                  <p className="font-semibold text-sm mt-0.5">{formatHours(p.resolutionTimeHours)}</p>
                </div>
                <div className="glass rounded-xl p-3 text-center border border-white/10">
                  <Clock className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">اسکالیشن</p>
                  <p className="font-semibold text-sm mt-0.5">{formatHours(p.escalationAfterHours)}</p>
                </div>
                <div className="glass rounded-xl p-3 text-center border border-white/10">
                  <AlertCircle className="w-4 h-4 text-red-400 mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">جریمه</p>
                  <p className="font-semibold text-sm mt-0.5">{p.penaltyPercent ? `${p.penaltyPercent}%` : "ندارد"}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="glass rounded-2xl p-6 w-full max-w-lg border border-border max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5"><h2 className="text-lg font-bold">{editing ? "ویرایش سیاست" : "سیاست جدید"}</h2><button onClick={() => setShowModal(false)}><X className="w-4 h-4" /></button></div>
              <div className="space-y-3">
                <input placeholder="نام سیاست *" value={form.policyName} onChange={e => setForm(f => ({ ...f, policyName: e.target.value }))} className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                <div className="grid grid-cols-2 gap-3">
                  <select value={form.targetSegment} onChange={e => setForm(f => ({ ...f, targetSegment: e.target.value }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary">
                    {SEGMENTS.map(s => <option key={s}>{s}</option>)}
                  </select>
                  <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as SLAPolicy["priority"] }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary">
                    {Object.entries(PRI_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div><label className="block text-xs text-muted-foreground mb-1">زمان پاسخ (ساعت)</label><input type="number" min={1} value={form.responseTimeHours} onChange={e => setForm(f => ({ ...f, responseTimeHours: Number(e.target.value) }))} className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" /></div>
                  <div><label className="block text-xs text-muted-foreground mb-1">زمان حل (ساعت)</label><input type="number" min={1} value={form.resolutionTimeHours} onChange={e => setForm(f => ({ ...f, resolutionTimeHours: Number(e.target.value) }))} className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" /></div>
                  <div><label className="block text-xs text-muted-foreground mb-1">اسکالیشن (ساعت)</label><input type="number" min={1} value={form.escalationAfterHours} onChange={e => setForm(f => ({ ...f, escalationAfterHours: Number(e.target.value) }))} className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" /></div>
                </div>
                <div><label className="block text-xs text-muted-foreground mb-1">درصد جریمه در صورت نقض</label><input type="number" min={0} max={100} value={form.penaltyPercent} onChange={e => setForm(f => ({ ...f, penaltyPercent: Number(e.target.value) }))} className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" /></div>
                <textarea placeholder="توضیحات" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary resize-none" />
                <label className="flex items-center gap-2 cursor-pointer text-sm"><input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} className="rounded" /><span>سیاست فعال است</span></label>
              </div>
              <div className="flex gap-3 mt-5"><button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl border border-border text-sm">انصراف</button><button onClick={save} className="flex-[2] py-2.5 rounded-xl gradient-brand text-black text-sm font-semibold">ذخیره</button></div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
