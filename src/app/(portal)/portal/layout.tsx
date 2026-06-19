"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { Home, FolderOpen, FileText, Headphones, MessageSquare, FileSignature, User, LogOut, Bell, X, Image, Star } from "lucide-react";
import { usePortal, portalFetch } from "@/lib/portal-context";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/portal", icon: Home, label: "خانه" },
  { href: "/portal/projects", icon: FolderOpen, label: "پروژه‌ها" },
  { href: "/portal/invoices", icon: FileText, label: "فاکتورها" },
  { href: "/portal/contracts", icon: FileSignature, label: "قراردادها" },
  { href: "/portal/tickets", icon: Headphones, label: "پشتیبانی" },
  { href: "/portal/files", icon: FolderOpen, label: "فایل‌ها" },
  { href: "/portal/designs", icon: Image, label: "طرح‌ها" },
  { href: "/portal/messages", icon: MessageSquare, label: "پیام‌ها" },
  { href: "/portal/nps", icon: Star, label: "نظرسنجی" },
  { href: "/portal/profile", icon: User, label: "پروفایل" },
];

interface PortalNotification {
  id: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading, logout } = usePortal();
  const [notifications, setNotifications] = useState<PortalNotification[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    if (!user) return;
    portalFetch("/api/portal/notifications")
      .then((r) => r.json())
      .then((d) => setNotifications(d.data ?? []))
      .catch(console.error);
  }, [user]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifs(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const markAllRead = () => {
    portalFetch("/api/portal/notifications", { method: "PATCH", body: JSON.stringify({ markAllRead: true }) })
      .catch(console.error);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  useEffect(() => {
    const publicPaths2 = ["/portal/login", "/portal/forgot-password"];
    const isPublicPath = publicPaths2.includes(pathname) || pathname.startsWith("/portal/reset-password") || pathname.startsWith("/portal/payment/callback");
    if (!isLoading && !user && !isPublicPath) {
      router.replace("/portal/login");
    }
  }, [user, isLoading, router, pathname]);

  const publicPaths = ["/portal/login", "/portal/forgot-password"];
  const isPublic = publicPaths.includes(pathname) || pathname.startsWith("/portal/reset-password");
  if (isPublic) {
    return <>{children}</>;
  }

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex" dir="rtl">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-60 border-l border-border bg-card shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-border">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-400 to-teal-400 flex items-center justify-center font-extrabold text-white text-sm shrink-0">
            P
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-foreground">پرتال مشتریان</p>
            <p className="text-xs text-muted-foreground truncate">{user.client?.companyName ?? "Persicore"}</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const active = pathname === item.href || (item.href !== "/portal" && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}
                className={cn("flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all",
                  active
                    ? "bg-gradient-to-r from-blue-500/15 to-teal-500/10 text-blue-400 font-medium border border-blue-500/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}>
                <item.icon className="w-4 h-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* User info */}
        <div className="p-3 border-t border-border">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-muted">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-teal-400 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user.phone ?? ""}</p>
            </div>
            <button onClick={logout} className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors" title="خروج">
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-xl border-t border-border px-2 py-2">
        <div className="flex items-center justify-around">
          {navItems.slice(0, 5).map((item) => {
            const active = pathname === item.href || (item.href !== "/portal" && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href}
                className={cn("flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all",
                  active ? "text-blue-400" : "text-muted-foreground"
                )}>
                <item.icon className="w-5 h-5" />
                <span className="text-[10px]">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-0">
        {/* Top bar */}
        <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-xl border-b border-border px-6 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 md:hidden">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-400 to-teal-400 flex items-center justify-center font-bold text-white text-xs">P</div>
            <span className="text-sm font-semibold text-foreground">پرتال مشتریان</span>
          </div>
          <div className="hidden md:block" />
          <div className="flex items-center gap-2">
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setShowNotifs(!showNotifs)}
                className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors relative"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -left-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {showNotifs && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 top-full mt-2 w-80 bg-card border border-border rounded-2xl shadow-xl overflow-hidden z-50"
                  >
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                      <h3 className="text-sm font-semibold text-foreground">اعلان‌ها</h3>
                      <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                          <button onClick={markAllRead} className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                            همه خوانده شد
                          </button>
                        )}
                        <button onClick={() => setShowNotifs(false)} className="p-1 rounded-lg hover:bg-muted text-muted-foreground">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">اعلانی وجود ندارد</p>
                      ) : notifications.map((n) => (
                        <div key={n.id}
                          className={cn("px-4 py-3 border-b border-border/50 last:border-0 transition-colors",
                            !n.isRead ? "bg-blue-500/5" : ""
                          )}>
                          <div className="flex items-start gap-2">
                            {!n.isRead && <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />}
                            <div className={cn("flex-1", n.isRead && "mr-3.5")}>
                              <p className="text-sm font-medium text-foreground">{n.title}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-muted text-sm">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-teal-400 flex items-center justify-center text-white text-[10px] font-bold">
                {user.name.charAt(0)}
              </div>
              <span className="text-foreground font-medium hidden sm:block">{user.name}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6">
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
