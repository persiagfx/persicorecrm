import Link from "next/link";

export function BlogFooter() {
  return (
    <footer className="border-t border-border bg-card/50 backdrop-blur-sm mt-20">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">P</span>
            </div>
            <div>
              <p className="font-bold text-foreground">Persicore Blog</p>
              <p className="text-xs text-muted-foreground">آخرین مقالات و بینش‌ها</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            {[
              { label: "سایت اصلی", href: "https://persicore.ir" },
              { label: "CRM", href: "https://crm.persicore.ir" },
            ].map(({ label, href }) => (
              <a key={label} href={href} target="_blank" rel="noreferrer"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                {label}
              </a>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Persicore — همه حقوق محفوظ است
          </p>
        </div>
      </div>
    </footer>
  );
}
