"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ShoppingCart,
  Plus,
  Minus,
  Search,
  Clock,
  CheckCircle2,
  X,
  Trash2,
  Receipt,
  UtensilsCrossed,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { apiClient } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

type OrderStatus = "pending" | "preparing" | "ready" | "served" | "paid";

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category?: string;
  available?: boolean;
}

interface Table {
  id: string;
  number: number | string;
  capacity?: number;
  status?: string;
}

interface OrderItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  id: string;
  tableId: string;
  tableNumber?: number | string;
  items: OrderItem[];
  status: OrderStatus;
  total: number;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; color: string; bg: string; border: string; next?: OrderStatus }
> = {
  pending: {
    label: "در انتظار",
    color: "text-amber-400",
    bg: "bg-amber-500/15",
    border: "border-amber-500/30",
    next: "preparing",
  },
  preparing: {
    label: "در حال آماده‌سازی",
    color: "text-blue-400",
    bg: "bg-blue-500/15",
    border: "border-blue-500/30",
    next: "ready",
  },
  ready: {
    label: "آماده سرو",
    color: "text-emerald-400",
    bg: "bg-emerald-500/15",
    border: "border-emerald-500/30",
    next: "served",
  },
  served: {
    label: "سرو شده",
    color: "text-purple-400",
    bg: "bg-purple-500/15",
    border: "border-purple-500/30",
    next: "paid",
  },
  paid: {
    label: "پرداخت شده",
    color: "text-slate-400",
    bg: "bg-slate-500/15",
    border: "border-slate-500/30",
  },
};

const ALL_STATUSES: (OrderStatus | "all")[] = [
  "all",
  "pending",
  "preparing",
  "ready",
  "served",
  "paid",
];

const STATUS_TAB_LABELS: Record<OrderStatus | "all", string> = {
  all: "همه",
  pending: "در انتظار",
  preparing: "در آماده‌سازی",
  ready: "آماده",
  served: "سرو شده",
  paid: "پرداخت شده",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeElapsed(createdAt: string): string {
  const diff = Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000);
  if (diff < 60) return `${diff} ثانیه`;
  const mins = Math.floor(diff / 60);
  if (mins < 60) return `${mins} دقیقه`;
  const hrs = Math.floor(mins / 60);
  return `${hrs} ساعت و ${mins % 60} دقیقه`;
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: OrderStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border",
        cfg.bg,
        cfg.color,
        cfg.border
      )}
    >
      {cfg.label}
    </span>
  );
}

// ─── Order Card ───────────────────────────────────────────────────────────────

function OrderCard({
  order,
  onClick,
}: {
  order: Order;
  onClick: () => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 cursor-pointer hover:border-[var(--primary)]/40 hover:shadow-lg hover:shadow-[var(--primary)]/5 transition-all"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center">
            <Receipt className="w-4 h-4 text-[var(--primary)]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--foreground)]">
              سفارش #{order.id.slice(-5).toUpperCase()}
            </p>
            <p className="text-xs text-[var(--muted-foreground)]">
              میز {order.tableNumber ?? order.tableId}
            </p>
          </div>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-[var(--muted-foreground)]">
          {order.items.length} آیتم
        </span>
        <span className="font-semibold text-[var(--foreground)]">
          {formatPrice(order.total)}
        </span>
      </div>

      <div className="flex items-center gap-1.5 mt-2 text-xs text-[var(--muted-foreground)]">
        <Clock className="w-3.5 h-3.5" />
        <span>{timeElapsed(order.createdAt)} پیش</span>
      </div>
    </motion.div>
  );
}

// ─── Edit Order Modal ─────────────────────────────────────────────────────────

