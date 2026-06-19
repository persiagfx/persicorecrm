"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Map, Plus, Tag, CheckCircle2, Clock, X, Pencil, Trash2, Target, ChevronDown } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Roadmap { id: string; title: string; description?: string; }
interface Feature { id: string; title: string; description?: string; status: "planned"|"in_progress"|"completed"|"cancelled"; priority: "low"|"medium"|"high"; targetQuarter: string; tags: string[]; roadmapId: string; }

const STATUS_CFG = { planned: { label: "برنامه‌ریزی شده", color: "text-blue-400 bg-blue-500/10" }, in_progress: { label: "در حال انجام", color: "text-amber-400 bg-amber-500/10" }, completed: { label: "تکمیل شده", color: "text-emerald-400 bg-emerald-500/10" }, cancelled: { label: "لغو شده", color: "text-gray-400 bg-gray-500/10" } };
const PRIORITY_CFG = { low: "text-gray-400", medium: "text-blue-400", high: "text-red-400" };
const QUARTERS = ["Q1 1404", "Q2 1404", "Q3 1404", "Q4 1404", "Q1 1405", "Q2 1405", "Q3 1405", "Q4 1405"];

export default function RoadmapPage() {
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [active, setActive] = useState<Roadmap | null>(null);
  const [showRoadmapModal, setShowRoadmapModal] = useState(false);
  const [showFeatureModal, setShowFeatureModal] = useState(false);
  const [editingFeature, setEditingFeature] = useState<Feature | undefined>();
  const [statusFilter, setStatusFilter] = useState("all");
  const [rmForm, setRmForm] = useState({ title: "", description: "" });
  const [ftForm, setFtForm] = useState({ title: "", description: "", status: "planned" as Feature["status"], priority: "medium" as Feature["priority"], targetQuarter: QUARTERS[0], tags: "" });

  const load = useCallback(async () => {
    try {
      const r = await apiClient.get("/it/roadmap");
      const list: Roadmap[] = r.data.data ?? [];
      setRoadmaps(list);
      if (!active && list.length) setActive(list[0]);
    } catch { toast.error("خطا"); }
  }, []);

  const loadFeatures = async (roadmapId: string) => {
    try { const r = await apiClient.get(`/it/roadmap-features?roadmapId=${roadmapId}`); setFeatures(r.data.data ?? []); } catch { /**/ }
  };

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (active) loadFeatures(active.id); }, [active?.id]);

  const saveRm = async () => {
    try { await apiClient.post("/it/roadmap", rmForm); toast.success("Roadmap ایجاد شد"); setShowRoadmapModal(false); load(); } catch { toast.error("خطا"); }
  };

  const saveFt = async () => {
    try {
      const data = { ...ftForm, tags: ftForm.tags.split(",").map(t => t.trim()).filter(Boolean), roadmapId: active?.id };
      if (editingFeature) await apiClient.put(`/it/roadmap-features/${editingFeature.id}`, data);
      else await apiClient.post("/it/roadmap-features", data);
      toast.success("ذخیره شد"); setShowFeatureModal(false); setEditingFeature(undefined);
      if (active) loadFeatures(active.id);
    } catch { toast.error("خطا"); }
  };

  const delFt = async (id: string) => { if (!confirm("حذف؟")) return; try { await apiClient.delete(`/it/roadmap-features/${id}`); if (active) loadFeatures(active.id); } catch { /**/ } };

  const openFt = (f?: Feature) => { setEditingFeature(f); setFtForm(f ? { title: f.title, description: f.description ?? "", status: f.status, priority: f.priority, targetQuarter: f.targetQuarter, tags: f.tags.join(", ") } : { title: "", description: "", status: "planned", priority: "medium", targetQuarter: QUARTERS[0], tags: "" }); setShowFeatureModal(true); };

  const filtered = features.filter(f => statusFilter === "all" || f.status === statusFilter);
  const grouped = QUARTERS.reduce<Record<string, Feature[]>>((acc, q) => { acc[q] = filtered.filter(f => f.targetQuarter === q); return acc; }, {});

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold flex items-center gap-2"><Map className="w-6 h-6 text-primary" />Roadmap محصول</h1></div>
        <div className="flex gap-2">
          <button onClick={() => setShowRoadmapModal(true)} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border text-sm hover:bg-muted"><Plus className="w-4 h-4" /> Roadmap جدید</button>
          <button onClick={() => openFt()} disabled={!active} className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-brand text-black text-sm font-semibold disabled:opacity-40"><Plus className="w-4 h-4" /> ویژگی جدید</button>
        </div>
      </div>

      {/* Roadmap tabs */}
      {roadmaps.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {roadmaps.map(r => <button key={r.id} onClick={() => setActive(r)} className={cn("px-3 py-1.5 rounded-lg text-sm border transition-all", active?.id === r.id ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted text-muted-foreground")}>{r.title}</button>)}
        </div>
      )}

      <div className="flex gap-3">
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary">
          <option value="all">همه</option>
          {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {/* Timeline */}
      {active ? (
        <div className="overflow-x-auto">
          <div className="grid grid-cols-4 gap-4 min-w-[800px]">
            {QUARTERS.slice(0, 4).map(q => (
              <div key={q} className="glass rounded-2xl border border-border p-4">
                <h3 className="text-sm font-bold text-muted-foreground mb-3">{q}</h3>
                <div className="space-y-2">
                  {(grouped[q] ?? []).length === 0 ? <p className="text-xs text-muted-foreground/50 text-center py-4">خالی</p> : (grouped[q] ?? []).map(f => (
                    <motion.div key={f.id} layout className="bg-muted/50 rounded-xl p-3 border border-border/50">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium leading-tight">{f.title}</p>
                        <div className="flex gap-1 shrink-0">
                          <button onClick={() => openFt(f)} className="p-1 hover:bg-muted rounded"><Pencil className="w-3 h-3 text-muted-foreground" /></button>
                          <button onClick={() => delFt(f.id)} className="p-1 hover:bg-destructive/10 rounded"><Trash2 className="w-3 h-3 text-destructive" /></button>
                        </div>
                      </div>
                      <span className={cn("mt-1.5 inline-block px-2 py-0.5 rounded-full text-[10px] font-medium", STATUS_CFG[f.status].color)}>{STATUS_CFG[f.status].label}</span>
                      {f.tags.length > 0 && <div className="flex gap-1 mt-1.5 flex-wrap">{f.tags.map(t => <span key={t} className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{t}</span>)}</div>}
                    </motion.div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="glass rounded-2xl border border-border p-12 text-center text-muted-foreground"><Map className="w-10 h-10 mx-auto mb-3 opacity-30" /><p>یک Roadmap ایجاد کنید</p></div>
      )}

      <AnimatePresence>
        {showRoadmapModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setShowRoadmapModal(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="glass rounded-2xl p-6 w-full max-w-md border border-border">
              <div className="flex items-center justify-between mb-4"><h2 className="text-lg font-bold">Roadmap جدید</h2><button onClick={() => setShowRoadmapModal(false)}><X className="w-4 h-4" /></button></div>
              <div className="space-y-3">
                <input placeholder="نام *" value={rmForm.title} onChange={e => setRmForm(f => ({ ...f, title: e.target.value }))} className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                <textarea placeholder="توضیحات" value={rmForm.description} onChange={e => setRmForm(f => ({ ...f, description: e.target.value }))} rows={2} className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary resize-none" />
              </div>
              <div className="flex gap-3 mt-4"><button onClick={() => setShowRoadmapModal(false)} className="flex-1 py-2.5 rounded-xl border border-border text-sm">انصراف</button><button onClick={saveRm} className="flex-[2] py-2.5 rounded-xl gradient-brand text-black text-sm font-semibold">ایجاد</button></div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showFeatureModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setShowFeatureModal(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="glass rounded-2xl p-6 w-full max-w-md border border-border">
              <div className="flex items-center justify-between mb-4"><h2 className="text-lg font-bold">{editingFeature ? "ویرایش ویژگی" : "ویژگی جدید"}</h2><button onClick={() => setShowFeatureModal(false)}><X className="w-4 h-4" /></button></div>
              <div className="space-y-3">
                <input placeholder="عنوان *" value={ftForm.title} onChange={e => setFtForm(f => ({ ...f, title: e.target.value }))} className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                <textarea placeholder="توضیحات" value={ftForm.description} onChange={e => setFtForm(f => ({ ...f, description: e.target.value }))} rows={2} className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary resize-none" />
                <div className="grid grid-cols-2 gap-3">
                  <select value={ftForm.status} onChange={e => setFtForm(f => ({ ...f, status: e.target.value as Feature["status"] }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary">
                    {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                  <select value={ftForm.targetQuarter} onChange={e => setFtForm(f => ({ ...f, targetQuarter: e.target.value }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary">
                    {QUARTERS.map(q => <option key={q}>{q}</option>)}
                  </select>
                </div>
                <input placeholder="تگ‌ها (با کاما جدا کنید)" value={ftForm.tags} onChange={e => setFtForm(f => ({ ...f, tags: e.target.value }))} className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
              </div>
              <div className="flex gap-3 mt-4"><button onClick={() => setShowFeatureModal(false)} className="flex-1 py-2.5 rounded-xl border border-border text-sm">انصراف</button><button onClick={saveFt} className="flex-[2] py-2.5 rounded-xl gradient-brand text-black text-sm font-semibold">ذخیره</button></div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
