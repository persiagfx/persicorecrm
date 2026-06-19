"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ShoppingCart, Plus, Search, Package, CheckCircle2, Clock, X, Pencil, Trash2, ChevronDown } from "lucide-react";
import { formatPrice, toJalali } from "@/lib/utils";
import { StatCard } from "@/components/common/StatCard";
import { apiClient } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────────────────────────

type POStatus = "draft" | "sent" | "confirmed" | "received" | "cancelled";

interface POItem {
  id?: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
}

interface Supplier {
  id: string;
  name: string;
}

interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplier?: { id: string; name: string };
  orderDate: string;
  expectedDelivery: string;
  status: POStatus;
  notes?: string;
  items: POItem[];
  totalAmount: number;
  createdAt: string;
}

// ─── Status Config ────────────────────────────────────────────────────────────

const STATUS_CFG: Record<POStatus, { label: string; icon: React.ElementType; color: string; bg: string; border: string }> = {
  draft:     { label: "پیش‌نویس",     icon: Pencil,        color: "text-slate-400",    bg: "bg-slate-500/10",    border: "border-slate-500/20" },
  sent:      { label: "ارسال شده",    icon: ShoppingCart,  color: "text-blue-400",     bg: "bg-blue-500/10",     border: "border-blue-500/20" },
  confirmed: { label: "تایید شده",    icon: CheckCircle2,  color: "text-emerald-400",  bg: "bg-emerald-500/10",  border: "border-emerald-500/20" },
  received:  { label: "دریافت شده",   icon: Package,       color: "text-violet-400",   bg: "bg-violet-500/10",   border: "border-violet-500/20" },
  cancelled: { label: "لغو شده",      icon: X,             color: "text-red-400",      bg: "bg-red-500/10",      border: "border-red-500/20" },
};

const STATUS_WORKFLOW: Partial<Record<POStatus, POStatus>> = {
  draft: "sent",
  sent: "confirmed",
  confirmed: "received",
};

function calcTotal(items: POItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
}

// ─── Create PO Modal ──────────────────────────────────────────────────────────

interface CreateModalProps {
  onClose: () => void;
  onSave: (po: PurchaseOrder) => void;
  suppliers: Supplier[];
}

