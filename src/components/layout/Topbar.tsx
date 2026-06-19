"use client";

import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/useIsMobile";
import { motion } from "motion/react";
import { Bell, Sun, Moon, Monitor, Command, Square, Menu } from "lucide-react";
import { useTheme } from "next-themes";
import { useUIStore, useTimerStore, useSidebarStore } from "@/lib/store";
import { useAuth } from "@/lib/auth/context";
import { formatDuration } from "@/lib/utils";
import { apiClient } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { useSSE } from "@/hooks/useSSE";

const routeLabels: Record<string, string> = {
  "/": "داشبورد",
  "/leads": "سرنخ‌ها",
  "/clients": "مشتریان",
  "/projects": "پروژه‌ها",
  "/timer": "تایمر",
  "/invoicing": "فاکتورها",
  "/expenses": "هزینه‌ها",
  "/finance": "مالی شرکت",
  "/contracts": "قراردادها",
  "/team": "اعضای تیم",
  "/tickets": "تیکت‌ها",
  "/wiki": "ویکی",
  "/calendar": "تقویم",
  "/files": "فایل‌ها",
  "/messages": "پیام‌ها",
  "/reports": "گزارش‌ها",
  "/activity": "لاگ فعالیت",
  "/settings": "تنظیمات",
};

export function Topbar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { setCommandPaletteOpen, setNotificationPanelOpen } = useUIStore();
  const { isRunning, taskTitle, elapsedSeconds, stopTimer } = useTimerStore();
  const { isCollapsed, openMobile } = useSidebarStore();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const sidebarWidth = isMobile ? 0 : (isCollapsed ? 64 : 260);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    apiClient.get("/notifications")
      .then((res) => setUnreadCount(res.data.data?.unreadCount ?? 0))
      .catch(console.error);
  }, []);

  // Real-time: اعلان‌های جدید از SSE
  useSSE((event) => {
    if (event.type === "notification") {
      setUnreadCount((p) => p + 1);
    }
  }, !!user);
  const pageLabel = routeLabels[pathname] ?? pathname.split("/").pop() ?? "";

  const themeIcons = { light: Sun, dark: Moon, system: Monitor };
  const ThemeIcon = themeIcons[theme as keyof typeof themeIcons] ?? Sun;

  const nextTheme = theme === "dark" ? "light" : theme === "light" ? "system" : "dark";

  return (
    <header
      className={cn(
        "fixed top-0 left-0 h-14 z-30",
        "flex items-center justify-between px-4 md:px-6",
        "glass border-b border-border",
        "transition-all duration-300"
      )}
      style={{ right: sidebarWidth }}
    >
      {/* Mobile hamburger */}
      <button
        onClick={openMobile}
        className="md:hidden p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        aria-label="باز کردن منو"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Left: Breadcrumb */}
      <div className="hidden md:flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">Persicore</span>
        <span className="text-border-strong">/</span>
        <span className="font-medium text-foreground">{pageLabel}</span>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Active Timer pill */}
        {isRunning && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-primary text-sm"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="font-mono tabular-nums">{formatDuration(elapsedSeconds)}</span>
            <span className="text-xs text-primary/70 max-w-[120px] truncate">{taskTitle}</span>
            <button onClick={stopTimer} className="hover:text-destructive transition-colors">
              <Square className="w-3 h-3 fill-current" />
            </button>
          </motion.div>
        )}

        {/* Command palette shortcut */}
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors text-xs"
        >
          <Command className="w-3.5 h-3.5" />
          <span>K</span>
        </button>

        {/* Theme toggle */}
        <button
          onClick={() => setTheme(nextTheme)}
          className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          title="تغییر تم"
        >
          <ThemeIcon className="w-4 h-4" />
        </button>

        {/* Notifications */}
        <button
          onClick={() => setNotificationPanelOpen(true)}
          className="relative p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-0.5 -left-0.5 w-4 h-4 rounded-full bg-destructive text-white text-[9px] font-bold flex items-center justify-center"
            >
              {unreadCount}
            </motion.span>
          )}
        </button>

        {/* Avatar */}
        <div className="w-8 h-8 rounded-full gradient-brand flex items-center justify-center text-xs font-bold text-black cursor-pointer">
          {user?.name.slice(0, 1)}
        </div>
      </div>
    </header>
  );
}
