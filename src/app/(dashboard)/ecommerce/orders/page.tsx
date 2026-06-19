"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ShoppingCart, Plus, Search, Package, Truck, CheckCircle2, XCircle, X, Pencil, Trash2, Eye } from "lucide-react";
import { formatPrice, toJalali } from "@/lib/utils";
import { StatCard } from "@/components/common/StatCard";
import { apiClient } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface EOrder { id: string; orderNumber: string; customerName: string; customerPhone?: string; customerEmail?: string; totalAmount: number; discountAmount?: number; shippingAmount?: number; finalAmount: number; paymentStatus: "pending"|"paid"|"refunded"|"failed"; status: "pending"|"confirmed"|"processing"|"shipped"|"delivered"|"cancelled"|"returned"; shippingAddress?: string; notes?: string; createdAt: string; itemCount?: number; }

const STATUS_CFG = { pending: { label: "در انتظار", color: "text-amber-400 bg-amber-500/10" }, confirmed: { label: "تایید شد", color: "text-blue-400 bg-blue-500/10" }, processing: { label: "پردازش", color: "text-violet-400 bg-violet-500/10" }, shipped: { label: "ارسال شد", color: "text-indigo-400 bg-indigo-500/10" }, delivered: { label: "تحویل داده شد", color: "text-emerald-400 bg-emerald-500/10" }, cancelled: { label: "لغو", color: "text-red-400 bg-red-500/10" }, returned: { label: "مرجوعی", color: "text-orange-400 bg-orange-500/10" } };
const PAY_CFG = { pending: "text-amber-400", paid: "text-emerald-400", refunded: "text-blue-400", failed: "text-red-400" };
const PAY_LABEL = { pending: "در انتظار", paid: "پرداخت شد", refunded: "بازگشت داده شد", failed: "ناموفق" };

