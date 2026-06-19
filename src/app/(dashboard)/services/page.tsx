"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ShoppingBag, Plus, Search, Edit2, Trash2, ToggleLeft, ToggleRight,
  Tag, DollarSign, ChevronDown, X, Check,
} from "lucide-react";
import type { ServiceItem } from "@/types";
import { RoleGuard } from "@/components/common/RoleGuard";
import { useAuth } from "@/lib/auth/context";
import { apiClient } from "@/lib/api/client";
import { toast } from "sonner";

const CATEGORIES = [
  { id: "all", label: "همه" },
  { id: "design", label: "طراحی" },
  { id: "development", label: "توسعه" },
  { id: "marketing", label: "مارکتینگ" },
  { id: "consulting", label: "مشاوره" },
  { id: "support", label: "پشتیبانی" },
  { id: "other", label: "سایر" },
];

const UNIT_LABELS: Record<string, string> = {
  hour: "ساعت", project: "پروژه", month: "ماه", piece: "عدد", word: "کلمه", page: "صفحه",
};

const CAT_COLORS: Record<string, string> = {
  design: "text-purple-500 bg-purple-500/10",
  development: "text-blue-500 bg-blue-500/10",
  marketing: "text-orange-500 bg-orange-500/10",
  consulting: "text-green-500 bg-green-500/10",
  support: "text-cyan-500 bg-cyan-500/10",
  other: "text-gray-500 bg-gray-500/10",
};

const CAT_LABELS: Record<string, string> = {
  design: "طراحی", development: "توسعه", marketing: "مارکتینگ",
  consulting: "مشاوره", support: "پشتیبانی", other: "سایر",
};

const EMPTY_FORM = {
  name: "", code: "", category: "design" as ServiceItem["category"],
  defaultPrice: 0, unit: "hour" as ServiceItem["unit"],
  taxRate: 9, description: "", isActive: true,
};

