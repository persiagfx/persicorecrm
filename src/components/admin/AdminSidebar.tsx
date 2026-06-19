"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, FileText, FolderOpen, Settings,
  Shield, LogOut, PenSquare, ChevronRight, Briefcase,
  Users, Building2, Activity, DollarSign, CreditCard,
  Zap, Tag, Bell, MessageSquare, BarChart3, GraduationCap, Star, Sparkles, Bot,
  TrendingUp, Webhook, Globe, Database, BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAdminAuth } from "@/lib/admin-auth/context";

const SECTIONS = [
  {
    label: "نظارت",
    items: [
      { label: "داشبورد", href: "/admin", icon: LayoutDashboard, exact: true },
      { label: "کاربران", href: "/admin/users", icon: Users },
      { label: "کسب‌وکارها", href: "/admin/tenants", icon: Building2 },
      { label: "لاگ فعالیت‌ها", href: "/admin/activity", icon: Activity },
      { label: "نمای مالی", href: "/admin/finance-overview", icon: BarChart3 },
      { label: "آمار مصرف", href: "/admin/usage", icon: TrendingUp },
    ],
  },
  {
    label: "اشتراک و مالی",
    items: [
      { label: "مدیریت پلن‌ها", href: "/admin/plans", icon: Zap },
      { label: "پرداخت‌ها", href: "/admin/payments", icon: CreditCard },
      { label: "کوپن‌های تخفیف", href: "/admin/coupons", icon: Tag },
    ],
  },
  {
    label: "پشتیبانی",
    items: [
      { label: "تیکت‌های پشتیبانی", href: "/admin/support", icon: MessageSquare },
      { label: "اعلانات سیستمی", href: "/admin/announcements", icon: Bell },
      { label: "نتایج NPS", href: "/admin/nps", icon: Star },
    ],
  },
  {
    label: "آموزش",
    items: [
      { label: "مدیریت دوره‌ها", href: "/admin/training", icon: GraduationCap },
    ],
  },
  {
    label: "محتوا و بلاگ",
    items: [
      { label: "پست‌ها", href: "/admin/blog", icon: FileText },
      { label: "نوشتن پست", href: "/admin/blog/new", icon: PenSquare },
      { label: "دسته‌بندی‌ها", href: "/admin/categories", icon: FolderOpen },
      { label: "رزومه‌ها", href: "/admin/resumes", icon: BookOpen },
      { label: "پروپزال‌ها", href: "/admin/proposals", icon: Briefcase },
    ],
  },
  {
    label: "ایجنت‌ساز AI",
    items: [
      { label: "مدیریت ایجنت‌ها", href: "/admin/agents", icon: Bot },
    ],
  },
  {
    label: "تولید محتوا AI",
    items: [
      { label: "داشبورد محصول", href: "/admin/content", icon: Sparkles },
      { label: "کاربران محتوا", href: "/admin/content/users", icon: Users },
      { label: "تاریخچه تولیدها", href: "/admin/content/generations", icon: BarChart3 },
      { label: "تنظیمات محصول", href: "/admin/content/settings", icon: Settings },
    ],
  },
  {
    label: "سیستم",
    items: [
      { label: "تنظیمات سایت", href: "/admin/settings", icon: Settings },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAdminAuth();

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || (pathname.startsWith(href + "/") && href !== "/admin");

  return (
    <aside className="fixed right-0 top-0 h-full w-64 bg-[#0c0c14] border-l border-white/[0.06] flex flex-col z-40">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Super Admin</p>
            <p className="text-[10px] text-white/35">پنل مدیریت مرکزی</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-4 overflow-y-auto scrollbar-thin">
        {SECTIONS.map(section => (
          <div key={section.label}>
            <p className="text-[9px] font-semibold text-white/20 uppercase tracking-widest px-3 mb-1">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map(({ label, href, icon: Icon, exact }) => {
                const active = isActive(href, exact);
                return (
                  <button
                    key={href}
                    onClick={() => router.push(href)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                      active
                        ? "bg-violet-600/20 text-violet-300 shadow-sm"
                        : "text-white/45 hover:text-white/80 hover:bg-white/[0.04]"
                    )}
                  >
                    <Icon className={cn("w-4 h-4 shrink-0", active ? "text-violet-400" : "text-white/30")} />
                    <span className="flex-1 text-right">{label}</span>
                    {active && <ChevronRight className="w-3 h-3 opacity-40" />}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-4 border-t border-white/[0.06] pt-3">
        <button
          onClick={() => logout()}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/35 hover:text-red-400 hover:bg-red-500/10 transition-all"
        >
          <LogOut className="w-4 h-4" />
          <span>خروج از پنل</span>
        </button>
      </div>
    </aside>
  );
}