export default function EcommerceOrdersPage() {
  const [orders, setOrders] = useState<EOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<EOrder | undefined>();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<EOrder | undefined>();
  const [form, setForm] = useState({ orderNumber: "", customerName: "", customerPhone: "", customerEmail: "", totalAmount: 0, discountAmount: 0, shippingAmount: 0, paymentStatus: "pending" as EOrder["paymentStatus"], status: "pending" as EOrder["status"], shippingAddress: "", notes: "" });

  const load = useCallback(async () => { try { const r = await apiClient.get("/ecommerce/orders"); setOrders(r.data.data ?? []); } catch { toast.error("خطا"); } finally { setLoading(false); } }, []);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    try {
      const finalAmount = form.totalAmount - (form.discountAmount || 0) + (form.shippingAmount || 0);
      if (editing) await apiClient.put(`/ecommerce/orders/${editing.id}`, { ...form, finalAmount }); else await apiClient.post("/ecommerce/orders", { ...form, finalAmount });
      toast.success("ذخیره شد"); setShowModal(false); setEditing(undefined); load();
    } catch { toast.error("خطا"); }
  };
  const del = async (id: string) => { if (!confirm("حذف؟")) return; try { await apiClient.delete(`/ecommerce/orders/${id}`); toast.success("حذف شد"); if (selected?.id === id) setSelected(undefined); load(); } catch { /**/ } };
  const open = (o?: EOrder) => { setEditing(o); setForm(o ? { orderNumber: o.orderNumber, customerName: o.customerName, customerPhone: o.customerPhone ?? "", customerEmail: o.customerEmail ?? "", totalAmount: o.totalAmount, discountAmount: o.discountAmount ?? 0, shippingAmount: o.shippingAmount ?? 0, paymentStatus: o.paymentStatus, status: o.status, shippingAddress: o.shippingAddress ?? "", notes: o.notes ?? "" } : { orderNumber: `ORD-${Date.now().toString().slice(-6)}`, customerName: "", customerPhone: "", customerEmail: "", totalAmount: 0, discountAmount: 0, shippingAmount: 0, paymentStatus: "pending", status: "pending", shippingAddress: "", notes: "" }); setShowModal(true); };

  const filtered = orders.filter(o => { if (statusFilter !== "all" && o.status !== statusFilter) return false; if (search && !o.orderNumber.includes(search) && !o.customerName.includes(search)) return false; return true; });
  const totalRevenue = orders.filter(o => o.paymentStatus === "paid").reduce((a, o) => a + o.finalAmount, 0);

  return (
    <div className="p-6 space-y-5 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold flex items-center gap-2"><ShoppingCart className="w-6 h-6 text-primary" />سفارشات فروشگاه</h1></div>
        <button onClick={() => open()} className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-brand text-black text-sm font-semibold"><Plus className="w-4 h-4" /> سفارش جدید</button>
      </div>
      <div className="grid grid-cols-4 gap-4">
        <StatCard title="کل سفارشات" value={orders.length} icon={ShoppingCart} color="blue" />
        <StatCard title="در انتظار" value={orders.filter(o => o.status === "pending").length} icon={Package} color="amber" />
        <StatCard title="تحویل داده شده" value={orders.filter(o => o.status === "delivered").length} icon={CheckCircle2} color="green" />
        <StatCard title="درآمد" value={formatPrice(totalRevenue)} icon={ShoppingCart} color="violet" />
      </div>
      <div className="flex gap-3">
        <div className="relative flex-1"><Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="جستجو..." className="w-full pe-10 ps-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" /></div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary">
          <option value="all">همه وضعیت‌ها</option>
          {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>
      <div className="flex gap-5">
        <div className="flex-1 glass rounded-2xl border border-border overflow-hidden">
          {loading ? <div className="p-12 text-center text-muted-foreground">در حال بارگذاری...</div> : filtered.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground"><ShoppingCart className="w-10 h-10 mx-auto mb-3 opacity-30" /><p>سفارشی یافت نشد</p></div>
          ) : (
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border">{["شماره", "مشتری", "مبلغ نهایی", "پرداخت", "تاریخ", "وضعیت", ""].map(h => <th key={h} className="text-right p-4 text-muted-foreground font-medium">{h}</th>)}</tr></thead>
              <tbody>
                {filtered.map(o => (
                  <tr key={o.id} onClick={() => setSelected(o)} className={cn("border-b border-border hover:bg-muted/30 transition-colors cursor-pointer", selected?.id === o.id && "bg-muted/50")}>
                    <td className="p-4 font-mono text-xs">{o.orderNumber}</td>
                    <td className="p-4"><p className="font-medium">{o.customerName}</p><p className="text-xs text-muted-foreground" dir="ltr">{o.customerPhone}</p></td>
                    <td className="p-4 font-medium">{formatPrice(o.finalAmount)}</td>
                    <td className="p-4"><span className={cn("text-xs font-medium", PAY_CFG[o.paymentStatus])}>{PAY_LABEL[o.paymentStatus]}</span></td>
                    <td className="p-4 text-muted-foreground whitespace-nowrap">{toJalali(o.createdAt)}</td>
                    <td className="p-4"><span className={cn("px-2.5 py-1 rounded-full text-xs font-medium", STATUS_CFG[o.status].color)}>{STATUS_CFG[o.status].label}</span></td>
                    <td className="p-4"><div className="flex gap-1"><button onClick={e => { e.stopPropagation(); open(o); }} className="p-1.5 rounded-lg hover:bg-muted"><Pencil className="w-3.5 h-3.5 text-muted-foreground" /></button><button onClick={e => { e.stopPropagation(); del(o.id); }} className="p-1.5 rounded-lg hover:bg-destructive/10"><Trash2 className="w-3.5 h-3.5 text-destructive" /></button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {selected && (
          <div className="w-72 shrink-0 glass rounded-2xl border border-border p-5 space-y-4">
            <div className="flex items-center justify-between"><p className="font-mono text-sm">{selected.orderNumber}</p><button onClick={() => setSelected(undefined)}><X className="w-4 h-4 text-muted-foreground" /></button></div>
            <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium inline-block", STATUS_CFG[selected.status].color)}>{STATUS_CFG[selected.status].label}</span>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">مشتری</span><span>{selected.customerName}</span></div>
              {selected.customerPhone && <div className="flex justify-between"><span className="text-muted-foreground">تلفن</span><span dir="ltr">{selected.customerPhone}</span></div>}
              <div className="flex justify-between"><span className="text-muted-foreground">مبلغ کل</span><span>{formatPrice(selected.totalAmount)}</span></div>
              {(selected.discountAmount ?? 0) > 0 && <div className="flex justify-between"><span className="text-muted-foreground">تخفیف</span><span className="text-red-400">-{formatPrice(selected.discountAmount ?? 0)}</span></div>}
              {(selected.shippingAmount ?? 0) > 0 && <div className="flex justify-between"><span className="text-muted-foreground">حمل</span><span>{formatPrice(selected.shippingAmount ?? 0)}</span></div>}
              <div className="flex justify-between font-semibold border-t border-border pt-2"><span>نهایی</span><span>{formatPrice(selected.finalAmount)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">پرداخت</span><span className={PAY_CFG[selected.paymentStatus]}>{PAY_LABEL[selected.paymentStatus]}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">تاریخ</span><span>{toJalali(selected.createdAt)}</span></div>
            </div>
            {selected.shippingAddress && <div><p className="text-xs text-muted-foreground mb-1">آدرس</p><p className="text-sm">{selected.shippingAddress}</p></div>}
          </div>
        )}
      </div>
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="glass rounded-2xl p-6 w-full max-w-lg border border-border max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5"><h2 className="text-lg font-bold">{editing ? "ویرایش سفارش" : "سفارش جدید"}</h2><button onClick={() => setShowModal(false)}><X className="w-4 h-4" /></button></div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input placeholder="شماره سفارش" value={form.orderNumber} onChange={e => setForm(f => ({ ...f, orderNumber: e.target.value }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as EOrder["status"] }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary">
                    {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <input placeholder="نام مشتری *" value={form.customerName} onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))} className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                <div className="grid grid-cols-2 gap-3">
                  <input placeholder="تلفن" value={form.customerPhone} onChange={e => setForm(f => ({ ...f, customerPhone: e.target.value }))} dir="ltr" className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                  <input placeholder="ایمیل" value={form.customerEmail} onChange={e => setForm(f => ({ ...f, customerEmail: e.target.value }))} dir="ltr" className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <input type="number" placeholder="مبلغ کل" value={form.totalAmount || ""} onChange={e => setForm(f => ({ ...f, totalAmount: Number(e.target.value) }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                  <input type="number" placeholder="تخفیف" value={form.discountAmount || ""} onChange={e => setForm(f => ({ ...f, discountAmount: Number(e.target.value) }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                  <input type="number" placeholder="حمل" value={form.shippingAmount || ""} onChange={e => setForm(f => ({ ...f, shippingAmount: Number(e.target.value) }))} className="px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary" />
                </div>
                <div className="px-3 py-2 rounded-xl bg-muted/50 border border-border text-sm text-muted-foreground">نهایی: {formatPrice(form.totalAmount - (form.discountAmount || 0) + (form.shippingAmount || 0))}</div>
                <select value={form.paymentStatus} onChange={e => setForm(f => ({ ...f, paymentStatus: e.target.value as EOrder["paymentStatus"] }))} className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary">
                  {Object.entries(PAY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <textarea placeholder="آدرس ارسال" value={form.shippingAddress} onChange={e => setForm(f => ({ ...f, shippingAddress: e.target.value }))} rows={2} className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary resize-none" />
                <textarea placeholder="یادداشت" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:border-primary resize-none" />
              </div>
              <div className="flex gap-3 mt-5"><button onClick={() => setShowModal(false)} className="flex-1 py-2.5 rounded-xl border border-border text-sm">انصراف</button><button onClick={save} className="flex-[2] py-2.5 rounded-xl gradient-brand text-black text-sm font-semibold">ذخیره</button></div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
