"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAgentAuth } from "@/lib/agent-auth/context";
import Link from "next/link";

type AuthMethod = "password" | "otp";

function agentApiFetch(path: string, body: object) {
  return fetch(`/api/agent${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export default function AgentLoginPage() {
  const { login } = useAgentAuth();
  const router = useRouter();

  const [method, setMethod] = useState<AuthMethod>("password");

  // Password method
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

  // OTP method
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpStep, setOtpStep] = useState<"phone" | "otp">("phone");
  const [countdown, setCountdown] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(identifier, password);
      router.push("/agent/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "خطا در ورود");
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await agentApiFetch("/auth/send-otp", { phone });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? "خطا در ارسال کد");
      }
      setOtpStep("otp");
      setCountdown(120);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "خطا در ارسال کد");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length !== 6) { setError("کد ۶ رقمی را کامل وارد کنید"); return; }
    setError("");
    setLoading(true);
    try {
      const res = await agentApiFetch("/auth/verify-otp", { phone, code });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? "کد اشتباه است");
      }
      const d = await res.json();
      const token = d.data?.token;
      if (token) {
        localStorage.setItem("agent-token", token);
        window.location.href = "/agent/dashboard";
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "کد اشتباه است");
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
    <div className="min-h-screen bg-[#07071a] flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 text-2xl font-bold text-white mb-2">
            <span className="text-3xl">🤖</span> ایجنت‌ساز
          </div>
          <p className="text-white/50 text-sm">وارد حساب کاربری خود شوید</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
          {/* Method toggle */}
          <div className="flex bg-white/5 rounded-xl p-1 mb-6">
            <button onClick={() => { setMethod("password"); setError(""); }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${method === "password" ? "bg-[#5b6cff] text-white shadow" : "text-white/50 hover:text-white/80"}`}>
              🔑 ایمیل و رمز
            </button>
            <button onClick={() => { setMethod("otp"); setOtpStep("phone"); setError(""); }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${method === "otp" ? "bg-[#5b6cff] text-white shadow" : "text-white/50 hover:text-white/80"}`}>
              📱 کد موبایل
            </button>
          </div>

          {method === "password" ? (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-white/70 mb-1.5">ایمیل یا شماره موبایل</label>
                <input type="text" value={identifier} onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="example@email.com یا 09..." dir="ltr"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-[#5b6cff]/60 transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-1.5">رمز عبور</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-[#5b6cff]/60 transition-colors"
                  required
                />
              </div>
              {error && <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</div>}
              <button type="submit" disabled={loading}
                className="w-full bg-[#5b6cff] hover:bg-[#4a5ae8] disabled:opacity-50 text-white font-medium py-3 rounded-xl transition-colors">
                {loading ? "در حال ورود..." : "ورود"}
              </button>
            </form>
          ) : otpStep === "phone" ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-sm text-white/70 mb-1.5">شماره موبایل</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                  placeholder="09123456789" dir="ltr" autoFocus
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-center text-lg tracking-widest placeholder:text-white/30 focus:outline-none focus:border-[#5b6cff]/60 transition-colors"
                  required
                />
              </div>
              {error && <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</div>}
              <button type="submit" disabled={loading || !phone.trim()}
                className="w-full bg-[#5b6cff] hover:bg-[#4a5ae8] disabled:opacity-50 text-white font-medium py-3 rounded-xl transition-colors">
                {loading ? "در حال ارسال..." : "دریافت کد تأیید"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <p className="text-sm text-white/60 mb-3">کد ارسال شده به <span className="text-white font-medium" dir="ltr">{phone}</span></p>
                <div className="flex gap-2 justify-center" dir="ltr" onPaste={handleOtpPaste}>
                  {otp.map((digit, i) => (
                    <input key={i} ref={el => { otpRefs.current[i] = el; }}
                      type="text" inputMode="numeric" maxLength={1} value={digit}
                      onChange={e => handleOtpChange(i, e.target.value)} onKeyDown={e => handleOtpKeyDown(i, e)}
                      className={`w-11 h-14 text-center text-xl font-bold rounded-xl bg-white/5 border-2 transition-all duration-150 text-white ${digit ? "border-[#5b6cff]" : "border-white/10"} focus:outline-none focus:border-[#5b6cff] focus:ring-2 focus:ring-[#5b6cff]/30`}
                    />
                  ))}
                </div>
              </div>
              <div className="text-center text-sm text-white/40">
                {countdown > 0 ? (
                  <span>ارسال مجدد تا <span className="text-[#5b6cff] font-mono font-semibold">{countdown}</span> ثانیه دیگر</span>
                ) : (
                  <button type="button" onClick={() => { setOtpStep("phone"); setOtp(["", "", "", "", "", ""]); }}
                    className="text-[#5b6cff] hover:underline">ارسال مجدد کد</button>
                )}
              </div>
              {error && <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</div>}
              <button type="submit" disabled={loading || otp.join("").length !== 6}
                className="w-full bg-[#5b6cff] hover:bg-[#4a5ae8] disabled:opacity-50 text-white font-medium py-3 rounded-xl transition-colors">
                {loading ? "در حال ورود..." : "ورود"}
              </button>
              <button type="button" onClick={() => { setOtpStep("phone"); setOtp(["", "", "", "", "", ""]); }}
                className="w-full text-center text-sm text-white/40 hover:text-white/60 transition-colors">
                ← تغییر شماره
              </button>
            </form>
          )}

          <p className="text-center text-sm text-white/40 mt-6">
            حساب ندارید؟{" "}
            <Link href="/agent/register" className="text-[#5b6cff] hover:underline">ثبت‌نام کنید</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
