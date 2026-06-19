"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MapPin, Plus, Pencil, Trash2, X, Package } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { toast } from "sonner";

interface Location {
  id: string;
  name: string;
  code?: string;
  notes?: string;
  itemCount?: number;
  createdAt: string;
}

const EMPTY_FORM = { name: "", code: "", notes: "" };

export default function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Location | undefined>();
  const [form, setForm] = useState(EMPTY_FORM);

  const load = useCallback(async () => {
    try {
      const r = await apiClient.get("/inventory/locations");
      setLocations(r.data.data ?? []);
    } catch {
      toast.error("خطا در بارگذاری");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    try {
      if (editing) await apiClient.put(`/inventory/locations/${editing.id}`, form);
      else await apiClient.post("/inventory/locations", form);
      toast.success("ذخیره شد");
      setShowModal(false);
      setEditing(undefined);
      load();
    } catch {
      toast.error("خطا در ذخیره");
    }
  };

  const del = async (id: string) => {
    if (!confirm("این مکان حذف شود؟")) return;
    try {
      await apiClient.delete(`/inventory/locations/${id}`);
      toast.success("حذف شد");
      load();
    } catch { /**/ }
  };

  const open = (loc?: Location) => {
    setEditing(loc);
    setForm(loc ? { name: loc.name, code: loc.code ?? "", notes: loc.notes ?? "" } : EMPTY_FORM);
    setShowModal(true);
  };

  return (
    <div className="p-6 space-y-5 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MapPin className="w-6 h-6 text-primary" />مکان‌های انبار
        </h1>
        <button onClick={() => open()} className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-brand text-black text-sm font-semibold">
          <Plus className="w-4 h-4" /> مکان جدید
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-muted-foreground">در حال بارگذاری...</div>
      ) : locations.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center border border-border text-muted-foreground">
          <MapPin className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p>هیچ مکانی تعریف نشده</p>
          <p className="text-sm mt-1">مکان‌های انبار مانند قفسه، ردیف، انبار سرد و... را اینجا تعریف کنید</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {locations.map(loc => (
            <div key={loc.id} className="glass rounded-2xl p-5 border border-border">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                    <MapPin className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">{loc.name}</p>
                    {loc.code && <p className="text-xs text-muted-foreground font-mono">{loc.code}</p>}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => open(loc)} className="p-1.5 rounded-lg hover:bg-muted"><Pencil className="w-3.5 h-3.5 text-muted-foreground" /></button>
                  <button onClick={() => del(loc.id)} className="p-1.5 rounded-lg hover:bg-destructive/10"><Trash2 className="w-3.5 h-3.5 text-destructive" /></button>
                </div>
              </div>
              {loc.notes && <p className="text-sm text-muted-foreground mb-3">{loc.notes}</p>}
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Package className="w-3.5 h-3.5" />
                <span>{loc.itemCount ?? 0} آیتم</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="glass rounded-2xl p-6 w-full max-w-md border border-border">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold">{editing ? "ویرایش مکان" : "مکان جدید"}</h2>
                <button onClick={() => setShowModal(false)}><X className="w-4 h-4" /></button>
              </div>
              <div className="space-y-3">
                <input placeholder="نام مکان *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                <input placeholder="کد (اختیاری) مثلاً A-01-03" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} dir="ltr" className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                <textarea placeholder="توضیحات (اختیاری)" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary resize-none" />
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl border border-border text-sm">انصراف</button>
                <button onClick={save} className="flex-[2] py-2.5 rounded-xl gradient-brand text-black text-sm font-semibold">ذخیره</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
