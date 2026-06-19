"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/context";
import { useSidebarStore } from "@/lib/store";
import { useIsMobile } from "@/hooks/useIsMobile";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { FloatingTimer } from "@/components/layout/FloatingTimer";
import { CommandPalette } from "@/components/layout/CommandPalette";
import { TrialBanner } from "@/components/layout/TrialBanner";
import { GlobalShortcuts } from "@/components/common/GlobalShortcuts";
import { OnboardingBanner } from "@/components/common/OnboardingBanner";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { BrandColorInjector } from "@/components/common/BrandColorInjector";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const { isCollapsed } = useSidebarStore();
  const isMobile = useIsMobile();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) router.replace("/login");
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl gradient-brand animate-pulse" />
          <p className="text-muted-foreground text-sm">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  const sidebarWidth = isMobile ? 0 : (isCollapsed ? 64 : 260);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div
        className="transition-all duration-250 ease-spring"
        style={{ marginRight: sidebarWidth }}
      >
        <Topbar />
        <TrialBanner />
        <OnboardingBanner />
        <main className="pt-14 min-h-screen overflow-x-hidden">
          <div className="p-4 md:p-6 lg:p-8">
            <ErrorBoundary>{children}</ErrorBoundary>
          </div>
        </main>
      </div>
      <FloatingTimer />
      <CommandPalette />
      <GlobalShortcuts />
      <BrandColorInjector />
      <OnboardingWizard />
      {/* Keyboard shortcut hint */}
      <div
        className="fixed bottom-4 left-4 z-40 hidden md:flex items-center gap-1.5 text-xs text-muted-foreground/50 select-none pointer-events-none"
        dir="rtl"
      >
        <kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-xs">?</kbd>
        <span>برای راهنمای کلیدهای میانبر</span>
      </div>
    </div>
  );
}
