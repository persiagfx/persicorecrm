"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Building2, Users, UserPlus, TrendingUp, CheckCircle2,
  ArrowLeft, ArrowRight, X, Sparkles, UtensilsCrossed,
  Laptop2, Factory, Package, Wrench, GraduationCap,
  ShoppingBag, Store, Phone, Mail, DollarSign, Check,
} from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/context";
import { useCompanyStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { getNavSections } from "@/lib/industry-modules";

const WIZARD_DISMISSED_KEY = "onboarding_wizard_dismissed";

const INDUSTRIES = [
  { value: "GENERAL",       label: "عمومی / خدمات",        icon: Store,           color: "from-blue-500 to-cyan-500" },
  { value: "RESTAURANT",    label: "رستوران / کافه",        icon: UtensilsCrossed, color: "from-orange-500 to-amber-500" },
  { value: "IT",            label: "فناوری اطلاعات",        icon: Laptop2,         color: "from-violet-500 to-purple-500" },
  { value: "MANUFACTURING", label: "تولید / کارخانه",       icon: Factory,         color: "from-slate-500 to-gray-500" },
  { value: "TRADING",       label: "تجارت / واردات",        icon: Package,         color: "from-emerald-500 to-teal-500" },
  { value: "SERVICE",       label: "خدمات میدانی",          icon: Wrench,          color: "from-yellow-500 to-orange-500" },
  { value: "EDUCATION",     label: "آموزشگاه",              icon: GraduationCap,   color: "from-sky-500 to-blue-500" },
  { value: "ECOMMERCE",     label: "فروشگاه آنلاین",        icon: ShoppingBag,     color: "from-pink-500 to-rose-500" },
];

// Steps: 0=welcome, 1=company, 2=modules(GENERAL only), 3=client, 4=lead, 5=done
const TOTAL_STEPS = 6;

export function OnboardingWizard() {
  const { refreshUser } = useAuth();
  const { updateSettings } = useCompanyStore();
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Company step
  const [companyName, setCompanyName] = useState("");
  const [industryType, setIndustryType] = useState("GENERAL");
  const [companyPhone, setCompanyPhone] = useState("");

  // Module selection step (GENERAL only)
  const generalSections = useMemo(
    () => getNavSections("GENERAL").filter((s) => s.label !== null),
    []
  );
  const allModuleHrefs = useMemo(
    () => generalSections.flatMap((s) => s.items.map((i) => i.href)),
    [generalSections]
  );
  const [selectedModules, setSelectedModules] = useState<string[]>(() => allModuleHrefs);

  // Client step
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");

  // Lead step
  const [leadTitle, setLeadTitle] = useState("");
  const [leadContact, setLeadContact] = useState("");
  const [leadValue, setLeadValue] = useState("");

  const checkShouldShow = useCallback(async () => {
    if (typeof window !== "undefined") {
      if (localStorage.getItem(WIZARD_DISMISSED_KEY) === "1") return;
    }
    try {
      const res = await apiClient.get("/onboarding");
      const data = res.data?.data ?? res.data;
      const done = data?.completed;
      const hasSteps = Object.values(data?.steps ?? {}).some(Boolean);
      if (!done && !hasSteps) setVisible(true);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { checkShouldShow(); }, [checkShouldShow]);

  const dismiss = () => {
    if (typeof window !== "undefined") localStorage.setItem(WIZARD_DISMISSED_KEY, "1");
    setVisible(false);
  };

  const markStep = async (stepId: string) => {
    try { await apiClient.patch("/onboarding", { step: stepId }); } catch { /* silent */ }
  };

  const handleCompanyStep = async () => {
    if (!companyName.trim()) { toast.error("نام شرکت الزامی است"); return; }
    setLoading(true);
    try {
      await apiClient.put("/settings", { companyName: companyName.trim(), phone: companyPhone, industryType });
      await markStep("company_info");
      if (industryType === "GENERAL") {
        setStep(2); // module selection step
      } else {
        updateSettings({ selectedModules: [] }); // clear any previous selection
        setStep(3); // skip to client
      }
    } catch { toast.error("خطا در ذخیره اطلاعات"); } finally { setLoading(false); }
  };

  const handleModuleStep = () => {
    // Save selected modules to local store (persisted in localStorage)
    updateSettings({ selectedModules: selectedModules.length > 0 ? selectedModules : allModuleHrefs });
    setStep(3);
  };

  const toggleModule = (href: string) => {
    setSelectedModules((prev) =>
      prev.includes(href) ? prev.filter((h) => h !== href) : [...prev, href]
    );
  };

  const toggleSection = (sectionLabel: string) => {
    const section = generalSections.find((s) => s.label === sectionLabel);
    if (!section) return;
    const hrefs = section.items.map((i) => i.href);
    const allSelected = hrefs.every((h) => selectedModules.includes(h));
    if (allSelected) {
      setSelectedModules((prev) => prev.filter((h) => !hrefs.includes(h)));
    } else {
      setSelectedModules((prev) => [...new Set([...prev, ...hrefs])]);
    }
  };

  const handleClientStep = async () => {
    if (!clientName.trim()) { setStep(4); return; }
    setLoading(true);
    try {
      await apiClient.post("/clients", { name: clientName.trim(), phone: clientPhone, email: clientEmail });
      await markStep("first_client");
      toast.success("مشتری ثبت شد");
    } catch { toast.error("خطا در ثبت مشتری"); }
    finally { setLoading(false); setStep(4); }
  };

  const handleLeadStep = async () => {
    if (!leadTitle.trim()) { setStep(5); return; }
    setLoading(true);
    try {
      await apiClient.post("/leads", { title: leadTitle.trim(), contactName: leadContact, value: Number(leadValue) || 0, status: "new" });
      await markStep("first_lead");
      toast.success("لید ثبت شد");
    } catch { toast.error("خطا در ثبت لید"); }
    finally { setLoading(false); setStep(5); }
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      await apiClient.patch("/onboarding", { step: "completed" });
      await refreshUser();
    } catch { /* silent */ }
    finally { setLoading(false); setVisible(false); }
  };

  if (!visible) return null;

  const isGeneral = industryType === "GENERAL";
  // Effective step index for progress: non-GENERAL skips step 2
  const effectiveStep = !isGeneral && step >= 3 ? step - 1 : step;
  const effectiveTotal = isGeneral ? 5 : 4; // excluding welcome(0) and done(last)
  const progressPercent = step > 0 ? ((effectiveStep - 1) / (effectiveTotal - 2)) * 100 : 0;

  const totalLabel = isGeneral ? "۴" : "۳";
  const stepNum = (s: number) => {
    if (!isGeneral && s >= 3) return s - 1;
    return s;
  };

  // Dot indices differ per industry
  const dotSteps = isGeneral ? [1, 2, 3, 4] : [1, 3, 4];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" dir="rtl">
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        transition={{ type: "spring", duration: 0.4 }}
        className="relative w-full max-w-xl"
      >
        <button
          onClick={dismiss}
          className="absolute -top-10 left-0 flex items-center gap-1.5 text-sm text-white/40 hover:text-white/70 transition-colors"
        >
          <X className="w-4 h-4" /> بعداً تکمیل می‌کنم
        </button>

        <div className="bg-[#0f0f17] rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
          {step > 0 && step < TOTAL_STEPS - 1 && (
            <div className="h-1 bg-white/5">
              <motion.div
                className="h-full bg-gradient-to-r from-violet-600 to-fuchsia-500"
                animate={{ width: `${Math.max(5, progressPercent)}%` }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
            </div>
          )}

          <AnimatePresence mode="wait">

            {/* ─── Step 0: Welcome ─────────────────────────────── */}
            {step === 0 && (
              <motion.div key="welcome" {...slide} className="p-8 text-center space-y-6">
                <div className="relative mx-auto w-20 h-20 rounded-2xl gradient-brand flex items-center justify-center shadow-xl shadow-primary/30">
                  <Sparkles className="w-9 h-9 text-black" />
                  <div className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <div className="space-y-2">
                  <h1 className="text-2xl font-bold text-white">به Persicore CRM خوش آمدید!</h1>
                  <p className="text-white/50 text-sm leading-relaxed">
                    در چند مرحله ساده کسب‌وکارتان را راه‌اندازی کنید.
                    <br />این فرایند کمتر از ۳ دقیقه طول می‌کشد.
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-3 pt-2">
                  {[
                    { label: "تنظیم شرکت", icon: Building2 },
                    { label: "ثبت مشتری", icon: Users },
                    { label: "اولین فرصت", icon: TrendingUp },
                  ].map(({ label, icon: Icon }) => (
                    <div key={label} className="rounded-xl bg-white/5 border border-white/[0.07] p-3 space-y-1.5">
                      <Icon className="w-4 h-4 text-violet-400 mx-auto" />
                      <p className="text-xs text-white/50 text-center">{label}</p>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setStep(1)}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-semibold text-sm hover:shadow-lg hover:shadow-violet-500/25 transition-all flex items-center justify-center gap-2"
                >
                  شروع راه‌اندازی <ArrowLeft className="w-4 h-4" />
                </button>
              </motion.div>
            )}

            {/* ─── Step 1: Company ─────────────────────────────── */}
            {step === 1 && (
              <motion.div key="company" {...slide} className="p-8 space-y-5">
                <StepHeader num={1} total={totalLabel} title="درباره کسب‌وکارتان" desc="این اطلاعات در فاکتورها و گزارش‌هایتان نمایش داده می‌شه" />
                <div className="space-y-3">
                  <div className="relative">
                    <Building2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input
                      value={companyName}
                      onChange={e => setCompanyName(e.target.value)}
                      placeholder="نام شرکت یا کسب‌وکار *"
                      className="w-full pe-10 ps-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-violet-500/50"
                    />
                  </div>
                  <div className="relative">
                    <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input
                      value={companyPhone}
                      onChange={e => setCompanyPhone(e.target.value)}
                      placeholder="شماره تلفن (اختیاری)"
                      dir="ltr"
                      className="w-full pe-10 ps-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-violet-500/50"
                    />
                  </div>
                  <div>
                    <p className="text-xs text-white/40 mb-2 mt-1">نوع کسب‌وکار خود را انتخاب کنید:</p>
                    <div className="grid grid-cols-4 gap-2">
                      {INDUSTRIES.map(ind => {
                        const Icon = ind.icon;
                        const selected = industryType === ind.value;
                        return (
                          <button
                            key={ind.value}
                            onClick={() => setIndustryType(ind.value)}
                            className={cn(
                              "rounded-xl border p-2 text-center transition-all space-y-1",
                              selected
                                ? "border-violet-500/50 bg-violet-500/10"
                                : "border-white/[0.07] bg-white/[0.02] hover:border-white/15"
                            )}
                          >
                            <div className={cn("w-7 h-7 rounded-lg mx-auto flex items-center justify-center bg-gradient-to-br", ind.color)}>
                              <Icon className="w-3.5 h-3.5 text-white" />
                            </div>
                            <p className="text-xs text-white/60 leading-tight">{ind.label}</p>
                          </button>
                        );
                      })}
                    </div>
                    {industryType === "GENERAL" && (
                      <p className="text-xs text-violet-400/80 mt-2 text-center">
                        در مرحله بعد می‌توانید ماژول‌های مورد نیاز را دقیقاً انتخاب کنید
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setStep(0)} className="px-4 py-2.5 rounded-xl border border-white/10 text-white/40 text-sm hover:text-white/70 transition-colors">
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleCompanyStep}
                    disabled={loading}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-semibold text-sm disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {loading ? <Spinner /> : <>ذخیره و ادامه <ArrowLeft className="w-4 h-4" /></>}
                  </button>
                </div>
              </motion.div>
            )}

            {/* ─── Step 2: Module Selection (GENERAL only) ─────── */}
            {step === 2 && (
              <motion.div key="modules" {...slide} className="p-6 space-y-4">
                <StepHeader num={2} total={totalLabel} title="ماژول‌های مورد نیاز را انتخاب کنید" desc="می‌توانید بعداً از تنظیمات شرکت تغییر دهید" />

                {/* Select all / deselect all */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedModules([...allModuleHrefs])}
                    className="flex-1 py-1.5 rounded-lg border border-white/10 text-white/50 text-xs hover:text-white/80 hover:border-white/20 transition-colors"
                  >
                    انتخاب همه
                  </button>
                  <button
                    onClick={() => setSelectedModules([])}
                    className="flex-1 py-1.5 rounded-lg border border-white/10 text-white/50 text-xs hover:text-white/80 hover:border-white/20 transition-colors"
                  >
                    حذف همه
                  </button>
                </div>

                {/* Sections list */}
                <div className="max-h-64 overflow-y-auto space-y-2 pe-1 scrollbar-thin">
                  {generalSections.map((section) => {
                    const sectionHrefs = section.items.map((i) => i.href);
                    const selectedCount = sectionHrefs.filter((h) => selectedModules.includes(h)).length;
                    const allSel = selectedCount === sectionHrefs.length;
                    const someSel = selectedCount > 0 && !allSel;

                    return (
                      <div key={section.label} className="rounded-xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
                        {/* Section header */}
                        <button
                          onClick={() => toggleSection(section.label!)}
                          className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-white/5 transition-colors"
                        >
                          <span className="text-sm font-medium text-white/80">{section.label}</span>
                          <div className={cn(
                            "w-5 h-5 rounded-md border flex items-center justify-center transition-all",
                            allSel ? "bg-violet-600 border-violet-500" : someSel ? "bg-violet-600/40 border-violet-500/50" : "border-white/20"
                          )}>
                            {allSel && <Check className="w-3 h-3 text-white" />}
                            {someSel && <div className="w-2 h-0.5 bg-white/80 rounded-full" />}
                          </div>
                        </button>

                        {/* Items grid */}
                        <div className="px-4 pb-3 grid grid-cols-2 gap-1.5">
                          {section.items.map((item) => {
                            const checked = selectedModules.includes(item.href);
                            return (
                              <button
                                key={item.href}
                                onClick={() => toggleModule(item.href)}
                                className={cn(
                                  "flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-all text-right",
                                  checked
                                    ? "bg-violet-500/10 text-violet-300 border border-violet-500/20"
                                    : "text-white/40 hover:text-white/60 hover:bg-white/5 border border-transparent"
                                )}
                              >
                                <div className={cn(
                                  "w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-all",
                                  checked ? "bg-violet-600 border-violet-500" : "border-white/20"
                                )}>
                                  {checked && <Check className="w-2.5 h-2.5 text-white" />}
                                </div>
                                <span className="truncate">{item.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Counter */}
                <p className="text-xs text-white/30 text-center">
                  {selectedModules.length} از {allModuleHrefs.length} صفحه انتخاب شده
                </p>

                <div className="flex gap-3 pt-1">
                  <button
                    onClick={() => { updateSettings({ selectedModules: allModuleHrefs }); setStep(3); }}
                    className="px-4 py-2.5 rounded-xl border border-white/10 text-white/30 text-xs hover:text-white/60 transition-colors whitespace-nowrap"
                  >
                    رد کردن
                  </button>
                  <button
                    onClick={handleModuleStep}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-semibold text-sm flex items-center justify-center gap-2"
                  >
                    ذخیره و ادامه <ArrowLeft className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ─── Step 3: First Client ─────────────────────────── */}
            {step === 3 && (
              <motion.div key="client" {...slide} className="p-8 space-y-5">
                <StepHeader num={stepNum(3)} total={totalLabel} title="اولین مشتری خود را ثبت کنید" desc="مشتریان فعلی‌تان را یک به یک به سیستم اضافه کنید" />
                <div className="space-y-3">
                  <div className="relative">
                    <Users className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input value={clientName} onChange={e => setClientName(e.target.value)} placeholder="نام شرکت یا مشتری"
                      className="w-full pe-10 ps-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-violet-500/50" />
                  </div>
                  <div className="relative">
                    <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input value={clientPhone} onChange={e => setClientPhone(e.target.value)} placeholder="شماره تلفن" dir="ltr"
                      className="w-full pe-10 ps-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-violet-500/50" />
                  </div>
                  <div className="relative">
                    <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input value={clientEmail} onChange={e => setClientEmail(e.target.value)} placeholder="ایمیل" dir="ltr"
                      className="w-full pe-10 ps-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-violet-500/50" />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setStep(4)} className="px-4 py-2.5 rounded-xl border border-white/10 text-white/30 text-xs hover:text-white/60 transition-colors whitespace-nowrap">
                    رد کردن
                  </button>
                  <button onClick={handleClientStep} disabled={loading}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-semibold text-sm disabled:opacity-60 flex items-center justify-center gap-2">
                    {loading ? <Spinner /> : <>{clientName ? "ثبت مشتری" : "رد کردن"} <ArrowLeft className="w-4 h-4" /></>}
                  </button>
                </div>
              </motion.div>
            )}

            {/* ─── Step 4: First Lead ───────────────────────────── */}
            {step === 4 && (
              <motion.div key="lead" {...slide} className="p-8 space-y-5">
                <StepHeader num={stepNum(4)} total={totalLabel} title="اولین فرصت فروش را ثبت کنید" desc="یک مذاکره یا فرصت فروش در حال پیگیری دارید؟" />
                <div className="space-y-3">
                  <div className="relative">
                    <TrendingUp className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input value={leadTitle} onChange={e => setLeadTitle(e.target.value)} placeholder="عنوان فرصت فروش (مثلاً: پروژه طراحی سایت)"
                      className="w-full pe-10 ps-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-violet-500/50" />
                  </div>
                  <div className="relative">
                    <UserPlus className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input value={leadContact} onChange={e => setLeadContact(e.target.value)} placeholder="نام مخاطب"
                      className="w-full pe-10 ps-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-violet-500/50" />
                  </div>
                  <div className="relative">
                    <DollarSign className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input type="number" value={leadValue} onChange={e => setLeadValue(e.target.value)} placeholder="ارزش تخمینی (تومان)" dir="ltr"
                      className="w-full pe-10 ps-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-violet-500/50" />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setStep(5)} className="px-4 py-2.5 rounded-xl border border-white/10 text-white/30 text-xs hover:text-white/60 transition-colors whitespace-nowrap">
                    رد کردن
                  </button>
                  <button onClick={handleLeadStep} disabled={loading}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white font-semibold text-sm disabled:opacity-60 flex items-center justify-center gap-2">
                    {loading ? <Spinner /> : <>{leadTitle ? "ثبت فرصت" : "رد کردن"} <ArrowLeft className="w-4 h-4" /></>}
                  </button>
                </div>
              </motion.div>
            )}

            {/* ─── Step 5: Done ─────────────────────────────────── */}
            {step === 5 && (
              <motion.div key="done" {...slide} className="p-8 text-center space-y-6">
                <div className="relative mx-auto w-24 h-24">
                  <div className="absolute inset-0 rounded-full bg-emerald-500/10 animate-ping" />
                  <div className="relative w-24 h-24 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
                    <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-white">همه چیز آماده‌ست! 🎉</h2>
                  <p className="text-white/50 text-sm leading-relaxed">
                    کسب‌وکارتان در Persicore CRM راه‌اندازی شد.
                    <br />می‌توانید در هر زمان از منوی تنظیمات اطلاعات را تکمیل کنید.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-right">
                  {[
                    { icon: "📊", title: "داشبورد", desc: "نمای کلی کسب‌وکار" },
                    { icon: "👥", title: "مشتریان", desc: "مدیریت مشتریان" },
                    { icon: "🎯", title: "لیدها", desc: "پیگیری فرصت‌های فروش" },
                    { icon: "📄", title: "فاکتورها", desc: "صدور فاکتور آنلاین" },
                  ].map(item => (
                    <div key={item.title} className="rounded-xl bg-white/5 border border-white/[0.07] p-3 flex items-center gap-2">
                      <span className="text-lg">{item.icon}</span>
                      <div>
                        <p className="text-sm font-medium text-white">{item.title}</p>
                        <p className="text-xs text-white/40">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleFinish}
                  disabled={loading}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold text-sm hover:shadow-lg hover:shadow-emerald-500/25 transition-all flex items-center justify-center gap-2"
                >
                  {loading ? <Spinner /> : <>ورود به داشبورد <ArrowLeft className="w-4 h-4" /></>}
                </button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Progress dots */}
        {step > 0 && step < TOTAL_STEPS - 1 && (
          <div className="flex justify-center gap-2 mt-4">
            {dotSteps.map(i => (
              <div key={i} className={cn("h-1.5 rounded-full transition-all", step === i ? "w-6 bg-violet-500" : "w-1.5 bg-white/20")} />
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}

function StepHeader({ num, total, title, desc }: { num: number; total: string; title: string; desc: string }) {
  return (
    <div className="space-y-1">
      <span className="text-xs font-medium text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full">مرحله {num} از {total}</span>
      <h2 className="text-xl font-bold text-white">{title}</h2>
      <p className="text-sm text-white/40">{desc}</p>
    </div>
  );
}

function Spinner() {
  return <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />;
}

const slide = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
  transition: { duration: 0.2 },
};
