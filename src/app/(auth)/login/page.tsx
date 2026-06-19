"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "@/lib/auth/context";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type AuthMethod = "phone" | "email";
type PhoneStep = "phone" | "otp";

export default function LoginPage() {
  const router = useRouter();
  const { sendOtp, verifyOtpAndLogin, loginWithPassword } = useAuth();

  const [method, setMethod] = useState<AuthMethod>("phone");
  const [phoneStep, setPhoneStep] = useState<PhoneStep>("phone");

  // Phone OTP state
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [countdown, setCountdown] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Email+password state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;
    setIsLoading(true);
    try {
      await sendOtp(phone, "login");
      setPhoneStep("otp");
      setCountdown(120);
      toast.success("کد تأیید ارسال شد");
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "خطا در ارسال کد";
      toast.error(msg);
    } finally {
      setIsLoading(false);
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

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length !== 6) return toast.error("کد ۶ رقمی را کامل وارد کنید");
    setIsLoading(true);
    try {
      await verifyOtpAndLogin(phone, code);
      toast.success("خوش آمدید!");
      router.push("/");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "کد اشتباه است";
      toast.error(msg);
      setOtp(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setIsLoading(true);
    try {
      await sendOtp(phone, "login");
      setCountdown(120);
      setOtp(["", "", "", "", "", ""]);
      toast.success("کد جدید ارسال شد");
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch { toast.error("خطا در ارسال مجدد کد"); }
    finally { setIsLoading(false); }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsLoading(true);
    try {
      await loginWithPassword(email, password);
      toast.success("خوش آمدید!");
      router.push("/");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "ایمیل یا رمز اشتباه است";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex overflow-hidden">
      <div className="absolute inset-0 aurora-bg opacity-90" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_50%,hsla(263,70%,20%,0.4),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_20%,hsla(43,74%,20%,0.3),transparent_60%)]" />

      {[...Array(6)].map((_, i) => (
        <motion.div key={i}
          className="absolute rounded-full bg-gold/10 blur-xl pointer-events-none"
          style={{ width: 150 + i * 30, height: 150 + i * 30, left: `${10 + i * 15}%`, top: `${10 + i * 12}%` }}
          animate={{ y: [0, -20, 0], opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 4 + i, repeat: Infinity, ease: "easeInOut", delay: i * 0.7 }}
        />
      ))}

      {/* Left panel */}
      <div className="hidden lg:flex flex-1 flex-col items-center justify-center p-12 relative z-10">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="text-center max-w-md">
          <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity }} className="mb-8">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl gradient-brand gold-glow mb-4">
              <span className="text-4xl font-extrabold text-black">P</span>
            </div>
          </motion.div>
          <h1 className="text-5xl font-extrabold text-white mb-4 leading-tight">
            Persicore<span className="block gradient-brand-text">CRM</span>
          </h1>
          <p className="text-white/60 text-lg leading-relaxed">سیستم مدیریت جامع کسب‌وکار<br />ورود با شماره موبایل یا ایمیل</p>
          <motion.div className="flex flex-wrap gap-2 justify-center mt-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
            {["مدیریت Lead", "پروژه‌ها", "فاکتور", "تایمر", "تیم", "قرارداد"].map((f, i) => (
              <motion.span key={f} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.6 + i * 0.1 }}
                className="px-3 py-1 rounded-full text-sm bg-white/10 text-white/80 border border-white/10">{f}</motion.span>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Right panel */}
      <div className="flex-1 lg:max-w-lg flex items-center justify-center p-6 relative z-10">
        <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} className="w-full max-w-md">
          <div className="glass rounded-2xl p-8 border border-white/10 shadow-modal">

            <div className="lg:hidden flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center">
                <span className="text-xl font-extrabold text-black">P</span>
              </div>
              <span className="text-xl font-bold text-white">Persicore CRM</span>
            </div>

            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground mb-4">ورود به حساب</h2>
              {/* Method toggle */}
              <div className="flex bg-white/5 rounded-xl p-1">
                <button
                  onClick={() => { setMethod("phone"); setPhoneStep("phone"); }}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                    method === "phone" ? "gradient-brand text-black shadow" : "text-white/50 hover:text-white/80"
                  )}
                >
                  📱 شماره موبایل
                </button>
                <button
                  onClick={() => setMethod("email")}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                    method === "email" ? "gradient-brand text-black shadow" : "text-white/50 hover:text-white/80"
                  )}
                >
                  ✉️ ایمیل و رمز
                </button>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {method === "phone" ? (
                phoneStep === "phone" ? (
                  <motion.form key="phone" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                    onSubmit={handleSendOtp} className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">شماره موبایل</label>
                      <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                        placeholder="۰۹۱۲۳۴۵۶۷۸۹" dir="ltr" autoFocus
                        className={cn(
                          "w-full px-4 py-3 rounded-xl text-center text-lg tracking-widest",
                          "bg-background/50 border border-border text-foreground placeholder:text-muted-foreground",
                          "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200"
                        )}
                      />
                    </div>
                    <motion.button type="submit" disabled={isLoading || !phone.trim()}
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      className={cn("w-full py-3 px-6 rounded-xl font-semibold text-black gradient-brand gold-glow transition-all duration-200",
                        "disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2")}>
                      {isLoading ? <><div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> در حال ارسال...</> : "دریافت کد تأیید"}
                    </motion.button>
                    <p className="text-center text-xs text-muted-foreground">
                      حساب ندارید؟{" "}
                      <a href="/register" className="text-primary hover:underline font-medium">ثبت‌نام رایگان ۱۴ روزه</a>
                    </p>
                  </motion.form>
                ) : (
                  <motion.form key="otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                    onSubmit={handleVerify} className="space-y-5">
                    <div>
                      <h3 className="text-lg font-bold text-foreground mb-1">کد تأیید</h3>
                      <p className="text-muted-foreground text-sm">
                        کد ارسال شده به <span className="text-foreground font-medium" dir="ltr">{phone}</span>
                      </p>
                    </div>
                    <div className="flex gap-2 justify-center" dir="ltr" onPaste={handleOtpPaste}>
                      {otp.map((digit, i) => (
                        <input key={i} ref={el => { otpRefs.current[i] = el; }}
                          type="text" inputMode="numeric" maxLength={1} value={digit}
                          onChange={e => handleOtpChange(i, e.target.value)}
                          onKeyDown={e => handleOtpKeyDown(i, e)}
                          className={cn("w-11 h-14 text-center text-xl font-bold rounded-xl bg-background/50 border-2 transition-all duration-150",
                            digit ? "border-primary text-foreground" : "border-border text-muted-foreground",
                            "focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
                          )}
                        />
                      ))}
                    </div>
                    <div className="text-center text-sm text-muted-foreground">
                      {countdown > 0 ? (
                        <span>ارسال مجدد تا <span className="text-primary font-mono font-semibold">{countdown}</span> ثانیه دیگر</span>
                      ) : (
                        <button type="button" onClick={handleResend} disabled={isLoading} className="text-primary hover:underline disabled:opacity-50">ارسال مجدد کد</button>
                      )}
                    </div>
                    <motion.button type="submit" disabled={isLoading || otp.join("").length !== 6}
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      className={cn("w-full py-3 px-6 rounded-xl font-semibold text-black gradient-brand gold-glow transition-all duration-200",
                        "disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2")}>
                      {isLoading ? <><div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> در حال ورود...</> : "ورود به پنل"}
                    </motion.button>
                    <button type="button" onClick={() => { setPhoneStep("phone"); setOtp(["", "", "", "", "", ""]); }}
                      className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors">
                      ← تغییر شماره موبایل
                    </button>
                  </motion.form>
                )
              ) : (
                <motion.form key="email" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                  onSubmit={handleEmailLogin} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">ایمیل</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="example@email.com" dir="ltr" autoFocus
                      className={cn("w-full px-4 py-3 rounded-xl bg-background/50 border border-border text-foreground placeholder:text-muted-foreground",
                        "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200"
                      )}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">رمز عبور</label>
                    <div className="relative">
                      <input type={showPass ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••" dir="ltr"
                        className={cn("w-full px-4 py-3 pl-10 rounded-xl bg-background/50 border border-border text-foreground placeholder:text-muted-foreground",
                          "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200"
                        )}
                      />
                      <button type="button" onClick={() => setShowPass(!showPass)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors text-sm">
                        {showPass ? "پنهان" : "نمایش"}
                      </button>
                    </div>
                  </div>
                  <motion.button type="submit" disabled={isLoading || !email || !password}
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    className={cn("w-full py-3 px-6 rounded-xl font-semibold text-black gradient-brand gold-glow transition-all duration-200",
                      "disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2")}>
                    {isLoading ? <><div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> در حال ورود...</> : "ورود"}
                  </motion.button>
                  <p className="text-center text-xs text-muted-foreground">
                    حساب ندارید؟{" "}
                    <a href="/register" className="text-primary hover:underline font-medium">ثبت‌نام رایگان ۱۴ روزه</a>
                  </p>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