export default function ServicesPage() {
  const { user } = useAuth();
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const canManage = ["admin", "accountant", "sales_manager"].includes(user?.role ?? "");

  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/services");
      setServices(res.data?.data ?? []);
    } catch { toast.error("خطا در بارگذاری خدمات"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchServices(); }, [fetchServices]);

  const filtered = useMemo(() => {
    return services.filter((s) => {
      if (activeCategory !== "all" && s.category !== activeCategory) return false;
      if (search) {
        const q = search.toLowerCase();
        return s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q);
      }
      return true;
    });
  }, [services, activeCategory, search]);

  const handleOpen = (svc?: ServiceItem) => {
    if (svc) {
      setEditingId(svc.id);
      setForm({ name: svc.name, code: svc.code, category: svc.category, defaultPrice: svc.defaultPrice, unit: svc.unit, taxRate: svc.taxRate, description: svc.description ?? "", isActive: svc.isActive });
    } else {
      setEditingId(null);
      setForm(EMPTY_FORM);
    }
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.code) return;
    setSaving(true);
    try {
      if (editingId) {
        const res = await apiClient.put(`/services/${editingId}`, form);
        setServices((prev) => prev.map((s) => s.id === editingId ? (res.data?.data ?? res.data) : s));
      } else {
        const res = await apiClient.post("/services", form);
        setServices((prev) => [res.data?.data ?? res.data, ...prev]);
      }
      setShowForm(false);
      toast.success(editingId ? "خدمت ویرایش شد" : "خدمت اضافه شد");
    } catch { toast.error("خطا در ذخیره"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete(`/services/${id}`);
      setServices((prev) => prev.filter((s) => s.id !== id));
      toast.success("خدمت حذف شد");
    } catch { toast.error("خطا در حذف"); }
  };

  const handleToggleActive = async (id: string) => {
    const svc = services.find((s) => s.id === id);
    if (!svc) return;
    try {
      await apiClient.put(`/services/${id}`, { isActive: !svc.isActive });
      setServices((prev) => prev.map((s) => s.id === id ? { ...s, isActive: !s.isActive } : s));
    } catch { toast.error("خطا"); }
  };

  return (
    <RoleGuard roles={["admin", "accountant", "sales_manager"]}>
      <div className="space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">خدمات و محصولات</h1>
              <p className="text-sm text-muted-foreground">{loading ? "در حال بارگذاری..." : `${services.filter(s => s.isActive).length} مورد فعال از ${services.length}`}</p>
            </div>
          </div>
          {canManage && (
            <button onClick={() => handleOpen()}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
              <Plus className="w-4 h-4" />
              خدمت جدید
            </button>
          )}
        </motion.div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="جستجو بر اساس نام یا کد..."
              className="w-full pr-9 pl-3 py-2 text-sm rounded-lg bg-card border border-border focus:outline-none focus:border-primary" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map((cat) => (
              <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${activeCategory === cat.id ? "bg-primary text-primary-foreground" : "bg-card border border-border hover:bg-muted"}`}>
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((svc, i) => (
            <motion.div key={svc.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className={`card p-4 space-y-3 ${!svc.isActive ? "opacity-60" : ""}`}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${CAT_COLORS[svc.category]}`}>
                      {CAT_LABELS[svc.category]}
                    </span>
                    {!svc.isActive && <span className="px-2 py-0.5 rounded text-xs bg-muted text-muted-foreground">غیرفعال</span>}
                  </div>
                  <h3 className="font-semibold text-sm leading-tight">{svc.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{svc.code}</p>
                </div>
                {canManage && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => handleToggleActive(svc.id)}
                      className="p-1 rounded hover:bg-muted transition-colors" title="فعال/غیرفعال">
                      {svc.isActive ? <ToggleRight className="w-4 h-4 text-green-500" /> : <ToggleLeft className="w-4 h-4 text-muted-foreground" />}
                    </button>
                    <button onClick={() => handleOpen(svc)} className="p-1 rounded hover:bg-muted transition-colors">
                      <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                    <button onClick={() => handleDelete(svc.id)} className="p-1 rounded hover:bg-destructive/10 transition-colors">
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </button>
                  </div>
                )}
              </div>

              {svc.description && (
                <p className="text-xs text-muted-foreground line-clamp-2">{svc.description}</p>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-border">
                <div className="text-sm font-bold text-primary">
                  {svc.defaultPrice.toLocaleString("fa-IR")} ت
                  <span className="text-xs font-normal text-muted-foreground mr-1">/ {UNIT_LABELS[svc.unit]}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Tag className="w-3 h-3" />
                  {svc.taxRate}% مالیات
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>خدمتی یافت نشد</p>
          </div>
        )}

        {/* Form Modal */}
        <AnimatePresence>
          {showForm && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                className="card w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-lg">{editingId ? "ویرایش خدمت" : "خدمت جدید"}</h2>
                  <button onClick={() => setShowForm(false)} className="p-1 rounded-lg hover:bg-muted">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1">نام خدمت *</label>
                    <input value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))}
                      className="input-field w-full" placeholder="مثال: طراحی رابط کاربری" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">کد *</label>
                    <input value={form.code} onChange={(e) => setForm(p => ({ ...p, code: e.target.value }))}
                      className="input-field w-full" placeholder="مثال: DES-001" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">دسته‌بندی</label>
                    <select value={form.category} onChange={(e) => setForm(p => ({ ...p, category: e.target.value as ServiceItem["category"] }))}
                      className="input-field w-full">
                      {CATEGORIES.filter(c => c.id !== "all").map(c => (
                        <option key={c.id} value={c.id}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">قیمت پیش‌فرض (تومان)</label>
                    <input type="number" value={form.defaultPrice} onChange={(e) => setForm(p => ({ ...p, defaultPrice: Number(e.target.value) }))}
                      className="input-field w-full" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">واحد</label>
                    <select value={form.unit} onChange={(e) => setForm(p => ({ ...p, unit: e.target.value as ServiceItem["unit"] }))}
                      className="input-field w-full">
                      {Object.entries(UNIT_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">نرخ مالیات (%)</label>
                    <input type="number" value={form.taxRate} onChange={(e) => setForm(p => ({ ...p, taxRate: Number(e.target.value) }))}
                      className="input-field w-full" />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">وضعیت فعال</label>
                    <button type="button" onClick={() => setForm(p => ({ ...p, isActive: !p.isActive }))}
                      className={`relative w-10 h-5 rounded-full transition-colors ${form.isActive ? "bg-primary" : "bg-muted"}`}>
                      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${form.isActive ? "right-0.5" : "left-0.5"}`} />
                    </button>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1">توضیحات</label>
                    <textarea value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))}
                      className="input-field w-full resize-none" rows={3} placeholder="توضیح مختصر خدمت..." />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button onClick={handleSave} disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-60">
                    <Check className="w-4 h-4" />
                    {saving ? "در حال ذخیره..." : "ذخیره"}
                  </button>
                  <button onClick={() => setShowForm(false)}
                    className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-muted">
                    انصراف
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </RoleGuard>
  );
}
