"use client";
export const dynamic = "force-dynamic";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  FileSignature, CheckCircle2, Clock, AlertCircle, X, Eye,
  Trash2, PenLine, Pen, Download, ZoomIn, ZoomOut, ChevronLeft,
} from "lucide-react";
import SignatureCanvas from "react-signature-canvas";
import { usePortal, portalFetch } from "@/lib/portal-context";
import { cn } from "@/lib/utils";
import { toJalali } from "@/lib/utils";
import { toast } from "sonner";

interface Contract {
  id: string;
  title: string;
  status: string;
  signToken: string | null;
  content: string;
  sentAt: string | null;
  signedAt: string | null;
  expiresAt: string | null;
  adminSignedAt: string | null;
  adminSignatureDataUrl: string | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: typeof Clock }> = {
  sent:         { label: "منتظر امضای شما", color: "text-amber-400",   bg: "bg-amber-500/10",  icon: Pen },
  admin_signed: { label: "منتظر امضای شما", color: "text-amber-400",   bg: "bg-amber-500/10",  icon: Pen },
  signed:       { label: "امضا شده",         color: "text-emerald-400", bg: "bg-emerald-500/10", icon: CheckCircle2 },
  expired:      { label: "منقضی شده",        color: "text-red-400",     bg: "bg-red-500/10",     icon: AlertCircle },
};

function daysLeft(dateStr: string | null) {
  if (!dateStr) return null;
  const diff = Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86_400_000);
  return diff;
}

