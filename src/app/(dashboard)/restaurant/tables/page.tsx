"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { TableProperties, Plus, Users, CheckCircle2, XCircle, Clock, Brush, X, Pencil, Trash2 } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

type TableStatus = "available" | "occupied" | "reserved" | "cleaning";
type TableLocation = "گوشه" | "وسط" | "پنجره" | "تراس";

interface RestaurantTable {
  id: string;
  tableNumber: number;
  capacity: number;
  location: TableLocation;
  status: TableStatus;
  currentOrder?: {
    id: string;
    items: string[];
    total: number;
    startedAt: string;
  };
  reservation?: {
    id: string;
    guestName: string;
    guestCount: number;
    reservedAt: string;
    phone?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface TableFormData {
  tableNumber: string;
  capacity: string;
  location: TableLocation;
  status: TableStatus;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const LOCATIONS: TableLocation[] = ["گوشه", "وسط", "پنجره", "تراس"];

const STATUS_CONFIG: Record<
  TableStatus,
  { label: string; color: string; bg: string; border: string; icon: React.ElementType }
> = {
  available: {
    label: "آزاد",
    color: "text-emerald-400",
    bg: "bg-emerald-500/15",
    border: "border-emerald-500/40",
    icon: CheckCircle2,
  },
  occupied: {
    label: "اشغال",
    color: "text-red-400",
    bg: "bg-red-500/15",
    border: "border-red-500/40",
    icon: XCircle,
  },
  reserved: {
    label: "رزرو",
    color: "text-amber-400",
    bg: "bg-amber-500/15",
    border: "border-amber-500/40",
    icon: Clock,
  },
  cleaning: {
    label: "نظافت",
    color: "text-zinc-400",
    bg: "bg-zinc-500/15",
    border: "border-zinc-500/40",
    icon: Brush,
  },
};

const EMPTY_FORM: TableFormData = {
  tableNumber: "",
  capacity: "4",
  location: "وسط",
  status: "available",
};

// ─── Detail Modal ─────────────────────────────────────────────────────────────

function TableDetailModal({
  table,
  onClose,
  onEdit,
  onStatusChange,
}: {
  table: RestaurantTable;
  onClose: () => void;
  onEdit: () => void;
  onStatusChange: (status: TableStatus) => void;
}) {
  const cfg = STATUS_CONFIG[table.status];
  const StatusIcon = cfg.icon;
  const [changingStatus, setChangingStatus] = useState<TableStatus | null>(null);

  const handleStatusChange = async (status: TableStatus) => {
    if (status === table.status) return;
    setChangingStatus(status);
    await onStatusChange(status);
    setChangingStatus(null);
  };

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
        className="glass rounded-2xl p-6 w-full max-w-md border border-border"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-xl", cfg.bg)}>
              <TableProperties className={cn("w-5 h-5", cfg.color)} />
            </div>
            <div>
              <h2 className="font-bold text-foreground text-lg">میز {table.tableNumber}</h2>
              <p className="text-muted-foreground text-xs">{table.location} — ظرفیت {table.capacity} نفر</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status badge */}
        <div className={cn("flex items-center gap-2 px-3 py-2 rounded-xl border mb-5", cfg.bg, cfg.border)}>
          <StatusIcon className={cn("w-4 h-4", cfg.color)} />
          <span className={cn("text-sm font-semibold", cfg.color)}>وضعیت: {cfg.label}</span>
        </div>

        {/* Order info (if occupied) */}
        {table.status === "occupied" && table.currentOrder && (
          <div className="bg-red-500/8 border border-red-500/20 rounded-xl p-4 mb-4">
            <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
              <XCircle className="w-4 h-4 text-red-400" />
              سفارش فعال
            </h3>
            <div className="space-y-1.5 text-sm text-muted-foreground">
              {table.currentOrder.items.length > 0 && (
                <p>اقلام: {table.currentOrder.items.join("، ")}</p>
              )}
              {table.currentOrder.total > 0 && (
                <p>
                  مبلغ کل:{" "}
                  <span className="text-foreground font-medium tabular-nums">
                    {table.currentOrder.total.toLocaleString("fa-IR")} ت
                  </span>
                </p>
              )}
              <p>
                شروع:{" "}
                {new Date(table.currentOrder.startedAt).toLocaleTimeString("fa-IR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        )}

        {/* Reservation info (if reserved) */}
        {table.status === "reserved" && table.reservation && (
          <div className="bg-amber-500/8 border border-amber-500/20 rounded-xl p-4 mb-4">
            <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-400" />
              اطلاعات رزرو
            </h3>
            <div className="space-y-1.5 text-sm text-muted-foreground">
              <p>
                نام مهمان:{" "}
                <span className="text-foreground font-medium">{table.reservation.guestName}</span>
              </p>
              <p>تعداد: {table.reservation.guestCount} نفر</p>
              {table.reservation.phone && <p>تلفن: {table.reservation.phone}</p>}
              <p>
                زمان:{" "}
                {new Date(table.reservation.reservedAt).toLocaleString("fa-IR", {
                  hour: "2-digit",
                  minute: "2-digit",
                  day: "numeric",
                  month: "long",
                })}
              </p>
            </div>
          </div>
        )}

        {/* Quick status change */}
        <div className="mb-5">
          <p className="text-xs font-medium text-muted-foreground mb-2">تغییر سریع وضعیت:</p>
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(STATUS_CONFIG) as TableStatus[]).map((s) => {
              const c = STATUS_CONFIG[s];
              const SIcon = c.icon;
              const isActive = table.status === s;
              return (
                <button
                  key={s}
                  onClick={() => handleStatusChange(s)}
                  disabled={isActive || changingStatus !== null}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-all",
                    isActive
                      ? cn(c.bg, c.border, c.color, "cursor-default")
                      : "bg-muted border-border text-muted-foreground hover:text-foreground hover:bg-muted/60 disabled:opacity-40 disabled:cursor-not-allowed"
                  )}
                >
                  <SIcon className="w-3.5 h-3.5" />
                  {changingStatus === s ? "..." : c.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-border bg-muted text-foreground text-sm hover:bg-muted/80 transition-colors"
          >
            بستن
          </button>
          <button
            onClick={onEdit}
            className="flex-1 py-2.5 rounded-xl gradient-brand text-black font-semibold text-sm flex items-center justify-center gap-1.5"
          >
            <Pencil className="w-3.5 h-3.5" />
            ویرایش میز
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Add/Edit Modal ───────────────────────────────────────────────────────────

function TableFormModal({
  table,
  onClose,
  onSave,
}: {
  table: RestaurantTable | null;
  onClose: () => void;
  onSave: (saved: RestaurantTable) => void;
}) {
  const isEdit = !!table;
  const [form, setForm] = useState<TableFormData>(
    table
      ? {
          tableNumber: String(table.tableNumber),
          capacity: String(table.capacity),
          location: table.location,
          status: table.status,
        }
      : EMPTY_FORM
  );
  const [saving, setSaving] = useState(false);

  const set =
    <K extends keyof TableFormData>(k: K) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((p) => ({ ...p, [k]: e.target.value as TableFormData[K] }));

  const handleSubmit = async () => {
    const tNum = Number(form.tableNumber);
    const cap = Number(form.capacity);
    if (!tNum || tNum < 1) {
      toast.error("شماره میز معتبر وارد کنید");
      return;
    }
    if (!cap || cap < 1) {
      toast.error("ظرفیت معتبر وارد کنید");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        tableNumber: tNum,
        capacity: cap,
        location: form.location,
        status: form.status,
      };
      const res = isEdit
        ? await apiClient.put(`/restaurant/tables/${table!.id}`, payload)
        : await apiClient.post("/restaurant/tables", payload);
      onSave(res.data.data);
      toast.success(isEdit ? "میز ویرایش شد" : "میز افزوده شد");
      onClose();
    } catch {
      toast.error(isEdit ? "خطا در ویرایش میز" : "خطا در افزودن میز");
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    "w-full px-3 py-2 rounded-xl bg-muted border border-border text-foreground text-sm focus:outline-none focus:border-primary";

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
        className="glass rounded-2xl p-6 w-full max-w-md border border-border"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-foreground flex items-center gap-2">
            <TableProperties className="w-4 h-4 text-emerald-400" />
            {isEdit ? "ویرایش میز" : "افزودن میز جدید"}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Table number + capacity */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">شماره میز *</label>
              <input
                type="number"
                min="1"
                value={form.tableNumber}
                onChange={set("tableNumber")}
                placeholder="مثال: ۱"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground mb-1.5">ظرفیت (نفر) *</label>
              <input
                type="number"
                min="1"
                max="20"
                value={form.capacity}
                onChange={set("capacity")}
                placeholder="۴"
                className={inputCls}
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">موقعیت میز</label>
            <select value={form.location} onChange={set("location")} className={inputCls}>
              {LOCATIONS.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-medium text-foreground mb-1.5">وضعیت</label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(STATUS_CONFIG) as TableStatus[]).map((s) => {
                const c = STATUS_CONFIG[s];
                const SIcon = c.icon;
                const isActive = form.status === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, status: s }))}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-all",
                      isActive
                        ? cn(c.bg, c.border, c.color)
                        : "bg-muted border-border text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <SIcon className="w-3.5 h-3.5" />
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-border bg-muted text-foreground text-sm hover:bg-muted/80 transition-colors"
            >
              انصراف
            </button>
            <button
              onClick={handleSubmit}
              disabled={!form.tableNumber || !form.capacity || saving}
              className="flex-1 py-2.5 rounded-xl gradient-brand text-black font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saving ? "در حال ذخیره..." : isEdit ? "ذخیره تغییرات" : "افزودن میز"}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Table Card ───────────────────────────────────────────────────────────────

function TableCard({
  table,
  onClick,
  onEdit,
  onDelete,
}: {
  table: RestaurantTable;
  onClick: () => void;
  onEdit: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
}) {
  const cfg = STATUS_CONFIG[table.status];
  const StatusIcon = cfg.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={cn(
        "relative cursor-pointer rounded-2xl border-2 p-4 transition-shadow hover:shadow-lg group",
        cfg.bg,
        cfg.border
      )}
    >
      {/* Action buttons (hover) */}
      <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <button
          onClick={onEdit}
          className="p-1.5 rounded-lg bg-card/80 backdrop-blur-sm text-muted-foreground hover:text-emerald-400 transition-colors"
          title="ویرایش"
        >
          <Pencil className="w-3 h-3" />
        </button>
        <button
          onClick={onDelete}
          className="p-1.5 rounded-lg bg-card/80 backdrop-blur-sm text-muted-foreground hover:text-red-400 transition-colors"
          title="حذف"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>

      {/* Table number */}
      <div className="text-center mb-3">
        <span className={cn("text-3xl font-black tabular-nums", cfg.color)}>
          {table.tableNumber}
        </span>
        <p className="text-xs text-muted-foreground mt-0.5">میز</p>
      </div>

      {/* Capacity */}
      <div className="flex items-center justify-center gap-1 mb-3">
        <Users className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">{table.capacity} نفر</span>
      </div>

      {/* Status badge */}
      <div className={cn("flex items-center justify-center gap-1.5 px-2 py-1 rounded-lg", cfg.bg)}>
        <StatusIcon className={cn("w-3.5 h-3.5", cfg.color)} />
        <span className={cn("text-xs font-semibold", cfg.color)}>{cfg.label}</span>
      </div>

      {/* Location tag */}
      <p className="text-center text-xs text-muted-foreground mt-2">{table.location}</p>

      {/* Guest name for reserved */}
      {table.status === "reserved" && table.reservation && (
        <p className="text-center text-xs text-amber-400 mt-1 truncate font-medium">
          {table.reservation.guestName}
        </p>
      )}
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function RestaurantTablesPage() {
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null);
  const [editTable, setEditTable] = useState<RestaurantTable | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<TableStatus | "all">("all");
  const [locationFilter, setLocationFilter] = useState<TableLocation | "all">("all");

  const fetchTables = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/restaurant/tables?perPage=200");
      setTables(res.data.data ?? []);
    } catch {
      toast.error("خطا در بارگذاری میزها");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("آیا از حذف این میز اطمینان دارید؟")) return;
    try {
      await apiClient.delete(`/restaurant/tables/${id}`);
      setTables((p) => p.filter((t) => t.id !== id));
      if (selectedTable?.id === id) setSelectedTable(null);
      toast.success("میز حذف شد");
    } catch {
      toast.error("خطا در حذف میز");
    }
  };

  const handleSave = (saved: RestaurantTable) => {
    setTables((p) => {
      const idx = p.findIndex((t) => t.id === saved.id);
      if (idx !== -1) {
        const copy = [...p];
        copy[idx] = saved;
        return copy;
      }
      return [...p, saved].sort((a, b) => a.tableNumber - b.tableNumber);
    });
  };

  const handleStatusChange = async (id: string, status: TableStatus) => {
    try {
      const res = await apiClient.patch(`/restaurant/tables/${id}/status`, { status });
      const updated: RestaurantTable = res.data.data;
      setTables((p) => p.map((t) => (t.id === id ? updated : t)));
      setSelectedTable((prev) => (prev?.id === id ? updated : prev));
      toast.success(`وضعیت میز به "${STATUS_CONFIG[status].label}" تغییر کرد`);
    } catch {
      toast.error("خطا در تغییر وضعیت میز");
    }
  };

  const openAdd = () => {
    setEditTable(null);
    setShowFormModal(true);
  };

  const openEdit = (table: RestaurantTable, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedTable(null);
    setEditTable(table);
    setShowFormModal(true);
  };

  const closeFormModal = () => {
    setShowFormModal(false);
    setEditTable(null);
  };

  // Stats
  const available = tables.filter((t) => t.status === "available").length;
  const occupied = tables.filter((t) => t.status === "occupied").length;
  const reserved = tables.filter((t) => t.status === "reserved").length;
  const totalCapacity = tables.reduce((s, t) => s + t.capacity, 0);

  // Filtered tables
  const filtered = tables.filter((t) => {
    const matchStatus = statusFilter === "all" || t.status === statusFilter;
    const matchLocation = locationFilter === "all" || t.location === locationFilter;
    return matchStatus && matchLocation;
  });

  // Sort by table number
  const sorted = [...filtered].sort((a, b) => a.tableNumber - b.tableNumber);

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
            <TableProperties className="w-6 h-6 text-emerald-400" />
            مدیریت میزهای رستوران
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {tables.length} میز ثبت شده
          </p>
        </div>
        <button
          onClick={openAdd}
          className="px-4 py-2 rounded-xl gradient-brand text-black text-sm font-semibold flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          افزودن میز
        </button>
      </motion.div>

      {/* Stats bar */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-2 sm:grid-cols-4 gap-3"
      >
        {/* Available */}
        <div
          className={cn(
            "flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-all",
            statusFilter === "available"
              ? "bg-emerald-500/20 border-emerald-500/50"
              : "bg-emerald-500/8 border-emerald-500/20 hover:bg-emerald-500/12"
          )}
          onClick={() => setStatusFilter((s) => (s === "available" ? "all" : "available"))}
        >
          <div className="p-2 rounded-xl bg-emerald-500/20">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-2xl font-black text-emerald-400 tabular-nums">{available}</p>
            <p className="text-xs text-muted-foreground">آزاد</p>
          </div>
        </div>

        {/* Occupied */}
        <div
          className={cn(
            "flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-all",
            statusFilter === "occupied"
              ? "bg-red-500/20 border-red-500/50"
              : "bg-red-500/8 border-red-500/20 hover:bg-red-500/12"
          )}
          onClick={() => setStatusFilter((s) => (s === "occupied" ? "all" : "occupied"))}
        >
          <div className="p-2 rounded-xl bg-red-500/20">
            <XCircle className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <p className="text-2xl font-black text-red-400 tabular-nums">{occupied}</p>
            <p className="text-xs text-muted-foreground">اشغال</p>
          </div>
        </div>

        {/* Reserved */}
        <div
          className={cn(
            "flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-all",
            statusFilter === "reserved"
              ? "bg-amber-500/20 border-amber-500/50"
              : "bg-amber-500/8 border-amber-500/20 hover:bg-amber-500/12"
          )}
          onClick={() => setStatusFilter((s) => (s === "reserved" ? "all" : "reserved"))}
        >
          <div className="p-2 rounded-xl bg-amber-500/20">
            <Clock className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <p className="text-2xl font-black text-amber-400 tabular-nums">{reserved}</p>
            <p className="text-xs text-muted-foreground">رزرو</p>
          </div>
        </div>

        {/* Total capacity */}
        <div className="flex items-center gap-3 p-4 rounded-2xl border bg-muted/40 border-border">
          <div className="p-2 rounded-xl bg-muted">
            <Users className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-2xl font-black text-foreground tabular-nums">{totalCapacity}</p>
            <p className="text-xs text-muted-foreground">ظرفیت کل</p>
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex items-center gap-3 flex-wrap"
      >
        {/* Status filter pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setStatusFilter("all")}
            className={cn(
              "px-3 py-1.5 rounded-xl text-sm font-medium border transition-all",
              statusFilter === "all"
                ? "bg-foreground text-background border-transparent"
                : "bg-muted border-border text-muted-foreground hover:text-foreground"
            )}
          >
            همه میزها
          </button>
          {(Object.keys(STATUS_CONFIG) as TableStatus[]).map((s) => {
            const c = STATUS_CONFIG[s];
            return (
              <button
                key={s}
                onClick={() => setStatusFilter((prev) => (prev === s ? "all" : s))}
                className={cn(
                  "px-3 py-1.5 rounded-xl text-sm font-medium border transition-all",
                  statusFilter === s
                    ? cn(c.bg, c.border, c.color)
                    : "bg-muted border-border text-muted-foreground hover:text-foreground"
                )}
              >
                {c.label}
              </button>
            );
          })}
        </div>

        {/* Location filter */}
        <select
          value={locationFilter}
          onChange={(e) => setLocationFilter(e.target.value as TableLocation | "all")}
          className="mr-auto px-3 py-1.5 rounded-xl bg-muted border border-border text-foreground text-sm focus:outline-none focus:border-primary"
        >
          <option value="all">همه موقعیت‌ها</option>
          {LOCATIONS.map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>
      </motion.div>

      {/* Floor Plan Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-36 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-20 text-muted-foreground"
        >
          <TableProperties className="w-12 h-12 mb-3 opacity-30" />
          <p className="text-sm">
            {tables.length === 0
              ? "هنوز میزی ثبت نشده است. اولین میز را اضافه کنید."
              : "هیچ میزی با فیلترهای انتخابی یافت نشد."}
          </p>
          {tables.length === 0 && (
            <button
              onClick={openAdd}
              className="mt-4 px-4 py-2 rounded-xl gradient-brand text-black text-sm font-semibold flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              افزودن اولین میز
            </button>
          )}
        </motion.div>
      ) : (
        <motion.div
          layout
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
        >
          <AnimatePresence mode="popLayout">
            {sorted.map((table) => (
              <TableCard
                key={table.id}
                table={table}
                onClick={() => setSelectedTable(table)}
                onEdit={(e) => openEdit(table, e)}
                onDelete={(e) => handleDelete(table.id, e)}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Legend */}
      {tables.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-4 flex-wrap pt-2 border-t border-border"
        >
          <span className="text-xs text-muted-foreground">راهنما:</span>
          {(Object.keys(STATUS_CONFIG) as TableStatus[]).map((s) => {
            const c = STATUS_CONFIG[s];
            const SIcon = c.icon;
            return (
              <div key={s} className="flex items-center gap-1.5">
                <SIcon className={cn("w-3.5 h-3.5", c.color)} />
                <span className={cn("text-xs font-medium", c.color)}>{c.label}</span>
              </div>
            );
          })}
        </motion.div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedTable && (
          <TableDetailModal
            table={selectedTable}
            onClose={() => setSelectedTable(null)}
            onEdit={() => openEdit(selectedTable)}
            onStatusChange={(status) => handleStatusChange(selectedTable.id, status)}
          />
        )}
      </AnimatePresence>

      {/* Add/Edit Form Modal */}
      <AnimatePresence>
        {showFormModal && (
          <TableFormModal
            table={editTable}
            onClose={closeFormModal}
            onSave={handleSave}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
