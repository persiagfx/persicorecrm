"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ClipboardList, Plus, BarChart2, CheckCircle, Clock, XCircle, X,
  Trash2, RefreshCw, UserPlus,
} from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { RoleGuard } from "@/components/common/RoleGuard";
import Link from "next/link";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Question { id: string; title: string; type: string; name?: string; }
interface Form {
  id: string; title: string; description?: string;
  status: "draft" | "open" | "closed"; type?: string;
  questions: Question[]; createdAt: string;
  _count?: { responses: number };
  leadMappingEnabled?: boolean;
  leadCount?: number;
  responses?: Array<{ id: string; answers: Record<string, unknown>; submittedAt: string }>;
}

const STATUS_CFG = {
  draft: { label: "پیش‌نویس", color: "text-gray-500 bg-gray-500/10 border-gray-500/20", icon: Clock },
  open:  { label: "فعال",    color: "text-green-500 bg-green-500/10 border-green-500/20", icon: CheckCircle },
  closed:{ label: "بسته",   color: "text-red-500 bg-red-500/10 border-red-500/20", icon: XCircle },
} as const;

const QUESTION_LABELS: Record<string, string> = {
  short_text: "متن کوتاه", long_text: "متن بلند", single_choice: "تک‌انتخابی",
  multiple_choice: "چندانتخابی", rating: "امتیازدهی", scale: "مقیاس",
  yes_no: "بله/خیر", date: "تاریخ", file_upload: "آپلود فایل",
};

