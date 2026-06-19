"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { Building2, User, Phone, Mail, Lock, ArrowLeft, CheckCircle2, Eye, EyeOff, Check, Layers } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { useAuth } from "@/lib/auth/context";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";
import { INDUSTRIES, getNavSections, type IndustryType } from "@/lib/industry-modules";

const BASE_SECTION_LABELS = new Set([null, "فروش", "مالی و حسابداری", "تیم و HR", "همکاری", "گزارش‌ها"]);

function getExtraSections(type: IndustryType) {
  return getNavSections(type).filter(s => !BASE_SECTION_LABELS.has(s.label));
}

function FeaturePanel({ type, compact = false }: { type: IndustryType; compact?: boolean }) {
  const extra = getExtraSections(type);
  return (
    <div className={cn("rounded-xl border border-white/10 bg-white/[0.04] p-3 space-y-2", compact && "p-2")}>
      {extra.length > 0 && (
        <>
          <p className={cn("font-medium text-white/50", compact ? "text-[10px]" : "text-xs")}>
            ماژول‌های اختصاصی این صنف:
          </p>
          <div className="grid grid-cols-2 gap-1">
            {extra.map(s => (
              <div key={s.label} className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-primary/80 shrink-0" />
                <span className={cn("text-white/75", compact ? "text-[10px]" : "text-xs")}>{s.label}</span>
                <span className="text-[10px] text-white/25 mr-auto">{s.items.length}</span>
              </div>
            ))}
          </div>
        </>
      )}
      <div className={cn("flex items-center gap-1.5 border-t border-white/10 pt-2", extra.length === 0 && "border-t-0 pt-0")}>
        <Layers className="w-3 h-3 text-emerald-400 shrink-0" />
        <span className={cn("text-white/40", compact ? "text-[10px]" : "text-[11px]")}>
          {type === "GENERAL" ? "دسترسی به تمام ماژول‌ها بدون محدودیت" : "+ تمام امکانات پایه CRM (فروش، مالی، HR، همکاری)"}
        </span>
      </div>
    </div>
  );
}

type RegMethod = "phone" | "email";
type PhoneStep = "industry" | "info" | "verify";

