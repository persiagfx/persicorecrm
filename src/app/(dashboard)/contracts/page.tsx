"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  FileSignature, Plus, Search, Eye, Download, Send, Clock, CheckCircle2,
  AlertCircle, FileText, Copy, X, Check, Trash2, PenLine, Pen, RefreshCw,
} from "lucide-react";
import { downloadContractPdf } from "@/lib/generate-pdf";
import SignatureCanvas from "react-signature-canvas";
import { toJalali, timeAgo } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { apiClient } from "@/lib/api/client";

type ContractStatus = "draft" | "admin_signed" | "sent" | "signed" | "expired" | "cancelled";

interface Contract {
  id: string;
  title: string;
  clientId: string;
  client?: { id: string; companyName: string; contactName: string };
  status: ContractStatus;
  value?: number;
  content?: string;
  createdAt: string;
  sentAt?: string;
  signedAt?: string;
  adminSignedAt?: string;
  adminSignatureDataUrl?: string;
  signatureDataUrl?: string;
  signToken?: string;
  expiresAt?: string;
}

interface Client {
  id: string;
  companyName: string;
  contactName: string;
}

const STATUS_CONFIG: Record<ContractStatus, { label: string; icon: typeof Clock; color: string; bg: string }> = {
  draft: { label: "پیش‌نویس", icon: FileText, color: "text-muted-foreground", bg: "bg-muted" },
  admin_signed: { label: "امضای ادمین", icon: Pen, color: "text-amber-400", bg: "bg-amber-500/10" },
  sent: { label: "ارسال شده", icon: Send, color: "text-blue-400", bg: "bg-blue-500/10" },
  signed: { label: "امضا شده", icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10" },
  expired: { label: "منقضی", icon: AlertCircle, color: "text-red-400", bg: "bg-red-500/10" },
  cancelled: { label: "لغو شده", icon: X, color: "text-muted-foreground", bg: "bg-muted" },
};

const templates = [
  { id: "t1", title: "قرارداد طراحی وب‌سایت", icon: "🌐", description: "برای پروژه‌های طراحی سایت", content: "این قرارداد بین کارفرما و مجری جهت طراحی وب‌سایت منعقد می‌گردد.\n\nماده ۱: موضوع قرارداد\nطراحی و پیاده‌سازی وب‌سایت...\n\nماده ۲: مدت قرارداد\nمدت اجرای این قرارداد ... ماه می‌باشد.\n\nماده ۳: مبلغ قرارداد\nمبلغ کل قرارداد ... تومان می‌باشد." },
  { id: "t2", title: "قرارداد نگهداری ماهانه", icon: "🔧", description: "نگهداری و پشتیبانی", content: "این قرارداد بین کارفرما و مجری جهت نگهداری ماهانه وب‌سایت منعقد می‌گردد.\n\nماده ۱: خدمات تحت پوشش\n- پشتیبانی فنی\n- به‌روزرسانی محتوا\n- رفع باگ‌ها" },
  { id: "t3", title: "قرارداد طراحی UI/UX", icon: "🎨", description: "رابط کاربری و تجربه", content: "این قرارداد بین کارفرما و مجری جهت طراحی رابط کاربری منعقد می‌گردد." },
  { id: "t4", title: "قرارداد توسعه اپلیکیشن", icon: "📱", description: "اپلیکیشن موبایل و وب", content: "این قرارداد بین کارفرما و مجری جهت توسعه اپلیکیشن موبایل منعقد می‌گردد." },
];

// ─── Admin Sign Modal ──────────────────────────────────────────────────
function AdminSignModal({
  contract,
  onClose,
  onSigned,
}: {
  contract: Contract;
  onClose: () => void;
  onSigned: (updated: Contract) => void;
}) {
  const [signMode, setSignMode] = useState<"saved" | "canvas" | "typed">("saved");
  const [signedName, setSignedName] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedSignature, setSavedSignature] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const sigRef = useRef<SignatureCanvas>(null);

  useEffect(() => {
    apiClient.get("/settings/signature")
      .then((r) => {
        const sig = r.data.data?.signature;
        setSavedSignature(sig ?? null);
        if (!sig) setSignMode("canvas");
      })
      .catch(() => setSignMode("canvas"));
  }, []);

  const clear = useCallback(() => { sigRef.current?.clear(); setIsEmpty(true); }, []);

  const handleSaveSignature = async (dataUrl: string) => {
    setIsSaving(true);
    try {
      await apiClient.post("/settings/signature", { signatureDataUrl: dataUrl });
      setSavedSignature(dataUrl);
      toast.success("امضا برای دفعات بعد ذخیره شد");
    } catch { /* ignore */ } finally { setIsSaving(false); }
  };

  const isValid = agreed && (
    signMode === "saved" ? !!savedSignature :
    signMode === "canvas" ? !isEmpty :
    !!signedName.trim()
  );

  const handleSign = async () => {
    if (!isValid) return;
    setIsSubmitting(true);
    try {
      let signatureDataUrl = "";
      if (signMode === "saved") {
        signatureDataUrl = savedSignature!;
      } else if (signMode === "canvas") {
        signatureDataUrl = sigRef.current!.getTrimmedCanvas().toDataURL("image/png");
        if (agreed) handleSaveSignature(signatureDataUrl);
      } else {
        const canvas = document.createElement("canvas");
        canvas.width = 400; canvas.height = 120;
        const ctx = canvas.getContext("2d")!;
        ctx.fillStyle = "transparent";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.font = "bold 36px cursive";
        ctx.fillStyle = "#d4a843";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(signedName, 200, 60);
        signatureDataUrl = canvas.toDataURL("image/png");
        if (agreed) handleSaveSignature(signatureDataUrl);
      }
      const res = await apiClient.put(`/contracts/${contract.id}`, {
        _action: "admin-sign",
        signatureDataUrl,
      });
      toast.success("امضای ادمین ثبت شد");
      onSigned(res.data.data);
    } catch {
      toast.error("خطا در ثبت امضا");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-bold text-foreground flex items-center gap-2">
            <Pen className="w-4 h-4 text-amber-400" />امضای ادمین
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted text-muted-foreground"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-muted-foreground">
            قرارداد: <span className="font-medium text-foreground">{contract.title}</span>
          </p>

          {/* Mode switcher */}
          <div className="flex gap-1.5 p-1 bg-muted rounded-xl">
            {([
              { id: "saved" as const, label: "امضای ذخیره‌شده", icon: <Check className="w-3.5 h-3.5" />, disabled: !savedSignature },
              { id: "canvas" as const, label: "امضای دستی", icon: <PenLine className="w-3.5 h-3.5" />, disabled: false },
              { id: "typed" as const, label: "تایپی", icon: <FileSignature className="w-3.5 h-3.5" />, disabled: false },
            ]).map((m) => (
              <button key={m.id} onClick={() => !m.disabled && setSignMode(m.id)}
                disabled={m.disabled}
                className={cn("flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all",
                  signMode === m.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                  m.disabled && "opacity-30 cursor-not-allowed"
                )}>
                {m.icon}{m.label}
              </button>
            ))}
          </div>

          {signMode === "saved" && savedSignature ? (
            <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 text-center">
              <p className="text-xs text-muted-foreground mb-2">امضای ذخیره‌شده</p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={savedSignature} alt="saved signature" className="h-14 mx-auto" />
              <button onClick={() => { setSavedSignature(null); setSignMode("canvas"); apiClient.delete("/settings/signature").catch(() => null); }}
                className="mt-2 text-xs text-red-400 hover:underline">حذف و رسم مجدد</button>
            </div>
          ) : signMode === "canvas" ? (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-foreground">امضای دستی</label>
                <button onClick={clear} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-red-400 transition-colors">
                  <Trash2 className="w-3 h-3" />پاک کردن
                </button>
              </div>
              <div className="rounded-xl border-2 border-dashed border-border bg-muted/20 overflow-hidden">
                <SignatureCanvas ref={sigRef} penColor="hsl(43 74% 56%)"
                  canvasProps={{ width: 460, height: 150, className: "w-full", style: { direction: "ltr" } }}
                  onBegin={() => setIsEmpty(false)} />
              </div>
              <p className="text-xs text-muted-foreground mt-1.5 text-center">پس از تأیید، این امضا برای دفعات بعد ذخیره می‌شود</p>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">نام ادمین</label>
              <input value={signedName} onChange={(e) => setSignedName(e.target.value)}
                placeholder="نام کامل را وارد کنید"
                className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-foreground text-lg font-bold placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all" />
              {signedName && (
                <div className="mt-3 p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 text-center">
                  <p className="text-muted-foreground text-xs mb-1">پیش‌نمایش</p>
                  <p className="text-2xl font-bold text-amber-400" style={{ fontFamily: "cursive" }}>{signedName}</p>
                </div>
              )}
            </div>
          )}

          <label className="flex items-start gap-3 cursor-pointer group">
            <div onClick={() => setAgreed(!agreed)}
              className={cn("w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all",
                agreed ? "bg-amber-400 border-amber-400" : "border-border group-hover:border-amber-400/50"
              )}>
              {agreed && <span className="text-black text-xs font-bold">✓</span>}
            </div>
            <span className="text-sm text-muted-foreground leading-relaxed">
              به عنوان نماینده پرسی‌کور این قرارداد را تأیید و امضا می‌کنم.
            </span>
          </label>
        </div>
        <div className="px-6 py-4 border-t border-border flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border bg-muted text-foreground text-sm hover:bg-muted/80 transition-colors">انصراف</button>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            disabled={!isValid || isSubmitting} onClick={handleSign}
            className="flex-1 py-2.5 rounded-xl bg-amber-500 text-black font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {isSubmitting ? <><span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />در حال ثبت...</> : "ثبت امضا"}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── New Contract Modal ────────────────────────────────────────────────
function NewContractModal({
  onClose, onAdd, clients, initialTemplateContent = "", initialTitle = "",
}: {
  onClose: () => void;
  onAdd: (c: Contract) => void;
  clients: Client[];
  initialTemplateContent?: string;
  initialTitle?: string;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [clientId, setClientId] = useState("");
  const [content, setContent] = useState(initialTemplateContent);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !clientId) return;
    setIsSaving(true);
    try {
      const res = await apiClient.post("/contracts", { title: title.trim(), clientId, content });
      onAdd(res.data.data);
      toast.success("قرارداد با موفقیت ایجاد شد");
      onClose();
    } catch {
      toast.error("خطا در ایجاد قرارداد");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <h2 className="font-bold text-foreground flex items-center gap-2">
            <FileSignature className="w-4 h-4 text-primary" />قرارداد جدید
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted text-muted-foreground"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">عنوان قرارداد *</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: قرارداد طراحی وب‌سایت شرکت آلفا"
              className="w-full px-4 py-2.5 rounded-xl bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">مشتری *</label>
            <select value={clientId} onChange={(e) => setClientId(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40">
              <option value="">انتخاب مشتری...</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.companyName}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">متن قرارداد</label>
            <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={10}
              placeholder="متن قرارداد را وارد کنید..."
              className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none leading-relaxed" />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-border flex gap-3 shrink-0">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border bg-muted text-foreground text-sm hover:bg-muted/80 transition-colors">انصراف</button>
          <button onClick={handleSubmit} disabled={!title.trim() || !clientId || isSaving}
            className="flex-1 py-2.5 rounded-xl gradient-brand text-black font-semibold text-sm gold-glow disabled:opacity-40 disabled:cursor-not-allowed">
            {isSaving ? "در حال ذخیره..." : "ذخیره پیش‌نویس"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Preview Modal ─────────────────────────────────────────────────────
function ContractPreviewModal({ contract, onClose }: { contract: Contract; onClose: () => void }) {
  const status = STATUS_CONFIG[contract.status] ?? STATUS_CONFIG.draft;
  const [isPdfLoading, setIsPdfLoading] = useState(false);

  const handleDownloadPdf = async () => {
    setIsPdfLoading(true);
    try {
      await downloadContractPdf({
        title: contract.title,
        clientName: contract.client?.contactName ?? contract.client?.companyName ?? "مشتری",
        content: contract.content ?? "",
        adminSignatureDataUrl: contract.adminSignatureDataUrl,
        clientSignatureDataUrl: contract.signatureDataUrl,
        signedAt: contract.signedAt,
        adminSignedAt: contract.adminSignedAt,
      });
    } finally {
      setIsPdfLoading(false);
    }
  };
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-card rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col border border-border">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <h2 className="font-bold text-foreground">پیش‌نمایش قرارداد</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted text-muted-foreground"><X className="w-4 h-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-8" dir="rtl">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-foreground mb-3">{contract.title}</h1>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
              <status.icon className="w-3.5 h-3.5" />{status.label}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-6 mb-8 p-4 rounded-xl bg-muted/30 border border-border text-sm">
            <div><span className="text-muted-foreground">مشتری: </span><span className="font-medium">{contract.client?.companyName ?? "—"}</span></div>
            <div><span className="text-muted-foreground">تاریخ: </span><span className="font-medium">{toJalali(contract.createdAt)}</span></div>
          </div>
          <div className="prose prose-sm max-w-none text-foreground leading-loose whitespace-pre-line">
            {contract.content || "متن قرارداد هنوز وارد نشده است."}
          </div>
          {/* Signatures */}
          <div className="mt-12 pt-6 border-t border-border">
            <div className="grid grid-cols-2 gap-8">
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-2">امضای ادمین پرسی‌کور</p>
                {contract.adminSignatureDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={contract.adminSignatureDataUrl} alt="admin signature" className="h-16 mx-auto" />
                ) : (
                  <div className="h-16 border-b-2 border-dashed border-border flex items-end justify-center pb-1">
                    <span className="text-xs text-muted-foreground">امضا نشده</span>
                  </div>
                )}
                {contract.adminSignedAt && <p className="text-xs text-emerald-400 mt-1">{toJalali(contract.adminSignedAt)}</p>}
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-2">امضای مشتری</p>
                {contract.signatureDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={contract.signatureDataUrl} alt="client signature" className="h-16 mx-auto" />
                ) : (
                  <div className="h-16 border-b-2 border-dashed border-border flex items-end justify-center pb-1">
                    <span className="text-xs text-muted-foreground">امضا نشده</span>
                  </div>
                )}
                {contract.signedAt && <p className="text-xs text-emerald-400 mt-1">{toJalali(contract.signedAt)}</p>}
              </div>
            </div>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-border flex gap-3 shrink-0">
          <button onClick={handleDownloadPdf} disabled={isPdfLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted border border-border text-foreground text-sm hover:bg-muted/80 transition-colors disabled:opacity-60">
            {isPdfLoading
              ? <><RefreshCw className="w-4 h-4 animate-spin" />در حال تولید...</>
              : <><Download className="w-4 h-4" />دانلود PDF</>}
          </button>
          <button onClick={onClose} className="ms-auto px-4 py-2 rounded-xl gradient-brand text-black text-sm font-semibold gold-glow">بستن</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────
export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ContractStatus | "all">("all");
  const [activeContract, setActiveContract] = useState<Contract | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newModalTemplate, setNewModalTemplate] = useState({ title: "", content: "" });
  const [previewContract, setPreviewContract] = useState<Contract | null>(null);
  const [adminSignContract, setAdminSignContract] = useState<Contract | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      apiClient.get("/contracts"),
      apiClient.get("/clients?perPage=100"),
    ]).then(([cRes, clRes]) => {
      setContracts(cRes.data.data ?? []);
      setClients(clRes.data.data ?? []);
    }).catch(() => toast.error("خطا در بارگذاری داده‌ها"))
      .finally(() => setIsLoading(false));
  }, []);

  const filtered = contracts.filter((c) => {
    const matchSearch = search === "" || c.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: contracts.length,
    signed: contracts.filter((c) => c.status === "signed").length,
    pending: contracts.filter((c) => c.status === "sent" || c.status === "admin_signed").length,
    totalValue: 0,
  };

  const handleSend = async (contract: Contract) => {
    try {
      const res = await apiClient.put(`/contracts/${contract.id}`, { _action: "send" });
      const updated = res.data.data;
      setContracts((prev) => prev.map((c) => c.id === contract.id ? updated : c));
      if (activeContract?.id === contract.id) setActiveContract(updated);
      toast.success("قرارداد با موفقیت ارسال شد");
    } catch {
      toast.error("خطا در ارسال قرارداد");
    }
  };

  const handleDelete = async (contractId: string) => {
    if (!window.confirm("آیا از حذف این قرارداد مطمئن هستید؟")) return;
    try {
      await apiClient.delete(`/contracts/${contractId}`);
      setContracts((prev) => prev.filter((c) => c.id !== contractId));
      setActiveContract(null);
      toast.success("قرارداد حذف شد");
    } catch {
      toast.error("خطا در حذف قرارداد");
    }
  };

  const handleCopyLink = async (contract: Contract) => {
    const token = contract.signToken ?? contract.id;
    const link = `${window.location.origin}/sign/${token}`;
    await navigator.clipboard.writeText(link);
    setCopiedId(contract.id);
    toast.success("لینک کپی شد");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAdminSigned = (updated: Contract) => {
    setContracts((prev) => prev.map((c) => c.id === updated.id ? { ...c, ...updated } : c));
    if (activeContract?.id === updated.id) setActiveContract({ ...activeContract, ...updated });
    setAdminSignContract(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <FileSignature className="w-6 h-6 text-primary" />قراردادها
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">{stats.signed} قرارداد امضا شده از {stats.total}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowTemplates(!showTemplates)}
            className={cn("flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm transition-colors",
              showTemplates ? "bg-primary/10 border-primary/30 text-primary" : "bg-muted border-border text-foreground hover:bg-muted/80"
            )}>
            <FileText className="w-4 h-4" />قالب‌ها
          </button>
          <button onClick={() => { setNewModalTemplate({ title: "", content: "" }); setShowNewModal(true); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-brand text-black font-semibold text-sm gold-glow">
            <Plus className="w-4 h-4" />قرارداد جدید
          </button>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "کل قراردادها", value: stats.total, color: "text-foreground" },
          { label: "امضا شده", value: stats.signed, color: "text-emerald-400" },
          { label: "در انتظار امضا", value: stats.pending, color: "text-blue-400" },
          { label: "در حال پردازش", value: contracts.filter((c) => c.status === "admin_signed").length, color: "text-amber-400" },
        ].map((s) => (
          <div key={s.label} className="p-4 rounded-2xl bg-card border border-border">
            <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
            <p className={`text-2xl font-bold tabular-nums ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Templates Panel */}
      <AnimatePresence>
        {showTemplates && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="p-5 rounded-2xl bg-card border border-border">
              <h3 className="font-semibold text-foreground mb-4">قالب‌های آماده</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {templates.map((t) => (
                  <div key={t.id} className="p-4 rounded-xl border border-border bg-muted hover:border-primary/30 text-right transition-all">
                    <span className="text-2xl mb-2 block">{t.icon}</span>
                    <p className="text-sm font-medium text-foreground">{t.title}</p>
                    <p className="text-xs text-muted-foreground mt-1 mb-3">{t.description}</p>
                    <button onClick={() => { setNewModalTemplate({ title: t.title, content: t.content }); setShowTemplates(false); setShowNewModal(true); }}
                      className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                      <Copy className="w-3 h-3" />استفاده
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-52">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="جستجوی قرارداد..."
            className="w-full pe-9 ps-3 py-2 rounded-xl bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
        </div>
        {(["all", "draft", "admin_signed", "sent", "signed", "expired"] as const).map((s) => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={cn("px-3 py-1.5 rounded-xl text-sm transition-all border",
              statusFilter === s ? "bg-primary/10 text-primary border-primary/30" : "bg-card text-muted-foreground border-border hover:text-foreground"
            )}>
            {s === "all" ? "همه" : STATUS_CONFIG[s].label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-2">
        {filtered.map((contract) => {
          const cfg = STATUS_CONFIG[contract.status] ?? STATUS_CONFIG.draft;
          return (
            <motion.div key={contract.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
              whileHover={{ x: -2 }} onClick={() => setActiveContract(contract)}
              className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border hover:border-primary/30 cursor-pointer transition-all">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                <FileSignature className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{contract.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {contract.client?.companyName ?? "مشتری انتخاب نشده"} · {toJalali(contract.createdAt)}
                </p>
              </div>
              {/* Signing progress */}
              <div className="hidden md:flex items-center gap-1 text-xs">
                <span className={cn("px-1.5 py-0.5 rounded text-[10px]", contract.adminSignedAt ? "bg-emerald-500/15 text-emerald-400" : "bg-muted text-muted-foreground")}>ادمین</span>
                <span className="text-muted-foreground">·</span>
                <span className={cn("px-1.5 py-0.5 rounded text-[10px]", contract.signedAt ? "bg-emerald-500/15 text-emerald-400" : "bg-muted text-muted-foreground")}>مشتری</span>
              </div>
              <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium shrink-0 ${cfg.bg} ${cfg.color}`}>
                <cfg.icon className="w-3 h-3" />{cfg.label}
              </span>
              <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                <button onClick={() => setPreviewContract(contract)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="پیش‌نمایش">
                  <Eye className="w-3.5 h-3.5" />
                </button>
                {contract.status === "draft" && (
                  <button onClick={() => setAdminSignContract(contract)} className="p-1.5 rounded-lg hover:bg-amber-500/10 text-muted-foreground hover:text-amber-400 transition-colors" title="امضای ادمین">
                    <Pen className="w-3.5 h-3.5" />
                  </button>
                )}
                {(contract.status === "draft" || contract.status === "admin_signed") && (
                  <button onClick={() => handleSend(contract)} className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors" title="ارسال برای امضا">
                    <Send className="w-3.5 h-3.5" />
                  </button>
                )}
                <button onClick={(e) => { e.stopPropagation(); handleDelete(contract.id); }}
                  className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          );
        })}
        {filtered.length === 0 && (
          <div className="py-12 text-center text-muted-foreground">
            <FileSignature className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>قراردادی یافت نشد</p>
          </div>
        )}
      </div>

      {/* Detail Drawer */}
      <AnimatePresence>
        {activeContract && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setActiveContract(null)} className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 250 }}
              className="fixed top-0 left-0 h-full w-full max-w-md z-50 bg-card border-e border-border shadow-modal overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-foreground leading-snug pe-4">{activeContract.title}</h2>
                  <button onClick={() => setActiveContract(null)} className="p-2 rounded-lg hover:bg-muted text-muted-foreground shrink-0">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {(() => {
                  const cfg = STATUS_CONFIG[activeContract.status] ?? STATUS_CONFIG.draft;
                  return (
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium mb-5 ${cfg.bg} ${cfg.color}`}>
                      <cfg.icon className="w-4 h-4" />{cfg.label}
                    </span>
                  );
                })()}

                {/* Signature status cards */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className={cn("p-3 rounded-xl border text-center", activeContract.adminSignedAt ? "bg-emerald-500/10 border-emerald-500/20" : "bg-muted border-border")}>
                    <p className="text-xs text-muted-foreground mb-1">امضای ادمین</p>
                    {activeContract.adminSignedAt ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                        <p className="text-xs text-emerald-400">{toJalali(activeContract.adminSignedAt)}</p>
                      </>
                    ) : (
                      <p className="text-xs text-muted-foreground">امضا نشده</p>
                    )}
                  </div>
                  <div className={cn("p-3 rounded-xl border text-center", activeContract.signedAt ? "bg-emerald-500/10 border-emerald-500/20" : "bg-muted border-border")}>
                    <p className="text-xs text-muted-foreground mb-1">امضای مشتری</p>
                    {activeContract.signedAt ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                        <p className="text-xs text-emerald-400">{toJalali(activeContract.signedAt)}</p>
                      </>
                    ) : (
                      <p className="text-xs text-muted-foreground">امضا نشده</p>
                    )}
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  {[
                    { label: "مشتری", value: activeContract.client?.companyName ?? "—" },
                    { label: "تاریخ ایجاد", value: toJalali(activeContract.createdAt) },
                    { label: "تاریخ ارسال", value: activeContract.sentAt ? toJalali(activeContract.sentAt) : "ارسال نشده" },
                    { label: "انقضا", value: activeContract.expiresAt ? toJalali(activeContract.expiresAt) : "—" },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between py-2.5 border-b border-border/50 text-sm">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-medium text-foreground">{value}</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col gap-2">
                  <button onClick={() => setPreviewContract(activeContract)}
                    className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border bg-muted text-foreground text-sm hover:bg-muted/80 transition-colors">
                    <Eye className="w-4 h-4" />پیش‌نمایش قرارداد
                  </button>
                  {activeContract.status === "draft" && (
                    <button onClick={() => setAdminSignContract(activeContract)}
                      className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400 text-sm hover:bg-amber-500/20 transition-colors">
                      <Pen className="w-4 h-4" />امضای ادمین
                    </button>
                  )}
                  {(activeContract.status === "draft" || activeContract.status === "admin_signed") && (
                    <button onClick={() => handleSend(activeContract)}
                      className="flex items-center justify-center gap-2 py-2.5 rounded-xl gradient-brand text-black font-semibold text-sm gold-glow">
                      <Send className="w-4 h-4" />ارسال برای امضای مشتری
                    </button>
                  )}
                  <button onClick={() => { setActiveContract(null); handleDelete(activeContract.id); }}
                    className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm hover:bg-red-500/20 transition-colors">
                    <Trash2 className="w-4 h-4" />حذف قرارداد
                  </button>
                </div>

                {(activeContract.status === "sent" || activeContract.status === "signed") && activeContract.signToken && (
                  <div className="mt-4 p-3 rounded-xl bg-primary/5 border border-primary/20">
                    <p className="text-xs text-muted-foreground mb-1.5 font-medium">🔗 لینک امضای آنلاین مشتری</p>
                    <div className="flex items-center gap-2">
                      <code className="text-xs text-primary flex-1 truncate" dir="ltr" style={{ textAlign: "left" }}>
                        {typeof window !== "undefined" ? window.location.origin : ""}/sign/{activeContract.signToken}
                      </code>
                      <button onClick={() => handleCopyLink(activeContract)}
                        className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors shrink-0">
                        {copiedId === activeContract.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <a
                      href={`/sign/${activeContract.signToken}`}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <Eye className="w-3 h-3" />باز کردن صفحه امضا در تب جدید
                    </a>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Modals */}
      <AnimatePresence>
        {showNewModal && (
          <NewContractModal
            onClose={() => setShowNewModal(false)}
            onAdd={(c) => setContracts((prev) => [c, ...prev])}
            clients={clients}
            initialTitle={newModalTemplate.title}
            initialTemplateContent={newModalTemplate.content}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {previewContract && (
          <ContractPreviewModal contract={previewContract} onClose={() => setPreviewContract(null)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {adminSignContract && (
          <AdminSignModal
            contract={adminSignContract}
            onClose={() => setAdminSignContract(null)}
            onSigned={handleAdminSigned}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
