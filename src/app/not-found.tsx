import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center" dir="rtl">
      <div className="text-center">
        <div className="text-8xl font-extrabold gradient-brand-text mb-4">۴۰۴</div>
        <h1 className="text-2xl font-bold text-foreground mb-2">صفحه پیدا نشد</h1>
        <p className="text-muted-foreground mb-8">صفحه‌ای که دنبالش می‌گردید وجود ندارد یا جابجا شده.</p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl gradient-brand text-black font-bold gold-glow"
        >
          برگشت به داشبورد
        </Link>
      </div>
    </div>
  );
}
