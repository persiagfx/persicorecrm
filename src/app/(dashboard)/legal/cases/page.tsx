"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Scale, Plus, X, ChevronDown, Calendar, User, Clock, FileText, CheckCircle } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { toast } from "sonner";
import type { LegalCase, CaseStatus, CaseType } from "@/types";
import { RoleGuard } from "@/components/common/RoleGuard";
import { useAuth } from "@/lib/auth/context";

const STATUS_CFG: Record<CaseStatus, { label: string; color: string }> = {
  open: { label: "باز", color: "text-yellow-600 bg-yellow-500/10 border-yellow-200" },
  in_progress: { label: "در جریان", color: "text-blue-600 bg-blue-500/10 border-blue-200" },
  suspended: { label: "معلق", color: "text-gray-600 bg-gray-500/10 border-gray-200" },
  closed: { label: "بسته", color: "text-muted-foreground bg-muted border-border" },
  won: { label: "برنده شد", color: "text-green-600 bg-green-500/10 border-green-200" },
  lost: { label: "بازنده شد", color: "text-red-600 bg-red-500/10 border-red-200" },
};

const TYPE_LABELS: Record<CaseType, string> = {
  contract: "قرارداد", dispute: "اختلاف", labor: "کارگری", ip: "مالکیت معنوی",
  regulatory: "مقررات", other: "سایر",
};

const EMPTY_FORM = {
  caseNumber: "", title: "", type: "contract" as CaseType, status: "open" as CaseStatus,
  plaintiff: "", defendant: "", court: "", lawyerId: "", nextHearing: "", description: "",
};

