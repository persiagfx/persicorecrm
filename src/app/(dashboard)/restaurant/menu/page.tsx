"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { UtensilsCrossed, Plus, Search, X, Pencil, Trash2, Clock, Flame, ToggleLeft, ToggleRight, ChefHat } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { apiClient } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

interface RestMenuCategory {
  id: string;
  name: string;
  color: string;
  itemCount?: number;
}

interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  categoryId: string;
  preparationTime: number;
  calories?: number;
  isAvailable: boolean;
  allergens?: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

interface CategoryFormData {
  name: string;
  color: string;
}

interface ItemFormData {
  name: string;
  description: string;
  price: string;
  categoryId: string;
  preparationTime: string;
  calories: string;
  isAvailable: boolean;
  allergens: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PRESET_COLORS = [
  "#f97316", // orange
  "#ef4444", // red
  "#22c55e", // green
  "#3b82f6", // blue
  "#a855f7", // purple
  "#eab308", // yellow
];

const emptyCategoryForm: CategoryFormData = {
  name: "",
  color: PRESET_COLORS[0],
};

const emptyItemForm: ItemFormData = {
  name: "",
  description: "",
  price: "",
  categoryId: "",
  preparationTime: "15",
  calories: "",
  isAvailable: true,
  allergens: "",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function CategoryTabSkeleton() {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-9 w-24 rounded-full bg-white/5 animate-pulse shrink-0" />
      ))}
    </div>
  );
}

