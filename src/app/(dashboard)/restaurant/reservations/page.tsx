"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CalendarClock, Plus, Phone, Users, Check, X, Pencil, Trash2, Clock, List, Calendar } from "lucide-react";
import { toJalali } from "@/lib/utils";
import { apiClient } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ─── Types ─────────────────────────────────────────────────────────────────────

type ReservationStatus = "pending" | "confirmed" | "cancelled" | "seated";

interface Reservation {
  id: string;
  customerName: string;
  customerPhone: string;
  tableId: string;
  tableName?: string;
  dateTime: string;
  partySize: number;
  notes?: string;
  status: ReservationStatus;
}

interface Table {
  id: string;
  name: string;
  capacity: number;
}

interface FormData {
  customerName: string;
  customerPhone: string;
  tableId: string;
  dateTime: string;
  partySize: number;
  notes: string;
  status: ReservationStatus;
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<ReservationStatus, { label: string; color: string; bg: string; border: string }> = {
  pending:   { label: "در انتظار",  color: "text-amber-400",  bg: "bg-amber-500/10",  border: "border-amber-500/30" },
  confirmed: { label: "تایید شده",  color: "text-green-400",  bg: "bg-green-500/10",  border: "border-green-500/30" },
  cancelled: { label: "لغو شده",    color: "text-red-400",    bg: "bg-red-500/10",    border: "border-red-500/30" },
  seated:    { label: "نشسته",      color: "text-blue-400",   bg: "bg-blue-500/10",   border: "border-blue-500/30" },
};

const WEEK_HOURS = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];
const DAY_NAMES_FA = ["شنبه", "یک‌شنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنج‌شنبه", "جمعه"];
const STATUS_BLOCK_BG: Record<ReservationStatus, string> = {
  pending:   "bg-amber-500/70 border-amber-400",
  confirmed: "bg-green-500/70 border-green-400",
  cancelled: "bg-red-500/70 border-red-400",
  seated:    "bg-blue-500/70 border-blue-400",
};

const EMPTY_FORM: FormData = {
  customerName: "",
  customerPhone: "",
  tableId: "",
  dateTime: "",
  partySize: 2,
  notes: "",
  status: "pending",
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

function getWeekDates(anchor: Date): Date[] {
  // Week starts Saturday (IR convention)
  const day = anchor.getDay(); // 0=Sun,6=Sat
  const diffToSat = day === 6 ? 0 : day + 1;
  const sat = new Date(anchor);
  sat.setDate(anchor.getDate() - diffToSat);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sat);
    d.setDate(sat.getDate() + i);
    return d;
  });
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

// ─── Status Badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ReservationStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border", cfg.color, cfg.bg, cfg.border)}>
      {cfg.label}
    </span>
  );
}

// ─── Add / Edit Modal ──────────────────────────────────────────────────────────