export default function LegalCasesPage() {
  const { user } = useAuth();
  const [cases, setCases] = useState<LegalCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<CaseStatus | "all">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    setLoading(true);
    apiClient.get("/legal/cases")
      .then((res) => {
        const data = res.data?.data ?? res.data;
        setCases(Array.isArray(data) ? data : []);
      })
      .catch(() => toast.error("خطا در دریافت پرونده‌ها"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (statusFilter === "all") return cases;
    return cases.filter(c => c.status === statusFilter);
  }, [cases, statusFilter]);

  const selectedCase = cases.find(c => c.id === selectedId);

  const handleSubmit = async () => {
    if (!form.title || !form.caseNumber || !form.plaintiff || !form.defendant) return;
    try {
      const payload = {
        ...form,
        court: form.court || undefined,
        nextHearing: form.nextHearing || undefined,
        description: form.description || undefined,
      };
      const res = await apiClient.post("/legal/cases", payload);
      const newCase: LegalCase = res.data?.data ?? res.data;
      setCases(prev => [newCase, ...prev]);
      setShowForm(false);
      setForm(EMPTY_FORM);
      toast.success("پرونده با موفقیت ثبت شد");
    } catch {
      toast.error("خطا در ثبت پرونده");
    }
  };

  return (
    <RoleGuard roles={["admin", "legal"]}>
      <div className="flex h-[calc(100vh-140px)] gap-4 overflow-hidden">
        {/* Left Panel */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <Scale className="w-4.5 h-4.5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-bold">پرونده‌های حقوقی</h1>
                <p className="text-xs text-muted-foreground">{cases.filter(c => c.status === "open" || c.status === "in_progress").length} پرونده فعال</p>
              </div>
            </div>
            <button onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">
              <Plus className="w-4 h-4" />پرونده جدید
            </button>
          </div>

          {/* Filters */}
          <div className="flex gap-2 flex-wrap mb-3">
            {(["all", "open", "in_progress", "suspended", "won", "lost", "closed"] as const).map(s => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-2.5 py-1 text-xs rounded-lg transition-colors ${statusFilter === s ? "bg-primary text-primary-foreground" : "bg-card border border-border hover:bg-muted"}`}>
                {s === "all" ? "همه" : STATUS_CFG[s].label}
              </button>
            ))}
          </div>

          {/* Cases Table */}
          <div className="flex-1 overflow-y-auto">
            <div className="card overflow-hidden">
              {loading ? (
                <div className="py-12 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <>
                  <table className="w-full">
                    <thead className="sticky top-0 bg-card z-10">
                      <tr className="border-b border-border">
                        {["شماره پرونده", "عنوان", "نوع", "طرفین", "جلسه بعدی", "وضعیت"].map(h => (
                          <th key={h} className="text-right text-xs font-medium text-muted-foreground px-4 py-3">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((c, i) => (
                        <tr key={c.id} onClick={() => setSelectedId(selectedId === c.id ? null : c.id)}
                          className={`border-b border-border/50 cursor-pointer transition-colors hover:bg-muted/30 ${selectedId === c.id ? "bg-primary/5" : ""}`}>
                          <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{c.caseNumber}</td>
                          <td className="px-4 py-3 text-sm font-medium max-w-[200px] truncate">{c.title}</td>
                          <td className="px-4 py-3">
                            <span className="text-xs bg-muted px-2 py-0.5 rounded">{TYPE_LABELS[c.type]}</span>
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            <span>{c.plaintiff}</span>
                            <span className="mx-1 opacity-50">vs</span>
                            <span>{c.defendant}</span>
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            {c.nextHearing ? new Date(c.nextHearing).toLocaleDateString("fa-IR") : "—"}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-0.5 rounded border ${STATUS_CFG[c.status].color}`}>
                              {STATUS_CFG[c.status].label}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filtered.length === 0 && (
                    <div className="py-12 text-center text-muted-foreground text-sm">پرونده‌ای یافت نشد</div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Detail Panel */}
        <AnimatePresence>
          {selectedCase && (
            <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 20, opacity: 0 }}
              className="w-80 flex-shrink-0 overflow-y-auto">
              <div className="card p-4 space-y-4 h-full">
                <div className="flex items-start justify-between">
                  <h2 className="font-bold text-sm leading-tight">{selectedCase.title}</h2>
                  <button onClick={() => setSelectedId(null)} className="p-0.5 hover:bg-muted rounded"><X className="w-4 h-4" /></button>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded border ${STATUS_CFG[selectedCase.status].color}`}>{STATUS_CFG[selectedCase.status].label}</span>
                  <span className="text-xs bg-muted px-2 py-0.5 rounded">{TYPE_LABELS[selectedCase.type]}</span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex gap-2">
                    <User className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                    <div>
                      <p className="text-muted-foreground">شاکی: <span className="text-foreground">{selectedCase.plaintiff}</span></p>
                      <p className="text-muted-foreground">متشاکی: <span className="text-foreground">{selectedCase.defendant}</span></p>
                    </div>
                  </div>
                  {selectedCase.court && (
                    <div className="flex gap-2">
                      <Scale className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                      <p className="text-muted-foreground">{selectedCase.court}</p>
                    </div>
                  )}
                  {selectedCase.nextHearing && (
                    <div className="flex gap-2">
                      <Calendar className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                      <p>جلسه بعدی: <span className="font-medium">{new Date(selectedCase.nextHearing).toLocaleDateString("fa-IR")}</span></p>
                    </div>
                  )}
                </div>

                {selectedCase.description && (
                  <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-2">{selectedCase.description}</p>
                )}

                {/* Actions Timeline */}
                {selectedCase.actions.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold mb-2 text-muted-foreground uppercase tracking-wide">اقدامات</h3>
                    <div className="space-y-3">
                      {selectedCase.actions.map((action, i) => (
                        <div key={action.id} className="relative pr-5">
                          <div className={`absolute right-0 top-1 w-3 h-3 rounded-full border-2 ${i === 0 ? "border-primary bg-primary/20" : "border-border bg-muted"}`} />
                          {i < selectedCase.actions.length - 1 && (
                            <div className="absolute right-1.5 top-4 bottom-0 w-px bg-border -mb-3" />
                          )}
                          <p className="text-xs font-medium">{action.type}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{action.description}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{new Date(action.date).toLocaleDateString("fa-IR")}</p>
                          {action.nextDate && (
                            <p className="text-xs text-primary">تاریخ بعدی: {new Date(action.nextDate).toLocaleDateString("fa-IR")}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Documents */}
                {selectedCase.documents.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold mb-2 text-muted-foreground uppercase tracking-wide">اسناد</h3>
                    <div className="space-y-1">
                      {selectedCase.documents.map(doc => (
                        <div key={doc} className="flex items-center gap-2 text-xs p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer">
                          <FileText className="w-3.5 h-3.5 text-primary" />
                          <span>{doc}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* New Case Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
                className="card w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-lg">پرونده جدید</h2>
                  <button onClick={() => setShowForm(false)} className="p-1 rounded-lg hover:bg-muted"><X className="w-5 h-5" /></button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">شماره پرونده *</label>
                    <input value={form.caseNumber} onChange={(e) => setForm(p => ({ ...p, caseNumber: e.target.value }))} className="input-field w-full" placeholder="۱۴۰۴/۱/۱۰۰" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">نوع</label>
                    <select value={form.type} onChange={(e) => setForm(p => ({ ...p, type: e.target.value as CaseType }))} className="input-field w-full">
                      {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1">عنوان پرونده *</label>
                    <input value={form.title} onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))} className="input-field w-full" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">شاکی *</label>
                    <input value={form.plaintiff} onChange={(e) => setForm(p => ({ ...p, plaintiff: e.target.value }))} className="input-field w-full" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">متشاکی *</label>
                    <input value={form.defendant} onChange={(e) => setForm(p => ({ ...p, defendant: e.target.value }))} className="input-field w-full" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">دادگاه</label>
                    <input value={form.court} onChange={(e) => setForm(p => ({ ...p, court: e.target.value }))} className="input-field w-full" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">تاریخ جلسه بعدی</label>
                    <input type="date" value={form.nextHearing} onChange={(e) => setForm(p => ({ ...p, nextHearing: e.target.value }))} className="input-field w-full" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium mb-1">توضیحات</label>
                    <textarea value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} className="input-field w-full resize-none" rows={3} />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={handleSubmit} className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium">ثبت پرونده</button>
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