function CreatePOModal({ onClose, onSave, suppliers }: CreateModalProps) {
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id ?? "");
  const [expectedDelivery, setExpectedDelivery] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState<POItem[]>([{ itemName: "", quantity: 1, unitPrice: 0 }]);

  const addItem = () => setItems((prev) => [...prev, { itemName: "", quantity: 1, unitPrice: 0 }]);
  const removeItem = (idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx));
  const updateItem = (idx: number, field: keyof POItem, value: string | number) => {
    setItems((prev) => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  };

  const total = calcTotal(items);
  const canSubmit = supplierId && expectedDelivery && items.every((it) => it.itemName.trim() && it.quantity > 0 && it.unitPrice >= 0);

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSaving(true);
    try {
      const res = await apiClient.post("/purchase-orders", {
        supplierId,
        expectedDelivery,
        notes: notes.trim() || undefined,
        items: items.map((it) => ({ itemName: it.itemName.trim(), quantity: Number(it.quantity), unitPrice: Number(it.unitPrice) })),
      });
      onSave(res.data.data);
      toast.success("سفارش خرید ایجاد شد");
      onClose();
    } catch {
      toast.error("خطا در ایجاد سفارش خرید");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <h2 className="font-bold text-foreground flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-blue-400" />
            ایجاد سفارش خرید جدید
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-6 space-y-5">
          {/* Supplier + delivery */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">تامین‌کننده *</label>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              >
                {suppliers.length === 0 && <option value="">تامین‌کننده‌ای یافت نشد</option>}
                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">تاریخ تحویل مورد انتظار *</label>
              <input
                type="date"
                value={expectedDelivery}
                onChange={(e) => setExpectedDelivery(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              />
            </div>
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-foreground">اقلام سفارش *</label>
              <button
                onClick={addItem}
                className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 px-2 py-1 rounded-lg hover:bg-blue-500/10 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                افزودن ردیف
              </button>
            </div>
            <div className="rounded-xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="text-right px-3 py-2 text-xs font-semibold text-muted-foreground">نام کالا</th>
                    <th className="text-right px-3 py-2 text-xs font-semibold text-muted-foreground w-24">تعداد</th>
                    <th className="text-right px-3 py-2 text-xs font-semibold text-muted-foreground w-32">قیمت واحد</th>
                    <th className="text-right px-3 py-2 text-xs font-semibold text-muted-foreground w-28">جمع</th>
                    <th className="w-10" />
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={idx} className="border-b border-border/50 last:border-0">
                      <td className="px-2 py-2">
                        <input
                          value={item.itemName}
                          onChange={(e) => updateItem(idx, "itemName", e.target.value)}
                          placeholder="نام کالا یا خدمت..."
                          className="w-full px-3 py-1.5 rounded-lg bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-1 focus:ring-blue-500/40"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) => updateItem(idx, "quantity", Number(e.target.value))}
                          className="w-full px-3 py-1.5 rounded-lg bg-muted border border-border text-foreground text-sm text-center focus:outline-none focus:ring-1 focus:ring-blue-500/40"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          min={0}
                          value={item.unitPrice}
                          onChange={(e) => updateItem(idx, "unitPrice", Number(e.target.value))}
                          className="w-full px-3 py-1.5 rounded-lg bg-muted border border-border text-foreground text-sm text-left focus:outline-none focus:ring-1 focus:ring-blue-500/40"
                          dir="ltr"
                        />
                      </td>
                      <td className="px-3 py-2 text-xs text-muted-foreground tabular-nums">
                        {formatPrice(item.quantity * item.unitPrice, true)}
                      </td>
                      <td className="px-2 py-2">
                        {items.length > 1 && (
                          <button
                            onClick={() => removeItem(idx)}
                            className="p-1 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end mt-2">
              <span className="text-sm font-semibold text-foreground">
                جمع کل: <span className="text-blue-400">{formatPrice(total)}</span>
              </span>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">یادداشت</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="توضیحات اختیاری..."
              className="w-full px-4 py-2.5 rounded-xl bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-border shrink-0">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border bg-muted text-foreground text-sm hover:bg-muted/80 transition-colors">
            انصراف
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || saving}
            className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? "در حال ذخیره..." : "ایجاد سفارش"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────

interface DetailModalProps {
  po: PurchaseOrder;
  onClose: () => void;
  onStatusChange: (id: string, status: POStatus) => void;
}

function DetailModal({ po, onClose, onStatusChange }: DetailModalProps) {
  const cfg = STATUS_CFG[po.status];
  const nextStatus = STATUS_WORKFLOW[po.status];
  const nextCfg = nextStatus ? STATUS_CFG[nextStatus] : null;
  const [advancing, setAdvancing] = useState(false);

  const handleAdvance = async () => {
    if (!nextStatus) return;
    setAdvancing(true);
    try {
      await apiClient.put(`/purchase-orders/${po.id}`, { status: nextStatus });
      onStatusChange(po.id, nextStatus);
      toast.success(`وضعیت به "${STATUS_CFG[nextStatus].label}" تغییر یافت`);
      onClose();
    } catch {
      toast.error("خطا در تغییر وضعیت");
    } finally {
      setAdvancing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div>
            <h2 className="font-bold text-foreground flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-blue-400" />
              {po.poNumber}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">{po.supplier?.name ?? "—"}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn("flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border", cfg.bg, cfg.color, cfg.border)}>
              <cfg.icon className="w-3 h-3" />{cfg.label}
            </span>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted text-muted-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-6 space-y-5">
          {/* Meta */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground block mb-0.5">تاریخ سفارش</span>
              <span className="font-medium text-foreground">{toJalali(po.orderDate)}</span>
            </div>
            <div>
              <span className="text-muted-foreground block mb-0.5">تحویل مورد انتظار</span>
              <span className="font-medium text-foreground">{toJalali(po.expectedDelivery)}</span>
            </div>
          </div>

          {po.notes && (
            <div className="p-3 rounded-xl bg-muted/50 border border-border text-sm text-muted-foreground">
              {po.notes}
            </div>
          )}

          {/* Items table */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-2">اقلام سفارش</h3>
            <div className="rounded-xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="text-right px-3 py-2 text-xs font-semibold text-muted-foreground">نام کالا</th>
                    <th className="text-right px-3 py-2 text-xs font-semibold text-muted-foreground w-16">تعداد</th>
                    <th className="text-right px-3 py-2 text-xs font-semibold text-muted-foreground w-28">قیمت واحد</th>
                    <th className="text-right px-3 py-2 text-xs font-semibold text-muted-foreground w-28">جمع</th>
                  </tr>
                </thead>
                <tbody>
                  {(po.items ?? []).map((item, idx) => (
                    <tr key={item.id ?? idx} className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-3 py-2.5 text-foreground">{item.itemName}</td>
                      <td className="px-3 py-2.5 text-muted-foreground text-center tabular-nums">
                        {item.quantity.toLocaleString("fa-IR")}
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground tabular-nums">
                        {formatPrice(item.unitPrice, true)}
                      </td>
                      <td className="px-3 py-2.5 font-medium text-foreground tabular-nums">
                        {formatPrice(item.quantity * item.unitPrice, true)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Total */}
          <div className="flex justify-between items-center p-4 rounded-xl bg-blue-500/5 border border-blue-500/20">
            <span className="text-sm font-medium text-foreground">جمع کل سفارش</span>
            <span className="text-lg font-bold text-blue-400">{formatPrice(po.totalAmount ?? calcTotal(po.items ?? []))}</span>
          </div>
        </div>

        {/* Footer */}
        {nextStatus && nextCfg && (
          <div className="px-6 py-4 border-t border-border shrink-0">
            <button
              onClick={handleAdvance}
              disabled={advancing}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              <nextCfg.icon className="w-4 h-4" />
              {advancing ? "در حال پردازش..." : `تغییر وضعیت به "${nextCfg.label}"`}
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PurchaseOrdersPage() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<POStatus | "all">("all");
  const [showCreate, setShowCreate] = useState(false);
  const [detailPO, setDetailPO] = useState<PurchaseOrder | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [ordersRes, suppliersRes] = await Promise.all([
        apiClient.get("/purchase-orders?perPage=100"),
        apiClient.get("/suppliers?perPage=200"),
      ]);
      setOrders(ordersRes.data.data ?? []);
      setSuppliers(suppliersRes.data.data ?? []);
    } catch {
      toast.error("خطا در بارگذاری سفارش‌های خرید");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await apiClient.delete(`/purchase-orders/${id}`);
      setOrders((prev) => prev.filter((o) => o.id !== id));
      toast.success("سفارش خرید حذف شد");
    } catch {
      toast.error("خطا در حذف سفارش");
    }
  };

  const handleStatusChange = (id: string, status: POStatus) => {
    setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status } : o));
  };

  const filtered = orders.filter((o) => {
    const matchSearch = !search || o.poNumber.toLowerCase().includes(search.toLowerCase()) || (o.supplier?.name ?? "").includes(search);
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Stats
  const totalCount = orders.length;
  const pendingCount = orders.filter((o) => o.status === "draft" || o.status === "sent").length;
  const totalValue = orders.reduce((sum, o) => sum + (o.totalAmount ?? calcTotal(o.items ?? [])), 0);
  const receivedCount = orders.filter((o) => o.status === "received").length;

  return (
    <div className="space-y-6" dir="rtl">
      {/* Page header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-blue-400" />
            سفارش‌های خرید
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">{orders.length.toLocaleString("fa-IR")} سفارش ثبت‌شده</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          سفارش جدید
        </button>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="کل سفارش‌ها" value={totalCount} icon={ShoppingCart} gradient="bg-blue-500/10" />
        <StatCard title="در انتظار تایید" value={pendingCount} icon={Clock} gradient="bg-amber-500/10" />
        <StatCard title="ارزش کل سفارش‌ها" value={totalValue} icon={Package} prefix="" suffix=" تومان" gradient="bg-violet-500/10" />
        <StatCard title="دریافت‌شده" value={receivedCount} icon={CheckCircle2} gradient="bg-emerald-500/10" />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="جستجو در سفارش‌ها..."
            className="w-full pr-10 pl-4 py-2.5 rounded-xl bg-card border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40"
          />
        </div>

        {/* Status filter tabs */}
        <div className="flex items-center gap-1 p-1 bg-muted rounded-xl">
          {(["all", "draft", "sent", "confirmed", "received", "cancelled"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                "px-3 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap",
                statusFilter === s ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {s === "all" ? "همه" : STATUS_CFG[s].label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-12 rounded-xl bg-muted animate-pulse" />)}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {["شماره سفارش", "تامین‌کننده", "تاریخ سفارش", "تاریخ تحویل", "تعداد اقلام", "مبلغ کل", "وضعیت", ""].map((h) => (
                  <th key={h} className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((po) => {
                const cfg = STATUS_CFG[po.status];
                const itemCount = (po.items ?? []).length;
                const total = po.totalAmount ?? calcTotal(po.items ?? []);
                return (
                  <tr
                    key={po.id}
                    onClick={() => setDetailPO(po)}
                    className="border-b border-border/50 hover:bg-muted/30 transition-colors group cursor-pointer"
                  >
                    <td className="px-4 py-3 font-mono font-medium text-blue-400 text-xs">{po.poNumber}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center text-[10px] font-bold text-blue-400 shrink-0">
                          {(po.supplier?.name ?? "?").slice(0, 1)}
                        </div>
                        <span className="font-medium text-foreground">{po.supplier?.name ?? "—"}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{toJalali(po.orderDate)}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{toJalali(po.expectedDelivery)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold">
                        {itemCount.toLocaleString("fa-IR")}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-foreground tabular-nums">{formatPrice(total, true)}</td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        "flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border w-fit",
                        cfg.bg, cfg.color, cfg.border
                      )}>
                        <cfg.icon className="w-3 h-3" />
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div
                        className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={(e) => { e.stopPropagation(); setDetailPO(po); }}
                          className="p-1.5 rounded-lg hover:bg-blue-500/10 text-muted-foreground hover:text-blue-400 transition-colors"
                          title="مشاهده جزئیات"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                        {po.status === "draft" && (
                          <button
                            onClick={(e) => handleDelete(po.id, e)}
                            className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"
                            title="حذف"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground text-sm">
                    <div className="flex flex-col items-center gap-2">
                      <ShoppingCart className="w-8 h-8 text-muted-foreground/30" />
                      <span>سفارش خریدی یافت نشد</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showCreate && (
          <CreatePOModal
            suppliers={suppliers}
            onClose={() => setShowCreate(false)}
            onSave={(po) => setOrders((prev) => [po, ...prev])}
          />
        )}
        {detailPO && (
          <DetailModal
            po={detailPO}
            onClose={() => setDetailPO(null)}
            onStatusChange={handleStatusChange}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