export default function FormsPage() {
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [responseModal, setResponseModal] = useState<Form | null>(null);

  const fetchForms = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/forms");
      setForms(res.data?.data ?? []);
    } catch { toast.error("خطا در بارگذاری فرم‌ها"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchForms(); }, [fetchForms]);

  const handleStatusToggle = async (form: Form) => {
    const next: Record<string, string> = { draft: "open", open: "closed", closed: "draft" };
    const newStatus = next[form.status];
    try {
      await apiClient.put(`/forms/${form.id}`, { status: newStatus });
      setForms((p) => p.map((f) => f.id === form.id ? { ...f, status: newStatus as Form["status"] } : f));
      toast.success("وضعیت فرم تغییر کرد");
    } catch { toast.error("خطا"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("آیا از حذف این فرم مطمئن هستید؟")) return;
    try {
      await apiClient.delete(`/forms/${id}`);
      setForms((p) => p.filter((f) => f.id !== id));
      toast.success("فرم حذف شد");
    } catch { toast.error("خطا در حذف"); }
  };

  const handleViewResponses = async (form: Form) => {
    try {
      const res = await apiClient.get(`/forms/${form.id}`);
      setResponseModal({ ...form, responses: res.data?.data?.responses ?? [] });
    } catch { toast.error("خطا در بارگذاری پاسخ‌ها"); }
  };

  return (
    <RoleGuard roles={["admin", "hr", "sales_manager"]}>
      <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">فرم‌ها و نظرسنجی‌ها</h1>
              <p className="text-sm text-muted-foreground">{forms.filter((f) => f.status === "open").length} فرم فعال</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={fetchForms} disabled={loading}
              className="p-2 rounded-xl bg-muted border border-border text-muted-foreground hover:text-foreground disabled:opacity-50">
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            </button>
            <Link href="/forms/builder"
              className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-brand text-black text-sm font-semibold gold-glow">
              <Plus className="w-4 h-4" />فرم جدید
            </Link>
          </div>
        </motion.div>

        <div className="grid grid-cols-3 gap-3">
          {(["draft","open","closed"] as const).map((s) => {
            const { label, color, icon: Icon } = STATUS_CFG[s];
            return (
              <div key={s} className="p-4 rounded-2xl bg-card border border-border">
                <div className="flex items-center gap-2 mb-1">
                  <Icon className={cn("w-4 h-4", color.split(" ")[0])} />
                  <span className="text-sm text-muted-foreground">{label}</span>
                </div>
                <p className="text-2xl font-bold text-foreground">{forms.filter((f) => f.status === s).length}</p>
              </div>
            );
          })}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-40 rounded-2xl bg-card border border-border animate-pulse" />)}
          </div>
        ) : forms.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground">
            <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="mb-3">فرمی ایجاد نشده است</p>
            <Link href="/forms/builder" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/10 text-primary text-sm hover:bg-primary/20 transition-colors">
              <Plus className="w-3.5 h-3.5" />ایجاد اولین فرم
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {forms.map((form, i) => {
              const cfg = STATUS_CFG[form.status] ?? STATUS_CFG.draft;
              return (
                <motion.div key={form.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="p-4 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all space-y-3 group">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-sm text-foreground">{form.title}</h3>
                        {form.leadMappingEnabled && (
                          <span className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-lg bg-primary/10 text-primary border border-primary/20 shrink-0">
                            <UserPlus className="w-3 h-3" />→ لید
                          </span>
                        )}
                      </div>
                      {form.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{form.description}</p>}
                    </div>
                    <span className={cn("text-xs px-2 py-0.5 rounded-lg border flex items-center gap-1 shrink-0", cfg.color)}>
                      <cfg.icon className="w-3 h-3" />{cfg.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{form.questions?.filter((q) => !(q as unknown as Record<string, unknown>).__config__)?.length ?? 0} سوال</span>
                    <span>·</span>
                    <span>{form._count?.responses ?? 0} پاسخ</span>
                    {form.leadMappingEnabled && (
                      <>
                        <span>·</span>
                        <span className="text-primary flex items-center gap-1">
                          <UserPlus className="w-3 h-3" />{form.leadCount ?? 0} لید
                        </span>
                      </>
                    )}
                    <span>·</span>
                    <span>{new Date(form.createdAt).toLocaleDateString("fa-IR")}</span>
                  </div>
                  <div className="flex items-center gap-2 pt-1 border-t border-border">
                    <button onClick={() => handleViewResponses(form)}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                      <BarChart2 className="w-3.5 h-3.5" />پاسخ‌ها ({form._count?.responses ?? 0})
                    </button>
                    <div className="flex-1" />
                    <button onClick={() => handleStatusToggle(form)} className="text-xs text-primary hover:underline">
                      {form.status === "draft" ? "فعال‌سازی" : form.status === "open" ? "بستن" : "بازگشایی"}
                    </button>
                    <Link href={`/forms/builder?id=${form.id}`} className="text-xs text-muted-foreground hover:text-foreground transition-colors">ویرایش</Link>
                    <button onClick={() => handleDelete(form.id)}
                      className="p-1 rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        <AnimatePresence>
          {responseModal && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setResponseModal(null)}>
              <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-card border border-border rounded-2xl w-full max-w-2xl p-6 max-h-[80vh] overflow-y-auto space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-bold text-foreground">{responseModal.title}</h2>
                    <p className="text-sm text-muted-foreground">{responseModal.responses?.length ?? 0} پاسخ</p>
                  </div>
                  <button onClick={() => setResponseModal(null)} className="p-1 rounded-lg hover:bg-muted">
                    <X className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>
                {!responseModal.responses?.length ? (
                  <p className="text-center text-muted-foreground py-8">پاسخی ثبت نشده</p>
                ) : (
                  <div className="space-y-6">
                    {responseModal.questions?.map((q) => {
                      const answers = responseModal.responses!.map((r) => r.answers[q.id]).filter(Boolean);
                      return (
                        <div key={q.id} className="space-y-2">
                          <h3 className="text-sm font-semibold text-foreground">{q.title}</h3>
                          <p className="text-xs text-muted-foreground">{QUESTION_LABELS[q.type] ?? q.type}</p>
                          {answers.length === 0 ? <p className="text-xs text-muted-foreground italic">بدون پاسخ</p> : (
                            <div className="space-y-1">
                              {answers.map((a, idx) => (
                                <div key={idx} className="text-sm bg-muted/50 rounded-xl px-3 py-1.5 text-foreground">
                                  {Array.isArray(a) ? a.join("، ") : String(a)}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </RoleGuard>
  );
}
