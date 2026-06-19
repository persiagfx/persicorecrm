"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function ResetPasswordPage() {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast.error("رمز عبور و تکرار آن یکسان نیستند");
      return;
    }
    if (password.length < 6) {
      toast.error("رمز عبور باید حداقل ۶ کاراکتر باشد");
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const d = await res.json();
      if (res.ok) {
        toast.success(d.data?.message ?? "رمز عبور تغییر کرد");
        router.push("/login");
      } else {
        toast.error(d.error ?? "خطا در تغییر رمز عبور");
      }
    } catch {
      toast.error("خطا در اتصال به سرور");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-sm">
        <div className="glass rounded-2xl p-8 border border-border shadow-modal">
          <h2 className="text-2xl font-bold text-foreground mb-2">تغییر رمز عبور</h2>
          <p className="text-muted-foreground mb-6 text-sm">رمز عبور جدید خود را وارد کنید.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">رمز عبور جدید</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="حداقل ۶ کاراکتر"
                required
                className={cn(
                  "w-full px-4 py-3 rounded-xl",
                  "bg-background/50 border border-border",
                  "text-foreground placeholder:text-muted-foreground",
                  "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary",
                  "transition-all duration-200"
                )}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">تکرار رمز عبور</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="رمز عبور را تکرار کنید"
                required
                className={cn(
                  "w-full px-4 py-3 rounded-xl",
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
              {isLoading ? "در حال ذخیره..." : "تغییر رمز عبور"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
