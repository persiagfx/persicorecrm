"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Package, Plus, Search, Star, AlertCircle, X, Pencil, Trash2, Image } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { StatCard } from "@/components/common/StatCard";
import { apiClient } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Category { id: string; name: string; }
interface Product {
  id: string;
  sku?: string;
  name: string;
  description?: string;
  categoryId?: string;
  category?: { id: string; name: string } | null;
  basePrice: number;
  salePrice?: number | null;
  stock: number;
  minStock: number;
  isPublished: boolean;
  isFeatured: boolean;
  images?: string[];
  weight?: number;
  tags?: string[];
  rating?: number;
  reviewCount?: number;
}

const EMPTY_FORM = {
  sku: "",
  name: "",
  description: "",
  categoryId: "",
  basePrice: 0,
  salePrice: 0,
  stock: 0,
  minStock: 5,
  isPublished: true,
  isFeatured: false,
  weight: 0,
  tags: "",
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Product | undefined>();
  const [form, setForm] = useState(EMPTY_FORM);

  const load = useCallback(async () => {
    try {
      const [pr, cr] = await Promise.all([
        apiClient.get("/ecommerce/products"),
        apiClient.get("/ecommerce/categories"),
      ]);
      setProducts(pr.data.data ?? []);
      setCategories(cr.data.data ?? []);
    } catch {
      toast.error("خطا در بارگذاری");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    try {
      const data = {
        ...form,
        tags: form.tags ? form.tags.split(",").map((t: string) => t.trim()).filter(Boolean) : [],
        salePrice: form.salePrice || null,
        categoryId: form.categoryId || null,
      };
      if (editing) await apiClient.put(`/ecommerce/products/${editing.id}`, data);
      else await apiClient.post("/ecommerce/products", data);
      toast.success("ذخیره شد");
      setShowModal(false);
      setEditing(undefined);
      load();
    } catch {
      toast.error("خطا در ذخیره");
    }
  };

  const del = async (id: string) => {
    if (!confirm("این محصول حذف شود؟")) return;
    try {
      await apiClient.delete(`/ecommerce/products/${id}`);
      toast.success("حذف شد");
      load();
    } catch { /**/ }
  };

  const open = (p?: Product) => {
    setEditing(p);
    setForm(p ? {
      sku: p.sku ?? "",
      name: p.name,
      description: p.description ?? "",
      categoryId: p.categoryId ?? "",
      basePrice: p.basePrice,
      salePrice: p.salePrice ?? 0,
      stock: p.stock,
      minStock: p.minStock,
      isPublished: p.isPublished,
      isFeatured: p.isFeatured,
      weight: p.weight ?? 0,
      tags: (p.tags ?? []).join(", "),
    } : { ...EMPTY_FORM, sku: `SKU-${Date.now().toString().slice(-6)}` });
    setShowModal(true);
  };

  const filtered = products.filter(p => {
    if (catFilter !== "all" && p.categoryId !== catFilter) return false;
    if (search && !p.name.includes(search) && !(p.sku ?? "").includes(search)) return false;
    return true;
  });

  const lowStock = products.filter(p => p.stock <= p.minStock).length;
  const totalValue = products.reduce((a, p) => a + p.basePrice * p.stock, 0);

  return (
    <div className="p-6 space-y-5 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Package className="w-6 h-6 text-primary" />مدیریت محصولات
        </h1>
        <button onClick={() => open()} className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-brand text-black text-sm font-semibold">
          <Plus className="w-4 h-4" /> محصول جدید
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <StatCard title="کل محصولات" value={products.length} icon={Package} color="blue" />
        <StatCard title="موجودی کم" value={lowStock} icon={AlertCircle} color="red" />
        <StatCard title="برجسته" value={products.filter(p => p.isFeatured).length} icon={Star} color="amber" />
        <StatCard title="ارزش انبار" value={formatPrice(totalValue)} icon={Package} color="green" />
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="جستجو..." className="w-full pe-10 ps-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
        </div>
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary">
          <option value="all">همه دسته‌ها</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      <div className="glass rounded-2xl border border-border overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-muted-foreground">در حال بارگذاری...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <Package className="w-10 h-10 mx-auto mb-3 opacity-30" /><p>محصولی یافت نشد</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {["SKU", "محصول", "دسته", "قیمت", "موجودی", "امتیاز", "وضعیت", ""].map(h => (
                  <th key={h} className="text-right p-4 text-muted-foreground font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                  <td className="p-4 font-mono text-xs">{p.sku ?? "—"}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <Image className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">{p.name}</p>
                        {p.isFeatured && <span className="text-xs text-amber-400 flex items-center gap-0.5"><Star className="w-3 h-3" />برجسته</span>}
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-muted-foreground">{p.category?.name ?? "—"}</td>
                  <td className="p-4">
                    <p className="font-medium">{formatPrice(p.basePrice)}</p>
                    {p.salePrice && p.salePrice > 0 && p.salePrice < p.basePrice && (
                      <p className="text-xs text-muted-foreground line-through">{formatPrice(p.basePrice)}</p>
                    )}
                  </td>
                  <td className="p-4">
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", p.stock <= p.minStock ? "text-red-400 bg-red-500/10" : "text-emerald-400 bg-emerald-500/10")}>
                      {p.stock}
                    </span>
                  </td>
                  <td className="p-4">
                    {p.rating ? (
                      <span className="flex items-center gap-1 text-amber-400"><Star className="w-3.5 h-3.5" />{Number(p.rating).toFixed(1)}</span>
                    ) : "—"}
                  </td>
                  <td className="p-4">
                    <span className={cn("px-2 py-0.5 rounded-full text-xs", p.isPublished ? "text-emerald-400 bg-emerald-500/10" : "text-gray-400 bg-gray-500/10")}>
                      {p.isPublished ? "منتشر" : "پیش‌نویس"}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-1">
                      <button onClick={() => open(p)} className="p-1.5 rounded-lg hover:bg-muted"><Pencil className="w-3.5 h-3.5 text-muted-foreground" /></button>
                      <button onClick={() => del(p.id)} className="p-1.5 rounded-lg hover:bg-destructive/10"><Trash2 className="w-3.5 h-3.5 text-destructive" /></button>
                    </div>
                  </td>
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
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold">{editing ? "ویرایش محصول" : "محصول جدید"}</h2>
                <button onClick={() => setShowModal(false)}><X className="w-4 h-4" /></button>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input placeholder="SKU" value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} dir="ltr" className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                  <select value={form.categoryId} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary">
                    <option value="">بدون دسته</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <input placeholder="نام محصول *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                <textarea placeholder="توضیحات" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary resize-none" />
                <div className="grid grid-cols-2 gap-3">
                  <input type="number" placeholder="قیمت پایه *" value={form.basePrice || ""} onChange={e => setForm(f => ({ ...f, basePrice: Number(e.target.value) }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                  <input type="number" placeholder="قیمت حراج" value={form.salePrice || ""} onChange={e => setForm(f => ({ ...f, salePrice: Number(e.target.value) }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <input type="number" placeholder="موجودی" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: Number(e.target.value) }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                  <input type="number" placeholder="آستانه کم" value={form.minStock} onChange={e => setForm(f => ({ ...f, minStock: Number(e.target.value) }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                  <input type="number" placeholder="وزن (گرم)" value={form.weight || ""} onChange={e => setForm(f => ({ ...f, weight: Number(e.target.value) }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                </div>
                <input placeholder="تگ‌ها (با کاما جدا کنید)" value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input type="checkbox" checked={form.isPublished} onChange={e => setForm(f => ({ ...f, isPublished: e.target.checked }))} />
                    <span>منتشر شده</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input type="checkbox" checked={form.isFeatured} onChange={e => setForm(f => ({ ...f, isFeatured: e.target.checked }))} />
                    <span>برجسته</span>
                  </label>
                </div>
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
