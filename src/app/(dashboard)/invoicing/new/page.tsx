"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Plus, Trash2, ArrowRight, FileText, ChevronDown, ChevronUp,
  Building2, CreditCard, Calendar, Percent, Tag, AlignLeft,
  PenLine, Info, DollarSign, Hash, ShoppingBag, Search, X,
} from "lucide-react";
import Link from "next/link";
import { apiClient } from "@/lib/api/client";
import { formatPrice } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

/* ─── Types ─────────────────────────────────────────── */
interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  unit: string;
}

interface Installment {
  id: string;
  dueDate: string;
  amount: number;
  description: string;
}

type DiscountType = "amount" | "percent";
type PaymentTerms = "immediate" | "15" | "30" | "60" | "90" | "installments" | "custom";
type Currency = "toman" | "dollar" | "euro" | "dirham";

const CURRENCIES: Record<Currency, { label: string; symbol: string }> = {
  toman: { label: "تومان", symbol: "﷼" },
  dollar: { label: "دلار", symbol: "$" },
  euro: { label: "یورو", symbol: "€" },
  dirham: { label: "درهم", symbol: "د.إ" },
};

const PAYMENT_TERMS: Record<PaymentTerms, string> = {
  immediate: "نقدی (همان روز)",
  "15": "۱۵ روز",
  "30": "۳۰ روز",
  "60": "۶۰ روز",
  "90": "۹۰ روز",
  installments: "اقساطی",
  custom: "تاریخ دلخواه",
};

const UNITS = ["عدد", "ساعت", "روز", "ماه", "سرویس", "متر", "کیلوگرم", "پکیج"];