function EditOrderModal({
  order,
  menuItems,
  onClose,
  onUpdated,
}: {
  order: Order;
  menuItems: MenuItem[];
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [status, setStatus] = useState<OrderStatus>(order.status);
  const [items, setItems] = useState<OrderItem[]>(order.items);
  const [search, setSearch] = useState("");
  const [notes, setNotes] = useState(order.notes ?? "");
  const [saving, setSaving] = useState(false);

  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);

  const filteredMenu = menuItems.filter(
    (m) =>
      m.name.includes(search) &&
      !items.find((i) => i.menuItemId === m.id)
  );

  function addItem(menuItem: MenuItem) {
    setItems((prev) => [
      ...prev,
      { menuItemId: menuItem.id, name: menuItem.name, price: menuItem.price, quantity: 1 },
    ]);
    setSearch("");
  }

  function changeQty(menuItemId: string, delta: number) {
    setItems((prev) =>
      prev
        .map((i) =>
          i.menuItemId === menuItemId
            ? { ...i, quantity: i.quantity + delta }
            : i
        )
        .filter((i) => i.quantity > 0)
    );
  }

  function removeItem(menuItemId: string) {
    setItems((prev) => prev.filter((i) => i.menuItemId !== menuItemId));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await apiClient.put(`/restaurant/orders/${order.id}`, {
        status,
        items,
        notes,
        total,
      });
      toast.success("سفارش با موفقیت ویرایش شد");
      onUpdated();
      onClose();
    } catch {
      toast.error("خطا در ویرایش سفارش");
    } finally {
      setSaving(false);
    }
  }

  const statusFlow: OrderStatus[] = ["pending", "preparing", "ready", "served", "paid"];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[var(--card)] border border-[var(--border)] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
          <div>
            <h2 className="text-lg font-bold text-[var(--foreground)]">
              ویرایش سفارش #{order.id.slice(-5).toUpperCase()}
            </h2>
            <p className="text-sm text-[var(--muted-foreground)]">
              میز {order.tableNumber ?? order.tableId}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--muted)] text-[var(--muted-foreground)] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Status Flow */}
          <div>
            <p className="text-sm font-medium text-[var(--muted-foreground)] mb-2">وضعیت سفارش</p>
            <div className="flex flex-wrap gap-2">
              {statusFlow.map((s) => {
                const cfg = STATUS_CONFIG[s];
                const isActive = status === s;
                return (
                  <button
                    key={s}
                    onClick={() => setStatus(s)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                      isActive
                        ? cn(cfg.bg, cfg.color, cfg.border)
                        : "border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--primary)]/40"
                    )}
                  >
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Add items */}
          <div>
            <p className="text-sm font-medium text-[var(--muted-foreground)] mb-2">افزودن آیتم</p>
            <div className="relative mb-2">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="جستجوی آیتم منو..."
                className="w-full bg-[var(--muted)]/30 border border-[var(--border)] rounded-lg pr-9 pl-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:border-[var(--primary)]/50"
              />
            </div>
            {search && filteredMenu.length > 0 && (
              <div className="border border-[var(--border)] rounded-lg overflow-hidden divide-y divide-[var(--border)] max-h-40 overflow-y-auto">
                {filteredMenu.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => addItem(item)}
                    className="w-full flex items-center justify-between px-3 py-2 hover:bg-[var(--muted)]/40 text-sm transition-colors"
                  >
                    <span className="text-[var(--foreground)]">{item.name}</span>
                    <span className="text-[var(--primary)] font-medium">
                      {formatPrice(item.price)}
                    </span>
                  </button>
                ))}
              </div>
            )}
            {search && filteredMenu.length === 0 && (
              <p className="text-xs text-[var(--muted-foreground)] text-center py-2">
                آیتمی یافت نشد
              </p>
            )}
          </div>

          {/* Current items */}
          <div>
            <p className="text-sm font-medium text-[var(--muted-foreground)] mb-2">آیتم‌های سفارش</p>
            {items.length === 0 ? (
              <p className="text-xs text-[var(--muted-foreground)] text-center py-4">
                هیچ آیتمی اضافه نشده
              </p>
            ) : (
              <div className="space-y-2">
                {items.map((item) => (
                  <div
                    key={item.menuItemId}
                    className="flex items-center gap-3 p-2.5 bg-[var(--muted)]/20 rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[var(--foreground)] truncate">{item.name}</p>
                      <p className="text-xs text-[var(--muted-foreground)]">
                        {formatPrice(item.price)} × {item.quantity}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => changeQty(item.menuItemId, -1)}
                        className="w-7 h-7 rounded-lg bg-[var(--muted)]/40 flex items-center justify-center hover:bg-[var(--muted)] transition-colors"
                      >
                        <Minus className="w-3 h-3 text-[var(--muted-foreground)]" />
                      </button>
                      <span className="w-5 text-center text-sm font-medium text-[var(--foreground)]">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => changeQty(item.menuItemId, 1)}
                        className="w-7 h-7 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center hover:bg-[var(--primary)]/20 transition-colors"
                      >
                        <Plus className="w-3 h-3 text-[var(--primary)]" />
                      </button>
                      <button
                        onClick={() => removeItem(item.menuItemId)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-500/15 text-[var(--muted-foreground)] hover:text-red-400 transition-colors mr-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="text-sm font-medium text-[var(--muted-foreground)] block mb-1.5">
              یادداشت
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="توضیحات اضافی..."
              className="w-full bg-[var(--muted)]/30 border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:border-[var(--primary)]/50 resize-none"
            />
          </div>

          {/* Total + Save */}
          <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
            <div>
              <p className="text-xs text-[var(--muted-foreground)]">جمع کل</p>
              <p className="text-lg font-bold text-[var(--foreground)]">{formatPrice(total)}</p>
            </div>
            <button
              onClick={handleSave}
              disabled={saving || items.length === 0}
              className="px-5 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary)]/90 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-all flex items-center gap-2"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              ذخیره تغییرات
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function RestaurantOrdersPage() {
  // Data state
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter
  const [activeTab, setActiveTab] = useState<OrderStatus | "all">("all");

  // New order form
  const [selectedTableId, setSelectedTableId] = useState("");
  const [menuSearch, setMenuSearch] = useState("");
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [orderNotes, setOrderNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Edit modal
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  // ── Fetch data ─────────────────────────────────────────────────────────────

  const fetchOrders = useCallback(async () => {
    try {
      const res = await apiClient.get("/restaurant/orders");
      const data: Order[] = res.data?.data ?? res.data ?? [];
      setOrders(data);
    } catch {
      // silent — show empty state
    }
  }, []);

  const fetchMenuItems = useCallback(async () => {
    try {
      const res = await apiClient.get("/restaurant/menu-items");
      const data: MenuItem[] = res.data?.data ?? res.data ?? [];
      setMenuItems(data.filter((m) => m.available !== false));
    } catch {
      // silent
    }
  }, []);

  const fetchTables = useCallback(async () => {
    try {
      const res = await apiClient.get("/restaurant/tables");
      const data: Table[] = res.data?.data ?? res.data ?? [];
      setTables(data);
      if (data.length > 0 && !selectedTableId) {
        setSelectedTableId(data[0].id);
      }
    } catch {
      // silent
    }
  }, [selectedTableId]);

  useEffect(() => {
    Promise.all([fetchOrders(), fetchMenuItems(), fetchTables()]).finally(() =>
      setLoading(false)
    );
  }, [fetchOrders, fetchMenuItems, fetchTables]);

  // ── Filtered orders ────────────────────────────────────────────────────────

  const filteredOrders =
    activeTab === "all"
      ? orders
      : orders.filter((o) => o.status === activeTab);

  const tabCounts = ALL_STATUSES.reduce<Record<string, number>>((acc, s) => {
    acc[s] =
      s === "all" ? orders.length : orders.filter((o) => o.status === s).length;
    return acc;
  }, {});

  // ── New order form helpers ─────────────────────────────────────────────────

  const filteredMenuItems = menuItems.filter(
    (m) =>
      m.name.includes(menuSearch) &&
      !orderItems.find((i) => i.menuItemId === m.id)
  );

  function addToOrder(item: MenuItem) {
    setOrderItems((prev) => [
      ...prev,
      { menuItemId: item.id, name: item.name, price: item.price, quantity: 1 },
    ]);
    setMenuSearch("");
  }

  function changeOrderQty(menuItemId: string, delta: number) {
    setOrderItems((prev) =>
      prev
        .map((i) =>
          i.menuItemId === menuItemId
            ? { ...i, quantity: i.quantity + delta }
            : i
        )
        .filter((i) => i.quantity > 0)
    );
  }

  function removeOrderItem(menuItemId: string) {
    setOrderItems((prev) => prev.filter((i) => i.menuItemId !== menuItemId));
  }

  const orderTotal = orderItems.reduce((s, i) => s + i.price * i.quantity, 0);

  async function handleSubmitOrder() {
    if (!selectedTableId) {
      toast.error("لطفاً یک میز انتخاب کنید");
      return;
    }
    if (orderItems.length === 0) {
      toast.error("لطفاً حداقل یک آیتم اضافه کنید");
      return;
    }
    setSubmitting(true);
    try {
      const table = tables.find((t) => t.id === selectedTableId);
      await apiClient.post("/restaurant/orders", {
        tableId: selectedTableId,
        tableNumber: table?.number,
        items: orderItems,
        total: orderTotal,
        notes: orderNotes,
        status: "pending",
      });
      toast.success("سفارش با موفقیت ثبت شد");
      setOrderItems([]);
      setOrderNotes("");
      if (tables.length > 0) setSelectedTableId(tables[0].id);
      await fetchOrders();
    } catch {
      toast.error("خطا در ثبت سفارش");
    } finally {
      setSubmitting(false);
    }
  }

  // ── Delete order ───────────────────────────────────────────────────────────

  async function handleDeleteOrder(orderId: string) {
    try {
      await apiClient.delete(`/restaurant/orders/${orderId}`);
      toast.success("سفارش حذف شد");
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
    } catch {
      toast.error("خطا در حذف سفارش");
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[var(--background)]" dir="rtl">
      {/* Page header */}
      <div className="border-b border-[var(--border)] bg-[var(--card)]/50 backdrop-blur-sm px-6 py-4">
        <div className="max-w-[1400px] mx-auto flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center">
            <UtensilsCrossed className="w-5 h-5 text-[var(--primary)]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--foreground)]">سفارش‌گیری رستوران</h1>
            <p className="text-sm text-[var(--muted-foreground)]">مدیریت سفارش‌های میزها</p>
          </div>
          <div className="mr-auto flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
            <span className="font-semibold text-[var(--foreground)]">{orders.length}</span>
            سفارش فعال
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-[var(--primary)]/30 border-t-[var(--primary)] rounded-full animate-spin" />
          </div>
        ) : (
          <div className="flex gap-6">
            {/* ── Left panel: Active orders (2/3) ─────────────────────────── */}
            <div className="flex-1 min-w-0">
              {/* Status filter tabs */}
              <div className="flex items-center gap-1 mb-4 bg-[var(--card)] border border-[var(--border)] rounded-xl p-1 overflow-x-auto">
                {ALL_STATUSES.map((s) => (
                  <button
                    key={s}
                    onClick={() => setActiveTab(s)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap",
                      activeTab === s
                        ? "bg-[var(--primary)] text-white shadow-sm"
                        : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]/40"
                    )}
                  >
                    {STATUS_TAB_LABELS[s]}
                    {tabCounts[s] > 0 && (
                      <span
                        className={cn(
                          "px-1.5 py-0.5 rounded-full text-[10px] font-bold",
                          activeTab === s
                            ? "bg-white/20 text-white"
                            : "bg-[var(--muted)]/50 text-[var(--muted-foreground)]"
                        )}
                      >
                        {tabCounts[s]}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Orders grid */}
              {filteredOrders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-[var(--muted)]/30 flex items-center justify-center mb-4">
                    <Receipt className="w-7 h-7 text-[var(--muted-foreground)]" />
                  </div>
                  <p className="text-[var(--muted-foreground)] text-sm">هیچ سفارشی یافت نشد</p>
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                    {filteredOrders.map((order) => (
                      <div key={order.id} className="relative group">
                        <OrderCard
                          order={order}
                          onClick={() => setEditingOrder(order)}
                        />
                        {/* Quick action: advance status */}
                        {order.status !== "paid" && (
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              const nextStatus = STATUS_CONFIG[order.status].next;
                              if (!nextStatus) return;
                              try {
                                await apiClient.put(
                                  `/restaurant/orders/${order.id}`,
                                  { status: nextStatus }
                                );
                                toast.success(
                                  `وضعیت به "${STATUS_CONFIG[nextStatus].label}" تغییر یافت`
                                );
                                await fetchOrders();
                              } catch {
                                toast.error("خطا در تغییر وضعیت");
                              }
                            }}
                            className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white text-[10px] font-semibold px-2 py-1 rounded-lg"
                          >
                            {STATUS_CONFIG[STATUS_CONFIG[order.status].next!]?.label ?? ""}
                          </button>
                        )}
                        {/* Delete button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteOrder(order.id);
                          }}
                          className="absolute bottom-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 bg-red-500/15 hover:bg-red-500/25 text-red-400 rounded-lg flex items-center justify-center"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </AnimatePresence>
              )}
            </div>

            {/* ── Right panel: New order form (1/3) ───────────────────────── */}
            <div className="w-80 shrink-0">
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden sticky top-6">
                {/* Panel header */}
                <div className="px-4 py-3.5 border-b border-[var(--border)] flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-[var(--primary)]" />
                  <h2 className="text-sm font-bold text-[var(--foreground)]">سفارش جدید</h2>
                </div>

                <div className="p-4 space-y-4">
                  {/* Table select */}
                  <div>
                    <label className="text-xs font-medium text-[var(--muted-foreground)] block mb-1.5">
                      انتخاب میز
                    </label>
                    {tables.length === 0 ? (
                      <p className="text-xs text-[var(--muted-foreground)] bg-[var(--muted)]/20 rounded-lg px-3 py-2">
                        میزی تعریف نشده
                      </p>
                    ) : (
                      <select
                        value={selectedTableId}
                        onChange={(e) => setSelectedTableId(e.target.value)}
                        className="w-full bg-[var(--muted)]/30 border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--primary)]/50"
                      >
                        {tables.map((t) => (
                          <option key={t.id} value={t.id}>
                            میز {t.number}
                            {t.capacity ? ` (${t.capacity} نفره)` : ""}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Menu search */}
                  <div>
                    <label className="text-xs font-medium text-[var(--muted-foreground)] block mb-1.5">
                      افزودن از منو
                    </label>
                    <div className="relative mb-1">
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--muted-foreground)]" />
                      <input
                        type="text"
                        value={menuSearch}
                        onChange={(e) => setMenuSearch(e.target.value)}
                        placeholder="جستجوی آیتم..."
                        className="w-full bg-[var(--muted)]/30 border border-[var(--border)] rounded-lg pr-9 pl-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:border-[var(--primary)]/50"
                      />
                    </div>

                    {/* Dropdown results */}
                    <AnimatePresence>
                      {menuSearch && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          className="border border-[var(--border)] rounded-lg overflow-hidden divide-y divide-[var(--border)] max-h-48 overflow-y-auto"
                        >
                          {filteredMenuItems.length === 0 ? (
                            <p className="text-xs text-[var(--muted-foreground)] text-center py-3">
                              آیتمی یافت نشد
                            </p>
                          ) : (
                            filteredMenuItems.map((item) => (
                              <button
                                key={item.id}
                                onClick={() => addToOrder(item)}
                                className="w-full flex items-center justify-between px-3 py-2 hover:bg-[var(--muted)]/30 transition-colors text-sm"
                              >
                                <span className="text-[var(--foreground)] text-right">
                                  {item.name}
                                </span>
                                <span className="text-[var(--primary)] font-medium text-xs whitespace-nowrap mr-2">
                                  {formatPrice(item.price)}
                                </span>
                              </button>
                            ))
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* No menu items at all */}
                    {menuItems.length === 0 && !menuSearch && (
                      <p className="text-xs text-[var(--muted-foreground)] text-center py-2">
                        منویی تعریف نشده
                      </p>
                    )}
                  </div>

                  {/* Order items list */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-medium text-[var(--muted-foreground)]">
                        آیتم‌های سفارش
                      </label>
                      {orderItems.length > 0 && (
                        <button
                          onClick={() => setOrderItems([])}
                          className="text-[10px] text-red-400 hover:text-red-300 transition-colors"
                        >
                          پاک کردن همه
                        </button>
                      )}
                    </div>

                    {orderItems.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-6 bg-[var(--muted)]/10 rounded-xl border border-dashed border-[var(--border)]">
                        <ShoppingCart className="w-6 h-6 text-[var(--muted-foreground)]/50 mb-1.5" />
                        <p className="text-xs text-[var(--muted-foreground)]">
                          آیتمی انتخاب نشده
                        </p>
                      </div>
                    ) : (
                      <AnimatePresence mode="popLayout">
                        <div className="space-y-1.5 max-h-52 overflow-y-auto">
                          {orderItems.map((item) => (
                            <motion.div
                              key={item.menuItemId}
                              layout
                              initial={{ opacity: 0, x: 8 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 8 }}
                              className="flex items-center gap-2 p-2 bg-[var(--muted)]/20 rounded-lg"
                            >
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-[var(--foreground)] truncate">
                                  {item.name}
                                </p>
                                <p className="text-[10px] text-[var(--muted-foreground)]">
                                  {formatPrice(item.price * item.quantity)}
                                </p>
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => changeOrderQty(item.menuItemId, -1)}
                                  className="w-6 h-6 rounded bg-[var(--muted)]/40 flex items-center justify-center hover:bg-[var(--muted)] transition-colors"
                                >
                                  <Minus className="w-2.5 h-2.5 text-[var(--muted-foreground)]" />
                                </button>
                                <span className="w-4 text-center text-xs font-medium text-[var(--foreground)]">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() => changeOrderQty(item.menuItemId, 1)}
                                  className="w-6 h-6 rounded bg-[var(--primary)]/10 flex items-center justify-center hover:bg-[var(--primary)]/20 transition-colors"
                                >
                                  <Plus className="w-2.5 h-2.5 text-[var(--primary)]" />
                                </button>
                                <button
                                  onClick={() => removeOrderItem(item.menuItemId)}
                                  className="w-6 h-6 rounded flex items-center justify-center hover:bg-red-500/15 text-[var(--muted-foreground)] hover:text-red-400 transition-colors"
                                >
                                  <X className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </AnimatePresence>
                    )}
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="text-xs font-medium text-[var(--muted-foreground)] block mb-1.5">
                      یادداشت
                    </label>
                    <textarea
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                      rows={2}
                      placeholder="توضیحات سفارش..."
                      className="w-full bg-[var(--muted)]/30 border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:border-[var(--primary)]/50 resize-none"
                    />
                  </div>

                  {/* Total */}
                  {orderItems.length > 0 && (
                    <div className="flex items-center justify-between px-3 py-2.5 bg-[var(--primary)]/5 border border-[var(--primary)]/20 rounded-xl">
                      <span className="text-xs text-[var(--muted-foreground)]">جمع کل</span>
                      <span className="text-sm font-bold text-[var(--foreground)]">
                        {formatPrice(orderTotal)}
                      </span>
                    </div>
                  )}

                  {/* Submit */}
                  <button
                    onClick={handleSubmitOrder}
                    disabled={submitting || orderItems.length === 0 || !selectedTableId}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary)]/90 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold transition-all"
                  >
                    {submitting ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4" />
                    )}
                    ثبت سفارش
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Edit Order Modal ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {editingOrder && (
          <EditOrderModal
            order={editingOrder}
            menuItems={menuItems}
            onClose={() => setEditingOrder(null)}
            onUpdated={fetchOrders}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
