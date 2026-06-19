"use client";

import { use, useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  CheckCircle2, FileSignature, AlertCircle, Download,
  ZoomIn, ZoomOut, Trash2, PenLine, Loader2,
} from "lucide-react";
import SignatureCanvas from "react-signature-canvas";
import { cn } from "@/lib/utils";
import { downloadContractPdf } from "@/lib/generate-pdf";

interface ContractData {
  token: string;
  id: string;
  title: string;
  clientName: string;
  companyName: string;
  content: string;
  expiresAt?: string | null;
  status: string;
  adminSignatureDataUrl?: string | null;
  adminSignedAt?: string | null;
  signedAt?: string | null;
}

type Step = "review" | "sign" | "done";
type SignMode = "canvas" | "typed";

export default function SignContractPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [contract, setContract] = useState<ContractData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("review");
  const [signMode, setSignMode] = useState<SignMode>("canvas");
  const [signedName, setSignedName] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);
  const [zoom, setZoom] = useState(100);
  const [clientSignatureDataUrl, setClientSignatureDataUrl] = useState<string | null>(null);
  const [isPdfLoading, setIsPdfLoading] = useState(false);

  const sigCanvasRef = useRef<SignatureCanvas>(null);

  const handlePrint = () => window.print();

  const handleDownloadPdf = async () => {
    if (!contract) return;
    setIsPdfLoading(true);
    try {
      await downloadContractPdf({
        title: contract.title,
        clientName: contract.clientName,
        content: contract.content,
        adminSignatureDataUrl: contract.adminSignatureDataUrl,
        clientSignatureDataUrl,
        signedAt: contract.signedAt,
        adminSignedAt: contract.adminSignedAt,
      });
    } finally {
      setIsPdfLoading(false);
    }
  };

  useEffect(() => {
    fetch(`/api/contracts/sign/${token}`)
      .then(async (r) => {
        if (!r.ok) {
          const d = await r.json().catch(() => ({}));
          throw new Error(d.error ?? "خطا");
        }
        return r.json();
      })
      .then((d) => {
        setContract(d.data);
        if (d.data.signedAt) setStep("done");
      })
      .catch((e) => setError(e.message))
      .finally(() => setIsLoading(false));
  }, [token]);

  const clearCanvas = useCallback(() => {
    sigCanvasRef.current?.clear();
    setIsEmpty(true);
  }, []);

  const handleSign = async () => {
    const canvasEmpty = signMode === "canvas" && isEmpty;
    const typedEmpty = signMode === "typed" && !signedName.trim();
    if ((canvasEmpty && typedEmpty) || !agreed) return;

    setIsSubmitting(true);
    try {
      let signatureDataUrl = "";
      if (signMode === "canvas") {
        signatureDataUrl = sigCanvasRef.current!.getTrimmedCanvas().toDataURL("image/png");
      } else {
        const canvas = document.createElement("canvas");
        canvas.width = 400; canvas.height = 120;
        const ctx = canvas.getContext("2d")!;
        ctx.font = "bold 36px cursive";
        ctx.fillStyle = "#d4a843";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(signedName, 200, 60);
        signatureDataUrl = canvas.toDataURL("image/png");
      }

      const res = await fetch(`/api/contracts/sign/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signatureDataUrl }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? "خطا در ثبت امضا");
      }
      setClientSignatureDataUrl(signatureDataUrl);
      setStep("done");
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "خطا در ثبت امضا");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isSignValid = agreed && (signMode === "typed" ? !!signedName.trim() : !isEmpty);
  const expired = contract?.expiresAt ? new Date(contract.expiresAt) < new Date() : false;
  const alreadySigned = contract?.status === "signed";

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" dir="rtl">
        <div className="text-center py-20">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-foreground mb-2">قرارداد یافت نشد</h2>
          <p className="text-muted-foreground">{error ?? "لینک امضا معتبر نیست."}</p>
          <p className="text-muted-foreground mt-1">لطفاً با پرسی‌کور تماس بگیرید.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card/80 backdrop-blur-xl border-b border-border px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl gradient-brand flex items-center justify-center font-bold text-black text-sm">P</div>
            <div>
              <p className="text-sm font-semibold text-foreground">پرسی‌کور</p>
              <p className="text-xs text-muted-foreground">امضای آنلاین قرارداد</p>
            </div>
          </div>
          {step === "review" && !expired && !alreadySigned && (
            <div className="flex items-center gap-2">
              <button onClick={() => setZoom((z) => Math.max(z - 10, 60))} className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs text-muted-foreground tabular-nums w-12 text-center">{zoom}٪</span>
              <button onClick={() => setZoom((z) => Math.min(z + 10, 150))} className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Steps */}
        {step !== "done" && !expired && !alreadySigned && (
          <div className="flex items-center justify-center gap-4 mb-8">
            {[{ id: "review", label: "مطالعه قرارداد" }, { id: "sign", label: "امضا و تأیید" }].map((s, i) => (
              <div key={s.id} className="flex items-center gap-2">
                <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                  step === s.id ? "gradient-brand text-black" :
                  step === "sign" && s.id === "review" ? "bg-emerald-500 text-white" :
                  "bg-muted text-muted-foreground"
                )}>
                  {step === "sign" && s.id === "review" ? "✓" : i + 1}
                </div>
                <span className={cn("text-sm", step === s.id ? "text-foreground font-medium" : "text-muted-foreground")}>{s.label}</span>
                {i < 1 && <div className="w-12 h-px bg-border mx-1" />}
              </div>
            ))}
          </div>
        )}

        <AnimatePresence mode="wait">
          {alreadySigned ? (
            <motion.div key="already" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-20">
              <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-foreground mb-2">این قرارداد قبلاً امضا شده است</h2>
              <p className="text-muted-foreground">قرارداد شما ثبت شده است.</p>
            </motion.div>
          ) : expired ? (
            <motion.div key="expired" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-20">
              <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-foreground mb-2">لینک منقضی شده</h2>
              <p className="text-muted-foreground">مهلت امضای این قرارداد به پایان رسیده است.</p>
              <p className="text-muted-foreground mt-1">لطفاً با پرسی‌کور تماس بگیرید.</p>
            </motion.div>
          ) : step === "review" ? (
            <motion.div key="review" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <div className="p-5 rounded-2xl bg-card border border-border mb-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-xl font-bold text-foreground mb-1">{contract.title}</h1>
                    <p className="text-sm text-muted-foreground">برای: {contract.clientName}</p>
                  </div>
                  <button onClick={handleDownloadPdf} disabled={isPdfLoading}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl bg-muted border border-border text-muted-foreground hover:text-foreground transition-colors disabled:opacity-60">
                    {isPdfLoading ? <div className="w-3.5 h-3.5 border-2 border-current/30 border-t-current rounded-full animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                    دانلود PDF
                  </button>
                </div>
                {contract.expiresAt && (
                  <div className="mt-4 pt-4 border-t border-border text-sm text-muted-foreground">
                    مهلت امضا: <span className="text-amber-400 font-medium">{new Date(contract.expiresAt).toLocaleDateString("fa-IR")}</span>
                  </div>
                )}
                {/* Admin signature indicator */}
                {contract.adminSignatureDataUrl && (
                  <div className="mt-4 pt-4 border-t border-border flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-sm text-emerald-400">این قرارداد توسط پرسی‌کور امضا شده است</span>
                  </div>
                )}
              </div>

              <div className="rounded-2xl bg-card border border-border overflow-hidden mb-5">
                <div className="bg-muted/50 px-5 py-3 border-b border-border flex items-center gap-2">
                  <FileSignature className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">متن قرارداد</span>
                </div>
                <div className="p-8" style={{ fontSize: `${zoom}%` }}>
                  <div
                    className="prose prose-sm max-w-none text-foreground leading-loose font-[Vazirmatn,sans-serif] prose-headings:text-foreground prose-p:text-foreground prose-li:text-foreground prose-strong:text-foreground"
                    dangerouslySetInnerHTML={{ __html: contract.content || "" }}
                  />
                  {/* Admin signature shown in contract body */}
                  {contract.adminSignatureDataUrl && (
                    <div className="mt-12 pt-6 border-t border-border">
                      <div className="flex justify-start">
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground mb-2">امضای پرسی‌کور</p>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={contract.adminSignatureDataUrl} alt="admin signature" className="h-16" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={() => setStep("sign")}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl gradient-brand text-black font-bold gold-glow">
                  ادامه و امضای قرارداد ←
                </motion.button>
              </div>
            </motion.div>
          ) : step === "sign" ? (
            <motion.div key="sign" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-xl mx-auto">
              <div className="p-6 rounded-2xl bg-card border border-border">
                <h2 className="text-lg font-bold text-foreground mb-1">تأیید و امضای قرارداد</h2>
                <p className="text-sm text-muted-foreground mb-5">امضای خود را رسم کنید یا نام خود را تایپ کنید.</p>

                <div className="flex gap-2 mb-4 p-1 bg-muted rounded-xl">
                  {(["canvas", "typed"] as const).map((m) => (
                    <button key={m} onClick={() => setSignMode(m)}
                      className={cn("flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all",
                        signMode === m ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                      )}>
                      {m === "canvas" ? <><PenLine className="w-3.5 h-3.5" />امضای دستی</> : <><FileSignature className="w-3.5 h-3.5" />امضای تایپی</>}
                    </button>
                  ))}
                </div>

                {signMode === "canvas" ? (
                  <div className="mb-5">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-foreground">امضای دستی</label>
                      <button onClick={clearCanvas} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-red-400 transition-colors">
                        <Trash2 className="w-3 h-3" />پاک کردن
                      </button>
                    </div>
                    <div className="rounded-xl border-2 border-dashed border-border bg-muted/20 overflow-hidden">
                      <SignatureCanvas ref={sigCanvasRef} penColor="hsl(43 74% 56%)"
                        canvasProps={{ width: 460, height: 160, className: "w-full", style: { direction: "ltr" } }}
                        onBegin={() => setIsEmpty(false)} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5 text-center">در کادر بالا امضای خود را رسم کنید</p>
                  </div>
                ) : (
                  <div className="mb-5">
                    <label className="block text-sm font-medium text-foreground mb-2">نام و نام خانوادگی</label>
                    <input value={signedName} onChange={(e) => setSignedName(e.target.value)}
                      placeholder="نام کامل خود را وارد کنید"
                      className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-foreground text-lg font-bold placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all" />
                    {signedName && (
                      <div className="mt-3 p-4 rounded-xl border border-primary/30 bg-primary/5 text-center">
                        <p className="text-muted-foreground text-xs mb-1">پیش‌نمایش امضا</p>
                        <p className="text-2xl font-bold text-primary" style={{ fontFamily: "cursive" }}>{signedName}</p>
                      </div>
                    )}
                  </div>
                )}

                <label className="flex items-start gap-3 cursor-pointer group mb-6">
                  <div onClick={() => setAgreed(!agreed)}
                    className={cn("w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all",
                      agreed ? "bg-primary border-primary" : "border-border group-hover:border-primary/50"
                    )}>
                    {agreed && <span className="text-black text-xs font-bold">✓</span>}
                  </div>
                  <span className="text-sm text-muted-foreground leading-relaxed">
                    محتوای قرارداد را مطالعه کرده‌ام و با کلیه شرایط و مفاد آن موافقم.
                  </span>
                </label>

                <div className="p-3 rounded-xl bg-muted/50 border border-border mb-6 text-xs text-muted-foreground space-y-1">
                  <div className="flex justify-between">
                    <span>تاریخ و زمان</span>
                    <span>{new Date().toLocaleDateString("fa-IR")}</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setStep("review")} className="flex-1 py-3 rounded-xl border border-border bg-muted text-muted-foreground text-sm hover:text-foreground transition-colors">
                    بازگشت
                  </button>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={handleSign} disabled={!isSignValid || isSubmitting}
                    className="flex-1 py-3 rounded-xl gradient-brand text-black font-bold text-sm gold-glow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                    {isSubmitting ? (
                      <><span className="w-4 h-4 border-2 border-black/40 border-t-black rounded-full animate-spin" />در حال ثبت...</>
                    ) : "امضا و تأیید قرارداد"}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-20">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: "spring", stiffness: 200 }}>
                <CheckCircle2 className="w-20 h-20 text-emerald-400 mx-auto mb-6" />
              </motion.div>
              <h2 className="text-3xl font-bold text-foreground mb-3">قرارداد با موفقیت امضا شد!</h2>
              <p className="text-muted-foreground mb-2">قرارداد شما ثبت و تأیید شد.</p>
              <p className="text-sm text-muted-foreground mb-8">می‌توانید نسخه PDF امضاشده را دانلود کنید.</p>
              <button onClick={handleDownloadPdf} disabled={isPdfLoading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border bg-card text-foreground text-sm hover:bg-muted transition-colors mx-auto disabled:opacity-60">
                {isPdfLoading
                  ? <><div className="w-4 h-4 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin" />در حال تولید PDF...</>
                  : <><Download className="w-4 h-4" />دانلود PDF قرارداد</>}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <style>{`
        @media print {
          nav, .sticky, button, [role="button"] { display: none !important; }
          body { background: #fff !important; color: #111 !important; }
          .bg-background { background: #fff !important; }
          .bg-card { background: #f9f9f9 !important; border: 1px solid #ddd !important; }
          .text-foreground { color: #111 !important; }
          .text-muted-foreground { color: #555 !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>
    </div>
  );
}