/* ─── Accordion Section ─────────────────────────────── */
function Section({
  title, icon: Icon, children, defaultOpen = true,
}: {
  title: string; icon: React.ElementType; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/40 transition-colors"
      >
        <div className="flex items-center gap-2.5 font-semibold text-sm text-foreground">
          <Icon className="w-4 h-4 text-primary" />
          {title}
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
          >
            <div className="px-5 pb-5 space-y-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Input helpers ─────────────────────────────────── */
const inputCls =
  "w-full px-3 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all";
const labelCls = "block text-xs font-medium text-muted-foreground mb-1.5";

/* ─── Main Page ─────────────────────────────────────── */
interface ApiClient { id: string; companyName: string; contactName: string; }
interface ApiProject { id: string; name: string; clientId: string; }
interface ApiService { id: string; code: string; name: string; defaultPrice: number; unit: string; taxRate: number; isActive: boolean; }

export default function NewInvoicePage() {
  const router = useRouter();

  const [clients, setClients] = useState<ApiClient[]>([]);
  const [allProjects, setAllProjects] = useState<ApiProject[]>([]);
  const [services, setServices] = useState<ApiService[]>([]);

  useEffect(() => {
    apiClient.get("/clients?perPage=200").then(r => setClients(r.data?.data ?? [])).catch((err) => console.error(err));
    apiClient.get("/projects?perPage=200").then(r => setAllProjects(r.data?.data ?? [])).catch((err) => console.error(err));
    apiClient.get("/services").then(r => setServices(r.data?.data ?? [])).catch((err) => console.error(err));
  }, []);

  /* basic */
  const [type, setType] = useState<"invoice" | "quote">("invoice");
  const [currency, setCurrency] = useState<Currency>("toman");
  const [invoiceNumber, setInvoiceNumber] = useState(
    `INV-${new Date().getFullYear().toString().slice(2)}${String(Date.now()).slice(-4)}`
  );

  /* dates */
  const [issuedAt, setIssuedAt] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState("");
  const [paymentTerms, setPaymentTerms] = useState<PaymentTerms>("30");

  /* parties */
  const [clientId, setClientId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [billingAddress, setBillingAddress] = useState("");
  const [billingContact, setBillingContact] = useState("");

  /* items */
  const [items, setItems] = useState<LineItem[]>([
    { id: "1", description: "", quantity: 1, unitPrice: 0, unit: "عدد" },
  ]);

  /* financials */
  const [taxRate, setTaxRate] = useState(9);
  const [taxEnabled, setTaxEnabled] = useState(true);
  const [discountType, setDiscountType] = useState<DiscountType>("amount");
  const [discountValue, setDiscountValue] = useState(0);

  /* installments */
  const [installments, setInstallments] = useState<Installment[]>([
    { id: "1", dueDate: "", amount: 0, description: "قسط اول" },
  ]);

  /* bank & terms */
  const [bankName, setBankName] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [iban, setIban] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [paymentNote, setPaymentNote] = useState("");

  /* recurring */
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringInterval, setRecurringInterval] = useState<"monthly" | "quarterly" | "yearly">("monthly");

  /* catalog picker */
  const [showCatalog, setShowCatalog] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState("");

  /* extras */
  const [notes, setNotes] = useState("");
  const [termsText, setTermsText] = useState("این فاکتور پس از صدور ۱۵ روز اعتبار دارد. در صورت عدم پرداخت در موعد مقرر، ۲٪ جریمه تأخیر تعلق می‌گیرد.");
  const [showSignatureLine, setShowSignatureLine] = useState(false);
  const [showStamp, setShowStamp] = useState(true);

  /* ── Calculations ── */
  const subtotal = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const discountAmount =
    discountType === "percent"
      ? Math.round((subtotal * discountValue) / 100)
      : discountValue;
  const afterDiscount = subtotal - discountAmount;
  const taxAmount = taxEnabled ? Math.round((afterDiscount * taxRate) / 100) : 0;
  const total = afterDiscount + taxAmount;

  /* ── Item helpers ── */
  const addItem = () =>
    setItems((p) => [
      ...p,
      { id: Date.now().toString(), description: "", quantity: 1, unitPrice: 0, unit: "عدد" },
    ]);
  const removeItem = (id: string) => setItems((p) => p.filter((i) => i.id !== id));
  const updateItem = useCallback(
    (id: string, field: keyof LineItem, value: string | number) =>
      setItems((p) => p.map((i) => (i.id === id ? { ...i, [field]: value } : i))),
    []
  );

  /* ── Installment helpers ── */
  const addInstallment = () =>
    setInstallments((p) => [
      ...p,
      { id: Date.now().toString(), dueDate: "", amount: 0, description: `قسط ${p.length + 1}` },
    ]);
  const removeInstallment = (id: string) =>
    setInstallments((p) => p.filter((i) => i.id !== id));
  const updateInstallment = (id: string, field: keyof Installment, value: string | number) =>
    setInstallments((p) => p.map((i) => (i.id === id ? { ...i, [field]: value } : i)));

  const distributeInstallments = () => {
    const each = Math.round(total / installments.length);
    setInstallments((p) =>
      p.map((inst, idx) => ({
        ...inst,
        amount: idx === p.length - 1 ? total - each * (p.length - 1) : each,
      }))
    );
  };

  /* ── Auto-set due date by terms ── */
  const handleTermsChange = (val: PaymentTerms) => {
    setPaymentTerms(val);
    if (val === "installments" || val === "custom") return;
    if (issuedAt) {
      const d = new Date(issuedAt);
      d.setDate(d.getDate() + (val === "immediate" ? 0 : parseInt(val)));
      setDueDate(d.toISOString().split("T")[0]);
    }
  };

  const clientProjects = allProjects.filter((p) => p.clientId === clientId);
  const selectedClient = clients.find((c) => c.id === clientId);

  const handleSubmit = () => {
    if (!clientId) { toast.error("لطفاً مشتری را انتخاب کنید"); return; }
    if (items.every((i) => !i.description)) { toast.error("حداقل یک آیتم وارد کنید"); return; }
    toast.success(type === "invoice" ? "فاکتور با موفقیت ذخیره شد" : "پیش‌فاکتور با موفقیت ذخیره شد");
    router.push("/invoicing");
  };

  /* ═══════════════════════════════════════════════════ */
  return (
    <div className="space-y-5 max-w-7xl">
      {/* Breadcrumb */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/invoicing" className="hover:text-foreground transition-colors">فاکتورها</Link>
        <ArrowRight className="w-3.5 h-3.5 rotate-180" />
        <span className="text-foreground font-medium">فاکتور جدید</span>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-6 items-start">
        {/* ── LEFT: Form ── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">

          {/* Type + Currency row */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex gap-1 p-1 bg-muted rounded-xl">
              {(["invoice", "quote"] as const).map((t) => (
                <button key={t} onClick={() => setType(t)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${type === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                  {t === "invoice" ? "فاکتور" : "پیش‌فاکتور"}
                </button>
              ))}
            </div>
            <div className="flex gap-1 p-1 bg-muted rounded-xl">
              {(Object.keys(CURRENCIES) as Currency[]).map((c) => (
                <button key={c} onClick={() => setCurrency(c)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${currency === c ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                  {CURRENCIES[c].symbol} {CURRENCIES[c].label}
                </button>
              ))}
            </div>
          </div>

          {/* Section 1: Basic Info */}
          <Section title="اطلاعات پایه" icon={Hash}>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>شماره فاکتور</label>
                <input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)}
                  dir="ltr" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>نوع سند</label>
                <div className="flex gap-1 p-1 bg-background border border-border rounded-xl h-[42px] items-center">
                  {(["invoice", "quote"] as const).map((t) => (
                    <button key={t} onClick={() => setType(t)}
                      className={`flex-1 py-1 rounded-lg text-xs font-medium transition-all ${type === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                      {t === "invoice" ? "فاکتور" : "پیش‌فاکتور"}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>تاریخ صدور</label>
                <input type="date" value={issuedAt} onChange={(e) => setIssuedAt(e.target.value)}
                  dir="ltr" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>شرایط پرداخت</label>
                <select value={paymentTerms} onChange={(e) => handleTermsChange(e.target.value as PaymentTerms)}
                  className={inputCls}>
                  {(Object.entries(PAYMENT_TERMS) as [PaymentTerms, string][]).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
            </div>
            {(paymentTerms === "custom" || paymentTerms === "installments") && (
              <div>
                <label className={labelCls}>تاریخ سررسید</label>
                <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                  dir="ltr" className={inputCls} />
              </div>
            )}
            {paymentTerms !== "installments" && paymentTerms !== "custom" && dueDate && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted px-3 py-2 rounded-xl">
                <Calendar className="w-3.5 h-3.5" />
                سررسید محاسبه شده: <span className="font-mono text-foreground" dir="ltr">{dueDate}</span>
              </div>
            )}

            {/* Recurring toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50 border border-border">
              <div>
                <p className="text-sm font-medium text-foreground">فاکتور تکرارشونده</p>
                <p className="text-xs text-muted-foreground mt-0.5">صدور خودکار در دوره‌های منظم</p>
              </div>
              <button
                onClick={() => setIsRecurring(!isRecurring)}
                className={`w-11 h-6 rounded-full transition-all relative ${isRecurring ? "bg-primary" : "bg-muted border border-border"}`}
              >
                <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all ${isRecurring ? "right-0.5" : "left-0.5"}`} />
              </button>
            </div>
            {isRecurring && (
              <div>
                <label className={labelCls}>بازه تکرار</label>
                <div className="flex gap-2">
                  {(["monthly", "quarterly", "yearly"] as const).map((v) => {
                    const labels = { monthly: "ماهانه", quarterly: "سه‌ماهه", yearly: "سالانه" };
                    return (
                      <button key={v} onClick={() => setRecurringInterval(v)}
                        className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-all ${recurringInterval === v ? "bg-primary/10 text-primary border-primary/30" : "border-border text-muted-foreground hover:text-foreground"}`}>
                        {labels[v]}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </Section>

          {/* Section 2: Client Info */}
          <Section title="اطلاعات مشتری" icon={Building2}>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>مشتری *</label>
                <select value={clientId} onChange={(e) => { setClientId(e.target.value); setProjectId(""); }}
                  className={inputCls}>
                  <option value="">انتخاب مشتری...</option>
                  {clients.map((c) => <option key={c.id} value={c.id}>{c.companyName}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>پروژه مرتبط</label>
                <select value={projectId} onChange={(e) => setProjectId(e.target.value)}
                  disabled={!clientId} className={`${inputCls} disabled:opacity-50`}>
                  <option value="">انتخاب پروژه...</option>
                  {clientProjects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className={labelCls}>آدرس صورت‌حساب</label>
              <textarea value={billingAddress} onChange={(e) => setBillingAddress(e.target.value)}
                rows={2} placeholder="تهران، خیابان ولیعصر، پلاک ..."
                className={`${inputCls} resize-none`} />
            </div>
            <div>
              <label className={labelCls}>نام مخاطب / واحد مالی</label>
              <input value={billingContact} onChange={(e) => setBillingContact(e.target.value)}
                placeholder="آقای / خانم ..." className={inputCls} />
            </div>
          </Section>

          {/* Section 3: Line Items */}
          <Section title="آیتم‌های فاکتور" icon={FileText}>
            {/* Header */}
            <div className="grid grid-cols-12 gap-2 text-xs text-muted-foreground pb-2 border-b border-border">
              <span className="col-span-5">شرح خدمت / کالا</span>
              <span className="col-span-2 text-center">واحد</span>
              <span className="col-span-1 text-center">تعداد</span>
              <span className="col-span-3 text-center">قیمت واحد</span>
              <span className="col-span-1"></span>
            </div>

            <div className="space-y-2">
              {items.map((item, idx) => (
                <motion.div key={item.id} initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                  className="grid grid-cols-12 gap-2 items-center">
                  <input value={item.description} onChange={(e) => updateItem(item.id, "description", e.target.value)}
                    placeholder={`آیتم ${idx + 1}`}
                    className="col-span-5 px-3 py-2 rounded-xl bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
                  <select value={item.unit} onChange={(e) => updateItem(item.id, "unit", e.target.value)}
                    className="col-span-2 px-2 py-2 rounded-xl bg-background border border-border text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
                    {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                  <input type="number" value={item.quantity} min={1}
                    onChange={(e) => updateItem(item.id, "quantity", Number(e.target.value))}
                    className="col-span-1 px-2 py-2 rounded-xl bg-background border border-border text-sm text-center text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
                  <input type="number" value={item.unitPrice || ""}
                    onChange={(e) => updateItem(item.id, "unitPrice", Number(e.target.value))}
                    placeholder="0"
                    className="col-span-3 px-3 py-2 rounded-xl bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
                  <button onClick={() => removeItem(item.id)} disabled={items.length === 1}
                    className="col-span-1 p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-30 flex items-center justify-center">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  {/* Row total hint */}
                  {item.description && item.unitPrice > 0 && (
                    <div className="col-span-12 -mt-1 flex justify-end pe-8">
                      <span className="text-xs text-muted-foreground tabular-nums">
                        جمع: {formatPrice(item.quantity * item.unitPrice, true)}
                      </span>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            <div className="flex items-center gap-4 mt-1">
              <button onClick={addItem}
                className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors">
                <Plus className="w-3.5 h-3.5" /> افزودن ردیف جدید
              </button>
              <button onClick={() => setShowCatalog(true)}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors border-r border-border pr-4">
                <ShoppingBag className="w-3.5 h-3.5" /> انتخاب از کاتالوگ خدمات
              </button>
            </div>
          </Section>

          {/* Section 4: Tax & Discount */}
          <Section title="مالیات و تخفیف" icon={Percent}>
            {/* Tax */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/50">
              <button onClick={() => setTaxEnabled(!taxEnabled)}
                className={`w-11 h-6 rounded-full transition-all relative flex-shrink-0 ${taxEnabled ? "bg-primary" : "bg-muted-foreground/30"}`}>
                <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${taxEnabled ? "start-0.5" : "end-0.5"}`} />
              </button>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">اعمال مالیات بر ارزش افزوده</p>
                <p className="text-xs text-muted-foreground">مالیات بر اساس نرخ انتخابی محاسبه می‌شود</p>
              </div>
              {taxEnabled && (
                <div className="flex items-center gap-2">
                  <input type="number" value={taxRate} min={0} max={30}
                    onChange={(e) => setTaxRate(Number(e.target.value))}
                    className="w-16 px-2 py-1.5 rounded-lg bg-background border border-border text-sm text-foreground text-center focus:outline-none focus:ring-2 focus:ring-primary/40" />
                  <span className="text-sm text-muted-foreground">٪</span>
                </div>
              )}
            </div>

            {/* Discount */}
            <div>
              <label className={labelCls}>تخفیف</label>
              <div className="flex gap-2">
                <div className="flex gap-1 p-1 bg-muted rounded-xl flex-shrink-0">
                  <button onClick={() => setDiscountType("amount")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${discountType === "amount" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>
                    مبلغ ثابت
                  </button>
                  <button onClick={() => setDiscountType("percent")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${discountType === "percent" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>
                    درصدی
                  </button>
                </div>
                <div className="flex-1 relative">
                  <input type="number" value={discountValue || ""} min={0}
                    max={discountType === "percent" ? 100 : undefined}
                    onChange={(e) => setDiscountValue(Number(e.target.value))}
                    placeholder="0" className={inputCls} />
                  {discountType === "percent" && (
                    <span className="absolute end-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">٪</span>
                  )}
                </div>
              </div>
              {discountValue > 0 && (
                <p className="text-xs text-muted-foreground mt-1.5">
                  مبلغ تخفیف: <span className="text-primary tabular-nums">{formatPrice(discountAmount, true)}</span>
                </p>
              )}
            </div>
          </Section>

          {/* Section 5: Installments */}
          <AnimatePresence>
            {paymentTerms === "installments" && (
              <motion.div key="installments" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                <Section title="تقسیم‌بندی اقساط" icon={Calendar}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-muted-foreground">
                      جمع اقساط: <span className={`tabular-nums font-medium ${installments.reduce((s, i) => s + i.amount, 0) !== total ? "text-destructive" : "text-primary"}`}>
                        {formatPrice(installments.reduce((s, i) => s + i.amount, 0), true)}
                      </span>
                      {" / "}<span className="text-foreground">{formatPrice(total, true)}</span>
                    </p>
                    <button onClick={distributeInstallments}
                      className="text-xs text-primary hover:text-primary/80 transition-colors">
                      تقسیم مساوی
                    </button>
                  </div>

                  <div className="space-y-3">
                    {installments.map((inst, idx) => (
                      <div key={inst.id} className="p-3 rounded-xl border border-border bg-muted/30 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-foreground">قسط {idx + 1}</span>
                          <button onClick={() => removeInstallment(inst.id)} disabled={installments.length === 1}
                            className="p-1 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-30">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div className="col-span-1">
                            <label className="text-xs text-muted-foreground mb-1 block">تاریخ</label>
                            <input type="date" value={inst.dueDate} dir="ltr"
                              onChange={(e) => updateInstallment(inst.id, "dueDate", e.target.value)}
                              className="w-full px-2 py-1.5 rounded-lg bg-background border border-border text-xs focus:outline-none focus:ring-2 focus:ring-primary/40" />
                          </div>
                          <div className="col-span-1">
                            <label className="text-xs text-muted-foreground mb-1 block">مبلغ</label>
                            <input type="number" value={inst.amount || ""} placeholder="0"
                              onChange={(e) => updateInstallment(inst.id, "amount", Number(e.target.value))}
                              className="w-full px-2 py-1.5 rounded-lg bg-background border border-border text-xs focus:outline-none focus:ring-2 focus:ring-primary/40" />
                          </div>
                          <div className="col-span-1">
                            <label className="text-xs text-muted-foreground mb-1 block">توضیح</label>
                            <input value={inst.description}
                              onChange={(e) => updateInstallment(inst.id, "description", e.target.value)}
                              className="w-full px-2 py-1.5 rounded-lg bg-background border border-border text-xs focus:outline-none focus:ring-2 focus:ring-primary/40" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button onClick={addInstallment}
                    className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors mt-1">
                    <Plus className="w-3.5 h-3.5" /> افزودن قسط
                  </button>
                </Section>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Section 6: Bank Info */}
          <Section title="اطلاعات حساب بانکی" icon={CreditCard} defaultOpen={false}>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>نام بانک</label>
                <input value={bankName} onChange={(e) => setBankName(e.target.value)}
                  placeholder="مثلاً: ملت، پارسیان، صادرات" className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>نام صاحب حساب</label>
                <input value={accountHolder} onChange={(e) => setAccountHolder(e.target.value)}
                  placeholder="نام و نام خانوادگی" className={inputCls} />
              </div>
            </div>
            <div>
              <label className={labelCls}>شماره شبا (IBAN)</label>
              <input value={iban} onChange={(e) => setIban(e.target.value)}
                dir="ltr" placeholder="IR00 0000 0000 0000 0000 0000 00" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>شماره کارت</label>
              <input value={cardNumber} onChange={(e) => setCardNumber(e.target.value)}
                dir="ltr" placeholder="0000-0000-0000-0000" maxLength={19} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>راهنمای پرداخت</label>
              <textarea value={paymentNote} onChange={(e) => setPaymentNote(e.target.value)}
                rows={2} placeholder="جهت واریز وجه با ذکر شماره فاکتور در توضیحات تراکنش..."
                className={`${inputCls} resize-none`} />
            </div>
          </Section>

          {/* Section 7: Notes & Terms */}
          <Section title="یادداشت و شرایط" icon={AlignLeft} defaultOpen={false}>
            <div>
              <label className={labelCls}>یادداشت برای مشتری</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                rows={3} placeholder="پیام خوش‌آمدگویی یا توضیحات تکمیلی..."
                className={`${inputCls} resize-none`} />
            </div>
            <div>
              <label className={labelCls}>شرایط و ضوابط</label>
              <textarea value={termsText} onChange={(e) => setTermsText(e.target.value)}
                rows={3} className={`${inputCls} resize-none text-xs`} />
            </div>
            <div className="flex flex-col gap-3">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div onClick={() => setShowSignatureLine(!showSignatureLine)}
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${showSignatureLine ? "bg-primary border-primary" : "border-border group-hover:border-primary/50"}`}>
                  {showSignatureLine && <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                </div>
                <div>
                  <p className="text-sm text-foreground">نمایش خط امضا</p>
                  <p className="text-xs text-muted-foreground">یک بخش برای امضا و مهر مشتری اضافه می‌شود</p>
                </div>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <div onClick={() => setShowStamp(!showStamp)}
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${showStamp ? "bg-primary border-primary" : "border-border group-hover:border-primary/50"}`}>
                  {showStamp && <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                </div>
                <div>
                  <p className="text-sm text-foreground">نمایش جای مهر</p>
                  <p className="text-xs text-muted-foreground">یک دایره برای مهر شرکت نشان داده می‌شود</p>
                </div>
              </label>
            </div>
          </Section>

          {/* Submit */}
          <div className="flex gap-3 pb-6">
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleSubmit}
              className="flex-1 py-3 rounded-xl gradient-brand text-black font-semibold gold-glow">
              {type === "invoice" ? "ذخیره فاکتور" : "ذخیره پیش‌فاکتور"}
            </motion.button>
            <Link href="/invoicing">
              <button className="px-5 py-3 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors">
                انصراف
              </button>
            </Link>
          </div>
        </motion.div>

        {/* ── RIGHT: Live Preview ── */}
        <motion.div
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
          className="sticky top-20 h-fit"
        >
          <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5" /> پیش‌نمایش زنده
          </p>
          <div className="rounded-2xl bg-card border border-border overflow-hidden shadow-lg text-sm">
            {/* Invoice Header */}
            <div className="p-6 border-b border-border">
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center font-bold text-black text-sm">P</div>
                  <div>
                    <p className="font-bold text-foreground">Persicore Agency</p>
                    <p className="text-xs text-muted-foreground">info@persicore.ir</p>
                  </div>
                </div>
                <div className="text-end">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mb-1 ${type === "invoice" ? "bg-primary/10 text-primary" : "bg-amber-500/10 text-amber-500"}`}>
                    {type === "invoice" ? "فاکتور رسمی" : "پیش‌فاکتور"}
                  </span>
                  <p className="font-mono text-xs text-muted-foreground" dir="ltr">#{invoiceNumber}</p>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 rounded-xl bg-muted">
                  <p className="text-muted-foreground mb-0.5">تاریخ صدور</p>
                  <p className="font-mono text-foreground" dir="ltr">{issuedAt || "—"}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-muted">
                  <p className="text-muted-foreground mb-0.5">سررسید</p>
                  <p className="font-mono text-foreground" dir="ltr">{dueDate || "—"}</p>
                </div>
              </div>
            </div>

            {/* Bill To */}
            {(selectedClient || billingContact) && (
              <div className="px-6 py-4 border-b border-border bg-muted/30">
                <p className="text-xs text-muted-foreground mb-1">صورت‌حساب به</p>
                {selectedClient && <p className="font-semibold text-foreground">{selectedClient.companyName}</p>}
                {billingContact && <p className="text-xs text-muted-foreground mt-0.5">{billingContact}</p>}
                {billingAddress && <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{billingAddress}</p>}
              </div>
            )}

            {/* Items */}
            <div className="px-6 py-4">
              {items.filter((i) => i.description).length > 0 ? (
                <>
                  <div className="grid grid-cols-12 gap-1 pb-2 border-b border-border text-xs text-muted-foreground">
                    <span className="col-span-5">شرح</span>
                    <span className="col-span-2 text-center">تعداد</span>
                    <span className="col-span-2 text-center">واحد</span>
                    <span className="col-span-3 text-end">مبلغ</span>
                  </div>
                  {items.filter((i) => i.description).map((item) => (
                    <div key={item.id} className="grid grid-cols-12 gap-1 py-2 border-b border-border/40 text-xs">
                      <span className="col-span-5 text-foreground leading-relaxed">{item.description}</span>
                      <span className="col-span-2 text-center text-muted-foreground">{item.quantity}</span>
                      <span className="col-span-2 text-center text-muted-foreground">{item.unit}</span>
                      <span className="col-span-3 text-end tabular-nums text-foreground">{formatPrice(item.quantity * item.unitPrice, true)}</span>
                    </div>
                  ))}
                </>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-4">آیتم‌ها اینجا نمایش داده می‌شوند</p>
              )}
            </div>

            {/* Totals */}
            <div className="px-6 pb-4 space-y-1.5 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>جمع ناخالص</span>
                <span className="tabular-nums">{formatPrice(subtotal, true)}</span>
              </div>
              {discountValue > 0 && (
                <div className="flex justify-between text-emerald-500">
                  <span>تخفیف {discountType === "percent" ? `(${discountValue}٪)` : ""}</span>
                  <span className="tabular-nums">— {formatPrice(discountAmount, true)}</span>
                </div>
              )}
              {taxEnabled && taxRate > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>مالیات ارزش افزوده {taxRate}٪</span>
                  <span className="tabular-nums">{formatPrice(taxAmount, true)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-foreground text-sm pt-2 border-t border-border mt-2">
                <span>مبلغ نهایی</span>
                <span className="text-primary tabular-nums">
                  {formatPrice(total, true)} {CURRENCIES[currency].label}
                </span>
              </div>
            </div>

            {/* Installments preview */}
            {paymentTerms === "installments" && installments.some((i) => i.amount > 0) && (
              <div className="px-6 pb-4 border-t border-border pt-4">
                <p className="text-xs font-medium text-foreground mb-2">جدول اقساط</p>
                <div className="space-y-1.5">
                  {installments.map((inst, idx) => (
                    <div key={inst.id} className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{inst.description || `قسط ${idx + 1}`}</span>
                      <div className="flex items-center gap-3">
                        {inst.dueDate && <span className="font-mono text-muted-foreground" dir="ltr">{inst.dueDate}</span>}
                        <span className="tabular-nums text-foreground">{formatPrice(inst.amount, true)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bank info preview */}
            {(bankName || iban || cardNumber) && (
              <div className="px-6 pb-4 border-t border-border pt-4">
                <p className="text-xs font-medium text-foreground mb-2">اطلاعات پرداخت</p>
                <div className="space-y-1 text-xs text-muted-foreground">
                  {bankName && <p>بانک: <span className="text-foreground">{bankName}</span></p>}
                  {accountHolder && <p>صاحب حساب: <span className="text-foreground">{accountHolder}</span></p>}
                  {iban && <p dir="ltr" className="font-mono text-foreground">{iban}</p>}
                  {cardNumber && <p dir="ltr" className="font-mono text-foreground">{cardNumber}</p>}
                  {paymentNote && <p className="leading-relaxed mt-1">{paymentNote}</p>}
                </div>
              </div>
            )}

            {/* Notes */}
            {notes && (
              <div className="px-6 pb-4 border-t border-border pt-4">
                <p className="text-xs font-medium text-foreground mb-1">یادداشت</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{notes}</p>
              </div>
            )}

            {/* Terms */}
            {termsText && (
              <div className="px-6 pb-4 border-t border-border pt-4">
                <p className="text-xs font-medium text-foreground mb-1">شرایط و ضوابط</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{termsText}</p>
              </div>
            )}

            {/* Signature / Stamp */}
            {(showSignatureLine || showStamp) && (
              <div className="px-6 pb-6 pt-4 border-t border-border flex items-end justify-between gap-4">
                {showSignatureLine && (
                  <div className="flex-1 text-center">
                    <div className="h-12 border-b border-dashed border-border mb-1" />
                    <p className="text-xs text-muted-foreground">امضای مشتری</p>
                  </div>
                )}
                {showStamp && (
                  <div className="flex-shrink-0 w-16 h-16 rounded-full border-2 border-dashed border-border flex items-center justify-center">
                    <p className="text-xs text-muted-foreground text-center leading-tight">مهر</p>
                  </div>
                )}
                {showSignatureLine && (
                  <div className="flex-1 text-center">
                    <div className="h-12 border-b border-dashed border-border mb-1" />
                    <p className="text-xs text-muted-foreground">امضای فروشنده</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Service Catalog Modal */}
      <AnimatePresence>
        {showCatalog && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowCatalog(false)}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-card border border-border rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col shadow-2xl">
              <div className="flex items-center justify-between p-5 border-b border-border">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-primary" />
                  <h2 className="font-bold text-lg">کاتالوگ خدمات</h2>
                </div>
                <button onClick={() => setShowCatalog(false)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 border-b border-border">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input value={catalogSearch} onChange={e => setCatalogSearch(e.target.value)}
                    placeholder="جستجو بر اساس نام یا کد..."
                    className="w-full pr-9 pl-3 py-2 text-sm rounded-xl bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary/40" />
                </div>
              </div>

              <div className="overflow-y-auto flex-1 p-4 space-y-2">
                {services
                  .filter(s => s.isActive)
                  .filter(s => !catalogSearch || s.name.toLowerCase().includes(catalogSearch.toLowerCase()) || s.code.toLowerCase().includes(catalogSearch.toLowerCase()))
                  .map(svc => (
                    <button key={svc.id} onClick={() => {
                      const UNIT_MAP: Record<string, string> = {
                        hour: "ساعت", project: "سرویس", month: "ماه", piece: "عدد", word: "کلمه", page: "صفحه",
                      };
                      setItems(prev => [...prev, {
                        id: Date.now().toString(),
                        description: svc.name,
                        quantity: 1,
                        unitPrice: svc.defaultPrice,
                        unit: UNIT_MAP[svc.unit] ?? "عدد",
                      }]);
                      setTaxRate(svc.taxRate);
                      setTaxEnabled(true);
                      setShowCatalog(false);
                      setCatalogSearch("");
                    }}
                      className="w-full flex items-center justify-between p-3 rounded-xl border border-border hover:border-primary/40 hover:bg-muted/30 transition-all text-right">
                      <div>
                        <p className="text-sm font-medium">{svc.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{svc.code} · {svc.taxRate}% مالیات</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-primary">{svc.defaultPrice.toLocaleString("fa-IR")} ت</p>
                        <p className="text-xs text-muted-foreground">/ {svc.unit}</p>
                      </div>
                    </button>
                  ))}
                {services.filter(s => s.isActive).filter(s => !catalogSearch || s.name.includes(catalogSearch) || s.code.includes(catalogSearch)).length === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-8">خدمتی یافت نشد</p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
