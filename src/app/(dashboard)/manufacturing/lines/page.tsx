"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Layers, Plus, Activity, X, Pencil, Trash2, Users, Settings } from "lucide-react";
import { StatCard } from "@/components/common/StatCard";
import { apiClient } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Line { id: string; name: string; description?: string; status: "active"|"idle"|"maintenance"; capacityPerDay: number; supervisorName?: string; efficiency: number; }

const STATUS_CFG = { active: { label: "فعال", color: "text-emerald-400 bg-emerald-500/10" }, idle: { label: "بیکار", color: "text-gray-400 bg-gray-500/10" }, maintenance: { label: "تعمیر", color: "text-amber-400 bg-amber-500/10" } };

export default function LinesPage() {
  const [lines, setLines] = useState<Line[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Line | undefined>();
  const [form, setForm] = useState({ name: "", description: "", status: "active" as Line["status"], capacityPerDay: 100, supervisorName: "" });

  const load = useCallback(async () => { try { const r = await apiClient.get("/manufacturing/lines"); setLines(r.data.data ?? []); } catch { toast.error("خطا"); } finally { setLoading(false); } }, []);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    try {
      if (editing) await apiClient.put(`/manufacturing/lines/${editing.id}`, form); else await apiClient.post("/manufacturing/lines", form);
      toast.success("ذخیره شد"); setShowModal(false); setEditing(undefined); load();
    } catch { toast.error("خطا"); }
  };

  const del = async (id: string) => { if (!confirm("حذف؟")) return; try { await apiClient.delete(`/manufacturing/lines/${id}`); toast.success("حذف شد"); load(); } catch { /**/ } };
  const open = (l?: Line) => { setEditing(l); setForm(l ? { name: l.name, description: l.description ?? "", status: l.status, capacityPerDay: l.capacityPerDay, supervisorName: l.supervisorName ?? "" } : { name: "", description: "", status: "active", capacityPerDay: 100, supervisorName: "" }); setShowModal(true); };

  return (
    <div className="p-6 space-y-5 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold flex items-center gap-2"><Layers className="w-6 h-6 text-primary" />خطوط تولید</h1></div>
        <button onClick={() => open()} className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-brand text-black text-sm font-semibold"><Plus className="w-4 h-4" /> خط جدید</button>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <StatCard title="کل خطوط" value={lines.length} icon={Layers} color="blue" />
        <StatCard title="فعال" value={lines.filter(l => l.status === "active").length} icon={Activity} color="green" />
        <StatCard title="در تعمیر" value={lines.filter(l => l.status === "maintenance").length} icon={Settings} color="amber" />
      </div>
      {loading ? <div className="p-12 text-center text-muted-foreground">در حال بارگذاری...</div> : lines.length === 0 ? (
        <div className="glass rounded-2xl border border-border p-12 text-center text-muted-foreground"><Layers className="w-10 h-10 mx-auto mb-3 opacity-30" /><p>خطی ثبت نشده</p></div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {lines.map(l => (
            <motion.div key={l.id} layout className="glass rounded-2xl border border-border p-5">
              <div className="flex items-start justify-between mb-3">
                <div><h3 className="font-semibold">{l.name}</h3>{l.description && <p className="text-sm text-muted-foreground mt-0.5">{l.description}</p>}</div>
                <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium", STATUS_CFG[l.status].color)}>{STATUS_CFG[l.status].label}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                <div className="p-2 rounded-lg bg-muted/50"><p className="text-xs text-muted-foreground">ظرفیت روزانه</p><p className="font-semibold">{l.capacityPerDay} واحد</p></div>
                <div className="p-2 rounded-lg bg-muted/50"><p className="text-xs text-muted-foreground">سرپرست</p><p className="font-semibold truncate">{l.supervisorName ?? "—"}</p></div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => open(l)} className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg border border-border text-sm hover:bg-muted"><Pencil className="w-3.5 h-3.5" />ویرایش</button>
                <button onClick={() => del(l.id)} className="p-2 rounded-lg border border-border text-destructive hover:bg-destructive/10"><Trash2 className="w-4 h-4" /></button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="glass rounded-2xl p-6 w-full max-w-md border border-border">
              <div className="flex items-center justify-between mb-5"><h2 className="text-lg font-bold">{editing ? "ویرایش خط" : "خط جدید"}</h2><button onClick={() => setShowModal(false)}><X className="w-4 h-4" /></button></div>
              <div className="space-y-3">
                <input placeholder="نام خط *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                <textarea placeholder="توضیحات" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary resize-none" />
                <div className="grid grid-cols-2 gap-3">
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as Line["status"] }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary">
                    {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                  <input type="number" placeholder="ظرفیت روزانه" value={form.capacityPerDay} onChange={e => setForm(f => ({ ...f, capacityPerDay: Number(e.target.value) }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                </div>
                <input placeholder="نام سرپرست" value={form.supervisorName} onChange={e => setForm(f => ({ ...f, supervisorName: e.target.value }))} className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
              </div>
              <div className="flex gap-3 mt-5"><button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl border border-border text-sm">انصراف</button><button onClick={save} className="flex-[2] py-2.5 rounded-xl gradient-brand text-black text-sm font-semibold">ذخیره</button></div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
