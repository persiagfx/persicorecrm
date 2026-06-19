"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Pencil, Trash2, FolderOpen, X, Check } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { toast } from "sonner";

interface Category {
  id: string; name: string; slug: string; color: string;
  description: string | null; order: number;
  _count: { posts: number };
}

const PRESET_COLORS = [
  "#8B5CF6", "#EC4899", "#3B82F6", "#10B981",
  "#F59E0B", "#EF4444", "#06B6D4", "#84CC16",
];

const EMPTY = { name: "", slug: "", color: "#8B5CF6", description: "" };

function slugify(t: string) {
  return t.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "").replace(/--+/g, "-");
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<null | "new" | Category>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const fetchCats = () => {
    setLoading(true);
    apiClient.get("/admin/categories").then(r => setCategories(r.data.data ?? [])).finally(() => setLoading(false));
  };

  useEffect(() => { fetchCats(); }, []);

  const openEdit = (cat: Category) => {
    setForm({ name: cat.name, slug: cat.slug, color: cat.color, description: cat.description ?? "" });
    setModal(cat);
  };

  const openNew = () => { setForm(EMPTY); setModal("new"); };

  const handleSave = async () => {
    if (!form.name) return;
    setSaving(true);
    try {
      if (modal === "new") {
        await apiClient.post("/admin/categories", { ...form, slug: form.slug || slugify(form.name) });
        toast.success("دسته‌بندی ایجاد شد");
      } else if (modal && typeof modal === "object") {
        await apiClient.put(`/admin/categories/${modal.id}`, form);
        toast.success("ذخیره شد");
      }
      fetchCats();
      setModal(null);
    } catch (e: any) {
      toast.error(e?.response?.data?.error ?? "خطا");
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("حذف شود؟")) return;
    await apiClient.delete(`/admin/categories/${id}`);
    toast.success("حذف شد");
    fetchCats();
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">دسته‌بندی‌ها</h1>
          <p className="text-sm text-white/40 mt-1">{categories.length} دسته</p>
        </div>
        <button onClick={openNew}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-sm font-semibold hover:opacity-90">
          <Plus className="w-4 h-4" />دسته جدید
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-24 rounded-2xl bg-white/5 animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat, i) => (
            <motion.div key={cat.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-colors group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: cat.color + "22" }}>
                    <FolderOpen className="w-4 h-4" style={{ color: cat.color }} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">{cat.name}</h3>
                    <p className="text-[10px] text-white/30" dir="ltr">{cat.slug}</p>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(cat)} className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(cat.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/40 hover:text-red-400">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              {cat.description && <p className="text-xs text-white/40 line-clamp-2 mb-2">{cat.description}</p>}
              <p className="text-xs text-white/30">{cat._count.posts} پست</p>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {modal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setModal(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              onClick={e => e.stopPropagation()}
              className="bg-[#141419] border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4" dir="rtl">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-white text-lg">{modal === "new" ? "دسته جدید" : "ویرایش دسته"}</h2>
                <button onClick={() => setModal(null)} className="p-1 rounded-lg hover:bg-white/10 text-white/40"><X className="w-5 h-5" /></button>
              </div>
              <div>
                <label className="block text-xs text-white/40 mb-1.5">نام *</label>
                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value, slug: p.slug || slugify(e.target.value) }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white/80 text-sm focus:outline-none focus:border-violet-500/50" />
              </div>
              <div>
                <label className="block text-xs text-white/40 mb-1.5">Slug</label>
                <input value={form.slug} onChange={e => setForm(p => ({ ...p, slug: e.target.value }))} dir="ltr"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white/60 text-sm focus:outline-none focus:border-violet-500/50" />
              </div>
              <div>
                <label className="block text-xs text-white/40 mb-1.5">رنگ</label>
                <div className="flex gap-2 flex-wrap">
                  {PRESET_COLORS.map(c => (
                    <button key={c} onClick={() => setForm(p => ({ ...p, color: c }))}
                      className="w-7 h-7 rounded-lg flex items-center justify-center transition-transform hover:scale-110"
                      style={{ background: c }}>
                      {form.color === c && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  ))}
                  <input type="color" value={form.color} onChange={e => setForm(p => ({ ...p, color: e.target.value }))}
                    className="w-7 h-7 rounded-lg cursor-pointer border-0 p-0" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-white/40 mb-1.5">توضیح</label>
                <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white/60 text-sm focus:outline-none resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={handleSave} disabled={saving || !form.name}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50">
                  {saving ? "در حال ذخیره..." : "ذخیره"}
                </button>
                <button onClick={() => setModal(null)} className="flex-1 py-2.5 rounded-xl bg-white/5 text-white/60 text-sm hover:bg-white/10">
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
