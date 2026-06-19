"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { RotateCcw, Plus, Search, AlertCircle, CheckCircle2, Clock, X, Pencil, Trash2 } from "lucide-react";
import { formatPrice, toJalali } from "@/lib/utils";
import { StatCard } from "@/components/common/StatCard";
import { apiClient } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────────────────────────

type ReturnType = "from_customer" | "to_supplier";
type ReturnStatus = "pending" | "approved" | "processed";
type RefundMethod = "cash" | "bank_transfer" | "credit" | "exchange";

interface ReturnItem {
  id?: string;
  productName: string;
  qty: number;
  unitPrice: number;
  reason: string;
}

interface ReturnRequest {
  id: string;
  returnNumber: string;
  type: ReturnType;
  clientName?: string;
  supplierName?: string;
  date: string;
  items: ReturnItem[];
  notes?: string;
  refundMethod: RefundMethod;
  status: ReturnStatus;
  totalValue: number;
  createdAt: string;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_CFG: Record<ReturnStatus, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  pending:   { label: "در انتظار",  icon: Clock,         color: "text-amber-400",   bg: "bg-amber-500/10"  },
  approved:  { label: "تایید شده",  icon: CheckCircle2,  color: "text-emerald-400", bg: "bg-emerald-500/10" },
  processed: { label: "تسویه شده", icon: RotateCcw,     color: "text-blue-400",    bg: "bg-blue-500/10"   },
};

const RETURN_TYPE_CFG: Record<ReturnType, { label: string; shortLabel: string; color: string; bg: string }> = {
  from_customer: { label: "مرجوعی از مشتری", shortLabel: "از مشتری", color: "text-orange-400", bg: "bg-orange-500/10" },
  to_supplier:   { label: "مرجوعی به تامین‌کننده", shortLabel: "به تامین‌کننده", color: "text-amber-400", bg: "bg-amber-500/10" },
};

const REFUND_METHODS: Record<RefundMethod, string> = {
  cash:          "نقد",
  bank_transfer: "انتقال بانکی",
  credit:        "اعتبار حساب",
  exchange:      "تعویض کالا",
};

const RETURN_REASONS = [
  "کالای معیوب",
  "عدم تطابق با سفارش",
  "آسیب‌دیدگی در حمل",
  "مغایرت مشخصات",
  "پشیمانی مشتری",
  "انقضای تاریخ",
  "سایر",
];

// ─── Create Return Modal ──────────────────────────────────────────────────────

interface CreateReturnModalProps {
  onClose: () => void;
  onSave: (r: ReturnRequest) => void;
}

