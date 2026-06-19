"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChefHat, Clock, CheckCircle2, AlertCircle, RefreshCw, Flame } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface OrderItem {
  id: string;
  menuItem?: { name: string };
  quantity: number;
  notes?: string;
}

interface Order {
  id: string;
  orderNumber: string;
  type: string;
  status: string;
  table?: { number: number; name?: string } | null;
  items: OrderItem[];
  createdAt: string;
}

const STATUS_CFG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  pending:    { label: "در انتظار",    color: "text-amber-400",  bg: "bg-amber-500/10",  border: "border-amber-500/30" },
  preparing:  { label: "در حال آماده‌سازی", color: "text-blue-400",   bg: "bg-blue-500/10",   border: "border-blue-500/30" },
  ready:      { label: "آماده سرو",    color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30" },
  delivered:  { label: "تحویل داده شد", color: "text-gray-400",   bg: "bg-gray-500/10",   border: "border-gray-500/30" },
};

const KDS_STATUSES = ["pending", "preparing", "ready"];
const NEXT_STATUS: Record<string, string> = { pending: "preparing", preparing: "ready", ready: "delivered" };
const NEXT_LABEL: Record<string, string> = { pending: "شروع آماده‌سازی", preparing: "آماده برای سرو", ready: "تحویل داده شد" };

function minutesSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
}

export default function KitchenPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const r = await apiClient.get("/restaurant/orders?perPage=100");
      const all: Order[] = r.data.data ?? [];
      setOrders(all.filter(o => KDS_STATUSES.includes(o.status)));
    } catch {
      if (!silent) toast.error("خطا در بارگذاری سفارش‌ها");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(() => load(true), 30_000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [autoRefresh, load]);

  const advance = async (order: Order) => {
    const next = NEXT_STATUS[order.status];
    if (!next) return;
    setUpdating(order.id);
    try {
      await apiClient.put(`/restaurant/orders/${order.id}`, { status: next });
      if (next === "delivered") {
        setOrders(prev => prev.filter(o => o.id !== order.id));
      } else {
        setOrders(prev => prev.map(o => o.id === order.id ? { ...o, status: next } : o));
      }
      toast.success(next === "delivered" ? "سفارش تحویل داده شد" : "وضعیت بروز شد");
    } catch {
      toast.error("خطا در بروزرسانی");
    } finally {
      setUpdating(null);
    }
  };

  const byStatus = (status: string) => orders.filter(o => o.status === status);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>بارگذاری آشپزخانه...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
            <ChefHat className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold">نمایشگر آشپزخانه (KDS)</h1>
            <p className="text-xs text-muted-foreground">{orders.length} سفارش فعال</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={e => setAutoRefresh(e.target.checked)}
              className="w-4 h-4 rounded"
            />
            بروزرسانی خودکار (۳۰ ثانیه)
          </label>
          <button onClick={() => load()} className="p-2 rounded-xl border border-border hover:bg-muted transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          </div>
          <p className="text-lg font-medium">همه سفارش‌ها آماده شدند!</p>
          <p className="text-sm text-muted-foreground">در حال حاضر هیچ سفارش فعالی وجود ندارد</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {KDS_STATUSES.map(status => {
            const cfg = STATUS_CFG[status];
            const statusOrders = byStatus(status);
            return (
              <div key={status} className={cn("rounded-2xl border p-4 space-y-3", cfg.bg, cfg.border)}>
                <div className="flex items-center justify-between">
                  <h2 className={cn("font-semibold", cfg.color)}>{cfg.label}</h2>
                  <span className={cn("text-xs px-2 py-0.5 rounded-full border", cfg.border, cfg.color)}>
                    {statusOrders.length}
                  </span>
                </div>

                <div className="space-y-3">
                  <AnimatePresence>
                    {statusOrders.map(order => {
                      const mins = minutesSince(order.createdAt);
                      const isUrgent = mins >= 15 && status === "pending";
                      return (
                        <motion.div
                          key={order.id}
                          layout
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className={cn(
                            "rounded-xl bg-background/60 border p-3 space-y-2",
                            isUrgent ? "border-red-500/50 animate-pulse" : "border-border"
                          )}
                        >
                          {/* Order header */}
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-sm">{order.orderNumber}</span>
                            <div className="flex items-center gap-1.5">
                              {isUrgent && <Flame className="w-3.5 h-3.5 text-red-400" />}
                              <Clock className={cn("w-3.5 h-3.5", isUrgent ? "text-red-400" : "text-muted-foreground")} />
                              <span className={cn("text-xs", isUrgent ? "text-red-400 font-bold" : "text-muted-foreground")}>
                                {mins} دقیقه
                              </span>
                            </div>
                          </div>

                          {/* Table info */}
                          {order.table && (
                            <p className="text-xs text-muted-foreground">
                              میز {order.table.number}{order.table.name ? ` — ${order.table.name}` : ""}
                            </p>
                          )}

                          {/* Items */}
                          <div className="space-y-1">
                            {order.items.map((item, idx) => (
                              <div key={item.id ?? idx} className="flex items-center justify-between text-sm">
                                <span>{item.menuItem?.name ?? "آیتم"}</span>
                                <span className="font-bold text-primary">×{item.quantity}</span>
                              </div>
                            ))}
                          </div>

                          {/* Advance button */}
                          {NEXT_STATUS[status] && (
                            <button
                              onClick={() => advance(order)}
                              disabled={updating === order.id}
                              className={cn(
                                "w-full py-2 rounded-lg text-xs font-semibold transition-all",
                                status === "pending"
                                  ? "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-500/30"
                                  : status === "preparing"
                                  ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/30"
                                  : "bg-gray-500/20 text-gray-400 hover:bg-gray-500/30 border border-gray-500/30"
                              )}
                            >
                              {updating === order.id ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin mx-auto" />
                              ) : (
                                NEXT_LABEL[status]
                              )}
                            </button>
                          )}
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>

                  {statusOrders.length === 0 && (
                    <div className="text-center py-6 text-muted-foreground/50 text-sm">
                      <AlertCircle className="w-5 h-5 mx-auto mb-1 opacity-40" />
                      خالی
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
