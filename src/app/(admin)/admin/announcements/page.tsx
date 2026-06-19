"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Bell, Plus, X, Edit3, Trash2, Calendar, Info, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { toast } from "sonner";

interface Announcement {
  id: string; title: string; message: string; type: string;
  targetPlans: string[]; isActive: boolean; expiresAt: string | null; createdAt: string;
}

const TYPE_CONFIG = {
  info:    { label: "اطلاع‌رسانی", icon: Info,           bg: "bg-blue-500/10",   text: "text-blue-300",   border: "border-blue-500/30" },
  warning: { label: "هشدار",       icon: AlertTriangle,   bg: "bg-amber-500/10",  text: "text-amber-300",  border: "border-amber-500/30" },
  success: { label: "موفقیت",      icon: CheckCircle2,    bg: "bg-green-500/10",  text: "text-green-300",  border: "border-green-500/30" },
  error:   { label: "خطا/اورژانس", icon: XCircle,         bg: "bg-red-500/10",    text: "text-red-300",    border: "border-red-500/30" },
};

const PLAN_LABELS: Record<string, string> = { trial: "آزمایشی", starter: "استارتر", pro: "حرفه‌ای", enterprise: "سازمانی" };

const EMPTY_FORM = { title: "", message: "", type: "info", targetPlans: [] as string[], isActive: true, expiresAt: "" };

export default function AnnouncementsPage() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editItem, setEditItem] = useState<Announcement | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await apiClient.get("/admin/announcements");
      setItems(r.data.data ?? []);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditItem(null); setForm({ ...EMPTY_FORM }); setModal(true); };
  const openEdit = (item: Announcement) => {
    setEditItem(item);
    setForm({ title: item.title, message: item.message, type: item.type, targetPlans: item.targetPlans ?? [], isActive: item.isActive, expiresAt: item.expiresAt ? item.expiresAt.split("T")[0] : "" });
    setModal(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const data = { ...form, expiresAt: form.expiresAt || null };
      if (editItem) {
        await apiClient.patch(`/admin/announcements/${editItem.id}`, data);
        toast.success("اعلان بروزرسانی شد ✓");
      } else {
        await apiClient.post("/admin/announcements", data);
        toast.success("اعلان ایجاد شد ✓");
      }
      setModal(false);
      load();
    } catch { toast.error("خطا در ذخیره"); }
    finally { setSaving(false); }
  };

  const toggleActive = async (item: Announcement) => {
    try {
      await apiClient.patch(`/admin/announcements/${item.id}`, { isActive: !item.isActive });
      setItems(prev => prev.map(a => a.id === item.id ? { ...a, isActive: !a.isActive } : a));
    } catch { toast.error("خطا"); }
  };

  const del = async (id: string) => {
    if (!confirm("حذف شود؟")) return;
    try {
      await apiClient.delete(`/admin/announcements/${id}`);
      toast.success("حذف شد");
      load();
    } catch { toast.error("خطا در حذف"); }
  };

  const togglePlan = (plan: string) => {
    setForm(p => ({
      ...p,
      targetPlans: p.targetPlans.includes(plan) ? p.targetPlans.filter(x => x !== plan) : [...p.targetPlans, plan],
    }));
  };

  const fmtDate = (d: string) => new Date(d).toLocaleDateString("fa-IR");

  return (
    <div className="p-8 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">اعلانات سیستمی</h1>
          <p className="text-sm text-white/40 mt-1">پیام‌های سراسری برای کسب‌وکارها</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-sm font-semibold hover:opacity-90">
          <Plus className="w-4 h-4" />اعلان جدید
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-24 rounded-2xl bg-white/5 animate-pulse" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 text-white/30">
          <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>هنوز اعلانی ایجاد نشده</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, idx) => {
            const cfg = TYPE_CONFIG[item.type as keyof typeof TYPE_CONFIG] ?? TYPE_CONFIG.info;
            const Icon = cfg.icon;
            return (
              <motion.div key={item.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                className={`rounded-2xl border p-4 ${cfg.border} ${item.isActive ? cfg.bg : "bg-white/3 border-white/5 opacity-50"}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-xl ${cfg.bg} flex items-center justify-center shrink-0`}>
                    <Icon className={`w-4 h-4 ${cfg.text}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-white">{item.title}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>{cfg.label}</span>
                      {(item.targetPlans?.length ?? 0) > 0 && (
                        <span className="text-xs text-white/40">
                          → {item.targetPlans.map(p => PLAN_LABELS[p]).join("، ")}
                        </span>
                      )}
                      {(item.targetPlans?.length ?? 0) === 0 && (
                        <span className="text-xs text-white/40">→ همه پلن‌ها</span>
                      )}
                    </div>
                    <p className="text-sm text-white/60 mt-1 line-clamp-2">{item.message}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-white/30">
                      <span>{fmtDate(item.createdAt)}</span>
                      {item.expiresAt && <span>انقضا: {fmtDate(item.expiresAt)}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => toggleActive(item)}
                      className={`w-10 h-5 rounded-full transition-colors relative ${item.isActive ? "bg-violet-600" : "bg-white/10"}`}>
                      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${item.isActive ? "right-0.5" : "right-5"}`} />
                    </button>
                    <button onClick={() => openEdit(item)}
                      className="p-1.5 rounded-lg hover:bg-white/10 text-white/30 hover:text-white transition-colors">
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => del(item.id)}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/30 hover:text-red-400 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {modal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-[#0f0f1a] border border-white/10 rounded-2xl w-full max-w-lg p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">{editItem ? "ویرایش اعلان" : "اعلان جدید"}</h3>
                <button onClick={() => setModal(false)} className="p-2 rounded-xl hover:bg-white/10 text-white/40">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-white/40 mb-1.5">عنوان</label>
                  <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white/70 text-sm focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs text-white/40 mb-1.5">متن پیام</label>
                  <textarea value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white/70 text-sm focus:outline-none resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-white/40 mb-1.5">نوع</label>
                    <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white/70 text-sm focus:outline-none">
                      {Object.entries(TYPE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-white/40 mb-1.5">تاریخ انقضا</label>
                    <input type="date" value={form.expiresAt} onChange={e => setForm(p => ({ ...p, expiresAt: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white/70 text-sm focus:outline-none" dir="ltr" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-white/40 mb-2">هدف (خالی = همه پلن‌ها)</label>
                  <div className="flex gap-2 flex-wrap">
                    {["trial", "starter", "pro", "enterprise"].map(pl => (
                      <button key={pl} onClick={() => togglePlan(pl)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          form.targetPlans.includes(pl) ? "bg-violet-600/30 text-violet-200 border border-violet-500/40" : "bg-white/5 text-white/40 border border-white/10 hover:text-white"
                        }`}>
                        {PLAN_LABELS[pl]}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-sm text-white/70">فعال بودن</span>
                  <button onClick={() => setForm(p => ({ ...p, isActive: !p.isActive }))}
                    className={`w-10 h-5 rounded-full transition-colors relative ${form.isActive ? "bg-violet-600" : "bg-white/10"}`}>
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${form.isActive ? "right-0.5" : "right-5"}`} />
                  </button>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={save} disabled={saving || !form.title || !form.message}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-semibold text-sm hover:opacity-90 disabled:opacity-50">
                  {saving ? "در حال ذخیره..." : "ذخیره"}
                </button>
                <button onClick={() => setModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-white/10 text-white/50 hover:text-white text-sm">
                  انصراف
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
