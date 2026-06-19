"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Warehouse, Plus, Search, AlertTriangle, Package, DollarSign, X, Pencil, Trash2, Filter, QrCode, ShoppingCart, RefreshCw } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { StatCard } from "@/components/common/StatCard";
import { apiClient } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  location: string;
  quantity: number;
  unitCost: number;
  minStockLevel: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

interface ItemFormData {
  name: string;
  sku: string;
  category: string;
  location: string;
  quantity: string;
  unitCost: string;
  minStockLevel: string;
  description: string;
}

const CATEGORIES = [
  "الکترونیک",
  "مواد اولیه",
  "قطعات",
  "ابزار",
  "بسته‌بندی",
  "مواد مصرفی",
  "تجهیزات",
  "سایر",
];

const LOCATIONS = [
  "انبار A",
  "انبار B",
  "انبار C",
  "قفسه ۱",
  "قفسه ۲",
  "قفسه ۳",
  "سردخانه",
  "سایر",
];

const emptyForm: ItemFormData = {
  name: "",
  sku: "",
  category: CATEGORIES[0],
  location: LOCATIONS[0],
  quantity: "",
  unitCost: "",
  minStockLevel: "5",
  description: "",
};

function QuantityBadge({ qty }: { qty: number }) {
  if (qty === 0) {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/15 text-red-400">
        ناموجود
      </span>
    );
  }
  if (qty < 10) {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400">
        {qty}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400">
      {qty}
    </span>
  );
}