export default function RegisterPage() {
  const router = useRouter();
  const { sendOtp, setSession } = useAuth();

  const [method, setMethod] = useState<RegMethod>("phone");
  const [step, setStep] = useState<PhoneStep>("industry");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [selectedIndustry, setSelectedIndustry] = useState<IndustryType | "">("");
  const [form, setForm] = useState({ companyName: "", phone: "", name: "" });
  const [emailForm, setEmailForm] = useState({ companyName: "", name: "", email: "", password: "" });
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const setE = (k: keyof typeof emailForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setEmailForm(f => ({ ...f, [k]: e.target.value }));

  const handleIndustrySelect = (type: IndustryType) => {
    setSelectedIndustry(type);
  };

  const handleEmailIndustrySelect = (type: IndustryType) => {
    setSelectedIndustry(type);
  };

  // ─── Phone flow ───────────────────────────────────────────────────
  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.companyName.trim()) return;
    if (!form.phone.trim()) return toast.error("شماره موبایل الزامی است");
    setLoading(true);
    try {
      await sendOtp(form.phone, "register");
      setStep("verify");
      setCountdown(120);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "خطا در ارسال کد";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) otpRefs.current[index - 1]?.focus();
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (text.length === 6) { setOtp(text.split("")); otpRefs.current[5]?.focus(); }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setLoading(true);
    try {
      await sendOtp(form.phone, "register");
      setCountdown(120);
      setOtp(["", "", "", "", "", ""]);
      toast.success("کد جدید ارسال شد");
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch { toast.error("خطا در ارسال مجدد کد"); }
    finally { setLoading(false); }
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otp.join("");
    if (otpCode.length !== 6) return toast.error("کد ۶ رقمی را کامل وارد کنید");
    if (!form.name.trim()) return toast.error("نام مدیر الزامی است");
    setLoading(true);
    try {
      const res = await apiClient.post("/auth/register", {
        companyName: form.companyName,
        name: form.name,
        phone: form.phone,
        industryType: selectedIndustry || "GENERAL",
        otpCode,
        method: "phone",
      });
      const { token, user } = res.data.data;
      setSession(token, user);
      toast.success("حساب شما ایجاد شد! ۱۴ روز تریال رایگان شروع شد.");
      router.push("/onboarding");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "خطا در ثبت‌نام";
      toast.error(msg);
      setOtp(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  // ─── Email flow ───────────────────────────────────────────────────
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailForm.companyName.trim()) return toast.error("نام شرکت الزامی است");
    if (!emailForm.name.trim()) return toast.error("نام مدیر الزامی است");
    if (!emailForm.email.trim()) return toast.error("ایمیل الزامی است");
    if (emailForm.password.length < 6) return toast.error("رمز عبور باید حداقل ۶ کاراکتر باشد");
    setLoading(true);
    try {
      const res = await apiClient.post("/auth/register", {
        companyName: emailForm.companyName,
        name: emailForm.name,
        email: emailForm.email,
        password: emailForm.password,
        industryType: selectedIndustry || "GENERAL",
        method: "email",
      });
      const { token, user } = res.data.data;
      setSession(token, user);
      toast.success("حساب شما ایجاد شد! ۱۴ روز تریال رایگان شروع شد.");
      router.push("/onboarding");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "خطا در ثبت‌نام";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex overflow-hidden">
      <div className="absolute inset-0 aurora-bg opacity-90" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_50%,hsla(263,70%,20%,0.4),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,hsla(43,74%,20%,0.3),transparent_60%)]" />

      <div className="relative z-10 w-full flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg">

          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl gradient-brand mb-4">
              <span className="text-2xl font-extrabold text-black">P</span>
            </div>
            <h1 className="text-2xl font-bold text-white">ثبت‌نام رایگان</h1>
            <p className="text-white/50 text-sm mt-1">۱۴ روز تریال رایگان، بدون نیاز به کارت اعتباری</p>
          </div>

          {/* Method selector */}
          <div className="flex bg-white/5 rounded-xl p-1 mb-6 border border-white/10">
            <button onClick={() => { setMethod("phone"); setStep("industry"); setSelectedIndustry(""); }}
              className={cn("flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                method === "phone" ? "gradient-brand text-black shadow" : "text-white/50 hover:text-white/80")}>
              📱 شماره موبایل
            </button>
            <button onClick={() => { setMethod("email"); setSelectedIndustry(""); }}
              className={cn("flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                method === "email" ? "gradient-brand text-black shadow" : "text-white/50 hover:text-white/80")}>
              ✉️ ایمیل و رمز
            </button>
          </div>

          <AnimatePresence mode="wait">
            {method === "email" ? (
              <motion.form key="email-reg" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                onSubmit={handleEmailSubmit}
                className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 space-y-4 shadow-2xl">

                {/* Industry cards */}
                <div>
                  <label className="block text-xs text-white/50 mb-3">نوع کسب‌وکار شما *</label>
                  <div className="grid grid-cols-4 gap-2">
                    {INDUSTRIES.map((ind) => {
                      const active = selectedIndustry === ind.type;
                      return (
                        <button key={ind.type} type="button"
                          onClick={() => handleEmailIndustrySelect(ind.type)}
                          className={cn(
                            "relative flex flex-col items-center gap-1 p-2 rounded-xl border text-center transition-all duration-200",
                            active
                              ? "border-primary/70 bg-primary/15 text-white scale-105"
                              : "border-white/10 bg-white/5 text-white/50 hover:border-white/30 hover:bg-white/10 hover:text-white/80"
                          )}>
                          {active && (
                            <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-primary flex items-center justify-center">
                              <Check className="w-2 h-2 text-black" />
                            </span>
                          )}
                          <span className="text-xl leading-none">{ind.icon}</span>
                          <span className="text-[10px] font-medium leading-tight">{ind.label.split("/")[0]}</span>
                        </button>
                      );
                    })}
                  </div>
                  <AnimatePresence>
                    {selectedIndustry && (
                      <motion.div
                        key={selectedIndustry}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden mt-2"
                      >
                        <FeaturePanel type={selectedIndustry} compact />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div>
                  <label className="block text-xs text-white/50 mb-1.5">نام شرکت / کسب‌وکار *</label>
                  <div className="relative">
                    <Building2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                    <input value={emailForm.companyName} onChange={setE("companyName")} required
                      placeholder="مثال: شرکت نوآوران پارسی"
                      className="w-full pe-10 ps-3 py-3 rounded-xl bg-white/[0.06] border border-white/10 text-white placeholder:text-white/20 text-sm focus:outline-none focus:border-primary/60" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-white/50 mb-1.5">نام مدیر *</label>
                  <div className="relative">
                    <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                    <input value={emailForm.name} onChange={setE("name")} required
                      placeholder="علی محمدی"
                      className="w-full pe-10 ps-3 py-3 rounded-xl bg-white/[0.06] border border-white/10 text-white placeholder:text-white/20 text-sm focus:outline-none focus:border-primary/60" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-white/50 mb-1.5">ایمیل *</label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                    <input type="email" value={emailForm.email} onChange={setE("email")} required dir="ltr"
                      placeholder="example@email.com"
                      className="w-full pe-10 ps-3 py-3 rounded-xl bg-white/[0.06] border border-white/10 text-white placeholder:text-white/20 text-sm focus:outline-none focus:border-primary/60" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-white/50 mb-1.5">رمز عبور *</label>
                  <div className="relative">
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                    <input type={showPass ? "text" : "password"} value={emailForm.password} onChange={setE("password")} required dir="ltr"
                      placeholder="حداقل ۶ کاراکتر"
                      className="w-full pe-10 ps-10 py-3 rounded-xl bg-white/[0.06] border border-white/10 text-white placeholder:text-white/20 text-sm focus:outline-none focus:border-primary/60" />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <motion.button type="submit" disabled={loading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  className="w-full py-3 rounded-xl gradient-brand text-black font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-40 gold-glow transition-all">
                  {loading ? <><div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> در حال ثبت‌نام...</> : <>ایجاد حساب رایگان <ArrowLeft className="w-4 h-4" /></>}
                </motion.button>

                <p className="text-center text-xs text-white/30">
                  حساب دارید؟{" "}
                  <Link href="/login" className="text-primary hover:underline font-medium">ورود به سیستم</Link>
                </p>
              </motion.form>

            ) : step === "industry" ? (
              // ─── Industry selection ──────────────────────────────────
              <motion.div key="industry-select" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 shadow-2xl">

                <h2 className="text-base font-bold text-white mb-1">نوع کسب‌وکار خود را انتخاب کنید</h2>
                <p className="text-white/40 text-xs mb-5">روی هر صنف کلیک کنید تا امکانات آن را ببینید</p>

                <div className="grid grid-cols-2 gap-2.5">
                  {INDUSTRIES.map((ind) => {
                    const active = selectedIndustry === ind.type;
                    return (
                      <motion.button key={ind.type} type="button"
                        onClick={() => handleIndustrySelect(ind.type)}
                        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                        className={cn(
                          "relative flex items-start gap-3 p-3.5 rounded-xl border text-right transition-all duration-200",
                          "bg-gradient-to-br", ind.color,
                          active
                            ? "border-primary/70 ring-1 ring-primary/40 shadow-lg shadow-primary/10"
                            : "hover:border-white/25"
                        )}>
                        {active && (
                          <span className="absolute top-2 left-2 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 text-black" />
                          </span>
                        )}
                        <span className="text-2xl leading-none mt-0.5 shrink-0">{ind.icon}</span>
                        <div className="overflow-hidden">
                          <p className="text-sm font-semibold text-white leading-tight">{ind.label}</p>
                          <p className="text-[10px] text-white/40 mt-0.5 leading-tight line-clamp-2">{ind.description}</p>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>

                {/* Feature preview panel */}
                <AnimatePresence>
                  {selectedIndustry && (
                    <motion.div
                      key={selectedIndustry}
                      initial={{ opacity: 0, y: -8, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: "auto" }}
                      exit={{ opacity: 0, y: -8, height: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden mt-4"
                    >
                      <div className="mb-3">
                        <p className="text-[11px] text-white/30 mb-2 flex items-center gap-1.5">
                          <span className="text-base">{INDUSTRIES.find(i => i.type === selectedIndustry)?.icon}</span>
                          امکانات فعال برای <span className="text-white/60 font-medium">{INDUSTRIES.find(i => i.type === selectedIndustry)?.label}</span>:
                        </p>
                        <FeaturePanel type={selectedIndustry} />
                      </div>

                      <motion.button
                        type="button"
                        onClick={() => setStep("info")}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full py-3 rounded-xl gradient-brand text-black font-semibold text-sm flex items-center justify-center gap-2 gold-glow transition-all"
                      >
                        ادامه با این صنف
                        <ArrowLeft className="w-4 h-4" />
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>

                <p className="text-center text-xs text-white/30 mt-4">
                  حساب دارید؟{" "}
                  <Link href="/login" className="text-primary hover:underline font-medium">ورود به سیستم</Link>
                </p>
              </motion.div>

            ) : step === "info" ? (
              // ─── Info step ────────────────────────────────────────────
              <motion.form key="phone-info" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                onSubmit={handleNext}
                className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 space-y-4 shadow-2xl">

                {selectedIndustry && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-xl">{INDUSTRIES.find(i => i.type === selectedIndustry)?.icon}</span>
                    <div>
                      <p className="text-xs text-white/40">صنف انتخابی</p>
                      <p className="text-sm font-medium text-white">{INDUSTRIES.find(i => i.type === selectedIndustry)?.label}</p>
                    </div>
                    <button type="button" onClick={() => setStep("industry")}
                      className="mr-auto text-xs text-primary hover:underline">تغییر</button>
                  </div>
                )}

                <div>
                  <label className="block text-xs text-white/50 mb-1.5">نام شرکت / کسب‌وکار *</label>
                  <div className="relative">
                    <Building2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                    <input value={form.companyName} onChange={set("companyName")} required
                      placeholder="مثال: شرکت نوآوران پارسی"
                      className="w-full pe-10 ps-3 py-3 rounded-xl bg-white/[0.06] border border-white/10 text-white placeholder:text-white/20 text-sm focus:outline-none focus:border-primary/60" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-white/50 mb-1.5">شماره موبایل *</label>
                  <div className="relative">
                    <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                    <input value={form.phone} onChange={set("phone")} type="tel" required dir="ltr"
                      placeholder="09123456789"
                      className="w-full pe-10 ps-3 py-3 rounded-xl bg-white/[0.06] border border-white/10 text-white placeholder:text-white/20 text-sm focus:outline-none focus:border-primary/60 text-center tracking-widest" />
                  </div>
                </div>

                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setStep("industry")}
                    className="flex-1 py-3 rounded-xl border border-white/10 bg-white/5 text-white/60 text-sm hover:bg-white/10 transition-all">
                    برگشت
                  </button>
                  <motion.button type="submit" disabled={loading || !form.companyName.trim() || !form.phone.trim()}
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    className="flex-[2] py-3 rounded-xl gradient-brand text-black font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-40 gold-glow transition-all">
                    {loading ? <><div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> در حال ارسال...</> : <>ارسال کد تأیید <ArrowLeft className="w-4 h-4" /></>}
                  </motion.button>
                </div>

                <p className="text-center text-xs text-white/30">
                  حساب دارید؟{" "}
                  <Link href="/login" className="text-primary hover:underline font-medium">ورود به سیستم</Link>
                </p>
              </motion.form>

            ) : (
              // ─── OTP verify ───────────────────────────────────────────
              <motion.form key="phone-verify" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                onSubmit={handlePhoneSubmit}
                className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 space-y-5 shadow-2xl">

                <div>
                  <h2 className="text-lg font-bold text-white mb-1">تأیید شماره موبایل</h2>
                  <p className="text-white/40 text-sm">
                    کد ۶ رقمی ارسال شده به <span className="text-white/70 font-medium" dir="ltr">{form.phone}</span>
                  </p>
                </div>

                <div>
                  <label className="block text-xs text-white/50 mb-1.5">نام و نام خانوادگی مدیر *</label>
                  <div className="relative">
                    <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                    <input value={form.name} onChange={set("name")} required autoFocus
                      placeholder="علی محمدی"
                      className="w-full pe-10 ps-3 py-3 rounded-xl bg-white/[0.06] border border-white/10 text-white placeholder:text-white/20 text-sm focus:outline-none focus:border-primary/60" />
                  </div>
                </div>

                <div className="flex gap-2 justify-center" dir="ltr" onPaste={handleOtpPaste}>
                  {otp.map((digit, i) => (
                    <input key={i} ref={el => { otpRefs.current[i] = el; }}
                      type="text" inputMode="numeric" maxLength={1} value={digit}
                      onChange={e => handleOtpChange(i, e.target.value)} onKeyDown={e => handleOtpKeyDown(i, e)}
                      className={cn("w-11 h-14 text-center text-xl font-bold rounded-xl bg-white/[0.06] border-2 transition-all duration-150 text-white",
                        digit ? "border-primary" : "border-white/10",
                        "focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30")} />
                  ))}
                </div>

                <div className="text-center text-sm text-white/40">
                  {countdown > 0 ? (
                    <span>ارسال مجدد تا <span className="text-primary font-mono font-semibold">{countdown}</span> ثانیه دیگر</span>
                  ) : (
                    <button type="button" onClick={handleResend} disabled={loading} className="text-primary hover:underline disabled:opacity-50">ارسال مجدد کد</button>
                  )}
                </div>

                <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10 space-y-1.5">
                  {["۱۴ روز تریال کامل رایگان", "بدون محدودیت کاربر در تریال", "پشتیبانی اختصاصی فارسی"].map(f => (
                    <div key={f} className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="text-xs text-white/50">{f}</span>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3">
                  <button type="button" onClick={() => { setStep("info"); setOtp(["", "", "", "", "", ""]); }}
                    className="flex-1 py-3 rounded-xl border border-white/10 bg-white/5 text-white/60 text-sm hover:bg-white/10 transition-all">
                    برگشت
                  </button>
                  <motion.button type="submit" disabled={loading || otp.join("").length !== 6 || !form.name.trim()}
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    className="flex-[2] py-3 rounded-xl gradient-brand text-black font-semibold text-sm disabled:opacity-40 gold-glow transition-all flex items-center justify-center gap-2">
                    {loading ? <><div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> در حال ثبت...</> : "ایجاد حساب رایگان"}
                  </motion.button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