function ReservationModal({
  open,
  onClose,
  onSave,
  initial,
  tables,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: FormData) => Promise<void>;
  initial?: Reservation | null;
  tables: Table[];
}) {
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      if (initial) {
        const dt = new Date(initial.dateTime);
        const pad = (n: number) => String(n).padStart(2, "0");
        const localDT = `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
        setForm({
          customerName: initial.customerName,
          customerPhone: initial.customerPhone,
          tableId: initial.tableId,
          dateTime: localDT,
          partySize: initial.partySize,
          notes: initial.notes ?? "",
          status: initial.status,
        });
      } else {
        setForm(EMPTY_FORM);
      }
    }
  }, [open, initial]);

  const set = (k: keyof FormData, v: string | number) =>
    setForm((p) => ({ ...p, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.customerName.trim()) { toast.error("نام مشتری الزامی است"); return; }
    if (!form.tableId) { toast.error("انتخاب میز الزامی است"); return; }
    if (!form.dateTime) { toast.error("تاریخ و ساعت الزامی است"); return; }
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg"
            dir="rtl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <CalendarClock className="w-5 h-5 text-primary" />
                <h2 className="font-semibold text-foreground text-base">
                  {initial ? "ویرایش رزرو" : "رزرو جدید"}
                </h2>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Customer name + phone */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">نام مشتری *</label>
                  <input
                    value={form.customerName}
                    onChange={(e) => set("customerName", e.target.value)}
                    placeholder="علی محمدی"
                    className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm focus:outline-none focus:border-primary/50 text-right"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">شماره تماس</label>
                  <input
                    value={form.customerPhone}
                    onChange={(e) => set("customerPhone", e.target.value)}
                    placeholder="09121234567"
                    dir="ltr"
                    className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm focus:outline-none focus:border-primary/50 text-left"
                  />
                </div>
              </div>

              {/* Table + Party size */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">میز *</label>
                  <select
                    value={form.tableId}
                    onChange={(e) => set("tableId", e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm focus:outline-none focus:border-primary/50"
                  >
                    <option value="">انتخاب میز...</option>
                    {tables.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} (ظرفیت {t.capacity})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">تعداد نفرات</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={form.partySize}
                    onChange={(e) => set("partySize", parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm focus:outline-none focus:border-primary/50 text-right"
                  />
                </div>
              </div>

              {/* DateTime */}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">تاریخ و ساعت *</label>
                <input
                  type="datetime-local"
                  value={form.dateTime}
                  onChange={(e) => set("dateTime", e.target.value)}
                  dir="ltr"
                  className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm focus:outline-none focus:border-primary/50 text-left"
                />
              </div>

              {/* Status */}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">وضعیت</label>
                <div className="flex gap-2 flex-wrap">
                  {(Object.keys(STATUS_CONFIG) as ReservationStatus[]).map((s) => (
                    <button
                      type="button"
                      key={s}
                      onClick={() => set("status", s)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs border transition-all",
                        form.status === s
                          ? cn(STATUS_CONFIG[s].bg, STATUS_CONFIG[s].color, STATUS_CONFIG[s].border)
                          : "bg-muted border-border text-muted-foreground hover:border-primary/30"
                      )}
                    >
                      {STATUS_CONFIG[s].label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">یادداشت</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => set("notes", e.target.value)}
                  rows={2}
                  placeholder="توضیحات اضافی..."
                  className="w-full px-3 py-2 rounded-lg bg-muted border border-border text-sm focus:outline-none focus:border-primary/50 resize-none text-right"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl gradient-brand text-black font-semibold text-sm disabled:opacity-50 transition-opacity"
                >
                  <Check className="w-4 h-4" />
                  {saving ? "در حال ذخیره..." : "ذخیره رزرو"}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-muted text-muted-foreground text-sm hover:bg-muted/80 transition-colors"
                >
                  انصراف
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Calendar Week View ────────────────────────────────────────────────────────

function WeekCalendar({
  reservations,
  weekDates,
  onClickReservation,
}: {
  reservations: Reservation[];
  weekDates: Date[];
  onClickReservation: (r: Reservation) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[700px]">
        {/* Header row: days */}
        <div className="grid grid-cols-[64px_repeat(7,1fr)] border-b border-border">
          <div className="py-2" />
          {weekDates.map((d, i) => {
            const isToday = sameDay(d, new Date());
            return (
              <div
                key={i}
                className={cn(
                  "py-2 text-center text-xs font-medium border-r border-border last:border-r-0",
                  isToday ? "text-primary" : "text-muted-foreground"
                )}
              >
                <div>{DAY_NAMES_FA[i]}</div>
                <div className={cn("text-base font-bold mt-0.5", isToday ? "text-primary" : "text-foreground")}>
                  {(() => { try { return toJalali(d).split("/")[2] ?? d.getDate(); } catch { return d.getDate(); } })()}
                </div>
              </div>
            );
          })}
        </div>

        {/* Time rows */}
        {WEEK_HOURS.map((hour) => (
          <div key={hour} className="grid grid-cols-[64px_repeat(7,1fr)] border-b border-border/40 min-h-[56px]">
            {/* Hour label */}
            <div className="flex items-start justify-end pr-3 pt-1 text-[11px] text-muted-foreground font-medium select-none">
              {String(hour).padStart(2, "0")}:00
            </div>

            {/* Cells per day */}
            {weekDates.map((d, di) => {
              const cellReservations = reservations.filter((r) => {
                const rd = new Date(r.dateTime);
                return sameDay(rd, d) && rd.getHours() === hour;
              });
              return (
                <div
                  key={di}
                  className="border-r border-border/30 last:border-r-0 p-0.5 flex flex-col gap-0.5 relative"
                >
                  {cellReservations.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => onClickReservation(r)}
                      className={cn(
                        "w-full text-right px-1.5 py-0.5 rounded text-[11px] font-medium border transition-opacity hover:opacity-80 truncate",
                        STATUS_BLOCK_BG[r.status]
                      )}
                      title={`${r.customerName} — ${r.partySize} نفر`}
                    >
                      <div className="truncate text-white">{r.customerName}</div>
                      <div className="text-white/70 text-[10px] flex items-center gap-1">
                        <Users className="w-2.5 h-2.5 inline" />
                        {r.partySize}
                        <span className="mr-1">{formatTime(r.dateTime)}</span>
                      </div>
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── List View ─────────────────────────────────────────────────────────────────

function ListView({
  reservations,
  tables,
  onEdit,
  onDelete,
  onStatusChange,
}: {
  reservations: Reservation[];
  tables: Table[];
  onEdit: (r: Reservation) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: ReservationStatus) => void;
}) {
  if (reservations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <CalendarClock className="w-12 h-12 mb-3 opacity-30" />
        <p className="text-sm">رزروی یافت نشد</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm" dir="rtl">
        <thead>
          <tr className="border-b border-border text-xs text-muted-foreground">
            <th className="py-3 px-4 text-right font-medium">مشتری</th>
            <th className="py-3 px-4 text-right font-medium">تماس</th>
            <th className="py-3 px-4 text-right font-medium">میز</th>
            <th className="py-3 px-4 text-right font-medium">تاریخ و ساعت</th>
            <th className="py-3 px-4 text-right font-medium">نفرات</th>
            <th className="py-3 px-4 text-right font-medium">وضعیت</th>
            <th className="py-3 px-4 text-right font-medium">یادداشت</th>
            <th className="py-3 px-4 text-right font-medium">عملیات</th>
          </tr>
        </thead>
        <tbody>
          {reservations.map((r) => {
            const table = tables.find((t) => t.id === r.tableId);
            const dt = new Date(r.dateTime);
            let jalaliStr = "";
            try {
              jalaliStr = toJalali(dt);
            } catch { /* empty */ }
            const timeStr = formatTime(r.dateTime);
            return (
              <motion.tr
                key={r.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="border-b border-border/40 hover:bg-muted/30 transition-colors"
              >
                <td className="py-3 px-4 font-medium text-foreground">{r.customerName}</td>
                <td className="py-3 px-4">
                  {r.customerPhone ? (
                    <a href={`tel:${r.customerPhone}`} className="flex items-center gap-1.5 text-muted-foreground hover:text-primary transition-colors">
                      <Phone className="w-3.5 h-3.5" />
                      <span dir="ltr">{r.customerPhone}</span>
                    </a>
                  ) : (
                    <span className="text-muted-foreground/40">—</span>
                  )}
                </td>
                <td className="py-3 px-4 text-muted-foreground">{table?.name ?? r.tableId}</td>
                <td className="py-3 px-4">
                  <div className="flex flex-col gap-0.5">
                    {jalaliStr && <span className="text-foreground">{jalaliStr}</span>}
                    <span className="flex items-center gap-1 text-muted-foreground text-xs">
                      <Clock className="w-3 h-3" />
                      {timeStr}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Users className="w-3.5 h-3.5" />
                    {r.partySize}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <select
                    value={r.status}
                    onChange={(e) => onStatusChange(r.id, e.target.value as ReservationStatus)}
                    className={cn(
                      "text-xs rounded-md px-2 py-1 border font-medium focus:outline-none cursor-pointer",
                      STATUS_CONFIG[r.status].bg,
                      STATUS_CONFIG[r.status].color,
                      STATUS_CONFIG[r.status].border
                    )}
                  >
                    {(Object.keys(STATUS_CONFIG) as ReservationStatus[]).map((s) => (
                      <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                    ))}
                  </select>
                </td>
                <td className="py-3 px-4 text-muted-foreground text-xs max-w-[140px] truncate" title={r.notes}>
                  {r.notes || <span className="opacity-30">—</span>}
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onEdit(r)}
                      className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                      title="ویرایش"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDelete(r.id)}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"
                      title="حذف"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"calendar" | "list">("list");
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Reservation | null>(null);
  const [weekAnchor, setWeekAnchor] = useState(new Date());
  const [filterStatus, setFilterStatus] = useState<ReservationStatus | "all">("all");

  const weekDates = getWeekDates(weekAnchor);

  // ─── Fetch data ──────────────────────────────────────────────────────────────
  const fetchReservations = useCallback(async () => {
    try {
      const res = await apiClient.get("/restaurant/reservations");
      const data = res.data?.data ?? res.data ?? [];
      setReservations(Array.isArray(data) ? data : []);
    } catch {
      toast.error("خطا در بارگذاری رزروها");
    }
  }, []);

  const fetchTables = useCallback(async () => {
    try {
      const res = await apiClient.get("/restaurant/tables");
      const data = res.data?.data ?? res.data ?? [];
      setTables(Array.isArray(data) ? data : []);
    } catch {
      // Tables endpoint may not exist yet — silently ignore
      setTables([]);
    }
  }, []);

  useEffect(() => {
    Promise.all([fetchReservations(), fetchTables()]).finally(() => setLoading(false));
  }, [fetchReservations, fetchTables]);

  // ─── CRUD ────────────────────────────────────────────────────────────────────

  async function handleSave(form: FormData) {
    const payload = {
      ...form,
      dateTime: new Date(form.dateTime).toISOString(),
    };
    if (editTarget) {
      await apiClient.put(`/restaurant/reservations/${editTarget.id}`, payload);
      toast.success("رزرو ویرایش شد");
    } else {
      await apiClient.post("/restaurant/reservations", payload);
      toast.success("رزرو ثبت شد");
    }
    await fetchReservations();
  }

  async function handleDelete(id: string) {
    if (!confirm("آیا مطمئن هستید که می‌خواهید این رزرو را حذف کنید؟")) return;
    try {
      await apiClient.delete(`/restaurant/reservations/${id}`);
      toast.success("رزرو حذف شد");
      await fetchReservations();
    } catch {
      toast.error("خطا در حذف رزرو");
    }
  }

  async function handleStatusChange(id: string, status: ReservationStatus) {
    try {
      await apiClient.patch(`/restaurant/reservations/${id}`, { status });
      setReservations((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
      toast.success("وضعیت رزرو به‌روز شد");
    } catch {
      toast.error("خطا در تغییر وضعیت");
    }
  }

  function openAdd() {
    setEditTarget(null);
    setModalOpen(true);
  }

  function openEdit(r: Reservation) {
    setEditTarget(r);
    setModalOpen(true);
  }

  const filtered = filterStatus === "all" ? reservations : reservations.filter((r) => r.status === filterStatus);

  // ─── Stats ───────────────────────────────────────────────────────────────────
  const stats = {
    total: reservations.length,
    pending: reservations.filter((r) => r.status === "pending").length,
    confirmed: reservations.filter((r) => r.status === "confirmed").length,
    seated: reservations.filter((r) => r.status === "seated").length,
  };

  // ─── Week nav ────────────────────────────────────────────────────────────────
  function prevWeek() { const d = new Date(weekAnchor); d.setDate(d.getDate() - 7); setWeekAnchor(d); }
  function nextWeek() { const d = new Date(weekAnchor); d.setDate(d.getDate() + 7); setWeekAnchor(d); }
  function goToday() { setWeekAnchor(new Date()); }

  const weekLabel = (() => {
    const start = weekDates[0];
    const end = weekDates[6];
    try {
      const startStr = toJalali(start);
      const endStr = toJalali(end);
      const sp = startStr.split("/");
      const endDay = endStr.split("/")[2];
      if (sp.length === 3 && endDay) return `${sp[2]} تا ${endDay} — ${sp[0]}/${sp[1]}`;
    } catch { /* empty */ }
    return `${start.toLocaleDateString("fa-IR")} — ${end.toLocaleDateString("fa-IR")}`;
  })();

  return (
    <div className="flex flex-col gap-6 p-6" dir="rtl">
      {/* ─── Page header ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl gradient-brand">
            <CalendarClock className="w-5 h-5 text-black" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">رزرو میز</h1>
            <p className="text-xs text-muted-foreground mt-0.5">مدیریت رزروهای رستوران</p>
          </div>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-brand text-black font-semibold text-sm hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          رزرو جدید
        </button>
      </div>

      {/* ─── Stat cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "کل رزروها", value: stats.total, color: "text-foreground" },
          { label: "در انتظار", value: stats.pending, color: "text-amber-400" },
          { label: "تایید شده", value: stats.confirmed, color: "text-green-400" },
          { label: "نشسته", value: stats.seated, color: "text-blue-400" },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-xl px-4 py-3">
            <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
            <p className={cn("text-2xl font-bold", s.color)}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* ─── Toolbar ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        {/* View toggle */}
        <div className="flex bg-muted rounded-lg p-1 gap-1">
          <button
            onClick={() => setView("list")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
              view === "list" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <List className="w-4 h-4" />
            لیست
          </button>
          <button
            onClick={() => setView("calendar")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
              view === "calendar" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Calendar className="w-4 h-4" />
            تقویم
          </button>
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setFilterStatus("all")}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs border font-medium transition-all",
              filterStatus === "all" ? "bg-primary/10 text-primary border-primary/30" : "bg-muted border-border text-muted-foreground hover:border-primary/20"
            )}
          >
            همه
          </button>
          {(Object.keys(STATUS_CONFIG) as ReservationStatus[]).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs border font-medium transition-all",
                filterStatus === s
                  ? cn(STATUS_CONFIG[s].bg, STATUS_CONFIG[s].color, STATUS_CONFIG[s].border)
                  : "bg-muted border-border text-muted-foreground hover:border-primary/20"
              )}
            >
              {STATUS_CONFIG[s].label}
            </button>
          ))}
        </div>
      </div>

      {/* ─── Main content ────────────────────────────────────────────────── */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        ) : view === "calendar" ? (
          <>
            {/* Calendar nav */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <button onClick={prevWeek} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
                <span className="text-lg leading-none">›</span>
              </button>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-foreground">{weekLabel}</span>
                <button onClick={goToday} className="px-2.5 py-1 rounded-md bg-muted text-xs text-muted-foreground hover:bg-muted/80 transition-colors">
                  امروز
                </button>
              </div>
              <button onClick={nextWeek} className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
                <span className="text-lg leading-none">‹</span>
              </button>
            </div>
            <WeekCalendar
              reservations={filtered}
              weekDates={weekDates}
              onClickReservation={openEdit}
            />
          </>
        ) : (
          <ListView
            reservations={filtered}
            tables={tables}
            onEdit={openEdit}
            onDelete={handleDelete}
            onStatusChange={handleStatusChange}
          />
        )}
      </div>

      {/* ─── Modal ───────────────────────────────────────────────────────── */}
      <ReservationModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditTarget(null); }}
        onSave={handleSave}
        initial={editTarget}
        tables={tables}
      />
    </div>
  );
}
