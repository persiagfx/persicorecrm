"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { FileText, CheckCircle2, Clock, AlertCircle, CreditCard, Loader2, PenLine, Trash2, FileSignature, X } from "lucide-react";
import SignatureCanvas from "react-signature-canvas";
import { usePortal, portalFetch } from "@/lib/portal-context";
import { cn } from "@/lib/utils";
import { toJalali } from "@/lib/utils";
import { toast } from "sonner";

interface Invoice {
  id: string;
  invoiceNumber: string;
  type: string;
  total: number;
  status: string;
  issuedAt: string;
  dueDate: string;
  paidAt: string | null;
  project: { id: string; name: string } | null;
  items: Array<{ description: string; quantity: number; unitPrice: number; total: number }>;
  adminSignedAt: string | null;
  adminSignatureDataUrl: string | null;
  signToken: string | null;
  clientSignedAt: string | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: typeof Clock }> = {
  sent:    { label: "در انتظار پرداخت", color: "text-blue-400",    bg: "bg-blue-500/10",    icon: Clock },
  overdue: { label: "معوق",             color: "text-red-400",     bg: "bg-red-500/10",     icon: AlertCircle },
  paid:    { label: "پرداخت شده",       color: "text-emerald-400", bg: "bg-emerald-500/10", icon: CheckCircle2 },
  partial: { label: "پرداخت جزئی",     color: "text-amber-400",   bg: "bg-amber-500/10",   icon: Clock },
};

