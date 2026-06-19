"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useContentAuth } from "@/lib/content-auth/context";
import { Eye, EyeOff, Sparkles, Zap } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";

type AuthMethod = "password" | "otp";
type AppMode = "login" | "register";

export default function ContentLoginPage() {
  const [appMode, setAppMode] = useState<AppMode>("login");
  const [method, setMethod] = useState<AuthMethod>("password");
  const [otpStep, setOtpStep] = useState<"phone" | "otp">("phone");

  // Password fields
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPass, setShowPass] = useState(false);

  // OTP fields
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [countdown, setCountdown] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [loading, setLoading] = useState(false);
  const { login, register } = useContentAuth();
  const router = useRouter();

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (appMode === "login") {
        await login(identifier, password);
      } else {
        if (!name.trim()) { toast.error("نام الزامی است"); setLoading(false); return; }
        await register(name, identifier, password);
      }
      router.push("/content");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "خطایی رخ داد");
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/content/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? "خطا در ارسال کد");
      }
      setOtpStep("otp");
      setCountdown(120);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
      toast.success("کد تأیید ارسال شد");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "خطا در ارسال کد");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length !== 6) { toast.error("کد ۶ رقمی را کامل وارد کنید"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/content/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? "کد اشتباه است");
      }
      const d = await res.json();
      const token = d.data?.token;
      if (token) {
        localStorage.setItem("content-token", token);
        window.location.href = "/content";
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "کد اشتباه است");
      setOtp(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
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
    <div className="min-h-screen bg-[#050508] flex items-center justify-center relative overflow-hidden" dir="rtl">
      <div className="absolute inset-0 pointer-events-none">
        <motion.div animate={{ x: [0, 40, 0], y: [0, -30, 0] }} transition={{ duration: 12, repeat: Infinity }}
          className="absolute top-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-violet-600/20 blur-[100px]" />
        <motion.div animate={{ x: [0, -30, 0], y: [0, 40, 0] }} transition={{ duration: 15, repeat: Infinity, delay: 2 }}
          className="absolute bottom-1/4 left-1/4 w-[350px] h-[350px] rounded-full bg-indigo-600/20 blur-[100px]" />
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:40px_40px]" />

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md mx-4">

        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-bold text-xl">Persicore Content</span>
          </div>
          <p className="text-white/50 text-sm">تولید محتوای هوشمند با هوش مصنوعی</p>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          {/* Login/Register toggle */}
          <div className="flex bg-white/5 rounded-xl p-1 mb-4">
            {(["login", "register"] as const).map((m) => (
              <button key={m} onClick={() => { setAppMode(m); setOtpStep("phone"); }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${appMode === m ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-violet-500/20" : "text-white/50 hover:text-white/80"}`}>
                {m === "login" ? "ورود" : "ثبت‌نام"}
              </button>
            ))}
          </div>

          {/* Method toggle */}
          <div className="flex bg-white/5 rounded-xl p-1 mb-6">
            <button onClick={() => { setMethod("password"); setOtpStep("phone"); }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${method === "password" ? "bg-violet-600/40 text-white border border-violet-500/30" : "text-white/40 hover:text-white/70"}`}>
              🔑 ایمیل و رمز
            </button>
            <button onClick={() => { setMethod("otp"); setOtpStep("phone"); }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${method === "otp" ? "bg-violet-600/40 text-white border border-violet-500/30" : "text-white/40 hover:text-white/70"}`}>
              📱 کد موبایل
            </button>
          </div>

          <AnimatePresence mode="wait">
            {method === "password" ? (
              <motion.form key="content-password" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                onSubmit={handlePasswordSubmit} className="space-y-4">
                {appMode === "register" && (
                  <div>
                    <label className="block text-white/60 text-sm mb-1.5">نام و نام‌خانوادگی</label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="علی محمدی"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-violet-500/50 transition-all" />
                  </div>
                )}
                <div>
                  <label className="block text-white/60 text-sm mb-1.5">ایمیل یا شماره موبایل</label>
                  <input type="text" value={identifier} onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="example@email.com یا 09..." dir="ltr"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-violet-500/50 transition-all" />
                </div>
                <div>
                  <label className="block text-white/60 text-sm mb-1.5">رمز عبور</label>
                  <div className="relative">
                    <input type={showPass ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
                      placeholder="حداقل ۶ کاراکتر" dir="ltr"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-violet-500/50 transition-all pl-12" />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors">
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <motion.button type="submit" disabled={loading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 mt-2">
                  {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Zap className="w-4 h-4" />{appMode === "login" ? "ورود به سیستم" : "ایجاد حساب رایگان"}</>}
                </motion.button>
              </motion.form>
            ) : otpStep === "phone" ? (
              <motion.form key="content-otp-phone" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-white/60 text-sm mb-1.5">شماره موبایل</label>
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                    placeholder="09123456789" dir="ltr" autoFocus
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-center text-lg tracking-widest placeholder-white/20 focus:outline-none focus:border-violet-500/50 transition-all" />
                </div>
                <motion.button type="submit" disabled={loading || !phone.trim()} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold shadow-lg shadow-violet-500/25 transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 mt-2">
                  {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "دریافت کد تأیید"}
                </motion.button>
              </motion.form>
            ) : (
              <motion.form key="content-otp-verify" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                onSubmit={handleVerifyOtp} className="space-y-4">
                <p className="text-sm text-white/60">کد ارسال شده به <span className="text-white font-medium" dir="ltr">{phone}</span></p>
                <div className="flex gap-2 justify-center" dir="ltr" onPaste={handleOtpPaste}>
                  {otp.map((digit, i) => (
                    <input key={i} ref={el => { otpRefs.current[i] = el; }}
                      type="text" inputMode="numeric" maxLength={1} value={digit}
                      onChange={e => handleOtpChange(i, e.target.value)} onKeyDown={e => handleOtpKeyDown(i, e)}
                      className={`w-11 h-14 text-center text-xl font-bold rounded-xl bg-white/5 border-2 transition-all text-white ${digit ? "border-violet-500" : "border-white/10"} focus:outline-none focus:border-violet-500`}
                    />
                  ))}
                </div>
                <div className="text-center text-sm text-white/40">
                  {countdown > 0 ? (
                    <span>ارسال مجدد تا <span className="text-violet-400 font-mono">{countdown}</span> ثانیه دیگر</span>
                  ) : (
                    <button type="button" onClick={() => { setOtpStep("phone"); setOtp(["", "", "", "", "", ""]); }}
                      className="text-violet-400 hover:underline">ارسال مجدد کد</button>
                  )}
                </div>
                <motion.button type="submit" disabled={loading || otp.join("").length !== 6} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold shadow-lg shadow-violet-500/25 transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2">
                  {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "ورود"}
                </motion.button>
                <button type="button" onClick={() => { setOtpStep("phone"); setOtp(["", "", "", "", "", ""]); }}
                  className="w-full text-center text-sm text-white/40 hover:text-white/60 transition-colors">
                  ← تغییر شماره
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          <div className="mt-6 text-center">
            <p className="text-white/30 text-xs">
              کاربر CRM هستید؟{" "}
              <Link href="/login" className="text-violet-400 hover:text-violet-300 transition-colors">از داخل CRM وارد شوید</Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
