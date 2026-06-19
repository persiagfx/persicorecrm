"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center" dir="rtl">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">⚠️</span>
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">مشکلی پیش آمد</h2>
        <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
          خطایی در بارگذاری صفحه رخ داد. لطفاً دوباره تلاش کنید.
        </p>
        <button
          onClick={reset}
          className="px-6 py-2.5 rounded-xl gradient-brand text-black font-bold gold-glow"
        >
          تلاش مجدد
        </button>
      </div>
    </div>
  );
}
