"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { FileText, CheckCircle2, PenLine, FileSignature, Trash2, AlertCircle } from "lucide-react";
import SignatureCanvas from "react-signature-canvas";
import { cn } from "@/lib/utils";
import { toJalali, formatPrice } from "@/lib/utils";

interface InvoiceData {
  id: string;
  invoiceNumber: string;
  total: number;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discount: number;
  status: string;
  issuedAt: string;
  dueDate: string;
  notes: string | null;
  items: Array<{ description: string; quantity: number; unitPrice: number; total: number }>;
  adminSignedAt: string | null;
  adminSignatureDataUrl: string | null;
  clientSignedAt: string | null;
  client: { companyName: string; contactName: string } | null;
}

export default function InvoiceSignPage({ params }: { params: Promise<{ token: string }> }) {
  const [token, setToken] = useState<string>("");
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [signMode, setSignMode] = useState<"canvas" | "typed">("canvas");
  const [signedName, setSignedName] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [signed, setSigned] = useState(false);
  const sigRef = useRef<SignatureCanvas>(null);

  useEffect(() => {
    params.then((p) => setToken(p.token));
  }, [params]);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/invoices/sign/${token}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setInvoice(d.data);
      })
      .catch(() => setError("خطا در بارگذاری فاکتور"))
      .finally(() => setLoading(false));
  }, [token]);

  const clear = useCallback(() => { sigRef.current?.clear(); setIsEmpty(true); }, []);
  const isValid = agreed && (signMode === "canvas" ? !isEmpty : !!signedName.trim());

  const handleSign = async () => {
    if (!isValid) return;
    setIsSubmitting(true);
    try {
      let signatureDataUrl = "";
      if (signMode === "canvas") {
        signatureDataUrl = sigRef.current!.getTrimmedCanvas().toDataURL("image/png");
      } else {
        const canvas = document.createElement("canvas");
        canvas.width = 400; canvas.height = 120;
        const ctx = canvas.getContext("2d")!;
        ctx.font = "bold italic 40px Georgia, serif";
        ctx.fillStyle = "#3b82f6";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(signedName, 200, 60);
        signatureDataUrl = canvas.toDataURL("image/png");
      }

      const res = await fetch(`/api/invoices/sign/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signatureDataUrl }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error ?? "خطا در ثبت امضا");
        return;
      }
      setSigned(true);
    } catch {
      setError("خطا در ارتباط با سرور");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h2 className="text-lg font-bold text-foreground mb-2">خطا</h2>
        <p className="text-muted-foreground">{error}</p>
      </div>
    </div>
  );

  if (!invoice) return null;

  if (signed || invoice.clientSignedAt) return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 250, damping: 20 }}
        className="text-center max-w-sm">
        <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 className="w-10 h-10 text-emerald-400" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">فاکتور امضا شد</h2>
        <p className="text-muted-foreground text-sm">فاکتور {invoice.invoiceNumber} با موفقیت امضا شد.</p>
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-3">
          <FileText className="w-5 h-5 text-amber-400" />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-foreground text-sm">{invoice.invoiceNumber}</p>
            <p className="text-xs text-muted-foreground">{invoice.client?.companyName ?? invoice.client?.contactName}</p>
          </div>
          <span className="text-sm font-bold text-amber-400">{(invoice.total / 1_000_000).toFixed(1)} میلیون تومان</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Admin signed indicator */}
        {invoice.adminSignedAt && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-sm text-emerald-400">این فاکتور توسط پرسی‌کور در {toJalali(invoice.adminSignedAt)} امضا شده است</span>
          </div>
        )}

        {/* Invoice details */}
        <div className="rounded-2xl bg-card border border-border overflow-hidden">
          <div className="bg-muted/50 px-5 py-3 border-b border-border flex items-center gap-2">
            <FileText className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">جزئیات فاکتور</span>
          </div>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-muted-foreground">تاریخ صدور: </span><span className="font-medium">{toJalali(invoice.issuedAt)}</span></div>
              <div><span className="text-muted-foreground">سررسید: </span><span className="font-medium">{toJalali(invoice.dueDate)}</span></div>
            </div>

            {Array.isArray(invoice.items) && invoice.items.length > 0 && (
              <div className="rounded-xl overflow-hidden border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-right px-3 py-2 text-xs text-muted-foreground font-medium">شرح خدمت</th>
                      <th className="text-center px-3 py-2 text-xs text-muted-foreground font-medium">تعداد</th>
                      <th className="text-left px-3 py-2 text-xs text-muted-foreground font-medium">مبلغ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items.map((item, i) => (
                      <tr key={i} className="border-t border-border">
                        <td className="px-3 py-2.5 text-foreground">{item.description}</td>
                        <td className="px-3 py-2.5 text-center text-muted-foreground">{item.quantity}</td>
                        <td className="px-3 py-2.5 text-left tabular-nums">{formatPrice(item.total, true)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="space-y-1.5 text-sm ms-auto max-w-xs">
              <div className="flex justify-between"><span className="text-muted-foreground">جمع:</span><span>{formatPrice(invoice.subtotal, true)}</span></div>
              {invoice.discount > 0 && <div className="flex justify-between"><span className="text-muted-foreground">تخفیف:</span><span className="text-emerald-400">- {formatPrice(invoice.discount, true)}</span></div>}
              {invoice.taxRate > 0 && <div className="flex justify-between"><span className="text-muted-foreground">مالیات ({invoice.taxRate}٪):</span><span>{formatPrice(invoice.taxAmount, true)}</span></div>}
              <div className="flex justify-between pt-2 border-t border-border font-bold text-base"><span>مبلغ نهایی:</span><span className="text-amber-400">{formatPrice(invoice.total, true)}</span></div>
            </div>
          </div>
        </div>

        {/* Admin signature */}
        {invoice.adminSignatureDataUrl && (
          <div className="rounded-2xl bg-card border border-border p-5">
            <p className="text-xs font-semibold text-muted-foreground mb-3">امضای پرسی‌کور</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={invoice.adminSignatureDataUrl} alt="admin signature" className="h-16" />
            {invoice.adminSignedAt && <p className="text-xs text-muted-foreground mt-2">{toJalali(invoice.adminSignedAt)}</p>}
          </div>
        )}

        {/* Sign section */}
        <div className="rounded-2xl bg-card border border-border overflow-hidden">
          <div className="bg-muted/50 px-5 py-3 border-b border-border flex items-center gap-2">
            <PenLine className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-medium text-foreground">امضای شما</span>
          </div>
          <div className="p-5 space-y-5">
            {/* Mode tabs */}
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

            <AnimatePresence mode="wait">
              {signMode === "canvas" ? (
                <motion.div key="canvas" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-foreground">امضا را در کادر رسم کنید</label>
                    <button onClick={clear} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-red-400 transition-colors">
                      <Trash2 className="w-3 h-3" />پاک کردن
                    </button>
                  </div>
                  <div className={cn("rounded-xl border-2 border-dashed bg-muted/20 overflow-hidden transition-colors", isEmpty ? "border-border" : "border-amber-400/50")}>
                    <SignatureCanvas ref={sigRef} penColor="#f59e0b"
                      canvasProps={{ width: 560, height: 160, className: "w-full", style: { direction: "ltr" } }}
                      onBegin={() => setIsEmpty(false)} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5 text-center">با انگشت یا موس امضا کنید</p>
                </motion.div>
              ) : (
                <motion.div key="typed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <label className="block text-sm font-medium text-foreground mb-2">نام و نام خانوادگی</label>
                  <input value={signedName} onChange={(e) => setSignedName(e.target.value)}
                    placeholder="مثال: علی احمدی"
                    className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-foreground text-lg placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber-400/40 transition-all" />
                  {signedName && (
                    <div className="mt-3 p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 text-center">
                      <p className="text-xs text-muted-foreground mb-1">پیش‌نمایش امضا</p>
                      <p className="text-2xl text-amber-400" style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontWeight: "bold" }}>{signedName}</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <label className="flex items-start gap-3 cursor-pointer group">
              <div onClick={() => setAgreed(!agreed)}
                className={cn("w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all",
                  agreed ? "bg-amber-500 border-amber-500" : "border-border group-hover:border-amber-400/50"
                )}>
                {agreed && <span className="text-white text-xs font-bold">✓</span>}
              </div>
              <span className="text-sm text-muted-foreground leading-relaxed">
                فاکتور فوق را مطالعه کرده‌ام و با مبلغ و شرایط آن موافقم.
              </span>
            </label>

            <div className="p-3 rounded-xl bg-muted/50 border border-border text-xs text-muted-foreground flex justify-between">
              <span>تاریخ امضا</span>
              <span dir="ltr">{new Date().toLocaleDateString("fa-IR")} — {new Date().toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })}</span>
            </div>

            {error && <p className="text-sm text-red-400 text-center">{error}</p>}

            <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
              onClick={handleSign} disabled={!isValid || isSubmitting}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {isSubmitting
                ? <><span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />در حال ثبت امضا...</>
                : <><CheckCircle2 className="w-4 h-4" />ثبت و تأیید امضا</>}
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}
