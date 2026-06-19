"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AdminAuthProvider, useAdminAuth } from "@/lib/admin-auth/context";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

function AdminGuard({ children }: { children: React.ReactNode }) {
  const { admin, isLoading } = useAdminAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (isLoading) return;
    if (!admin && !isLoginPage) router.replace("/admin/login");
    if (admin && isLoginPage) router.replace("/admin");
  }, [admin, isLoading, isLoginPage, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="w-10 h-10 rounded-2xl bg-red-600/20 animate-pulse" />
      </div>
    );
  }

  if (isLoginPage) return <>{children}</>;
  if (!admin) return null;

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex" dir="rtl">
      <AdminSidebar />
      <main className="flex-1 mr-64 min-h-screen">
        {children}
      </main>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthProvider>
      <AdminGuard>{children}</AdminGuard>
    </AdminAuthProvider>
  );
}
