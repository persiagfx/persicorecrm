"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Tag, Plus, Pencil, Trash2, X, ChevronRight, Package, FolderOpen } from "lucide-react";
import { StatCard } from "@/components/common/StatCard";
import { apiClient } from "@/lib/api/client";
import { toast } from "sonner";

interface Category { id: string; name: string; slug: string; parentId?: string; imageUrl?: string; order: number; isActive: boolean; createdAt: string; _count?: { products: number }; children?: Category[]; }

export default function EcommerceCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Category | undefined>();
  const [form, setForm] = useState({ name: "", slug: "", parentId: "", imageUrl: "", order: 0, isActive: true });

  const load = useCallback(async () => {
    try {
      const r = await apiClient.get("/ecommerce/categories");
      setCategories(r.data.data ?? []);
    } catch { toast.error("خطا در بارگذاری"); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    try {
      const data = { ...form, parentId: form.parentId || undefined };
      if (editing) await apiClient.put(`/ecommerce/categories/${editing.id}`, data);
      else await apiClient.post("/ecommerce/categories", data);
      toast.success("ذخیره شد"); setShowModal(false); setEditing(undefined); load();
    } catch { toast.error("خطا"); }
  };

  const del = async (id: string) => {
    if (!confirm("حذف؟")) return;
    try { await apiClient.delete(`/ecommerce/categories/${id}`); toast.success("حذف شد"); load(); } catch { /**/ }
  };

  const open = (cat?: Category) => {
    setEditing(cat);
    setForm(cat ? { name: cat.name, slug: cat.slug, parentId: cat.parentId ?? "", imageUrl: cat.imageUrl ?? "", order: cat.order, isActive: cat.isActive } : { name: "", slug: "", parentId: "", imageUrl: "", order: 0, isActive: true });
    setShowModal(true);
  };

  const genSlug = (name: string) => name.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "");
  const roots = categories.filter(c => !c.parentId);
  const totalProducts = categories.reduce((a, c) => a + (c._count?.products ?? 0), 0);
  const activeCount = categories.filter(c => c.isActive).length;

  const inp = "w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary";

  return (
    <div className="p-6 space-y-5 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Tag className="w-6 h-6 text-primary" />دسته‌بندی محصولات</h1>
        <button onClick={() => open()} className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-brand text-black text-sm font-semibold"><Plus className="w-4 h-4" /> دسته جدید</button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard title="کل دسته‌ها" value={categories.length} icon={Tag} color="violet" />
        <StatCard title="دسته‌های فعال" value={activeCount} icon={FolderOpen} color="emerald" />
        <StatCard title="کل محصولات" value={totalProducts} icon={Package} color="blue" />
      </div>

      {loading ? <p className="text-center text-muted-foreground py-12">در حال بارگذاری...</p> : (
        <div className="space-y-3">
          {roots.map(root => {
            const children = categories.filter(c => c.parentId === root.id);
            return (
              <motion.div key={root.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-2xl border border-border overflow-hidden">
                <div className="flex items-center justify-between p-4 hover:bg-muted/20 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center"><Tag className="w-4 h-4 text-primary" /></div>
                    <div>
                      <p className="font-semibold">{root.name}</p>
                      <p className="text-xs text-muted-foreground">{root.slug} · {root._count?.products ?? 0} محصول · {children.length} زیرمجموعه</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${root.isActive ? "text-emerald-400 bg-emerald-500/10" : "text-red-400 bg-red-500/10"}`}>{root.isActive ? "فعال" : "غیرفعال"}</span>
                    <button onClick={() => open(root)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={() => del(root.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
                {children.length > 0 && (
                  <div className="border-t border-border bg-muted/10">
                    {children.map(child => (
                      <div key={child.id} className="flex items-center justify-between px-4 py-3 border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
                        <div className="flex items-center gap-3 pr-4">
                          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">{child.name}</p>
                            <p className="text-xs text-muted-foreground">{child.slug} · {child._count?.products ?? 0} محصول</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${child.isActive ? "text-emerald-400 bg-emerald-500/10" : "text-red-400 bg-red-500/10"}`}>{child.isActive ? "فعال" : "غیرفعال"}</span>
                          <button onClick={() => open(child)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><Pencil className="w-3.5 h-3.5" /></button>
                          <button onClick={() => del(child.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            );
          })}
          {!roots.length && <p className="text-center text-muted-foreground py-12">دسته‌ای ایجاد نشده</p>}
        </div>
      )}

      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="glass rounded-2xl border border-border w-full max-w-lg p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">{editing ? "ویرایش دسته" : "دسته جدید"}</h2>
                <button onClick={() => setShowModal(false)} className="p-1.5 rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs text-muted-foreground mb-1 block">نام دسته</label>
                  <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value, slug: genSlug(e.target.value) })} className={inp} placeholder="مثلاً: پوشاک مردانه" />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-muted-foreground mb-1 block">Slug (آدرس)</label>
                  <input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} className={inp} dir="ltr" placeholder="men-clothing" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">دسته والد (اختیاری)</label>
                  <select value={form.parentId} onChange={e => setForm({ ...form, parentId: e.target.value })} className={inp}>
                    <option value="">— دسته اصلی —</option>
                    {categories.filter(c => c.id !== editing?.id && !c.parentId).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div><label className="text-xs text-muted-foreground mb-1 block">ترتیب نمایش</label><input type="number" value={form.order} onChange={e => setForm({ ...form, order: +e.target.value })} className={inp} /></div>
                <div className="col-span-2"><label className="text-xs text-muted-foreground mb-1 block">آدرس تصویر (اختیاری)</label><input value={form.imageUrl} onChange={e => setForm({ ...form, imageUrl: e.target.value })} className={inp} placeholder="https://..." dir="ltr" /></div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="active" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} className="w-4 h-4" />
                  <label htmlFor="active" className="text-sm cursor-pointer">دسته فعال باشد</label>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={save} className="flex-1 py-2.5 rounded-xl gradient-brand text-black text-sm font-semibold">ذخیره</button>
                <button onClick={() => setShowModal(false)} className="px-4 py-2.5 rounded-xl border border-border text-sm">انصراف</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
