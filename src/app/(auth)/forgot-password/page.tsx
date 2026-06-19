"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setSent(true);
      } else {
        const d = await res.json();
        toast.error(d.error ?? "خطا در ارسال درخواست");
      }
    } catch {
      toast.error("خطا در ارسال درخواست");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-sm">
        <div className="glass rounded-2xl p-8 border border-border shadow-modal">
          <h2 className="text-2xl font-bold text-foreground mb-2">فراموشی رمز عبور</h2>

          {sent ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
                اگر این ایمیل در سیستم باشد، لینک بازنشانی به آدرس{" "}
                <strong>{email}</strong> ارسال شد.
              </div>
              <Link
                href="/login"
                className="block text-center text-sm text-primary hover:underline"
              >
                بازگشت به ورود
              </Link>
            </div>
          ) : (
            <>
              <p className="text-muted-foreground mb-6 text-sm">
                ایمیل حساب خود را وارد کنید تا لینک بازنشانی دریافت کنید.
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">ایمیل</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@company.com"
                    dir="ltr"
                    required
                    className={cn(
                      "w-full px-4 py-3 rounded-xl text-left",
                      "bg-background/50 border border-border",
                      "text-foreground placeholder:text-muted-foreground",
                      "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary",
                      "transition-all duration-200"
                    )}
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className={cn(
                    "w-full py-3 px-6 rounded-xl font-semibold text-black",
                    "gradient-brand gold-glow",
                    "disabled:opacity-60 disabled:cursor-not-allowed"
                  )}
                >
                  {isLoading ? "در حال ارسال..." : "ارسال لینک بازنشانی"}
                </button>
              </form>
              <p className="mt-4 text-center text-xs text-muted-foreground">
                <Link href="/login" className="text-primary hover:underline">
                  بازگشت به ورود
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
