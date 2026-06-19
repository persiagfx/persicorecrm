"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { FileText, Plus, X, Download, AlertTriangle, Check } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { toast } from "sonner";
import type { LegalContract } from "@/types";
import { RoleGuard } from "@/components/common/RoleGuard";
import { useAuth } from "@/lib/auth/context";

const STATUS_CFG: Record<LegalContract["status"], { label: string; color: string }> = {
  draft: { label: "پیش‌نویس", color: "text-gray-600 bg-gray-500/10 border-gray-200" },
  review: { label: "در بررسی", color: "text-yellow-600 bg-yellow-500/10 border-yellow-200" },
  signed: { label: "امضا شده", color: "text-green-600 bg-green-500/10 border-green-200" },
  expired: { label: "منقضی", color: "text-red-600 bg-red-500/10 border-red-200" },
  terminated: { label: "فسخ شده", color: "text-muted-foreground bg-muted border-border" },
};

const TYPE_LABELS: Record<LegalContract["type"], string> = {
  employment: "استخدامی", service: "خدمات", nda: "محرمانگی",
  partnership: "مشارکت", vendor: "تامین‌کننده", other: "سایر",
};

const EMPTY_FORM = {
  title: "", type: "service" as LegalContract["type"], parties: ["", ""],
  startDate: "", endDate: "", status: "draft" as LegalContract["status"], notes: "",
};

const isExpiringSoon = (endDate?: string) => {
  if (!endDate) return false;
  const diff = (new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  return diff > 0 && diff <= 30;
};

export default function LegalContractsPage() {
  const { user } = useAuth();
  const [contracts, setContracts] = useState<LegalContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<LegalContract["status"] | "all">("all");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    setLoading(true);
    apiClient.get("/legal/contracts")
      .then((res) => {
        const data = res.data?.data ?? res.data;
        setContracts(Array.isArray(data) ? data : []);
      })
      .catch(() => toast.error("خطا در دریافت قراردادها"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (statusFilter === "all") return contracts;
    return contracts.filter(c => c.status === statusFilter);
  }, [contracts, statusFilter]);

  const expiringSoon = contracts.filter(c => isExpiringSoon(c.endDate));

  const handleSubmit = async () => {
    if (!form.title || !form.startDate) return;
    try {
      const payload = {
        ...form,
        parties: form.parties.filter(Boolean),
        endDate: form.endDate || undefined,
        notes: form.notes || undefined,
      };
      const res = await apiClient.post("/legal/contracts", payload);
      const nc: LegalContract = res.data?.data ?? res.data;
      setContracts(prev => [nc, ...prev]);
      setShowForm(false);
      setForm(EMPTY_FORM);
      toast.success("قرارداد با موفقیت ذخیره شد");
    } catch {
      toast.error("خطا در ذخیره قرارداد");
    }
  };

  return (
    <RoleGuard roles={["admin", "legal", "accountant"]}>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">قراردادها</h1>
              <p className="text-sm text-muted-foreground">{contracts.filter(c => c.status === "signed").length} قرارداد فعال</p>
            </div>
          </div>
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">
            <Plus className="w-4 h-4" />قرارداد جدید
          </button>
        </motion.div>

        {/* Expiring Soon Alert */}
        {expiringSoon.length > 0 && (
          <div className="flex items-start gap-3 p-4 rounded-lg bg-orange-500/10 border border-orange-200 text-orange-700">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold">هشدار انقضای قرارداد</p>
              <p className="text-xs mt-0.5">{expiringSoon.length} قرارداد ظرف ۳۰ روز آینده منقضی می‌شود: {expiringSoon.map(c => c.title).join("، ")}</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          {(["all", "draft", "review", "signed", "expired", "terminated"] as const).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${statusFilter === s ? "bg-primary text-primary-foreground" : "bg-card border border-border hover:bg-muted"}`}>
              {s === "all" ? "همه" : STATUS_CFG[s].label}
            </button>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="py-12 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((c, i) => (
              <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="card p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs bg-muted px-2 py-0.5 rounded">{TYPE_LABELS[c.type]}</span>
                      {isExpiringSoon(c.endDate) && (
                        <span className="text-xs bg-orange-500/10 text-orange-600 px-1.5 py-0.5 rounded flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />در شرف انقضا
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-sm leading-tight">{c.title}</h3>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded border whitespace-nowrap ${STATUS_CFG[c.status].color}`}>
                    {STATUS_CFG[c.status].label}
                  </span>
                </div>

                <div className="text-xs text-muted-foreground space-y-1">
                  <p>طرفین: {c.parties.join(" · ")}</p>
                  <p>شروع: {new Date(c.startDate).toLocaleDateString("fa-IR")}</p>
                  {c.endDate && (
                    <p className={isExpiringSoon(c.endDate) ? "text-orange-600 font-medium" : ""}>
                      پایان: {new Date(c.endDate).toLocaleDateString("fa-IR")}
                    </p>
                  )}
                </div>

                {c.notes && <p className="text-xs text-muted-foreground border-r-2 border-border pr-2">{c.notes}</p>}

                <div className="flex items-center justify-between pt-1">
                  <p className="text-xs text-muted-foreground">{new Date(c.createdAt).toLocaleDateString("fa-IR")}</p>
                  {c.fileUrl && (
                    <button className="flex items-center gap-1 text-xs text-primary hover:underline">
                      <Download className="w-3 h-3" />دانلود
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Form Modal */}
        <AnimatePresence>
          {showForm && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
                className="card w-full max-w-lg p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-lg">قرارداد جدید</h2>
                  <button onClick={() => setShowForm(false)} className="p-1 rounded-lg hover:bg-muted"><X className="w-5 h-5" /></button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1">عنوان *</label>
                    <input value={form.title} onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))} className="input-field w-full" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">نوع</label>
                    <select value={form.type} onChange={(e) => setForm(p => ({ ...p, type: e.target.value as LegalContract["type"] }))} className="input-field w-full">
                      {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">وضعیت</label>
                    <select value={form.status} onChange={(e) => setForm(p => ({ ...p, status: e.target.value as LegalContract["status"] }))} className="input-field w-full">
                      {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">طرف اول *</label>
                    <input value={form.parties[0]} onChange={(e) => setForm(p => { const pts = [...p.parties]; pts[0] = e.target.value; return { ...p, parties: pts }; })} className="input-field w-full" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">طرف دوم *</label>
                    <input value={form.parties[1]} onChange={(e) => setForm(p => { const pts = [...p.parties]; pts[1] = e.target.value; return { ...p, parties: pts }; })} className="input-field w-full" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">تاریخ شروع *</label>
                    <input type="date" value={form.startDate} onChange={(e) => setForm(p => ({ ...p, startDate: e.target.value }))} className="input-field w-full" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">تاریخ پایان</label>
                    <input type="date" value={form.endDate} onChange={(e) => setForm(p => ({ ...p, endDate: e.target.value }))} className="input-field w-full" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1">یادداشت</label>
                    <textarea value={form.notes} onChange={(e) => setForm(p => ({ ...p, notes: e.target.value }))} className="input-field w-full resize-none" rows={2} />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={handleSubmit} className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium">ذخیره</button>
                  <button onClick={() => setShowForm(false)} className="flex-1 py-2 rounded-lg border border-border text-sm hover:bg-muted">انصراف</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </RoleGuard>
  );
}
