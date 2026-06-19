"use client";

import { useState, useMemo } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { HelpCircle, X, Search, ChevronDown, ChevronUp } from "lucide-react";
import { HELP_ARTICLES } from "@/data/help-articles";

function ArticleItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-right bg-muted/30 hover:bg-muted/60 transition-colors"
      >
        <span className="text-sm font-medium text-foreground leading-relaxed">{q}</span>
        {open ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
        )}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="px-4 py-3 text-sm text-muted-foreground leading-relaxed bg-background/50">
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function HelpPanel() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const pathname = usePathname();

  // Find best matching section: exact path, or longest prefix match
  const section = useMemo(() => {
    const keys = Object.keys(HELP_ARTICLES);
    // Exact match first
    if (HELP_ARTICLES[pathname]) return HELP_ARTICLES[pathname];
    // Prefix match (longest wins)
    const match = keys
      .filter((k) => pathname.startsWith(k))
      .sort((a, b) => b.length - a.length)[0];
    return match ? HELP_ARTICLES[match] : null;
  }, [pathname]);

  const articles = useMemo(() => {
    const pool = section
      ? section.articles
      : Object.values(HELP_ARTICLES).flatMap((s) => s.articles);
    if (!query.trim()) return pool;
    const q = query.toLowerCase();
    return pool.filter(
      (a) => a.q.toLowerCase().includes(q) || a.a.toLowerCase().includes(q)
    );
  }, [section, query]);

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={() => setOpen(true)}
        aria-label="باز کردن راهنما"
        className="fixed bottom-6 left-6 z-50 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-110 active:scale-95 transition-transform"
      >
        <HelpCircle className="w-5 h-5" />
      </button>

      {/* Backdrop */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Slide-in panel */}
      <AnimatePresence>
        {open && (
          <motion.aside
            key="panel"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed top-0 left-0 z-[51] h-full w-full max-w-sm bg-card border-r border-border shadow-2xl flex flex-col"
            style={{ direction: "rtl" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
              <div>
                <h2 className="text-base font-bold text-foreground">مرکز راهنما</h2>
                {section && (
                  <p className="text-xs text-muted-foreground mt-0.5">{section.title}</p>
                )}
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search */}
            <div className="px-4 py-3 border-b border-border shrink-0">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  placeholder="جستجو در راهنما..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full h-9 pr-9 pl-3 rounded-lg bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>

            {/* Articles */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {articles.length === 0 ? (
                <div className="text-center py-10">
                  <HelpCircle className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">مقاله‌ای یافت نشد</p>
                </div>
              ) : (
                articles.map((article, i) => (
                  <ArticleItem key={i} q={article.q} a={article.a} />
                ))
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-border text-center shrink-0">
              <p className="text-xs text-muted-foreground">
                نیاز به کمک بیشتری دارید؟ با پشتیبانی تماس بگیرید.
              </p>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