function ItemModal({
  item,
  onClose,
  onSave,
}: {
  item: InventoryItem | null;
  onClose: () => void;
  onSave: (item: InventoryItem) => void;
}) {
  const isEdit = !!item;
  const [form, setForm] = useState<ItemFormData>(
    item
      ? {
          name: item.name,
          sku: item.sku,
          category: item.category,
          location: item.location,
          quantity: String(item.quantity),
          unitCost: String(item.unitCost),
          minStockLevel: String(item.minStockLevel),
          description: item.description ?? "",
        }
      : emptyForm
  );
  const [saving, setSaving] = useState(false);

  const set = (k: keyof ItemFormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.sku.trim()) {
      toast.error("نام و SKU الزامی است");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        sku: form.sku.trim(),
        category: form.category,
        location: form.location,
        quantity: Number(form.quantity) || 0,
        unitCost: Number(form.unitCost) || 0,
        minStockLevel: Number(form.minStockLevel) || 0,
        description: form.description.trim() || undefined,
      };
      const res = isEdit
        ? await apiClient.put(`/inventory/${item!.id}`, payload)
        : await apiClient.post("/inventory", payload);
      onSave(res.data.data);
      toast.success(isEdit ? "کالا ویرایش شد" : "کالا افزوده شد");
      onClose();
    } catch {
      toast.error(isEdit ? "خطا در ویرایش کالا" : "خطا در افزودن کالا");
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full px-3 py-2 rounded-xl bg-muted border border-border text-foreground text-sm focus:outline-none focus:border-primary";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.95, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 10 }}
        className="glass rounded-2xl p-6 w-full max-w-lg border border-border max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-foreground flex items-center gap-2">
            <Package className="w-4 h-4 text-emerald-400" />
            {isEdit ? "ویرایش کالا" : "افزودن کالای جدید"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">نام کالا *</label>
              <input
                value={form.name}
                onChange={set("name")}
                placeholder="مثال: پیچ M6"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">کد SKU *</label>
              <input
                value={form.sku}
                onChange={set("sku")}
                placeholder="مثال: SKU-001"
                className={inputCls}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">دسته‌بندی</label>
              <select value={form.category} onChange={set("category")} className={inputCls}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">موقعیت انبار</label>
              <select value={form.location} onChange={set("location")} className={inputCls}>
                {LOCATIONS.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">تعداد</label>
              <input
                type="number"
                min="0"
                value={form.quantity}
                onChange={set("quantity")}
                placeholder="0"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">قیمت واحد (ت)</label>
              <input
                type="number"
                min="0"
                value={form.unitCost}
                onChange={set("unitCost")}
                placeholder="0"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">حداقل موجودی</label>
              <input
                type="number"
                min="0"
                value={form.minStockLevel}
                onChange={set("minStockLevel")}
                placeholder="5"
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">توضیحات</label>
            <textarea
              value={form.description}
              onChange={set("description")}
              rows={2}
              placeholder="توضیحات اختیاری..."
              className={cn(inputCls, "resize-none")}
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-border bg-muted text-foreground text-sm hover:bg-muted/80 transition-colors"
            >
              انصراف
            </button>
            <button
              onClick={handleSubmit}
              disabled={!form.name.trim() || !form.sku.trim() || saving}
              className="flex-1 py-2.5 rounded-xl gradient-brand text-black font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saving ? "در حال ذخیره..." : isEdit ? "ذخیره تغییرات" : "افزودن کالا"}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function QRModal({ item, onClose }: { item: InventoryItem; onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    import("qrcode").then(QRCode => {
      QRCode.toCanvas(canvasRef.current, `SKU:${item.sku}|ID:${item.id}|NAME:${item.name}`, {
        width: 200, margin: 2, color: { dark: "#000000", light: "#ffffff" },
      });
    }).catch(() => {});
  }, [item]);

  const download = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `qr-${item.sku}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
        className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-6 w-80 text-center space-y-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm">QR Code کالا</h3>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-white/10 text-gray-400"><X className="w-4 h-4" /></button>
        </div>
        <div className="bg-white rounded-xl p-3 inline-block">
          <canvas ref={canvasRef} />
        </div>
        <div className="text-xs text-gray-400 space-y-0.5">
          <div className="font-semibold text-white">{item.name}</div>
          <div className="font-mono">SKU: {item.sku}</div>
          <div>موجودی: {item.quantity}</div>
        </div>
        <button onClick={download} className="w-full bg-primary text-white rounded-lg py-2 text-sm font-medium hover:opacity-90">
          دانلود PNG
        </button>
      </motion.div>
    </motion.div>
  );
}

export default function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);
  const [qrItem, setQrItem] = useState<InventoryItem | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/inventory?perPage=200");
      setItems(res.data.data ?? []);
    } catch {
      toast.error("خطا در بارگذاری انبار");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete(`/inventory/${id}`);
      setItems((p) => p.filter((i) => i.id !== id));
      toast.success("کالا حذف شد");
    } catch {
      toast.error("خطا در حذف کالا");
    }
  };

  const handleSave = (saved: InventoryItem) => {
    setItems((p) => {
      const idx = p.findIndex((i) => i.id === saved.id);
      if (idx !== -1) {
        const copy = [...p];
        copy[idx] = saved;
        return copy;
      }
      return [saved, ...p];
    });
  };

  const openAdd = () => { setEditItem(null); setShowModal(true); };
  const openEdit = (item: InventoryItem) => { setEditItem(item); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setEditItem(null); };

  const lowStockItems = items.filter((i) => i.quantity < i.minStockLevel);
  const totalValue = items.reduce((s, i) => s + i.quantity * i.unitCost, 0);
  const categories = Array.from(new Set(items.map((i) => i.category)));
  const locations = Array.from(new Set(items.map((i) => i.location)));

  const filtered = items.filter((item) => {
    const matchSearch =
      !search ||
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.sku.toLowerCase().includes(search.toLowerCase());
    const matchCategory = categoryFilter === "all" || item.category === categoryFilter;
    const matchLocation = locationFilter === "all" || item.location === locationFilter;
    return matchSearch && matchCategory && matchLocation;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Warehouse className="w-6 h-6 text-emerald-400" />
            مدیریت انبار
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {items.length} کالا در انبار
          </p>
        </div>
        <button
          onClick={openAdd}
          className="px-4 py-2 rounded-xl gradient-brand text-black text-sm font-semibold flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          افزودن کالا
        </button>
      </motion.div>

      {/* Low stock alert banner */}
      <AnimatePresence>
        {lowStockItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-400"
          >
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <div className="text-sm flex-1">
              <span className="font-semibold">هشدار کمبود موجودی: </span>
              {lowStockItems.length} کالا زیر حداقل موجودی هستند —{" "}
              {lowStockItems.slice(0, 4).map((i) => i.name).join("، ")}
              {lowStockItems.length > 4 && ` و ${lowStockItems.length - 4} مورد دیگر`}
            </div>
            <Link href="/inventory/purchase-orders"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap"
            >
              <ShoppingCart className="w-3.5 h-3.5" /> ثبت سفارش خرید
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="کل اقلام"
          value={items.length}
          icon={Package}
          gradient="bg-gradient-to-br from-emerald-500 to-teal-600"
        />
        <StatCard
          title="هشدار کمبود"
          value={lowStockItems.length}
          icon={AlertTriangle}
          gradient="bg-gradient-to-br from-amber-500 to-orange-500"
        />
        <StatCard
          title="ارزش کل انبار"
          value={totalValue}
          icon={DollarSign}
          gradient="bg-gradient-to-br from-emerald-600 to-green-700"
          prefix=""
          suffix=" ت"
        />
        <StatCard
          title="تعداد دسته‌ها"
          value={categories.length}
          icon={Filter}
          gradient="bg-gradient-to-br from-teal-500 to-cyan-600"
        />
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="جستجو بر اساس نام یا SKU..."
            className="w-full pr-9 pl-3 py-2 rounded-xl bg-muted border border-border text-foreground text-sm focus:outline-none focus:border-primary"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 rounded-xl bg-muted border border-border text-foreground text-sm focus:outline-none focus:border-primary"
        >
          <option value="all">همه دسته‌ها</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <select
          value={locationFilter}
          onChange={(e) => setLocationFilter(e.target.value)}
          className="px-3 py-2 rounded-xl bg-muted border border-border text-foreground text-sm focus:outline-none focus:border-primary"
        >
          <option value="all">همه مکان‌ها</option>
          {locations.map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>

        {(search || categoryFilter !== "all" || locationFilter !== "all") && (
          <button
            onClick={() => { setSearch(""); setCategoryFilter("all"); setLocationFilter("all"); }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-muted border border-border text-muted-foreground hover:text-foreground text-sm transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            پاک‌کردن
          </button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">
            {[1, 2, 3, 5].map((i) => (
              <div key={i} className="h-12 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {["نام کالا", "SKU", "دسته‌بندی", "موقعیت", "موجودی", "قیمت واحد", "ارزش کل", ""].map((h) => (
                    <th
                      key={h}
                      className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => {
                  const totalItemValue = item.quantity * item.unitCost;
                  const isLow = item.quantity < item.minStockLevel;
                  return (
                    <tr
                      key={item.id}
                      className={cn(
                        "border-b border-border hover:bg-muted/30 transition-colors group",
                        isLow && "bg-amber-500/5"
                      )}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {isLow && (
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          )}
                          <span className="font-medium text-foreground">{item.name}</span>
                        </div>
                        {item.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[180px]">
                            {item.description}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {item.sku}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-medium">
                          {item.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {item.location}
                      </td>
                      <td className="px-4 py-3">
                        <QuantityBadge qty={item.quantity} />
                      </td>
                      <td className="px-4 py-3 tabular-nums text-foreground">
                        {formatPrice(item.unitCost, true)}
                      </td>
                      <td className="px-4 py-3 tabular-nums font-medium text-foreground">
                        {formatPrice(totalItemValue, true)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setQrItem(item)}
                            className="p-1.5 rounded-lg hover:bg-indigo-500/10 text-muted-foreground hover:text-indigo-400 transition-colors"
                            title="QR Code"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                          </button>
                          {isLow && (
                            <Link href="/inventory/purchase-orders"
                              className="p-1.5 rounded-lg hover:bg-amber-500/10 text-amber-400 transition-colors"
                              title="سفارش مجدد"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                            </Link>
                          )}
                          <button
                            onClick={() => openEdit(item)}
                            className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-muted-foreground hover:text-emerald-400 transition-colors"
                            title="ویرایش"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"
                            title="حذف"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground text-sm">
                      {items.length === 0 ? "انباری ثبت نشده است. اولین کالا را اضافه کنید." : "هیچ موردی با فیلترهای انتخابی یافت نشد."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AnimatePresence>
        {qrItem && <QRModal item={qrItem} onClose={() => setQrItem(null)} />}
      </AnimatePresence>

      <AnimatePresence>
        {showModal && (
          <ItemModal item={editItem} onClose={closeModal} onSave={handleSave} />
        )}
      </AnimatePresence>
    </div>
  );
}