// ─── Invoice Sign Modal ───────────────────────────────────────────────
function InvoiceSignModal({ invoice, token: portalToken, onClose, onSigned }: {
  invoice: Invoice; token: string | null; onClose: () => void; onSigned: () => void;
}) {
  const [signMode, setSignMode] = useState<"canvas" | "typed">("canvas");
  const [signedName, setSignedName] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const sigRef = useRef<SignatureCanvas>(null);
  const clear = useCallback(() => { sigRef.current?.clear(); setIsEmpty(true); }, []);
  const isValid = agreed && (signMode === "canvas" ? !isEmpty : !!signedName.trim());

  const handleSign = async () => {
    if (!isValid || !invoice.signToken) return;
    setSubmitting(true);
    try {
      let signatureDataUrl = "";
      if (signMode === "canvas") {
        signatureDataUrl = sigRef.current!.getTrimmedCanvas().toDataURL("image/png");
      } else {
        const canvas = document.createElement("canvas");
        canvas.width = 400; canvas.height = 120;
        const ctx = canvas.getContext("2d")!;
        ctx.font = "bold italic 40px Georgia, serif";
        ctx.fillStyle = "#f59e0b";
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(signedName, 200, 60);
        signatureDataUrl = canvas.toDataURL("image/png");
      }
      const res = await fetch(`/api/invoices/sign/${invoice.signToken}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signatureDataUrl }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error ?? "خطا"); }
      toast.success("فاکتور با موفقیت امضا شد");
      onSigned();
      onClose();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "خطا در ثبت امضا");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <PenLine className="w-4 h-4 text-amber-400" />
            <h2 className="font-bold text-foreground">{invoice.invoiceNumber} — امضا</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted text-muted-foreground"><X className="w-4 h-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-5" dir="rtl">
          {invoice.adminSignedAt && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-sm text-emerald-400">این فاکتور توسط پرسی‌کور امضا شده است</span>
            </div>
          )}
          <div className="p-3 rounded-xl bg-muted text-sm flex justify-between">
            <span className="text-muted-foreground">مبلغ:</span>
            <span className="font-bold text-amber-400">{(invoice.total / 1_000_000).toFixed(1)} میلیون تومان</span>
          </div>

          <div className="flex gap-2 p-1 bg-muted rounded-xl">
            {(["canvas", "typed"] as const).map((m) => (
              <button key={m} onClick={() => setSignMode(m)}
                className={cn("flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition-all",
                  signMode === m ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                )}>
                {m === "canvas" ? <><PenLine className="w-3.5 h-3.5" />امضای دستی</> : <><FileSignature className="w-3.5 h-3.5" />امضای تایپی</>}
              </button>
            ))}
          </div>

          {signMode === "canvas" ? (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-foreground">امضا را در کادر رسم کنید</label>
                <button onClick={clear} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-red-400 transition-colors">
                  <Trash2 className="w-3 h-3" />پاک کردن
                </button>
              </div>
              <div className={cn("rounded-xl border-2 border-dashed bg-muted/20 overflow-hidden transition-colors", isEmpty ? "border-border" : "border-amber-400/50")}>
                <SignatureCanvas ref={sigRef} penColor="#f59e0b"
                  canvasProps={{ width: 460, height: 140, className: "w-full", style: { direction: "ltr" } }}
                  onBegin={() => setIsEmpty(false)} />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">نام و نام خانوادگی</label>
              <input value={signedName} onChange={(e) => setSignedName(e.target.value)}
                placeholder="مثال: علی احمدی"
                className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-foreground text-lg placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber-400/40 transition-all" />
              {signedName && (
                <div className="mt-3 p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 text-center">
                  <p className="text-2xl text-amber-400" style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontWeight: "bold" }}>{signedName}</p>
                </div>
              )}
            </div>
          )}

          <label className="flex items-start gap-3 cursor-pointer group">
            <div onClick={() => setAgreed(!agreed)}
              className={cn("w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all",
                agreed ? "bg-amber-500 border-amber-500" : "border-border group-hover:border-amber-400/50"
              )}>
              {agreed && <span className="text-white text-xs font-bold">✓</span>}
            </div>
            <span className="text-sm text-muted-foreground leading-relaxed">
              این فاکتور را مطالعه کرده‌ام و با مبلغ و شرایط آن موافقم.
            </span>
          </label>
        </div>
        <div className="px-5 py-4 border-t border-border shrink-0">
          <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
            onClick={handleSign} disabled={!isValid || submitting}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {submitting
              ? <><span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />در حال ثبت...</>
              : <><CheckCircle2 className="w-4 h-4" />ثبت و تأیید امضا</>}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function PortalInvoicesPage() {
  const { token } = usePortal();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [paying, setPaying] = useState<string | null>(null);
  const [signingInvoice, setSigningInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    portalFetch("/api/portal/invoices", {}, token)
      .then((r) => r.json())
      .then((d) => setInvoices(d.data ?? []))
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  }, [token]);

  const handlePay = async (inv: Invoice) => {
    setPaying(inv.id);
    try {
      const res = await portalFetch("/api/portal/payment/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId: inv.id }),
      }, token);
      const json = await res.json();
      if (!res.ok || !json.data?.startPayUrl) {
        toast.error(json.error || "خطا در ایجاد درخواست پرداخت");
        return;
      }
      // انتقال به درگاه پرداخت
      window.location.href = json.data.startPayUrl;
    } catch {
      toast.error("خطا در اتصال به سرور");
    } finally {
      setPaying(null);
    }
  };

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
    </div>
  );

  const total = invoices.reduce((s, i) => s + i.total, 0);
  const unpaidTotal = invoices.filter((i) => i.status !== "paid").reduce((s, i) => s + i.total, 0);
  const paidCount = invoices.filter((i) => i.status === "paid").length;

  return (
    <div className="space-y-5" dir="rtl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <FileText className="w-6 h-6 text-blue-400" />فاکتورها
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">لیست فاکتورها و پرداخت آنلاین</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "جمع کل", value: `${(total / 1_000_000).toFixed(1)}M`, color: "text-foreground" },
          { label: "پرداخت نشده", value: `${(unpaidTotal / 1_000_000).toFixed(1)}M`, color: "text-red-400" },
          { label: "پرداخت شده", value: paidCount, color: "text-emerald-400" },
        ].map((s) => (
          <div key={s.label} className="p-4 rounded-2xl bg-card border border-border">
            <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
            <p className={cn("text-xl font-bold tabular-nums", s.color)}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Invoice list */}
      <div className="space-y-3">
        {invoices.map((inv, i) => {
          const cfg = STATUS_CONFIG[inv.status] ?? { label: inv.status, color: "text-muted-foreground", bg: "bg-muted", icon: Clock };
          const isExp = expanded === inv.id;
          const canPay = inv.status === "sent" || inv.status === "overdue" || inv.status === "partial";

          return (
            <motion.div key={inv.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="rounded-2xl bg-card border border-border overflow-hidden">
              {/* Header row */}
              <div className="flex items-center gap-4 p-4 cursor-pointer" onClick={() => setExpanded(isExp ? null : inv.id)}>
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", cfg.bg)}>
                  <cfg.icon className={cn("w-5 h-5", cfg.color)} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground font-mono text-sm">{inv.invoiceNumber}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <p className="text-xs text-muted-foreground">{inv.project?.name ?? "—"} · صادر: {toJalali(inv.issuedAt)}</p>
                    {inv.signToken && !inv.clientSignedAt && (
                      <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-400 text-xs font-medium">
                        <PenLine className="w-3 h-3" />نیاز به امضا
                      </span>
                    )}
                    {inv.clientSignedAt && (
                      <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 text-xs font-medium">
                        <CheckCircle2 className="w-3 h-3" />امضا شده
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-semibold text-foreground tabular-nums">{(inv.total / 1_000_000).toFixed(1)}M</p>
                  <p className="text-xs text-muted-foreground">تومان</p>
                </div>
                <span className={cn("flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium shrink-0", cfg.bg, cfg.color)}>
                  <cfg.icon className="w-3 h-3" />{cfg.label}
                </span>
              </div>

              {/* Expanded detail */}
              {isExp && (
                <div className="border-t border-border p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-muted-foreground">سررسید: </span><span className="font-medium">{toJalali(inv.dueDate)}</span></div>
                    {inv.paidAt && (
                      <div><span className="text-muted-foreground">پرداخت: </span><span className="font-medium text-emerald-400">{toJalali(inv.paidAt)}</span></div>
                    )}
                  </div>

                  {Array.isArray(inv.items) && inv.items.length > 0 && (
                    <div className="rounded-xl overflow-hidden border border-border">
                      <table className="w-full text-sm">
                        <thead className="bg-muted">
                          <tr>
                            <th className="text-right px-3 py-2 text-muted-foreground font-medium">آیتم</th>
                            <th className="text-center px-3 py-2 text-muted-foreground font-medium">تعداد</th>
                            <th className="text-left px-3 py-2 text-muted-foreground font-medium">مبلغ</th>
                          </tr>
                        </thead>
                        <tbody>
                          {inv.items.map((item, idx) => (
                            <tr key={idx} className="border-t border-border">
                              <td className="px-3 py-2 text-foreground">{item.description}</td>
                              <td className="px-3 py-2 text-muted-foreground text-center">{item.quantity}</td>
                              <td className="px-3 py-2 text-foreground text-left tabular-nums">{(item.unitPrice / 1_000_000).toFixed(1)}M</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* امضای فاکتور */}
                  {inv.signToken && !inv.clientSignedAt && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setSigningInvoice(inv); }}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-amber-500 to-yellow-500 text-black shadow-lg shadow-amber-500/20 hover:opacity-90 transition-opacity">
                      <PenLine className="w-4 h-4" />امضای فاکتور
                    </button>
                  )}
                  {inv.clientSignedAt && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="text-sm text-emerald-400">فاکتور در {toJalali(inv.clientSignedAt)} امضا شد</span>
                    </div>
                  )}

                  {/* دکمه پرداخت آنلاین */}
                  {canPay && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handlePay(inv); }}
                      disabled={paying === inv.id}
                      className={cn(
                        "w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm",
                        "bg-gradient-to-r from-blue-500 to-teal-500 text-white",
                        "shadow-lg shadow-blue-500/20 hover:opacity-90 transition-opacity",
                        "disabled:opacity-60 disabled:cursor-not-allowed"
                      )}>
                      {paying === inv.id ? (
                        <><Loader2 className="w-4 h-4 animate-spin" />در حال اتصال به درگاه...</>
                      ) : (
                        <><CreditCard className="w-4 h-4" />پرداخت آنلاین ({(inv.total / 1_000_000).toFixed(1)}M تومان)</>
                      )}
                    </button>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}

        {invoices.length === 0 && (
          <div className="py-20 text-center text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p>فاکتوری وجود ندارد</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {signingInvoice && (
          <InvoiceSignModal
            invoice={signingInvoice}
            token={token}
            onClose={() => setSigningInvoice(null)}
            onSigned={() => {
              setInvoices((prev) => prev.map((inv) =>
                inv.id === signingInvoice.id ? { ...inv, clientSignedAt: new Date().toISOString() } : inv
              ));
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
