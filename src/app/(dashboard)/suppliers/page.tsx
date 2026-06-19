"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Users, Plus, Search, Star, Phone, Mail, Truck, X, Pencil, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { StatCard } from "@/components/common/StatCard";
import { apiClient } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ─── Types ──────────────────────────────────────────────────────────────────

type SupplierCategory = "مواد اولیه" | "ابزار" | "خدمات" | "بسته‌بندی" | "سایر";

interface Supplier {
  id: string;
  companyName: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  address?: string;
  category: SupplierCategory;
  paymentTerms: number;
  avgDeliveryDays: number;
  rating: number;
  totalPurchases: number;
  notes?: string;
  isActive: boolean;
  createdAt?: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const CATEGORIES: { id: string; label: SupplierCategory | "همه" }[] = [
  { id: "all", label: "همه" },
  { id: "مواد اولیه", label: "مواد اولیه" },
  { id: "ابزار", label: "ابزار" },
  { id: "خدمات", label: "خدمات" },
  { id: "بسته‌بندی", label: "بسته‌بندی" },
  { id: "سایر", label: "سایر" },
];

const CAT_COLORS: Record<string, string> = {
  "مواد اولیه": "text-teal-600 bg-teal-500/10",
  "ابزار": "text-orange-600 bg-orange-500/10",
  "خدمات": "text-blue-600 bg-blue-500/10",
  "بسته‌بندی": "text-purple-600 bg-purple-500/10",
  "سایر": "text-gray-500 bg-gray-500/10",
};

const EMPTY_FORM = {
  companyName: "",
  contactName: "",
  contactPhone: "",
  contactEmail: "",
  address: "",
  category: "مواد اولیه" as SupplierCategory,
  paymentTerms: 30,
  avgDeliveryDays: 7,
  rating: 3,
  notes: "",
  isActive: true,
};

// ─── Star Rating ─────────────────────────────────────────────────────────────

function StarRating({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange?.(n)}
          className={cn(
            "transition-colors",
            onChange ? "cursor-pointer hover:scale-110" : "cursor-default pointer-events-none"
          )}
        >
          <Star
            className={cn(
              "w-4 h-4",
              n <= value ? "fill-amber-400 text-amber-400" : "fill-none text-muted-foreground/40"
            )}
          />
        </button>
      ))}
    </div>
  );
}

// ─── Supplier Card ────────────────────────────────────────────────────────────