function CreateReturnModal({ onClose, onSave }: CreateReturnModalProps) {
  const [type, setType] = useState<ReturnType>("from_customer");
  const [partyName, setPartyName] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [refundMethod, setRefundMethod] = useState<RefundMethod>("bank_transfer");
  const [saving, setSaving] = useState(false);
  const [items, setItems] = useState<ReturnItem[]>([
    { productName: "", qty: 1, unitPrice: 0, reason: RETURN_REASONS[0] },
  ]);

  const addItem = () =>
    setItems((prev) => [...prev, { productName: "", qty: 1, unitPrice: 0, reason: RETURN_REASONS[0] }]);

  const removeItem = (idx: number) =>
    setItems((prev) => prev.filter((_, i) => i !== idx));

  const updateItem = (idx: number, field: keyof ReturnItem, value: string | number) =>
    setItems((prev) => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));

  const totalValue = items.reduce((sum, item) => sum + item.qty * item.unitPrice, 0);

  const canSubmit =
    partyName.trim() &&
    items.every((i) => i.productName.trim() && i.qty > 0 && i.unitPrice >= 0);

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSaving(true);
    try {
      const payload = {
        type,
        ...(type === "from_customer" ? { clientName: partyName.trim() } : { supplierName: partyName.trim() }),
        date,
        items,
        notes: notes.trim() || undefined,
        refundMethod,
      };
      const res = await apiClient.post("/returns", payload);
      onSave(res.data.data);
      onClose();
      toast.success("مرجوعی با موفقیت ثبت شد");
    } catch {
      toast.error("خطا در ثبت مرجوعی");
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 24 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 24 }}
        transition={{ type: "spring", stiffness: 300, damping: 26 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl my-8 bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-amber-500/5">
          <h2 className="font-bold text-foreground flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-amber-400" />
            ثبت مرجوعی جدید
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Type Toggle */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">نوع مرجوعی</label>
            <div className="flex gap-2 p-1 bg-muted rounded-xl">
              {(["from_customer", "to_supplier"] as ReturnType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={cn(
                    "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all",
                    type === t
                      ? "bg-amber-500/20 text-amber-400 shadow-sm border border-amber-500/30"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {RETURN_TYPE_CFG[t].label}
                </button>
              ))}
            </div>
          </div>

          {/* Party Name + Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                {type === "from_customer" ? "نام مشتری" : "نام تامین‌کننده"} *
              </label>
              <input
                value={partyName}
                onChange={(e) => setPartyName(e.target.value)}
                placeholder={type === "from_customer" ? "نام مشتری را وارد کنید" : "نام تامین‌کننده را وارد کنید"}
                className="w-full px-4 py-2.5 rounded-xl bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">تاریخ</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              />
            </div>
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-foreground">اقلام مرجوعی *</label>
              <button
                onClick={addItem}
                className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                افزودن قلم
              </button>
            </div>
            <div className="space-y-3">
              {items.map((item, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-muted/50 border border-border space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">قلم {idx + 1}</span>
                    {items.length > 1 && (
                      <button
                        onClick={() => removeItem(idx)}
                        className="text-muted-foreground hover:text-red-400 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-3">
                      <input
                        value={item.productName}
                        onChange={(e) => updateItem(idx, "productName", e.target.value)}
                        placeholder="نام کالا / محصول *"
                        className="w-full px-3 py-2 rounded-lg bg-card border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                      />
                    </div>
                    <div>
                      <input
                        type="number"
                        min={1}
                        value={item.qty}
                        onChange={(e) => updateItem(idx, "qty", Number(e.target.value))}
                        placeholder="تعداد"
                        className="w-full px-3 py-2 rounded-lg bg-card border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                      />
                    </div>
                    <div>
                      <input
                        type="number"
                        min={0}
                        value={item.unitPrice || ""}
                        onChange={(e) => updateItem(idx, "unitPrice", Number(e.target.value))}
                        placeholder="قیمت واحد (تومان)"
                        className="w-full px-3 py-2 rounded-lg bg-card border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                      />
                    </div>
                    <div>
                      <select
                        value={item.reason}
                        onChange={(e) => updateItem(idx, "reason", e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-card border border-border text-foreground text-sm focus:outline-none"
                      >
                        {RETURN_REASONS.map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {item.qty > 0 && item.unitPrice > 0 && (
                    <div className="text-xs text-amber-400 font-medium">
                      جمع: {formatPrice(item.qty * item.unitPrice, true)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Refund Method + Notes */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">روش استرداد وجه</label>
              <select
                value={refundMethod}
                onChange={(e) => setRefundMethod(e.target.value as RefundMethod)}
                className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-foreground text-sm focus:outline-none"
              >
                {(Object.entries(REFUND_METHODS) as [RefundMethod, string][]).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">یادداشت</label>
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="توضیحات اضافی..."
                className="w-full px-4 py-2.5 rounded-xl bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              />
            </div>
          </div>

          {/* Total summary */}
          {totalValue > 0 && (
            <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <span className="text-sm text-amber-400 font-medium">جمع کل مرجوعی</span>
              <span className="text-sm font-bold text-amber-300 tabular-nums">{formatPrice(totalValue)}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-border bg-muted text-foreground text-sm font-medium hover:bg-muted/80 transition-colors"
            >
              انصراف
            </button>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit || saving}
              className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saving ? "در حال ثبت..." : "ثبت مرجوعی"}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Status Advance Modal ─────────────────────────────────────────────────────

interface StatusModalProps {
  ret: ReturnRequest;
  onClose: () => void;
  onUpdate: (id: string, status: ReturnStatus) => void;
}

function StatusModal({ ret, onClose, onUpdate }: StatusModalProps) {
  const nextStatus: Record<ReturnStatus, ReturnStatus | null> = {
    pending:   "approved",
    approved:  "processed",
    processed: null,
  };
  const next = nextStatus[ret.status];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 16 }}
        transition={{ type: "spring", stiffness: 300, damping: 26 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-card border border-border rounded-2xl shadow-2xl p-6 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-foreground">تغییر وضعیت مرجوعی</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            شماره مرجوعی: <span className="text-foreground font-medium">{ret.returnNumber}</span>
          </p>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">وضعیت فعلی:</span>
            {(() => {
              const cfg = STATUS_CFG[ret.status];
              return (
                <span className={cn("flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium", cfg.bg, cfg.color)}>
                  <cfg.icon className="w-3 h-3" />{cfg.label}
                </span>
              );
            })()}
          </div>
        </div>

        {next ? (
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-border bg-muted text-foreground text-sm"
            >
              انصراف
            </button>
            <button
              onClick={() => { onUpdate(ret.id, next); onClose(); }}
              className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm transition-colors"
            >
              {next === "approved" ? "تایید مرجوعی" : "تسویه مرجوعی"}
            </button>
          </div>
        ) : (
          <p className="text-sm text-center text-muted-foreground py-2">این مرجوعی کاملاً پردازش شده است.</p>
        )}
      </motion.div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ReturnsPage() {
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ReturnStatus | "all">("all");
  const [typeFilter, setTypeFilter] = useState<ReturnType | "all">("all");
  const [showCreate, setShowCreate] = useState(false);
  const [editingStatus, setEditingStatus] = useState<ReturnRequest | null>(null);

  const fetchReturns = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/returns?perPage=100");
      setReturns(res.data.data ?? []);
    } catch {
      toast.error("خطا در بارگذاری مرجوعی‌ها");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReturns(); }, [fetchReturns]);

  const handleStatusUpdate = async (id: string, status: ReturnStatus) => {
    try {
      await apiClient.put(`/returns/${id}`, { status });
      setReturns((prev) => prev.map((r) => r.id === id ? { ...r, status } : r));
      toast.success(
        status === "approved"
          ? "مرجوعی تایید شد"
          : "مرجوعی تسویه شد"
      );
    } catch {
      toast.error("خطا در تغییر وضعیت");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete(`/returns/${id}`);
      setReturns((prev) => prev.filter((r) => r.id !== id));
      toast.success("مرجوعی حذف شد");
    } catch {
      toast.error("خطا در حذف مرجوعی");
    }
  };

  // ── Derived stats ────────────────────────────────────────────────────────────
  const totalCount    = returns.length;
  const pendingCount  = returns.filter((r) => r.status === "pending").length;
  const approvedCount = returns.filter((r) => r.status === "approved").length;
  const totalRefund   = returns
    .filter((r) => r.status !== "pending")
    .reduce((s, r) => s + r.totalValue, 0);

  // ── Filtered rows ────────────────────────────────────────────────────────────
  const filtered = returns.filter((r) => {
    const party = r.clientName ?? r.supplierName ?? "";
    const matchSearch =
      !search ||
      r.returnNumber.includes(search) ||
      party.includes(search);
    const matchStatus = statusFilter === "all" || r.status === statusFilter;
    const matchType   = typeFilter   === "all" || r.type   === typeFilter;
    return matchSearch && matchStatus && matchType;
  });

  return (
    <div className="space-y-6">
      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <RotateCcw className="w-6 h-6 text-amber-400" />
            مدیریت مرجوعی‌ها
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {totalCount} مرجوعی ثبت‌شده
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchReturns}
            disabled={loading}
            className="p-2 rounded-xl bg-muted border border-border text-muted-foreground hover:text-foreground disabled:opacity-50 transition-colors"
          >
            <RotateCcw className={cn("w-4 h-4", loading && "animate-spin")} />
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            ثبت مرجوعی
          </button>
        </div>
      </motion.div>

      {/* ── Stats ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="کل مرجوعی‌ها"
          value={totalCount}
          icon={RotateCcw}
          gradient="bg-gradient-to-br from-amber-500 to-orange-500"
        />
        <StatCard
          title="در انتظار بررسی"
          value={pendingCount}
          icon={Clock}
          gradient="bg-gradient-to-br from-yellow-500 to-amber-500"
        />
        <StatCard
          title="تایید شده"
          value={approvedCount}
          icon={CheckCircle2}
          gradient="bg-gradient-to-br from-orange-500 to-amber-600"
        />
        <StatCard
          title="مبلغ استرداد (تومان)"
          value={totalRefund}
          icon={AlertCircle}
          gradient="bg-gradient-to-br from-rose-500 to-orange-500"
        />
      </div>

      {/* ── Filters ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="جستجو در شماره یا نام..."
            className="w-full pr-9 pl-4 py-2.5 rounded-xl bg-card border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40"
          />
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-1 p-1 bg-muted rounded-xl">
          {(["all", "pending", "approved", "processed"] as (ReturnStatus | "all")[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                statusFilter === s
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {s === "all" ? "همه" : STATUS_CFG[s].label}
            </button>
          ))}
        </div>

        {/* Type filter */}
        <div className="flex items-center gap-1 p-1 bg-muted rounded-xl">
          {(["all", "from_customer", "to_supplier"] as (ReturnType | "all")[]).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                typeFilter === t
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t === "all" ? "همه انواع" : RETURN_TYPE_CFG[t].shortLabel}
            </button>
          ))}
        </div>
      </div>

      {/* ── Table ───────────────────────────────────────────────────────────── */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {["شماره مرجوعی", "طرف حساب", "نوع", "تاریخ", "دلیل", "تعداد اقلام", "ارزش کل", "وضعیت", ""].map((h) => (
                    <th key={h} className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((ret) => {
                  const statusCfg = STATUS_CFG[ret.status];
                  const typeCfg   = RETURN_TYPE_CFG[ret.type];
                  const party     = ret.clientName ?? ret.supplierName ?? "—";
                  const reasons   = [...new Set(ret.items.map((i) => i.reason))].join("، ");

                  return (
                    <tr
                      key={ret.id}
                      className="border-b border-border/50 hover:bg-muted/30 transition-colors group"
                    >
                      {/* Return Number */}
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-1 rounded-lg">
                          {ret.returnNumber}
                        </span>
                      </td>

                      {/* Party */}
                      <td className="px-4 py-3 font-medium text-foreground max-w-[140px] truncate">
                        {party}
                      </td>

                      {/* Type */}
                      <td className="px-4 py-3">
                        <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full", typeCfg.bg, typeCfg.color)}>
                          {typeCfg.shortLabel}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {toJalali(ret.date)}
                      </td>

                      {/* Reasons */}
                      <td className="px-4 py-3 text-xs text-muted-foreground max-w-[120px] truncate" title={reasons}>
                        {reasons || "—"}
                      </td>

                      {/* Items count */}
                      <td className="px-4 py-3 text-center">
                        <span className="text-xs font-semibold text-foreground bg-muted px-2 py-0.5 rounded-full">
                          {ret.items.length}
                        </span>
                      </td>

                      {/* Total Value */}
                      <td className="px-4 py-3 font-medium text-foreground tabular-nums whitespace-nowrap">
                        {formatPrice(ret.totalValue, true)}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setEditingStatus(ret)}
                          className={cn(
                            "flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all hover:opacity-80",
                            statusCfg.bg,
                            statusCfg.color
                          )}
                          title="کلیک برای تغییر وضعیت"
                        >
                          <statusCfg.icon className="w-3 h-3" />
                          {statusCfg.label}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setEditingStatus(ret)}
                            className="p-1.5 rounded-lg hover:bg-amber-500/10 text-muted-foreground hover:text-amber-400 transition-colors"
                            title="تغییر وضعیت"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(ret.id)}
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
                    <td colSpan={9} className="px-4 py-12 text-center">
                      <div className="flex flex-col items-center gap-3 text-muted-foreground">
                        <RotateCcw className="w-10 h-10 opacity-20" />
                        <p className="text-sm">
                          {search || statusFilter !== "all" || typeFilter !== "all"
                            ? "نتیجه‌ای برای فیلتر انتخابی یافت نشد"
                            : "هنوز مرجوعی‌ای ثبت نشده"}
                        </p>
                        {!search && statusFilter === "all" && typeFilter === "all" && (
                          <button
                            onClick={() => setShowCreate(true)}
                            className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            ثبت اولین مرجوعی
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modals ──────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showCreate && (
          <CreateReturnModal
            onClose={() => setShowCreate(false)}
            onSave={(r) => setReturns((prev) => [r, ...prev])}
          />
        )}
        {editingStatus && (
          <StatusModal
            ret={editingStatus}
            onClose={() => setEditingStatus(null)}
            onUpdate={handleStatusUpdate}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
