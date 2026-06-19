"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronLeft, LogOut, HelpCircle, Zap,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebarStore, useCompanyStore } from "@/lib/store";
import { useAuth } from "@/lib/auth/context";
import { USER_ROLES } from "@/lib/constants";
import { useIsMobile } from "@/hooks/useIsMobile";
import { getNavSections, type IndustryType } from "@/lib/industry-modules";

export function Sidebar() {
  const pathname = usePathname();
  const { isCollapsed, toggle, isMobileOpen, closeMobile } = useSidebarStore();
  const { user, logout } = useAuth();
  const isMobile = useIsMobile();

  useEffect(() => {
    closeMobile();
  }, [pathname]);

  const industryType = (user?.tenant?.industryType ?? "GENERAL") as IndustryType;
  const { settings: companySettings } = useCompanyStore();
  const navSections = (() => {
    const all = getNavSections(industryType);
    const sel = companySettings.selectedModules;
    if (industryType !== "GENERAL" || !sel || sel.length === 0) return all;
    return all
      .map((s) => ({ ...s, items: s.items.filter((item) => sel.includes(item.href)) }))
      .filter((s) => s.label === null || s.items.length > 0);
  })();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const desktopWidth = isCollapsed ? 64 : 260;

  return (
    <>
      {/* Mobile backdrop */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-30 md:hidden"
            onClick={closeMobile}
          />
        )}
      </AnimatePresence>

    <motion.aside
      animate={
        isMobile
          ? { width: 260, x: isMobileOpen ? 0 : 260 }
          : { width: desktopWidth, x: 0 }
      }
      initial={false}
      transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
      className={cn(
        "fixed top-0 right-0 h-screen z-40 flex flex-col",
        "glass border-l border-border",
        "overflow-hidden",
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
        <AnimatePresence>
          {(!isCollapsed || isMobile) && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="flex items-center gap-2 overflow-hidden"
            >
              <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center shrink-0">
                <span className="text-sm font-extrabold text-black">P</span>
              </div>
              <div className="overflow-hidden">
                <p className="font-bold text-sm text-foreground leading-none">Persicore</p>
                <p className="text-xs text-muted-foreground">CRM</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {isCollapsed && !isMobile && (
          <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center mx-auto">
            <span className="text-sm font-extrabold text-black">P</span>
          </div>
        )}
        {(!isCollapsed || isMobile) && (
          <button
            onClick={isMobile ? closeMobile : toggle}
            className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 space-y-0.5 px-2">
        {navSections.map((section) => (
          <div key={section.label ?? "main"} className="mb-1">
            {section.label && (!isCollapsed || isMobile) && (
              <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                {section.label}
              </p>
            )}
            {section.items.map((item) => {
              const Icon = item.icon as LucideIcon;
              const active = isActive(item.href);
              const showLabel = !isCollapsed || isMobile;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={!showLabel ? item.label : undefined}
                  className={cn(
                    "relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium",
                    "transition-all duration-150",
                    active
                      ? "bg-primary/10 text-primary nav-active"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <Icon className={cn("w-4 h-4 shrink-0", active && "text-primary")} />
                  <AnimatePresence>
                    {showLabel && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: "auto" }}
                        exit={{ opacity: 0, width: 0 }}
                        className="truncate"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* CRM Guide */}
      <div className="px-2 pb-1 shrink-0">
        <Link
          href="/crm-guide"
          title={(!isCollapsed || isMobile) ? undefined : "راهنمای CRM"}
          className={cn(
            "relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium",
            "transition-all duration-150 border border-dashed",
            isActive("/crm-guide")
              ? "bg-primary/10 text-primary border-primary/30"
              : "text-yellow-600 dark:text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/10"
          )}
        >
          <HelpCircle className="w-4 h-4 shrink-0" />
          <AnimatePresence>
            {(!isCollapsed || isMobile) && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className="truncate"
              >
                راهنمای CRM
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
      </div>

      {/* Quick links */}
      {(!isCollapsed || isMobile) && (
        <div className="px-3 pb-2 shrink-0 space-y-1">
          <Link href="/settings/subscription"
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-violet-500/8 border border-violet-500/15 hover:border-violet-500/30 transition-all group">
            <Zap className="w-3.5 h-3.5 text-violet-400 shrink-0" />
            <span className="text-xs text-violet-300/70 group-hover:text-violet-300 transition-colors">مدیریت اشتراک</span>
          </Link>
          <Link href="/support"
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/3 border border-white/8 hover:border-white/15 transition-all group">
            <HelpCircle className="w-3.5 h-3.5 text-white/30 shrink-0 group-hover:text-white/60" />
            <span className="text-xs text-white/30 group-hover:text-white/60 transition-colors">پشتیبانی</span>
          </Link>
        </div>
      )}

      {/* User section */}
      <div className="border-t border-border p-3 shrink-0">
        <Link
          href="/settings"
          className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted transition-colors group"
        >
          <div className="w-8 h-8 rounded-full gradient-brand flex items-center justify-center shrink-0 text-xs font-bold text-black">
            {user?.name.slice(0, 1)}
          </div>
          <AnimatePresence>
            {(!isCollapsed || isMobile) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 overflow-hidden"
              >
                <p className="text-sm font-medium text-foreground truncate leading-none mb-0.5">
                  {user?.name}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.role ? USER_ROLES[user.role]?.label : ""}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {(!isCollapsed || isMobile) && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={(e) => { e.preventDefault(); logout(); }}
                className="p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all text-muted-foreground"
              >
                <LogOut className="w-3.5 h-3.5" />
              </motion.button>
            )}
          </AnimatePresence>
        </Link>

        {isCollapsed && !isMobile && (
          <button
            onClick={toggle}
            className="w-full mt-2 flex justify-center p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="w-4 h-4 rotate-180" />
          </button>
        )}
      </div>
    </motion.aside>
    </>
  );
}
