"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAgentAuth } from "@/lib/agent-auth/context";
import Link from "next/link";

export default function AgentRegisterPage() {
  const { register } = useAgentAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(name, identifier, password);
      router.push("/agent/new");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "خطا در ثبت‌نام");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07071a] flex items-center justify-center p-4" dir="rtl">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 text-2xl font-bold text-white mb-2">
            <span className="text-3xl">🤖</span> ایجنت‌ساز
          </div>
          <p className="text-white/50 text-sm">اولین ایجنت خود را بسازید</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-white/70 mb-1.5">نام کامل</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="علی احمدی"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-[#5b6cff]/60 transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-1.5">ایمیل یا شماره موبایل</label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="example@email.com یا 09..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-[#5b6cff]/60 transition-colors"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-1.5">رمز عبور</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="حداقل ۶ کاراکتر"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-[#5b6cff]/60 transition-colors"
                minLength={6}
                required
              />
            </div>
            {error && (
              <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#5b6cff] hover:bg-[#4a5ae8] disabled:opacity-50 text-white font-medium py-3 rounded-xl transition-colors"
            >
              {loading ? "در حال ثبت‌نام..." : "ثبت‌نام و شروع"}
            </button>
          </form>
          <p className="text-center text-sm text-white/40 mt-6">
            حساب دارید؟{" "}
            <Link href="/agent/login" className="text-[#5b6cff] hover:underline">
              وارد شوید
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
