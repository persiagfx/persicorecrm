"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) { setError("رمز عبور و تکرار آن یکسان نیستند"); return; }
    if (password.length < 6) { setError("رمز عبور باید حداقل ۶ کاراکتر باشد"); return; }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/portal/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "خطا در بازنشانی");
      } else {
        setSuccess(true);
        setTimeout(() => router.push("/portal/login"), 2500);
      }
    } catch {
      setError("خطا در اتصال به سرور");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background" dir="rtl">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-950 via-background to-teal-950 opacity-80" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_40%,hsla(217,70%,20%,0.5),transparent_60%)]" />

      {[...Array(3)].map((_, i) => (
        <motion.div key={i}
          className="absolute rounded-full bg-blue-500/5 blur-2xl"
          style={{ width: 150 + i * 80, height: 150 + i * 80, left: `${15 + i * 25}%`, top: `${10 + i * 20}%` }}
          animate={{ y: [0, -20, 0], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 5 + i, repeat: Infinity, ease: "easeInOut", delay: i * 1.2 }}
        />
      ))}

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
        className="relative z-10 w-full max-w-md px-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-teal-400 flex items-center justify-center font-extrabold text-white text-lg">P</div>
            <div>
              <p className="text-white font-bold">Persicore</p>
              <p className="text-white/50 text-xs">پرتال مشتریان</p>
            </div>
          </div>

          {!success ? (
            <>
              <h2 className="text-2xl font-bold text-white mb-2">تعیین رمز جدید</h2>
              <p className="text-white/50 text-sm mb-6">رمز عبور جدید خود را وارد کنید</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">رمز عبور جدید</label>
                  <div className="relative">
                    <input
                      type={showPass ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="حداقل ۶ کاراکتر"
                      required
                      className={cn(
                        "w-full pe-10 ps-4 py-3 rounded-xl",
                        "bg-white/10 border border-white/10 text-white placeholder:text-white/30",
                        "focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 transition-all"
                      )}
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors">
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">تکرار رمز عبور</label>
                  <input
                    type={showPass ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="••••••"
                    required
                    className={cn(
                      "w-full px-4 py-3 rounded-xl",
                      "bg-white/10 border transition-all",
                      confirm && confirm !== password ? "border-red-500/50" : confirm && confirm === password ? "border-emerald-500/50" : "border-white/10",
                      "text-white placeholder:text-white/30",
                      "focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                    )}
                  />
                  {confirm && confirm !== password && (
                    <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                      <XCircle className="w-3 h-3" />رمزها یکسان نیستند
                    </p>
                  )}
                  {confirm && confirm === password && (
                    <p className="text-emerald-400 text-xs mt-1 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />رمزها یکسان هستند
                    </p>
                  )}
                </div>

                {error && (
                  <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
                )}

                <motion.button type="submit" disabled={isSubmitting || (!!confirm && confirm !== password)}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  className={cn(
                    "w-full py-3 px-6 rounded-xl font-semibold text-white",
                    "bg-gradient-to-r from-blue-500 to-teal-500",
                    "shadow-lg shadow-blue-500/25 transition-all",
                    "disabled:opacity-60 disabled:cursor-not-allowed",
                    "flex items-center justify-center gap-2"
                  )}>
                  {isSubmitting ? (
                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />در حال تغییر...</>
                  ) : "ذخیره رمز جدید"}
                </motion.button>
              </form>
            </>
          ) : (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">رمز تغییر یافت!</h3>
              <p className="text-white/60 text-sm">در حال انتقال به صفحه ورود...</p>
              <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto mt-4" />
            </motion.div>
          )}

          {!success && (
            <div className="mt-6 pt-6 border-t border-white/10 text-center">
              <Link href="/portal/login" className="text-sm text-white/50 hover:text-white transition-colors">
                بازگشت به ورود
              </Link>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
