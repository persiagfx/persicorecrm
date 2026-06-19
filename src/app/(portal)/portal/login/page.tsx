"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { usePortal } from "@/lib/portal-context";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type AuthMethod = "phone" | "email";

export default function PortalLoginPage() {
  const router = useRouter();
  const { sendOtp, verifyOtpAndLogin, loginWithPassword, user, isLoading } = usePortal();

  const [method, setMethod] = useState<AuthMethod>("phone");
  const [phoneStep, setPhoneStep] = useState<"phone" | "otp">("phone");

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [countdown, setCountdown] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => { if (!isLoading && user) router.replace("/portal"); }, [user, isLoading, router]);
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;
    setIsSubmitting(true);
    try {
      await sendOtp(phone);
      setPhoneStep("otp");
      setCountdown(120);
      toast.success("کد تأیید ارسال شد");
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "خطا در ارسال کد");
    } finally { setIsSubmitting(false); }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length !== 6) return toast.error("کد ۶ رقمی را کامل وارد کنید");
    setIsSubmitting(true);
    try {
      await verifyOtpAndLogin(phone, code);
      toast.success("خوش آمدید!");
      router.replace("/portal");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "کد اشتباه است");
      setOtp(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
    } finally { setIsSubmitting(false); }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await loginWithPassword(email, password);
      toast.success("خوش آمدید!");
      router.replace("/portal");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "ایمیل یا رمز اشتباه است");
    } finally { setIsSubmitting(false); }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setIsSubmitting(true);
    try {
      await sendOtp(phone);
      setCountdown(120);
      setOtp(["", "", "", "", "", ""]);
      toast.success("کد جدید ارسال شد");
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "خطا در ارسال مجدد کد");
    } finally { setIsSubmitting(false); }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp]; next[index] = value.slice(-1); setOtp(next);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) otpRefs.current[index - 1]?.focus();
  };
  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (text.length === 6) { setOtp(text.split("")); otpRefs.current[5]?.focus(); }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background" dir="rtl">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-950 via-background to-teal-950 opacity-80" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_40%,hsla(217,70%,20%,0.5),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_70%,hsla(172,60%,15%,0.4),transparent_60%)]" />

      {[...Array(4)].map((_, i) => (
        <motion.div key={i} className="absolute rounded-full bg-blue-500/5 blur-2xl pointer-events-none"
          style={{ width: 150 + i * 80, height: 150 + i * 80, left: `${15 + i * 20}%`, top: `${10 + i * 15}%` }}
          animate={{ y: [0, -20, 0], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 5 + i, repeat: Infinity, ease: "easeInOut", delay: i * 1.2 }}
        />
      ))}

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
        className="relative z-10 w-full max-w-md px-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 shadow-2xl">

          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-teal-400 flex items-center justify-center font-extrabold text-white text-lg">P</div>
            <div>
              <p className="text-white font-bold">Persicore</p>
              <p className="text-white/50 text-xs">پرتال مشتریان</p>
            </div>
          </div>

          {/* Method toggle */}
          <div className="flex bg-white/5 rounded-xl p-1 mb-6">
            <button onClick={() => { setMethod("phone"); setPhoneStep("phone"); }}
              className={cn("flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                method === "phone" ? "bg-gradient-to-r from-blue-500 to-teal-500 text-white shadow" : "text-white/50 hover:text-white/80")}>
              📱 شماره موبایل
            </button>
            <button onClick={() => setMethod("email")}
              className={cn("flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                method === "email" ? "bg-gradient-to-r from-blue-500 to-teal-500 text-white shadow" : "text-white/50 hover:text-white/80")}>
              ✉️ ایمیل و رمز
            </button>
          </div>

          <AnimatePresence mode="wait">
            {method === "phone" ? (
              phoneStep === "phone" ? (
                <motion.form key="portal-phone" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                  onSubmit={handleSendOtp} className="space-y-5">
                  <div>
                    <h2 className="text-xl font-bold text-white mb-1">ورود به پرتال</h2>
                    <p className="text-white/50 text-sm">شماره موبایل خود را وارد کنید</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">شماره موبایل</label>
                    <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                      placeholder="09123456789" dir="ltr" autoFocus required
                      className={cn("w-full px-4 py-3 rounded-xl text-center text-lg tracking-widest bg-white/10 border border-white/10 text-white placeholder:text-white/30",
                        "focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 transition-all duration-200")}
                    />
                  </div>
                  <motion.button type="submit" disabled={isSubmitting || !phone.trim()} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    className={cn("w-full py-3 px-6 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-500 to-teal-500 shadow-lg shadow-blue-500/25",
                      "transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2")}>
                    {isSubmitting ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> در حال ارسال...</> : "دریافت کد تأیید"}
                  </motion.button>
                </motion.form>
              ) : (
                <motion.form key="portal-otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                  onSubmit={handleVerify} className="space-y-5">
                  <div>
                    <h2 className="text-xl font-bold text-white mb-1">کد تأیید</h2>
                    <p className="text-white/50 text-sm">کد ارسال شده به <span className="text-white/80 font-medium" dir="ltr">{phone}</span></p>
                  </div>
                  <div className="flex gap-2 justify-center" dir="ltr" onPaste={handleOtpPaste}>
                    {otp.map((digit, i) => (
                      <input key={i} ref={el => { otpRefs.current[i] = el; }}
                        type="text" inputMode="numeric" maxLength={1} value={digit}
                        onChange={e => handleOtpChange(i, e.target.value)} onKeyDown={e => handleOtpKeyDown(i, e)}
                        className={cn("w-11 h-14 text-center text-xl font-bold rounded-xl bg-white/10 border-2 transition-all duration-150 text-white",
                          digit ? "border-blue-400" : "border-white/10",
                          "focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30")}
                      />
                    ))}
                  </div>
                  <div className="text-center text-sm text-white/40">
                    {countdown > 0 ? (
                      <span>ارسال مجدد تا <span className="text-blue-400 font-mono font-semibold">{countdown}</span> ثانیه دیگر</span>
                    ) : (
                      <button type="button" onClick={handleResend} disabled={isSubmitting} className="text-blue-400 hover:underline disabled:opacity-50">ارسال مجدد کد</button>
                    )}
                  </div>
                  <motion.button type="submit" disabled={isSubmitting || otp.join("").length !== 6} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    className={cn("w-full py-3 px-6 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-500 to-teal-500 shadow-lg shadow-blue-500/25",
                      "transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2")}>
                    {isSubmitting ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> در حال ورود...</> : "ورود به پرتال"}
                  </motion.button>
                  <button type="button" onClick={() => { setPhoneStep("phone"); setOtp(["", "", "", "", "", ""]); }}
                    className="w-full text-center text-sm text-white/40 hover:text-white/60 transition-colors">
                    ← تغییر شماره موبایل
                  </button>
                </motion.form>
              )
            ) : (
              <motion.form key="portal-email" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                onSubmit={handleEmailLogin} className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">ورود با ایمیل</h2>
                  <p className="text-white/50 text-sm">ایمیل و رمز عبور خود را وارد کنید</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">ایمیل</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="example@email.com" dir="ltr" autoFocus
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 transition-all duration-200"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">رمز عبور</label>
                  <div className="relative">
                    <input type={showPass ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••" dir="ltr"
                      className="w-full px-4 py-3 pl-20 rounded-xl bg-white/10 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 transition-all duration-200"
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 text-xs transition-colors">
                      {showPass ? "پنهان" : "نمایش"}
                    </button>
                  </div>
                </div>
                <motion.button type="submit" disabled={isSubmitting || !email || !password} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  className={cn("w-full py-3 px-6 rounded-xl font-semibold text-white bg-gradient-to-r from-blue-500 to-teal-500 shadow-lg shadow-blue-500/25",
                    "transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2")}>
                  {isSubmitting ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> در حال ورود...</> : "ورود به پرتال"}
                </motion.button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
