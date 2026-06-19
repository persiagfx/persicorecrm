"use client";

import { useEffect, useRef } from "react";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

interface KeyboardShortcutsOverlayProps {
  open: boolean;
  onClose: () => void;
}

interface ShortcutRow {
  keys: string[];
  description: string;
}

interface ShortcutCategory {
  title: string;
  shortcuts: ShortcutRow[];
}

const CATEGORIES: ShortcutCategory[] = [
  {
    title: "ناوبری",
    shortcuts: [
      { keys: ["g", "d"], description: "داشبورد" },
      { keys: ["g", "l"], description: "لیدها" },
      { keys: ["g", "c"], description: "مشتریان" },
      { keys: ["g", "p"], description: "پروژه‌ها" },
      { keys: ["g", "m"], description: "پیام‌ها" },
      { keys: ["g", "i"], description: "فاکتورها" },
    ],
  },
  {
    title: "عملکرد",
    shortcuts: [
      { keys: ["Ctrl", "K"], description: "جستجو" },
      { keys: ["Ctrl", "N"], description: "ایجاد جدید" },
      { keys: ["Escape"], description: "بستن" },
    ],
  },
  {
    title: "صفحه",
    shortcuts: [{ keys: ["?"], description: "نمایش این راهنما" }],
  },
];

export function KeyboardShortcutsOverlay({
  open,
  onClose,
}: KeyboardShortcutsOverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useKeyboardShortcuts({
    escape: onClose,
  });

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        overlayRef.current &&
        !overlayRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(2px)" }}
    >
      <div
        ref={overlayRef}
        className="relative w-full max-w-lg rounded-2xl border border-border bg-popover p-6 shadow-2xl text-right"
        dir="rtl"
      >
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors text-lg leading-none"
            aria-label="بستن"
          >
            ✕
          </button>
          <h2 className="text-foreground text-lg font-semibold">
            کلیدهای میانبر
          </h2>
        </div>

        {/* Categories */}
        <div className="space-y-5">
          {CATEGORIES.map((category) => (
            <div key={category.title}>
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {category.title}
              </p>
              <div className="rounded-xl border border-border bg-muted/30 overflow-hidden">
                {category.shortcuts.map((shortcut, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between px-4 py-2.5 border-b border-border last:border-0"
                  >
                    <span className="text-sm text-foreground/80">
                      {shortcut.description}
                    </span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((k, ki) => (
                        <span key={ki} className="flex items-center gap-1">
                          <kbd className="inline-flex items-center justify-center rounded-md border border-border bg-muted px-2 py-0.5 text-xs font-mono text-muted-foreground min-w-[28px]">
                            {k}
                          </kbd>
                          {ki < shortcut.keys.length - 1 && (
                            <span className="text-muted-foreground text-xs">+</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer hint */}
        <p className="mt-4 text-center text-xs text-muted-foreground/60">
          برای بستن <kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-xs font-mono">Esc</kbd> یا خارج از پنجره کلیک کنید
        </p>
      </div>
    </div>
  );
}
