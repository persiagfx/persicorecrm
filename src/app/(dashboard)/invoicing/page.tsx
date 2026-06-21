"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { Plus, FileText, DollarSign, Clock, AlertTriangle, X, Printer, Send, CheckCircle2, Repeat, Download, PenLine, Trash2, Search } from "lucide-react";
import SignatureCanvas from "react-signature-canvas";
import Link from "next/link";
import { apiClient } from "@/lib/api/client";
import { toast } from "sonner";
import { InvoiceStatusBadge } from "@/components/common/StatusBadge";
import { formatPrice, toJalali } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { StatCard } from "@/components/common/StatCard";
import { InvoicePDFPreview } from "@/components/invoicing/InvoicePDFPreview";

interface InvoiceClient {
  id: string;
  companyName: string;
  contactName?: string;
  contactEmail?: string;
}

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface Installment {
  id: string;
  amount: number;
  dueDate: string;
  status: string;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  type: "invoice" | "quote";
  clientId: string;
  client?: InvoiceClient;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
  issuedAt: string;
  dueDate: string;
  paidAt?: string | null;
  notes?: string | null;
  isRecurring: boolean;
  nextInvoiceDate?: string | null;
  installments: Installment[];
  adminSignedAt?: string | null;
  adminSignatureDataUrl?: string | null;
  signToken?: string | null;
  clientSignedAt?: string | null;
}