function SupplierCard({
  supplier,
  index,
  onEdit,
  onDelete,
  onToggle,
}: {
  supplier: Supplier;
  index: number;
  onEdit: (s: Supplier) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className={cn(
        "bg-card border border-border rounded-2xl p-5 space-y-4 shadow-sm hover:shadow-md transition-shadow",
        !supplier.isActive && "opacity-60"
      )}
    >
      {/* Top row: company + actions */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span
              className={cn(
                "px-2 py-0.5 rounded text-xs font-medium",
                CAT_COLORS[supplier.category] ?? "text-gray-500 bg-gray-500/10"
              )}
            >
              {supplier.category}
            </span>
            <span
              className={cn(
                "px-2 py-0.5 rounded text-xs font-medium",
                supplier.isActive
                  ? "text-emerald-600 bg-emerald-500/10"
                  : "text-muted-foreground bg-muted"
              )}
            >
              {supplier.isActive ? "فعال" : "غیرفعال"}
            </span>
          </div>
          <h3 className="font-bold text-sm leading-tight truncate">{supplier.companyName}</h3>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{supplier.contactName}</p>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onToggle(supplier.id)}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            title="فعال/غیرفعال"
          >
            {supplier.isActive ? (
              <ToggleRight className="w-4 h-4 text-teal-500" />
            ) : (
              <ToggleLeft className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
          <button
            onClick={() => onEdit(supplier)}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            title="ویرایش"
          >
            <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
          <button
            onClick={() => onDelete(supplier.id)}
            className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors"
            title="حذف"
          >
            <Trash2 className="w-3.5 h-3.5 text-destructive" />
          </button>
        </div>
      </div>

      {/* Contact info */}
      <div className="space-y-1.5">
        {supplier.contactPhone && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Phone className="w-3.5 h-3.5 shrink-0 text-teal-500" />
            <span dir="ltr" className="truncate">{supplier.contactPhone}</span>
          </div>
        )}
        {supplier.contactEmail && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Mail className="w-3.5 h-3.5 shrink-0 text-teal-500" />
            <span dir="ltr" className="truncate">{supplier.contactEmail}</span>
          </div>
        )}
      </div>

      {/* Rating */}
      <div className="flex items-center justify-between">
        <StarRating value={supplier.rating} />
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Truck className="w-3.5 h-3.5" />
          <span>{supplier.avgDeliveryDays} روز</span>
        </div>
      </div>

      {/* Stats row */}
      <div className="pt-3 border-t border-border grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">مجموع خرید</p>
          <p className="text-sm font-bold text-teal-600 dark:text-teal-400">
            {(supplier.totalPurchases ?? 0).toLocaleString("fa-IR")}
            <span className="text-xs font-normal text-muted-foreground mr-1">ت</span>
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">شرایط پرداخت</p>
          <p className="text-sm font-semibold">
            {supplier.paymentTerms.toLocaleString("fa-IR")}
            <span className="text-xs font-normal text-muted-foreground mr-1">روز</span>
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/suppliers");
      setSuppliers(res.data?.data ?? res.data ?? []);
    } catch {
      toast.error("خطا در بارگذاری تامین‌کنندگان");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  // ── Computed stats ─────────────────────────────────────────────────────────

  const totalSuppliers = suppliers.length;
  const activeSuppliers = suppliers.filter((s) => s.isActive).length;
  const totalPurchaseValue = suppliers.reduce((sum, s) => sum + (s.totalPurchases ?? 0), 0);
  const avgDeliveryDays =
    suppliers.length > 0
      ? Math.round(suppliers.reduce((sum, s) => sum + s.avgDeliveryDays, 0) / suppliers.length)
      : 0;

  // ── Filter ─────────────────────────────────────────────────────────────────

  const filtered = suppliers.filter((s) => {
    if (activeCategory !== "all" && s.category !== activeCategory) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        s.companyName.toLowerCase().includes(q) ||
        s.contactName.toLowerCase().includes(q) ||
        s.contactPhone?.includes(q) ||
        s.contactEmail?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // ── Modal helpers ──────────────────────────────────────────────────────────

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (supplier: Supplier) => {
    setEditingId(supplier.id);
    setForm({
      companyName: supplier.companyName,
      contactName: supplier.contactName,
      contactPhone: supplier.contactPhone,
      contactEmail: supplier.contactEmail,
      address: supplier.address ?? "",
      category: supplier.category,
      paymentTerms: supplier.paymentTerms,
      avgDeliveryDays: supplier.avgDeliveryDays,
      rating: supplier.rating,
      notes: supplier.notes ?? "",
      isActive: supplier.isActive,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
  };

  // ── CRUD ───────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!form.companyName.trim() || !form.contactName.trim()) {
      toast.error("نام شرکت و نام مخاطب الزامی است");
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        const res = await apiClient.put(`/suppliers/${editingId}`, form);
        const updated: Supplier = res.data?.data ?? res.data;
        setSuppliers((prev) => prev.map((s) => (s.id === editingId ? updated : s)));
        toast.success("تامین‌کننده ویرایش شد");
      } else {
        const res = await apiClient.post("/suppliers", form);
        const created: Supplier = res.data?.data ?? res.data;
        setSuppliers((prev) => [created, ...prev]);
        toast.success("تامین‌کننده اضافه شد");
      }
      closeModal();
    } catch {
      toast.error("خطا در ذخیره اطلاعات");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete(`/suppliers/${id}`);
      setSuppliers((prev) => prev.filter((s) => s.id !== id));
      toast.success("تامین‌کننده حذف شد");
    } catch {
      toast.error("خطا در حذف");
    }
  };

  const handleToggle = async (id: string) => {
    const supplier = suppliers.find((s) => s.id === id);
    if (!supplier) return;
    try {
      await apiClient.put(`/suppliers/${id}`, { isActive: !supplier.isActive });
      setSuppliers((prev) =>
        prev.map((s) => (s.id === id ? { ...s, isActive: !s.isActive } : s))
      );
    } catch {
      toast.error("خطا در تغییر وضعیت");
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6" dir="rtl">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center">
            <Truck className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold">تامین‌کنندگان</h1>
            <p className="text-sm text-muted-foreground">
              {loading
                ? "در حال بارگذاری..."
                : `${activeSuppliers} تامین‌کننده فعال از ${totalSuppliers}`}
            </p>
          </div>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          تامین‌کننده جدید
        </button>
      </motion.div>

      {/* ── Stats ──────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="کل تامین‌کنندگان"
          value={totalSuppliers}
          icon={Users}
          gradient="bg-teal-500"
        />
        <StatCard
          title="تامین‌کنندگان فعال"
          value={activeSuppliers}
          icon={ToggleRight}
          gradient="bg-emerald-500"
        />
        <StatCard
          title="مجموع ارزش خرید"
          value={totalPurchaseValue}
          icon={Truck}
          suffix=" ت"
          gradient="bg-teal-600"
        />
        <StatCard
          title="میانگین روز تحویل"
          value={avgDeliveryDays}
          icon={Star}
          suffix=" روز"
          gradient="bg-cyan-500"
        />
      </div>

      {/* ── Filters ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="جستجو بر اساس نام، تلفن، ایمیل..."
            className="w-full pr-9 pl-3 py-2 text-sm rounded-lg bg-card border border-border focus:outline-none focus:border-teal-500 transition-colors"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                activeCategory === cat.id
                  ? "bg-teal-600 text-white shadow-sm"
                  : "bg-card border border-border hover:bg-muted"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Grid ───────────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="bg-card border border-border rounded-2xl p-5 h-52 animate-pulse"
            />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Truck className="w-14 h-14 mx-auto mb-3 opacity-20" />
          <p className="text-lg font-medium">تامین‌کننده‌ای یافت نشد</p>
          <p className="text-sm mt-1">برای اضافه کردن، دکمه «تامین‌کننده جدید» را بزنید</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((supplier, i) => (
            <SupplierCard
              key={supplier.id}
              supplier={supplier}
              index={i}
              onEdit={openEdit}
              onDelete={handleDelete}
              onToggle={handleToggle}
            />
          ))}
        </div>
      )}

      {/* ── Add / Edit Modal ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) closeModal();
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className="bg-card border border-border rounded-2xl w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto"
              dir="rtl"
            >
              {/* Modal header */}
              <div className="flex items-center justify-between p-6 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center">
                    <Truck className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  </div>
                  <h2 className="font-bold text-lg">
                    {editingId ? "ویرایش تامین‌کننده" : "تامین‌کننده جدید"}
                  </h2>
                </div>
                <button
                  onClick={closeModal}
                  className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal body */}
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Company name */}
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium mb-1">
                    نام شرکت <span className="text-destructive">*</span>
                  </label>
                  <input
                    value={form.companyName}
                    onChange={(e) => setForm((p) => ({ ...p, companyName: e.target.value }))}
                    placeholder="مثال: شرکت پارس مواد"
                    className="w-full px-3 py-2 text-sm rounded-lg bg-background border border-border focus:outline-none focus:border-teal-500 transition-colors"
                  />
                </div>

                {/* Contact name */}
                <div>
                  <label className="block text-sm font-medium mb-1">
                    نام مخاطب <span className="text-destructive">*</span>
                  </label>
                  <input
                    value={form.contactName}
                    onChange={(e) => setForm((p) => ({ ...p, contactName: e.target.value }))}
                    placeholder="نام و نام خانوادگی"
                    className="w-full px-3 py-2 text-sm rounded-lg bg-background border border-border focus:outline-none focus:border-teal-500 transition-colors"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium mb-1">شماره تلفن</label>
                  <input
                    value={form.contactPhone}
                    onChange={(e) => setForm((p) => ({ ...p, contactPhone: e.target.value }))}
                    placeholder="۰۲۱-۱۲۳۴۵۶۷۸"
                    dir="ltr"
                    className="w-full px-3 py-2 text-sm rounded-lg bg-background border border-border focus:outline-none focus:border-teal-500 transition-colors text-right"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium mb-1">ایمیل</label>
                  <input
                    type="email"
                    value={form.contactEmail}
                    onChange={(e) => setForm((p) => ({ ...p, contactEmail: e.target.value }))}
                    placeholder="info@company.com"
                    dir="ltr"
                    className="w-full px-3 py-2 text-sm rounded-lg bg-background border border-border focus:outline-none focus:border-teal-500 transition-colors text-right"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium mb-1">دسته‌بندی</label>
                  <select
                    value={form.category}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, category: e.target.value as SupplierCategory }))
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg bg-background border border-border focus:outline-none focus:border-teal-500 transition-colors"
                  >
                    {CATEGORIES.filter((c) => c.id !== "all").map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Payment terms */}
                <div>
                  <label className="block text-sm font-medium mb-1">شرایط پرداخت (روز)</label>
                  <input
                    type="number"
                    min={0}
                    value={form.paymentTerms}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, paymentTerms: Number(e.target.value) }))
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg bg-background border border-border focus:outline-none focus:border-teal-500 transition-colors"
                  />
                </div>

                {/* Avg delivery days */}
                <div>
                  <label className="block text-sm font-medium mb-1">میانگین روز تحویل</label>
                  <input
                    type="number"
                    min={1}
                    value={form.avgDeliveryDays}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, avgDeliveryDays: Number(e.target.value) }))
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg bg-background border border-border focus:outline-none focus:border-teal-500 transition-colors"
                  />
                </div>

                {/* Rating */}
                <div>
                  <label className="block text-sm font-medium mb-2">امتیاز (۱ تا ۵)</label>
                  <StarRating
                    value={form.rating}
                    onChange={(v) => setForm((p) => ({ ...p, rating: v }))}
                  />
                </div>

                {/* Active toggle */}
                <div className="flex items-center gap-3">
                  <label className="text-sm font-medium">وضعیت فعال</label>
                  <button
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, isActive: !p.isActive }))}
                    className={cn(
                      "relative w-11 h-6 rounded-full transition-colors",
                      form.isActive ? "bg-teal-600" : "bg-muted"
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all",
                        form.isActive ? "right-1" : "left-1"
                      )}
                    />
                  </button>
                </div>

                {/* Address */}
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium mb-1">آدرس</label>
                  <input
                    value={form.address}
                    onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                    placeholder="آدرس کامل شرکت"
                    className="w-full px-3 py-2 text-sm rounded-lg bg-background border border-border focus:outline-none focus:border-teal-500 transition-colors"
                  />
                </div>

                {/* Notes */}
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium mb-1">یادداشت</label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                    placeholder="توضیحات اضافی درباره تامین‌کننده..."
                    rows={3}
                    className="w-full px-3 py-2 text-sm rounded-lg bg-background border border-border focus:outline-none focus:border-teal-500 transition-colors resize-none"
                  />
                </div>
              </div>

              {/* Modal footer */}
              <div className="flex items-center gap-3 px-6 pb-6">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-teal-600 text-white text-sm font-medium hover:bg-teal-700 disabled:opacity-60 transition-colors shadow-sm"
                >
                  {saving ? (
                    <>
                      <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                      در حال ذخیره...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      {editingId ? "ذخیره تغییرات" : "افزودن تامین‌کننده"}
                    </>
                  )}
                </button>
                <button
                  onClick={closeModal}
                  className="px-5 py-2.5 rounded-lg border border-border text-sm hover:bg-muted transition-colors"
                >
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