// ─── Signature Canvas Modal ────────────────────────────────────────────
function SignContractModal({
  contract, onClose, onSigned,
}: {
  contract: Contract;
  onClose: () => void;
  onSigned: () => void;
}) {
  const { token } = usePortal();
  const [step, setStep] = useState<"review" | "sign">("review");
  const [signMode, setSignMode] = useState<"canvas" | "typed">("canvas");
  const [signedName, setSignedName] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [zoom, setZoom] = useState(100);
  const sigRef = useRef<SignatureCanvas>(null);

  const clear = useCallback(() => { sigRef.current?.clear(); setIsEmpty(true); }, []);
  const isValid = agreed && (signMode === "canvas" ? !isEmpty : !!signedName.trim());

  const days = daysLeft(contract.expiresAt);

  const handleSign = async () => {
    if (!isValid || !contract.signToken) return;
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

      const res = await fetch(`/api/contracts/sign/${contract.signToken}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signatureDataUrl }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? "خطا در ثبت امضا");
      }
      onSigned();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "خطا در ثبت امضا");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <FileSignature className="w-4 h-4 text-blue-400 shrink-0" />
            <h2 className="font-bold text-foreground truncate">{contract.title}</h2>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {step === "review" && (
              <>
                <button onClick={() => setZoom((z) => Math.max(z - 10, 60))} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors"><ZoomOut className="w-3.5 h-3.5" /></button>
                <span className="text-xs text-muted-foreground w-10 text-center tabular-nums">{zoom}٪</span>
                <button onClick={() => setZoom((z) => Math.min(z + 10, 150))} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors"><ZoomIn className="w-3.5 h-3.5" /></button>
              </>
            )}
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted text-muted-foreground ml-1"><X className="w-4 h-4" /></button>
          </div>
        </div>

        {/* Step indicators */}
        <div className="flex items-center gap-4 px-5 py-3 border-b border-border bg-muted/30 shrink-0">
          {[{ id: "review", label: "مطالعه قرارداد" }, { id: "sign", label: "امضا و تأیید" }].map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                step === s.id ? "bg-gradient-to-r from-blue-500 to-teal-500 text-white" :
                step === "sign" && s.id === "review" ? "bg-emerald-500 text-white" :
                "bg-muted text-muted-foreground"
              )}>
                {step === "sign" && s.id === "review" ? "✓" : i + 1}
              </div>
              <span className={cn("text-sm", step === s.id ? "text-foreground font-medium" : "text-muted-foreground")}>{s.label}</span>
              {i < 1 && <div className="w-8 h-px bg-border" />}
            </div>
          ))}
          {days !== null && days > 0 && days <= 7 && (
            <span className="mr-auto text-xs text-amber-400 font-medium">{days} روز تا انقضا</span>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {step === "review" ? (
              <motion.div key="review" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="p-6" dir="rtl">
                {contract.adminSignedAt && (
                  <div className="flex items-center gap-2 mb-5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-sm text-emerald-400 font-medium">این قرارداد توسط پرسی‌کور امضا شده است</span>
                  </div>
                )}
                <div
                  className="prose prose-sm max-w-none text-foreground leading-loose font-[Vazirmatn,sans-serif] prose-headings:text-foreground prose-p:text-foreground prose-li:text-foreground prose-strong:text-foreground"
                  style={{ fontSize: `${zoom}%` }}
                  dangerouslySetInnerHTML={{ __html: contract.content || "<p>متن قرارداد موجود نیست.</p>" }}
                />
                {contract.adminSignatureDataUrl && (
                  <div className="mt-10 pt-6 border-t border-border">
                    <p className="text-xs text-muted-foreground mb-2">امضای پرسی‌کور:</p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={contract.adminSignatureDataUrl} alt="admin sig" className="h-14" />
                    {contract.adminSignedAt && <p className="text-xs text-muted-foreground mt-1">{toJalali(contract.adminSignedAt)}</p>}
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div key="sign" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="p-6 max-w-lg mx-auto">
                <p className="text-sm text-muted-foreground mb-5 text-center">امضای خود را رسم کنید یا نام کامل‌تان را تایپ کنید</p>

                {/* Mode tab */}
                <div className="flex gap-2 p-1 bg-muted rounded-xl mb-5">
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
                  <div className="mb-5">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-foreground">امضا را در کادر رسم کنید</label>
                      <button onClick={clear} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-red-400 transition-colors">
                        <Trash2 className="w-3 h-3" />پاک کردن
                      </button>
                    </div>
                    <div className={cn("rounded-xl border-2 border-dashed bg-muted/20 overflow-hidden transition-colors", isEmpty ? "border-border" : "border-blue-400/50")}>
                      <SignatureCanvas ref={sigRef} penColor="#3b82f6"
                        canvasProps={{ width: 460, height: 160, className: "w-full", style: { direction: "ltr" } }}
                        onBegin={() => setIsEmpty(false)} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5 text-center">با انگشت یا موس امضا کنید</p>
                  </div>
                ) : (
                  <div className="mb-5">
                    <label className="block text-sm font-medium text-foreground mb-2">نام و نام خانوادگی</label>
                    <input value={signedName} onChange={(e) => setSignedName(e.target.value)}
                      placeholder="مثال: علی احمدی"
                      className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-foreground text-lg placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-400/40 transition-all" />
                    {signedName && (
                      <div className="mt-3 p-4 rounded-xl border border-blue-500/30 bg-blue-500/5 text-center">
                        <p className="text-xs text-muted-foreground mb-1">پیش‌نمایش امضا</p>
                        <p className="text-2xl text-blue-400" style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontWeight: "bold" }}>{signedName}</p>
                      </div>
                    )}
                  </div>
                )}

                <label className="flex items-start gap-3 cursor-pointer group mb-5">
                  <div onClick={() => setAgreed(!agreed)}
                    className={cn("w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all",
                      agreed ? "bg-blue-500 border-blue-500" : "border-border group-hover:border-blue-400/50"
                    )}>
                    {agreed && <span className="text-white text-xs font-bold">✓</span>}
                  </div>
                  <span className="text-sm text-muted-foreground leading-relaxed">
                    محتوای این قرارداد را به دقت مطالعه کرده‌ام و با تمام شرایط و مفاد آن موافقم.
                  </span>
                </label>

                <div className="p-3 rounded-xl bg-muted/50 border border-border text-xs text-muted-foreground flex justify-between">
                  <span>تاریخ امضا</span>
                  <span dir="ltr">{new Date().toLocaleDateString("fa-IR")} — {new Date().toLocaleTimeString("fa-IR", { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-border flex gap-3 shrink-0">
          {step === "review" ? (
            <>
              <button onClick={onClose} className="py-2.5 px-4 rounded-xl border border-border bg-muted text-foreground text-sm hover:bg-muted/80 transition-colors">بستن</button>
              <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                onClick={() => setStep("sign")}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-teal-500 text-white font-semibold text-sm flex items-center justify-center gap-2">
                <Pen className="w-4 h-4" />ادامه — امضای قرارداد
              </motion.button>
            </>
          ) : (
            <>
              <button onClick={() => setStep("review")} className="py-2.5 px-4 rounded-xl border border-border bg-muted text-foreground text-sm hover:bg-muted/80 transition-colors flex items-center gap-1">
                <ChevronLeft className="w-4 h-4 rotate-180" />بازگشت
              </button>
              <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                onClick={handleSign} disabled={!isValid || isSubmitting}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-teal-500 text-white font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {isSubmitting
                  ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />در حال ثبت امضا...</>
                  : <><CheckCircle2 className="w-4 h-4" />ثبت و تأیید امضا</>}
              </motion.button>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Preview Modal ─────────────────────────────────────────────────────
function ContractPreviewModal({
  contract, onClose, onSign,
}: {
  contract: Contract;
  onClose: () => void;
  onSign?: () => void;
}) {
  const isPending = contract.status === "sent" || contract.status === "admin_signed";
  const isSigned = contract.status === "signed";

  const handlePrint = () => window.print();

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <FileSignature className="w-4 h-4 text-blue-400" />
            <h2 className="font-bold text-foreground">{contract.title}</h2>
          </div>
          <div className="flex items-center gap-2">
            {(() => {
              const cfg = STATUS_CONFIG[contract.status];
              if (!cfg) return null;
              return (
                <span className={cn("flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-medium", cfg.bg, cfg.color)}>
                  <cfg.icon className="w-3 h-3" />{cfg.label}
                </span>
              );
            })()}
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted text-muted-foreground"><X className="w-4 h-4" /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6" dir="rtl">
          {/* Info row */}
          <div className="grid grid-cols-2 gap-3 mb-6 text-sm">
            {contract.sentAt && (
              <div className="p-3 rounded-xl bg-muted">
                <p className="text-xs text-muted-foreground mb-0.5">تاریخ ارسال</p>
                <p className="font-medium">{toJalali(contract.sentAt)}</p>
              </div>
            )}
            {contract.expiresAt && (
              <div className={cn("p-3 rounded-xl", daysLeft(contract.expiresAt) !== null && daysLeft(contract.expiresAt)! <= 3 ? "bg-red-500/10 border border-red-500/20" : "bg-muted")}>
                <p className="text-xs text-muted-foreground mb-0.5">مهلت امضا</p>
                <p className={cn("font-medium", daysLeft(contract.expiresAt) !== null && daysLeft(contract.expiresAt)! <= 3 ? "text-red-400" : "")}>
                  {toJalali(contract.expiresAt)}
                  {daysLeft(contract.expiresAt) !== null && daysLeft(contract.expiresAt)! > 0 && (
                    <span className="text-xs text-muted-foreground mr-1">({daysLeft(contract.expiresAt)} روز)</span>
                  )}
                </p>
              </div>
            )}
          </div>

          {/* Admin signed indicator */}
          {contract.adminSignedAt && (
            <div className="flex items-center gap-2 mb-5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="text-sm text-emerald-400">امضای پرسی‌کور در {toJalali(contract.adminSignedAt)} ثبت شده</span>
            </div>
          )}

          {/* Contract content */}
          <div
            className="prose prose-sm max-w-none text-foreground leading-loose font-[Vazirmatn,sans-serif] prose-headings:text-foreground prose-p:text-foreground prose-li:text-foreground prose-strong:text-foreground mb-8"
            dangerouslySetInnerHTML={{ __html: contract.content || "<p>متن قرارداد موجود نیست.</p>" }}
          />

          {/* Signature section */}
          <div className="border-t border-border pt-6">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">وضعیت امضاها</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 rounded-xl bg-muted/50 border border-border">
                <p className="text-xs text-muted-foreground mb-2">امضای پرسی‌کور</p>
                {contract.adminSignatureDataUrl ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={contract.adminSignatureDataUrl} alt="admin" className="h-12 mx-auto mb-1" />
                    <p className="text-xs text-emerald-400">✓ {contract.adminSignedAt ? toJalali(contract.adminSignedAt) : "ثبت شده"}</p>
                  </>
                ) : (
                  <div className="h-12 border-b border-dashed border-border flex items-end justify-center pb-1">
                    <span className="text-xs text-muted-foreground">امضا نشده</span>
                  </div>
                )}
              </div>
              <div className="text-center p-4 rounded-xl bg-muted/50 border border-border">
                <p className="text-xs text-muted-foreground mb-2">امضای شما</p>
                {isSigned ? (
                  <>
                    <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-1" />
                    <p className="text-xs text-emerald-400">✓ {contract.signedAt ? toJalali(contract.signedAt) : "ثبت شده"}</p>
                  </>
                ) : (
                  <div className="h-12 border-b border-dashed border-amber-500/40 flex items-end justify-center pb-1">
                    <span className="text-xs text-amber-400">در انتظار امضا</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-border flex gap-3 shrink-0">
          <button onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-muted border border-border text-foreground text-sm hover:bg-muted/80 transition-colors">
            <Download className="w-4 h-4" />دانلود PDF
          </button>
          {isPending && onSign && (
            <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
              onClick={() => { onClose(); onSign(); }}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-teal-500 text-white font-semibold text-sm flex items-center justify-center gap-2">
              <Pen className="w-4 h-4" />امضای قرارداد
            </motion.button>
          )}
          {!isPending && (
            <button onClick={onClose} className="ms-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-teal-500 text-white text-sm font-semibold">بستن</button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Success overlay ───────────────────────────────────────────────────
function SignedSuccessOverlay({ contractTitle, onClose }: { contractTitle: string; onClose: () => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="bg-card border border-border rounded-3xl p-10 max-w-sm w-full text-center shadow-2xl">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.15, type: "spring", stiffness: 200 }}>
          <CheckCircle2 className="w-20 h-20 text-emerald-400 mx-auto mb-5" />
        </motion.div>
        <h2 className="text-2xl font-bold text-foreground mb-2">قرارداد امضا شد!</h2>
        <p className="text-muted-foreground text-sm mb-1">«{contractTitle}»</p>
        <p className="text-muted-foreground text-xs mb-8">امضای شما با موفقیت ثبت و ذخیره شد.</p>
        <button onClick={onClose}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-teal-500 text-white font-semibold">
          متوجه شدم
        </button>
      </motion.div>
    </motion.div>
  );
}

// ─── Page inner (uses useSearchParams) ────────────────────────────────
function ContractsPageInner() {
  const { token } = usePortal();
  const searchParams = useSearchParams();
  const autoSignId = searchParams.get("sign");

  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [signContract, setSignContract] = useState<Contract | null>(null);
  const [previewContract, setPreviewContract] = useState<Contract | null>(null);
  const [successContract, setSuccessContract] = useState<Contract | null>(null);

  useEffect(() => {
    portalFetch("/api/portal/contracts", {}, token)
      .then((r) => r.json())
      .then((d) => {
        const list: Contract[] = d.data ?? [];
        setContracts(list);
        // auto-open sign modal if ?sign=id in URL
        if (autoSignId) {
          const target = list.find((c) => c.id === autoSignId && (c.status === "sent" || c.status === "admin_signed"));
          if (target) setSignContract(target);
        }
      })
      .catch(() => toast.error("خطا در دریافت قراردادها"))
      .finally(() => setIsLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleSigned = (contract: Contract) => {
    setContracts((prev) => prev.map((c) => c.id === contract.id ? { ...c, status: "signed", signedAt: new Date().toISOString() } : c));
    setSignContract(null);
    setSuccessContract(contract);
  };

  const pending  = contracts.filter((c) => c.status === "sent" || c.status === "admin_signed");
  const signed   = contracts.filter((c) => c.status === "signed");
  const others   = contracts.filter((c) => c.status !== "sent" && c.status !== "admin_signed" && c.status !== "signed");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Title */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <FileSignature className="w-6 h-6 text-blue-400" />قراردادها
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          {pending.length > 0 ? `${pending.length} قرارداد منتظر امضای شما` : `${contracts.length} قرارداد`}
        </p>
      </motion.div>

      {/* Pending contracts */}
      {pending.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-amber-400 flex items-center gap-2">
            <Pen className="w-4 h-4" />نیاز به امضا ({pending.length})
          </h2>
          {pending.map((c, i) => {
            const days = daysLeft(c.expiresAt);
            const urgent = days !== null && days <= 3 && days >= 0;
            return (
              <motion.div key={c.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className={cn("p-5 rounded-2xl border transition-all",
                  urgent
                    ? "bg-red-500/5 border-red-500/30"
                    : "bg-amber-500/5 border-amber-500/20 hover:border-amber-500/40"
                )}>
                <div className="flex items-start gap-4">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                    urgent ? "bg-red-500/20" : "bg-amber-500/15"
                  )}>
                    <FileSignature className={cn("w-5 h-5", urgent ? "text-red-400" : "text-amber-400")} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground truncate">{c.title}</p>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      {c.sentAt && <span className="text-xs text-muted-foreground">ارسال: {toJalali(c.sentAt)}</span>}
                      {days !== null && (
                        <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full",
                          urgent ? "bg-red-500/15 text-red-400" :
                          days <= 7 ? "bg-amber-500/15 text-amber-400" :
                          "bg-muted text-muted-foreground"
                        )}>
                          {days <= 0 ? "منقضی شده" : `${days} روز تا انقضا`}
                        </span>
                      )}
                      {c.adminSignedAt && (
                        <span className="text-xs text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />امضای پرسی‌کور ثبت شده
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => setPreviewContract(c)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border bg-muted text-muted-foreground text-xs hover:text-foreground transition-colors">
                      <Eye className="w-3.5 h-3.5" />مطالعه
                    </button>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      onClick={() => setSignContract(c)}
                      className={cn("flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-bold",
                        urgent
                          ? "bg-gradient-to-r from-red-500 to-rose-500"
                          : "bg-gradient-to-r from-blue-500 to-teal-500"
                      )}>
                      <Pen className="w-3.5 h-3.5" />امضا
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Signed contracts */}
      {signed.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />امضا شده ({signed.length})
          </h2>
          {signed.map((c) => (
            <div key={c.id}
              className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border hover:border-emerald-500/20 transition-all">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{c.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  امضا شده در {c.signedAt ? toJalali(c.signedAt) : "—"}
                </p>
              </div>
              <div className="hidden md:flex gap-1.5 items-center shrink-0">
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400">پرسی‌کور ✓</span>
                <span className="text-muted-foreground text-xs">·</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400">شما ✓</span>
              </div>
              <button onClick={() => setPreviewContract(c)}
                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0">
                <Eye className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Other (expired etc.) */}
      {others.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground">سایر</h2>
          {others.map((c) => {
            const cfg = STATUS_CONFIG[c.status] ?? { label: c.status, color: "text-muted-foreground", bg: "bg-muted", icon: Clock };
            return (
              <div key={c.id}
                className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border opacity-60">
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                  <FileSignature className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{c.title}</p>
                </div>
                <span className={cn("flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-medium shrink-0", cfg.bg, cfg.color)}>
                  <cfg.icon className="w-3 h-3" />{cfg.label}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {contracts.length === 0 && (
        <div className="py-20 text-center text-muted-foreground">
          <FileSignature className="w-14 h-14 mx-auto mb-4 opacity-20" />
          <p className="font-medium">قراردادی وجود ندارد</p>
          <p className="text-sm mt-1">قراردادهای ارسال‌شده توسط پرسی‌کور اینجا نمایش داده می‌شوند</p>
        </div>
      )}

      {/* Sign modal */}
      <AnimatePresence>
        {signContract && (
          <SignContractModal
            contract={signContract}
            onClose={() => setSignContract(null)}
            onSigned={() => handleSigned(signContract)}
          />
        )}
      </AnimatePresence>

      {/* Preview modal */}
      <AnimatePresence>
        {previewContract && (
          <ContractPreviewModal
            contract={previewContract}
            onClose={() => setPreviewContract(null)}
            onSign={
              (previewContract.status === "sent" || previewContract.status === "admin_signed")
                ? () => { setSignContract(previewContract); setPreviewContract(null); }
                : undefined
            }
          />
        )}
      </AnimatePresence>

      {/* Success overlay */}
      <AnimatePresence>
        {successContract && (
          <SignedSuccessOverlay
            contractTitle={successContract.title}
            onClose={() => setSuccessContract(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Page with Suspense (required for useSearchParams) ─────────────────
function PortalContractsPageInner() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
      </div>
    }>
      <ContractsPageInner />
    </Suspense>
  );
}

export default function PortalContractsPage() {
  return <Suspense><PortalContractsPageInner /></Suspense>;
}