// ─── Admin Sign Modal ─────────────────────────────────────────────────
function AdminSignModal({ invoice, onClose, onSigned }: { invoice: Invoice; onClose: () => void; onSigned: (dataUrl: string) => void }) {
  const sigRef = useRef<SignatureCanvas>(null);
  const [isEmpty, setIsEmpty] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const clear = () => { sigRef.current?.clear(); setIsEmpty(true); };

  const handleSign = async () => {
    if (isEmpty || !sigRef.current) return;
    setSubmitting(true);
    try {
      const dataUrl = sigRef.current.getTrimmedCanvas().toDataURL("image/png");
      await apiClient.put(`/invoices/${invoice.id}`, { _action: "admin-sign", signatureDataUrl: dataUrl });
      toast.success("امضا ثبت شد");
      onSigned(dataUrl);
      onClose();
    } catch {
      toast.error("خطا در ثبت امضا");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <PenLine className="w-4 h-4 text-primary" />
            <h2 className="font-bold text-foreground">امضای فاکتور</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted text-muted-foreground"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-sm text-muted-foreground">امضای خود را در کادر زیر رسم کنید</p>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">امضا</span>
            <button onClick={clear} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-red-400 transition-colors">
              <Trash2 className="w-3 h-3" />پاک کردن
            </button>
          </div>
          <div className={cn("rounded-xl border-2 border-dashed bg-muted/20 overflow-hidden transition-colors", isEmpty ? "border-border" : "border-primary/50")}>
            <SignatureCanvas ref={sigRef} penColor="currentColor"
              canvasProps={{ width: 440, height: 160, className: "w-full", style: { direction: "ltr" } }}
              onBegin={() => setIsEmpty(false)} />
          </div>
          <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
            onClick={handleSign} disabled={isEmpty || submitting}
            className="w-full py-3 rounded-xl gradient-brand text-black font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {submitting ? <><span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />در حال ثبت...</> : <><CheckCircle2 className="w-4 h-4" />ثبت امضا</>}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Invoice Detail Modal ─────────────────────────────────────────────
function InvoiceDetailModal({ invoice, onClose, onMarkPaid, onUpdate }: { invoice: Invoice; onClose: () => void; onMarkPaid: (id: string) => void; onUpdate: (id: string, patch: Partial<Invoice>) => void }) {
  const client = invoice.client;
  const isPaid = invoice.status === "paid";
  const isOverdue = invoice.status === "overdue";
  const [marking, setMarking] = useState(false);
  const [sending, setSending] = useState(false);
  const [showSignModal, setShowSignModal] = useState(false);

  const handleMarkPaid = async () => {
    setMarking(true);
    try {
      await apiClient.put(`/invoices/${invoice.id}`, { status: "paid", paidAt: new Date().toISOString() });
      toast.success("فاکتور پرداخت شده ثبت شد");
      onMarkPaid(invoice.id);
      onClose();
    } catch {
      toast.error("خطا در ثبت پرداخت");
    } finally {
      setMarking(false);
    }
  };

  const handleSend = async () => {
    setSending(true);
    try {
      await apiClient.put(`/invoices/${invoice.id}`, { _action: "send" });
      toast.success("فاکتور برای مشتری ارسال شد");
      onUpdate(invoice.id, { status: "sent" });
      onClose();
    } catch {
      toast.error("خطا در ارسال فاکتور");
    } finally {
      setSending(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-bold text-foreground">{invoice.invoiceNumber}</h2>
              <p className="text-xs text-muted-foreground">{invoice.type === "invoice" ? "فاکتور" : "پیش‌فاکتور"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <InvoiceStatusBadge status={invoice.status} />
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted text-muted-foreground ms-2">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">مشتری</p>
              <p className="font-semibold text-foreground">{client?.companyName}</p>
              {client?.contactName && <p className="text-sm text-muted-foreground mt-0.5">{client.contactName}</p>}
              {client?.contactEmail && <p className="text-xs text-muted-foreground mt-0.5 dir-ltr text-start">{client.contactEmail}</p>}
            </div>
            <div className="text-end">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">تاریخ‌ها</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between gap-8">
                  <span className="text-muted-foreground">صدور:</span>
                  <span className="text-foreground">{toJalali(invoice.issuedAt)}</span>
                </div>
                <div className="flex justify-between gap-8">
                  <span className="text-muted-foreground">سررسید:</span>
                  <span className={isOverdue ? "text-red-500 font-medium" : "text-foreground"}>{toJalali(invoice.dueDate)}</span>
                </div>
                {invoice.paidAt && (
                  <div className="flex justify-between gap-8">
                    <span className="text-muted-foreground">پرداخت:</span>
                    <span className="text-emerald-400">{toJalali(invoice.paidAt)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">اقلام</p>
            <div className="rounded-xl border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground">شرح خدمت</th>
                    <th className="text-center px-4 py-2.5 text-xs font-semibold text-muted-foreground">تعداد</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground">قیمت واحد</th>
                    <th className="text-right px-4 py-2.5 text-xs font-semibold text-muted-foreground">جمع</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item, idx) => (
                    <tr key={item.id ?? idx} className="border-b border-border/50">
                      <td className="px-4 py-3 text-foreground">{item.description}</td>
                      <td className="px-4 py-3 text-center text-muted-foreground">{item.quantity}</td>
                      <td className="px-4 py-3 tabular-nums text-muted-foreground">{formatPrice(item.unitPrice, true)}</td>
                      <td className="px-4 py-3 tabular-nums font-medium text-foreground">{formatPrice(item.total, true)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="ms-auto max-w-xs w-full space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">جمع کل</span>
              <span className="text-foreground tabular-nums">{formatPrice(invoice.subtotal, true)}</span>
            </div>
            {invoice.discount > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">تخفیف</span>
                <span className="text-emerald-400 tabular-nums">- {formatPrice(invoice.discount, true)}</span>
              </div>
            )}
            {invoice.taxRate > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">مالیات ({invoice.taxRate}٪)</span>
                <span className="text-foreground tabular-nums">{formatPrice(invoice.taxAmount, true)}</span>
              </div>
            )}
            <div className="flex justify-between pt-3 border-t border-border font-bold text-base">
              <span className="text-foreground">مبلغ قابل پرداخت</span>
              <span className="text-primary tabular-nums">{formatPrice(invoice.total, true)}</span>
            </div>
          </div>

          {invoice.installments.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">اقساط</p>
              <div className="space-y-2">
                {invoice.installments.map((inst, i) => (
                  <div key={inst.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/50 border border-border/50">
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        inst.status === "paid" ? "bg-emerald-500/10 text-emerald-400" :
                        inst.status === "overdue" ? "bg-red-500/10 text-red-400" :
                        "bg-muted text-muted-foreground"
                      }`}>
                        {i + 1}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground tabular-nums">{formatPrice(inst.amount, true)}</p>
                        <p className="text-xs text-muted-foreground">سررسید: {toJalali(inst.dueDate)}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      inst.status === "paid" ? "bg-emerald-500/10 text-emerald-400" :
                      inst.status === "overdue" ? "bg-red-500/10 text-red-400" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {inst.status === "paid" ? "پرداخت شده" : inst.status === "overdue" ? "معوق" : "در انتظار"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {invoice.notes && (
            <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
              <p className="text-xs font-semibold text-muted-foreground mb-1">یادداشت</p>
              <p className="text-sm text-foreground leading-relaxed">{invoice.notes}</p>
            </div>
          )}
        </div>

        {/* Admin signature display */}
        {invoice.adminSignedAt && (
          <div className="px-6 pb-4 space-y-2">
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-sm text-emerald-400">امضای شما در {toJalali(invoice.adminSignedAt)} ثبت شده</span>
            </div>
            {invoice.clientSignedAt && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-sm text-emerald-400">مشتری در {toJalali(invoice.clientSignedAt)} امضا کرد</span>
              </div>
            )}
            {invoice.signToken && !invoice.clientSignedAt && (
              <div className="p-3 rounded-xl bg-muted border border-border text-xs text-muted-foreground break-all">
                لینک امضای مشتری: {typeof window !== "undefined" ? window.location.origin : ""}/invoice-sign/{invoice.signToken}
              </div>
            )}
          </div>
        )}

        <div className="px-6 py-4 border-t border-border flex items-center gap-3 shrink-0 flex-wrap">
          <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-muted border border-border text-foreground text-sm hover:bg-muted/80 transition-colors">
            <Printer className="w-4 h-4" />چاپ
          </button>
          {!isPaid && invoice.status !== "cancelled" && !invoice.adminSignedAt && (
            <button onClick={() => setShowSignModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-muted border border-border text-foreground text-sm hover:bg-muted/80 transition-colors">
              <PenLine className="w-4 h-4" />امضای ادمین
            </button>
          )}
          {invoice.adminSignedAt && !isPaid && invoice.status !== "cancelled" && (
            <button onClick={handleSend} disabled={sending}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm hover:bg-blue-500/20 transition-colors disabled:opacity-50">
              <Send className="w-4 h-4" />{sending ? "در حال ارسال..." : "ارسال به مشتری"}
            </button>
          )}
          {!isPaid && (
            <button
              onClick={handleMarkPaid}
              disabled={marking}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-brand text-black font-semibold text-sm gold-glow ms-auto disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />{marking ? "..." : "ثبت پرداخت"}
            </button>
          )}
        </div>
      </motion.div>
      <AnimatePresence>
        {showSignModal && (
          <AdminSignModal
            invoice={invoice}
            onClose={() => setShowSignModal(false)}
            onSigned={(dataUrl) => onUpdate(invoice.id, { adminSignatureDataUrl: dataUrl, adminSignedAt: new Date().toISOString() })}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────
export default function InvoicingPage() {
  const searchParams = useSearchParams();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [tab, setTab] = useState<"all" | "quotes" | "invoices" | "overdue">("all");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [signTarget, setSignTarget] = useState<Invoice | null>(null);
  const [pdfInvoice, setPdfInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [search, setSearch] = useState("");

  const handleExport = async () => {
    setExporting(true);
    try {
      const token = localStorage.getItem("crm-token") ?? "";
      const res = await fetch("/api/export?type=invoices", { headers: { Authorization: `Bearer ${token}` } });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "invoices-export.xlsx"; a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error("خطا در خروجی گرفتن"); }
    finally { setExporting(false); }
  };

  const fetchInvoices = () => {
    setLoading(true);
    apiClient.get("/invoices?perPage=100")
      .then((res) => setInvoices(res.data.data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchInvoices();
  }, [searchParams.get("t")]);

  const paid = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.total, 0);
  const pending = invoices.filter((i) => i.status === "sent").reduce((s, i) => s + i.total, 0);
  const overdue = invoices.filter((i) => i.status === "overdue");
  const overdueTotal = overdue.reduce((s, i) => s + i.total, 0);

  const filtered = invoices.filter((inv) => {
    if (tab === "quotes" && inv.type !== "quote") return false;
    if (tab === "invoices" && inv.type !== "invoice") return false;
    if (tab === "overdue" && inv.status !== "overdue") return false;
    if (search) {
      const q = search.toLowerCase();
      return inv.invoiceNumber?.toLowerCase().includes(q) || inv.client?.companyName?.toLowerCase().includes(q);
    }
    return true;
  });

  const handleMarkPaid = (id: string) => {
    setInvoices((prev) => prev.map((inv) => inv.id === id ? { ...inv, status: "paid", paidAt: new Date().toISOString() } : inv));
  };

  const handleUpdate = (id: string, patch: Partial<Invoice>) => {
    setInvoices((prev) => prev.map((inv) => inv.id === id ? { ...inv, ...patch } : inv));
    setSelectedInvoice((prev) => prev?.id === id ? { ...prev, ...patch } : prev);
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" />
            فاکتورها و پیش‌فاکتورها
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border bg-card text-muted-foreground text-sm hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" />{exporting ? "..." : "خروجی Excel"}
          </button>
          <Link href="/invoicing/new">
            <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-brand text-black font-semibold text-sm gold-glow cursor-pointer">
              <Plus className="w-4 h-4" />فاکتور جدید
            </motion.div>
          </Link>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="پرداخت شده" value={paid} icon={DollarSign} trend={12} suffix=" ت" gradient="gradient-brand" />
        <StatCard title="در انتظار پرداخت" value={pending} icon={Clock} suffix=" ت" />
        <StatCard title="معوق" value={overdueTotal} icon={AlertTriangle} suffix=" ت" trend={-overdue.length} trendLabel="فاکتور" />
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="جستجوی فاکتور / مشتری..."
            className="pe-10 ps-4 py-2.5 rounded-xl bg-card border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 w-52" />
        </div>
      </div>

      <div className="flex items-center gap-1 bg-muted p-1 rounded-xl w-fit">
        {[
          { key: "all", label: "همه" },
          { key: "invoices", label: "فاکتورها" },
          { key: "quotes", label: "پیش‌فاکتورها" },
          { key: "overdue", label: "معوق" },
        ].map((t) => (
          <button key={t.key} onClick={() => setTab(t.key as typeof tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-muted-foreground text-sm">در حال بارگذاری...</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                {["شماره", "مشتری", "نوع", "مبلغ کل", "وضعیت", "امضا", "سررسید", "عملیات"].map((h) => (
                  <th key={h} className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv) => {
                const needsAdminSign = !inv.adminSignedAt && inv.status !== "paid" && inv.status !== "cancelled";
                const adminSigned = !!inv.adminSignedAt;
                const clientSigned = !!inv.clientSignedAt;
                return (
                <tr key={inv.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => setSelectedInvoice(inv)}>
                  <td className="px-4 py-3 font-mono text-xs text-foreground">{inv.invoiceNumber}</td>
                  <td className="px-4 py-3 font-medium text-foreground">{inv.client?.companyName}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      {inv.type === "invoice" ? "فاکتور" : "پیش‌فاکتور"}
                      {inv.isRecurring && (
                        <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-medium">
                          <Repeat className="w-2.5 h-2.5" />تکرار
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-primary tabular-nums font-medium">{formatPrice(inv.total, true)}</td>
                  <td className="px-4 py-3"><InvoiceStatusBadge status={inv.status} /></td>
                  {/* ستون امضا */}
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    {clientSigned ? (
                      <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
                        <CheckCircle2 className="w-3 h-3" />هر دو
                      </span>
                    ) : adminSigned ? (
                      <span className="flex items-center gap-1 text-xs text-blue-400 font-medium">
                        <CheckCircle2 className="w-3 h-3" />ادمین ✓
                      </span>
                    ) : needsAdminSign ? (
                      <button
                        onClick={() => setSignTarget(inv)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 transition-colors whitespace-nowrap">
                        <PenLine className="w-3 h-3" />امضای ادمین
                      </button>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className={`px-4 py-3 text-xs ${inv.status === "overdue" ? "text-red-500 font-medium" : "text-muted-foreground"}`}>
                    <div>{toJalali(inv.dueDate)}</div>
                    {inv.isRecurring && inv.nextInvoiceDate && (
                      <div className="flex items-center gap-1 text-blue-400 mt-0.5">
                        <Repeat className="w-2.5 h-2.5" />
                        {toJalali(inv.nextInvoiceDate)}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setSelectedInvoice(inv)}
                        className="px-2 py-1 rounded-lg text-xs bg-primary/10 hover:bg-primary/20 text-primary transition-colors font-medium">
                        مشاهده
                      </button>
                      <button
                        onClick={() => setPdfInvoice(inv)}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs bg-muted hover:bg-primary/10 hover:text-primary text-foreground transition-colors">
                        <Download className="w-3 h-3" />PDF
                      </button>
                    </div>
                  </td>
                </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground text-sm">
                    فاکتوری یافت نشد
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <AnimatePresence>
        {selectedInvoice && (
          <InvoiceDetailModal
            invoice={selectedInvoice}
            onClose={() => setSelectedInvoice(null)}
            onMarkPaid={handleMarkPaid}
            onUpdate={handleUpdate}
          />
        )}
      </AnimatePresence>

      {/* Quick admin sign from table row */}
      <AnimatePresence>
        {signTarget && (
          <AdminSignModal
            invoice={signTarget}
            onClose={() => setSignTarget(null)}
            onSigned={(dataUrl) => {
              handleUpdate(signTarget.id, { adminSignatureDataUrl: dataUrl, adminSignedAt: new Date().toISOString() });
              setSignTarget(null);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {pdfInvoice && (
          <InvoicePDFPreview
            invoice={pdfInvoice as any}
            client={pdfInvoice.client as any}
            onClose={() => setPdfInvoice(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