function ItemCardSkeleton() {
  return (
    <div className="bg-white/5 rounded-2xl p-4 animate-pulse">
      <div className="h-32 rounded-xl bg-white/5 mb-3" />
      <div className="h-4 w-3/4 rounded bg-white/5 mb-2" />
      <div className="h-3 w-full rounded bg-white/5 mb-3" />
      <div className="h-5 w-1/3 rounded bg-white/5" />
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function RestaurantMenuPage() {
  // Data state
  const [categories, setCategories] = useState<RestMenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [loadingItems, setLoadingItems] = useState(false);

  // UI state
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // Category modal
  const [catModal, setCatModal] = useState<{ open: boolean; editing: RestMenuCategory | null }>({
    open: false,
    editing: null,
  });
  const [catForm, setCatForm] = useState<CategoryFormData>(emptyCategoryForm);
  const [savingCat, setSavingCat] = useState(false);

  // Item modal
  const [itemModal, setItemModal] = useState<{ open: boolean; editing: MenuItem | null }>({
    open: false,
    editing: null,
  });
  const [itemForm, setItemForm] = useState<ItemFormData>(emptyItemForm);
  const [savingItem, setSavingItem] = useState(false);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<{ type: "category" | "item"; id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ─── Fetch categories ──────────────────────────────────────────────────────

  const fetchCategories = useCallback(async () => {
    setLoadingCats(true);
    try {
      const res = await apiClient.get("/restaurant/menu-categories");
      const data: RestMenuCategory[] = res.data?.data ?? res.data ?? [];
      setCategories(data);
      if (data.length > 0 && activeCategory === null) {
        setActiveCategory(data[0].id);
      }
    } catch {
      toast.error("خطا در بارگذاری دسته‌بندی‌ها");
    } finally {
      setLoadingCats(false);
    }
  }, [activeCategory]);

  // ─── Fetch items ───────────────────────────────────────────────────────────

  const fetchItems = useCallback(async (categoryId: string) => {
    setLoadingItems(true);
    try {
      const res = await apiClient.get(`/restaurant/menu-items?categoryId=${categoryId}`);
      const data: MenuItem[] = res.data?.data ?? res.data ?? [];
      setItems(data);
    } catch {
      toast.error("خطا در بارگذاری آیتم‌های منو");
    } finally {
      setLoadingItems(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (activeCategory) {
      fetchItems(activeCategory);
    }
  }, [activeCategory, fetchItems]);

  // ─── Category CRUD ─────────────────────────────────────────────────────────

  const openAddCategory = () => {
    setCatForm(emptyCategoryForm);
    setCatModal({ open: true, editing: null });
  };

  const openEditCategory = (cat: RestMenuCategory) => {
    setCatForm({ name: cat.name, color: cat.color });
    setCatModal({ open: true, editing: cat });
  };

  const saveCategory = async () => {
    if (!catForm.name.trim()) {
      toast.error("نام دسته‌بندی الزامی است");
      return;
    }
    setSavingCat(true);
    try {
      if (catModal.editing) {
        await apiClient.put(`/restaurant/menu-categories/${catModal.editing.id}`, catForm);
        toast.success("دسته‌بندی ویرایش شد");
      } else {
        await apiClient.post("/restaurant/menu-categories", catForm);
        toast.success("دسته‌بندی افزوده شد");
      }
      setCatModal({ open: false, editing: null });
      await fetchCategories();
    } catch {
      toast.error("خطا در ذخیره دسته‌بندی");
    } finally {
      setSavingCat(false);
    }
  };

  const confirmDeleteCategory = (cat: RestMenuCategory) => {
    setDeleteTarget({ type: "category", id: cat.id, name: cat.name });
  };

  // ─── Item CRUD ─────────────────────────────────────────────────────────────

  const openAddItem = () => {
    setItemForm({ ...emptyItemForm, categoryId: activeCategory ?? "" });
    setItemModal({ open: true, editing: null });
  };

  const openEditItem = (item: MenuItem) => {
    setItemForm({
      name: item.name,
      description: item.description ?? "",
      price: String(item.price),
      categoryId: item.categoryId,
      preparationTime: String(item.preparationTime),
      calories: item.calories != null ? String(item.calories) : "",
      isAvailable: item.isAvailable,
      allergens: item.allergens ?? "",
    });
    setItemModal({ open: true, editing: item });
  };

  const saveItem = async () => {
    if (!itemForm.name.trim()) {
      toast.error("نام آیتم الزامی است");
      return;
    }
    if (!itemForm.price || isNaN(Number(itemForm.price))) {
      toast.error("قیمت معتبر وارد کنید");
      return;
    }
    if (!itemForm.categoryId) {
      toast.error("دسته‌بندی را انتخاب کنید");
      return;
    }
    setSavingItem(true);
    try {
      const payload = {
        name: itemForm.name.trim(),
        description: itemForm.description.trim() || undefined,
        price: Number(itemForm.price),
        categoryId: itemForm.categoryId,
        preparationTime: Number(itemForm.preparationTime) || 15,
        calories: itemForm.calories ? Number(itemForm.calories) : undefined,
        isAvailable: itemForm.isAvailable,
        allergens: itemForm.allergens.trim() || undefined,
      };
      if (itemModal.editing) {
        await apiClient.put(`/restaurant/menu-items/${itemModal.editing.id}`, payload);
        toast.success("آیتم ویرایش شد");
      } else {
        await apiClient.post("/restaurant/menu-items", payload);
        toast.success("آیتم افزوده شد");
      }
      setItemModal({ open: false, editing: null });
      if (activeCategory) await fetchItems(activeCategory);
    } catch {
      toast.error("خطا در ذخیره آیتم");
    } finally {
      setSavingItem(false);
    }
  };

  const confirmDeleteItem = (item: MenuItem) => {
    setDeleteTarget({ type: "item", id: item.id, name: item.name });
  };

  const toggleAvailability = async (item: MenuItem) => {
    try {
      await apiClient.patch(`/restaurant/menu-items/${item.id}`, {
        isAvailable: !item.isAvailable,
      });
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, isAvailable: !i.isAvailable } : i))
      );
    } catch {
      toast.error("خطا در تغییر وضعیت");
    }
  };

  // ─── Delete confirm handler ────────────────────────────────────────────────

  const executeDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      if (deleteTarget.type === "category") {
        await apiClient.delete(`/restaurant/menu-categories/${deleteTarget.id}`);
        toast.success("دسته‌بندی حذف شد");
        setDeleteTarget(null);
        const remaining = categories.filter((c) => c.id !== deleteTarget.id);
        setCategories(remaining);
        if (activeCategory === deleteTarget.id) {
          setActiveCategory(remaining[0]?.id ?? null);
          setItems([]);
        }
      } else {
        await apiClient.delete(`/restaurant/menu-items/${deleteTarget.id}`);
        toast.success("آیتم حذف شد");
        setDeleteTarget(null);
        setItems((prev) => prev.filter((i) => i.id !== deleteTarget.id));
      }
    } catch {
      toast.error("خطا در حذف");
    } finally {
      setDeleting(false);
    }
  };

  // ─── Filtered items ────────────────────────────────────────────────────────

  const filteredItems = items.filter(
    (item) =>
      item.name.includes(search) ||
      (item.description ?? "").includes(search)
  );

  const activeCategoryObj = categories.find((c) => c.id === activeCategory);

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white p-6" dir="rtl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2.5 rounded-xl bg-orange-500/15">
            <UtensilsCrossed className="w-6 h-6 text-orange-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">منوی رستوران</h1>
            <p className="text-gray-400 text-sm">مدیریت دسته‌بندی‌ها و آیتم‌های منو</p>
          </div>
        </div>
      </div>

      {/* Category tabs bar */}
      <div className="mb-6">
        <div className="flex items-center gap-3 flex-wrap">
          {loadingCats ? (
            <CategoryTabSkeleton />
          ) : (
            <>
              {categories.map((cat) => (
                <div key={cat.id} className="flex items-center gap-1">
                  <button
                    onClick={() => setActiveCategory(cat.id)}
                    className={cn(
                      "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border",
                      activeCategory === cat.id
                        ? "text-white border-transparent shadow-lg"
                        : "bg-white/5 text-gray-300 border-white/10 hover:bg-white/10"
                    )}
                    style={
                      activeCategory === cat.id
                        ? { backgroundColor: cat.color, borderColor: cat.color }
                        : {}
                    }
                  >
                    {cat.name}
                  </button>
                  <button
                    onClick={() => openEditCategory(cat)}
                    className="p-1.5 rounded-full hover:bg-white/10 text-gray-400 hover:text-orange-400 transition-colors"
                    title="ویرایش دسته‌بندی"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => confirmDeleteCategory(cat)}
                    className="p-1.5 rounded-full hover:bg-white/10 text-gray-400 hover:text-red-400 transition-colors"
                    title="حذف دسته‌بندی"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              <button
                onClick={openAddCategory}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-orange-500/15 text-orange-400 border border-orange-500/30 hover:bg-orange-500/25 transition-all duration-200"
              >
                <Plus className="w-4 h-4" />
                دسته‌بندی جدید
              </button>
            </>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="جستجو در آیتم‌ها..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pr-9 pl-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50 focus:bg-white/8 transition-all"
          />
        </div>
        {activeCategory && (
          <button
            onClick={openAddItem}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-medium text-sm transition-all duration-200 shadow-lg shadow-orange-500/20"
          >
            <Plus className="w-4 h-4" />
            آیتم جدید
          </button>
        )}
      </div>

      {/* Items grid */}
      {!activeCategory && !loadingCats && (
        <div className="flex flex-col items-center justify-center py-24 text-gray-500">
          <ChefHat className="w-16 h-16 mb-4 opacity-30" />
          <p className="text-lg font-medium">یک دسته‌بندی انتخاب یا ایجاد کنید</p>
        </div>
      )}

      {loadingItems ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <ItemCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {filteredItems.length === 0 && activeCategory ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-20 text-gray-500"
            >
              <UtensilsCrossed className="w-14 h-14 mb-4 opacity-30" />
              <p className="text-base font-medium">آیتمی در این دسته‌بندی وجود ندارد</p>
              <button
                onClick={openAddItem}
                className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500/15 text-orange-400 border border-orange-500/30 hover:bg-orange-500/25 text-sm font-medium transition-all"
              >
                <Plus className="w-4 h-4" />
                اولین آیتم را اضافه کنید
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            >
              {filteredItems.map((item, idx) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className={cn(
                    "bg-white/5 border border-white/8 rounded-2xl overflow-hidden group hover:border-orange-500/30 transition-all duration-200",
                    !item.isAvailable && "opacity-60"
                  )}
                >
                  {/* Image placeholder */}
                  <div
                    className="h-36 flex items-center justify-center text-gray-600"
                    style={{
                      backgroundColor: activeCategoryObj
                        ? activeCategoryObj.color + "18"
                        : "#f9731618",
                    }}
                  >
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ChefHat className="w-12 h-12 opacity-30" style={{ color: activeCategoryObj?.color ?? "#f97316" }} />
                    )}
                  </div>

                  <div className="p-4">
                    {/* Name + availability toggle */}
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-semibold text-white text-sm leading-snug line-clamp-1">
                        {item.name}
                      </h3>
                      <button
                        onClick={() => toggleAvailability(item)}
                        className="shrink-0 mt-0.5"
                        title={item.isAvailable ? "موجود — کلیک برای غیرفعال" : "ناموجود — کلیک برای فعال"}
                      >
                        {item.isAvailable ? (
                          <ToggleRight className="w-5 h-5 text-orange-400" />
                        ) : (
                          <ToggleLeft className="w-5 h-5 text-gray-500" />
                        )}
                      </button>
                    </div>

                    {/* Description */}
                    {item.description && (
                      <p className="text-gray-400 text-xs leading-relaxed line-clamp-2 mb-2">
                        {item.description}
                      </p>
                    )}

                    {/* Meta: prep time + calories */}
                    <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {item.preparationTime} دقیقه
                      </span>
                      {item.calories != null && (
                        <span className="flex items-center gap-1">
                          <Flame className="w-3 h-3" />
                          {item.calories} کال
                        </span>
                      )}
                    </div>

                    {/* Price */}
                    <div className="text-orange-400 font-bold text-sm mb-3">
                      {formatPrice(item.price)}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEditItem(item)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-white/8 hover:bg-orange-500/15 text-gray-300 hover:text-orange-400 text-xs font-medium transition-all"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        ویرایش
                      </button>
                      <button
                        onClick={() => confirmDeleteItem(item)}
                        className="flex items-center justify-center p-1.5 rounded-lg bg-white/8 hover:bg-red-500/15 text-gray-400 hover:text-red-400 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* ─── Category Modal ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {catModal.open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={(e) => e.target === e.currentTarget && setCatModal({ open: false, editing: null })}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-sm shadow-2xl"
              dir="rtl"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
                <h2 className="text-white font-semibold text-base">
                  {catModal.editing ? "ویرایش دسته‌بندی" : "دسته‌بندی جدید"}
                </h2>
                <button
                  onClick={() => setCatModal({ open: false, editing: null })}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                {/* Name */}
                <div>
                  <label className="block text-sm text-gray-300 mb-1.5">نام دسته‌بندی *</label>
                  <input
                    type="text"
                    value={catForm.name}
                    onChange={(e) => setCatForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="مثلاً: پیش‌غذا، نوشیدنی..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50 transition-all"
                  />
                </div>

                {/* Color */}
                <div>
                  <label className="block text-sm text-gray-300 mb-2">رنگ دسته‌بندی</label>
                  <div className="flex items-center gap-3 flex-wrap">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => setCatForm((f) => ({ ...f, color }))}
                        className="w-8 h-8 rounded-full transition-all duration-150 border-2"
                        style={{
                          backgroundColor: color,
                          borderColor: catForm.color === color ? "white" : "transparent",
                          transform: catForm.color === color ? "scale(1.15)" : "scale(1)",
                        }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>

                {/* Preview */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">پیش‌نمایش:</span>
                  <span
                    className="px-3 py-1 rounded-full text-white text-xs font-medium"
                    style={{ backgroundColor: catForm.color }}
                  >
                    {catForm.name || "نام دسته‌بندی"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 px-6 py-4 border-t border-white/8">
                <button
                  onClick={saveCategory}
                  disabled={savingCat}
                  className="flex-1 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-sm font-medium transition-all"
                >
                  {savingCat ? "در حال ذخیره..." : catModal.editing ? "ذخیره تغییرات" : "افزودن دسته‌بندی"}
                </button>
                <button
                  onClick={() => setCatModal({ open: false, editing: null })}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-sm font-medium transition-all"
                >
                  انصراف
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Item Modal ───────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {itemModal.open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={(e) => e.target === e.currentTarget && setItemModal({ open: false, editing: null })}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto"
              dir="rtl"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/8 sticky top-0 bg-gray-900 z-10">
                <h2 className="text-white font-semibold text-base">
                  {itemModal.editing ? "ویرایش آیتم" : "آیتم جدید"}
                </h2>
                <button
                  onClick={() => setItemModal({ open: false, editing: null })}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm text-gray-300 mb-1.5">نام آیتم *</label>
                  <input
                    type="text"
                    value={itemForm.name}
                    onChange={(e) => setItemForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="مثلاً: چلو کباب کوبیده"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50 transition-all"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm text-gray-300 mb-1.5">توضیحات</label>
                  <textarea
                    value={itemForm.description}
                    onChange={(e) => setItemForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="توضیح کوتاهی از این آیتم..."
                    rows={3}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50 transition-all resize-none"
                  />
                </div>

                {/* Price + PrepTime in row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-300 mb-1.5">قیمت (تومان) *</label>
                    <input
                      type="number"
                      value={itemForm.price}
                      onChange={(e) => setItemForm((f) => ({ ...f, price: e.target.value }))}
                      placeholder="۸۵۰۰۰"
                      min={0}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-1.5 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      زمان آماده‌سازی (دقیقه)
                    </label>
                    <input
                      type="number"
                      value={itemForm.preparationTime}
                      onChange={(e) => setItemForm((f) => ({ ...f, preparationTime: e.target.value }))}
                      placeholder="۱۵"
                      min={1}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50 transition-all"
                    />
                  </div>
                </div>

                {/* Category + Calories in row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-300 mb-1.5">دسته‌بندی *</label>
                    <select
                      value={itemForm.categoryId}
                      onChange={(e) => setItemForm((f) => ({ ...f, categoryId: e.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-orange-500/50 transition-all appearance-none"
                    >
                      <option value="" disabled className="bg-gray-900">
                        انتخاب کنید
                      </option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id} className="bg-gray-900">
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-1.5 flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5" />
                      کالری (اختیاری)
                    </label>
                    <input
                      type="number"
                      value={itemForm.calories}
                      onChange={(e) => setItemForm((f) => ({ ...f, calories: e.target.value }))}
                      placeholder="۴۵۰"
                      min={0}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50 transition-all"
                    />
                  </div>
                </div>

                {/* Allergens */}
                <div>
                  <label className="block text-sm text-gray-300 mb-1.5">آلرژن‌ها (اختیاری)</label>
                  <input
                    type="text"
                    value={itemForm.allergens}
                    onChange={(e) => setItemForm((f) => ({ ...f, allergens: e.target.value }))}
                    placeholder="مثلاً: گلوتن، لبنیات، آجیل..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50 transition-all"
                  />
                </div>

                {/* isAvailable toggle */}
                <div className="flex items-center justify-between py-2 px-4 bg-white/5 border border-white/8 rounded-xl">
                  <div>
                    <p className="text-sm text-white font-medium">موجودیت آیتم</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {itemForm.isAvailable ? "این آیتم در منو نمایش داده می‌شود" : "این آیتم مخفی است"}
                    </p>
                  </div>
                  <button
                    onClick={() => setItemForm((f) => ({ ...f, isAvailable: !f.isAvailable }))}
                    className="shrink-0"
                  >
                    {itemForm.isAvailable ? (
                      <ToggleRight className="w-8 h-8 text-orange-400" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-gray-500" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3 px-6 py-4 border-t border-white/8 sticky bottom-0 bg-gray-900">
                <button
                  onClick={saveItem}
                  disabled={savingItem}
                  className="flex-1 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white text-sm font-medium transition-all"
                >
                  {savingItem ? "در حال ذخیره..." : itemModal.editing ? "ذخیره تغییرات" : "افزودن آیتم"}
                </button>
                <button
                  onClick={() => setItemModal({ open: false, editing: null })}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-sm font-medium transition-all"
                >
                  انصراف
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Delete Confirm Modal ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={(e) => e.target === e.currentTarget && setDeleteTarget(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-sm shadow-2xl p-6"
              dir="rtl"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-xl bg-red-500/15">
                  <Trash2 className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-base">تایید حذف</h3>
                  <p className="text-gray-400 text-xs mt-0.5">
                    {deleteTarget.type === "category" ? "دسته‌بندی" : "آیتم"}
                  </p>
                </div>
              </div>
              <p className="text-gray-300 text-sm mb-6 leading-relaxed">
                آیا از حذف{" "}
                <span className="text-white font-medium">«{deleteTarget.name}»</span> مطمئن هستید؟
                {deleteTarget.type === "category" && (
                  <span className="block mt-1 text-amber-400 text-xs">
                    تمام آیتم‌های این دسته‌بندی نیز حذف خواهند شد.
                  </span>
                )}
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={executeDelete}
                  disabled={deleting}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white text-sm font-medium transition-all"
                >
                  {deleting ? "در حال حذف..." : "بله، حذف شود"}
                </button>
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-sm font-medium transition-all"
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
