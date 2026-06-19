"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";

interface ExportButtonProps {
  type: "leads" | "clients" | "invoices";
  label?: string;
  className?: string;
}

export function ExportButton({ type, label, className }: ExportButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
      const res = await fetch(`/api/export?type=${type}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("خطا در دریافت فایل");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${type}-export.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("فایل Excel دانلود شد");
    } catch {
      toast.error("خطا در Export داده‌ها");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className={className ?? "flex items-center gap-2 px-3 py-2 rounded-lg text-sm border border-border hover:bg-muted transition-colors disabled:opacity-50"}
    >
      <Download size={16} />
      {loading ? "در حال دانلود..." : (label ?? "خروجی Excel")}
    </button>
  );
}
