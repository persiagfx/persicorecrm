"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  FileText, Plus, Edit3, Trash2, X, Check, Copy, Eye, Tag,
  ChevronDown, ChevronUp, Variable, Save, LayoutTemplate,
} from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api/client";
import { timeAgo } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface ContractTemplate {
  id: string;
  name: string;
  content: string;
  variables: string[];
  createdAt: string;
  updatedAt: string;
  _count?: { contracts: number };
}

const VARIABLE_SUGGESTIONS = [
  { key: "client_name", label: "نام مشتری" },
  { key: "client_company", label: "شرکت مشتری" },
  { key: "client_email", label: "ایمیل مشتری" },
  { key: "project_name", label: "نام پروژه" },
  { key: "total_amount", label: "مبلغ کل" },
  { key: "start_date", label: "تاریخ شروع" },
  { key: "deadline", label: "ددلاین" },
  { key: "duration_months", label: "مدت (ماه)" },
  { key: "monthly_fee", label: "حق‌الزحمه ماهانه" },
  { key: "payment_terms", label: "شرایط پرداخت" },
  { key: "agency_name", label: "نام آژانس" },
  { key: "agency_address", label: "آدرس آژانس" },
];

// ─── Preview Modal ──────────────────────────────────────────────────────
function PreviewModal({ template, onClose }: { template: ContractTemplate; onClose: () => void }) {
  const [sampleValues, setSampleValues] = useState<Record<string, string>>({});

  const rendered = template.variables.reduce((text, v) => {
    const val = sampleValues[v] ?? `[${v}]`;
    return text.replaceAll(`{{${v}}}`, `<mark class="bg-amber-400/20 text-amber-300 rounded px-0.5">${val}</mark>`);
  }, template.content);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl max-h-[90vh] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <h2 className="font-bold text-foreground flex items-center gap-2">
            <Eye className="w-4 h-4 text-primary" />پیش‌نمایش قالب: {template.name}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted text-muted-foreground"><X className="w-4 h-4" /></button>
        </div>

        {template.variables.length > 0 && (
          <div className="px-6 py-4 border-b border-border bg-muted/30 shrink-0">
            <p className="text-xs text-muted-foreground mb-3 font-medium">مقادیر نمونه برای پیش‌نمایش:</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {template.variables.map((v) => (
                <div key={v}>
                  <label className="text-[10px] text-muted-foreground block mb-1">
                    {`{{${v}}}`}
                  </label>
                  <input
                    value={sampleValues[v] ?? ""}
                    onChange={(e) => setSampleValues((prev) => ({ ...prev, [v]: e.target.value }))}
                    placeholder={VARIABLE_SUGGESTIONS.find((s) => s.key === v)?.label ?? v}
                    className="w-full px-2 py-1.5 text-xs rounded-lg bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-8" dir="rtl">
          <div className="prose prose-sm max-w-none text-foreground leading-loose whitespace-pre-line"
            dangerouslySetInnerHTML={{ __html: rendered }} />
        </div>

        <div className="px-6 py-4 border-t border-border shrink-0 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-xl gradient-brand text-black font-semibold text-sm gold-glow">بستن</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Edit Modal ─────────────────────────────────────────────────────────
function TemplateEditModal({
  template,
  onClose,
  onSaved,
}: {
  template: ContractTemplate | null;
  onClose: () => void;
  onSaved: (t: ContractTemplate) => void;
}) {
  const isNew = template === null;
  const [name, setName] = useState(template?.name ?? "");
  const [content, setContent] = useState(template?.content ?? "");
  const [variables, setVariables] = useState<string[]>(template?.variables ?? []);
  const [newVar, setNewVar] = useState("");
  const [showVarSuggestions, setShowVarSuggestions] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertVariable = useCallback((varKey: string) => {
    const ta = textareaRef.current;
    if (!ta) { setContent((c) => c + `{{${varKey}}}`); return; }
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const tag = `{{${varKey}}}`;
    setContent((c) => c.slice(0, start) + tag + c.slice(end));
    setTimeout(() => {
      ta.setSelectionRange(start + tag.length, start + tag.length);
      ta.focus();
    }, 0);
  }, []);

  const addVariable = (key: string) => {
    const k = key.trim().replace(/\s+/g, "_").toLowerCase();
    if (!k || variables.includes(k)) return;
    setVariables((v) => [...v, k]);
    setNewVar("");
    setShowVarSuggestions(false);
  };

  const removeVariable = (key: string) => {
    setVariables((v) => v.filter((x) => x !== key));
  };

  const handleSave = async () => {
    if (!name.trim()) { toast.error("نام قالب الزامی است"); return; }
    setIsSaving(true);
    try {
      const payload = { name: name.trim(), content, variables };
      const res = isNew
        ? await apiClient.post("/contract-templates", payload)
        : await apiClient.put(`/contract-templates/${template!.id}`, payload);
      onSaved(res.data.data);
      toast.success(isNew ? "قالب ایجاد شد" : "قالب ذخیره شد");
      onClose();
    } catch {
      toast.error("خطا در ذخیره قالب");
    } finally {
      setIsSaving(false);
    }
  };

  // Auto-detect variables from content
  const detectedVars = [...content.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]);
  const undeclaredVars = detectedVars.filter((v) => !variables.includes(v));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}>
      <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl max-h-[92vh] bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden">

        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <h2 className="font-bold text-foreground flex items-center gap-2">
            <LayoutTemplate className="w-4 h-4 text-primary" />
            {isNew ? "قالب جدید" : "ویرایش قالب"}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted text-muted-foreground"><X className="w-4 h-4" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">نام قالب *</label>
            <input value={name} onChange={(e) => setName(e.target.value)}
              placeholder="مثال: قرارداد طراحی وب‌سایت"
              className="w-full px-4 py-2.5 rounded-xl bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40" />
          </div>

          {/* Variables */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-foreground flex items-center gap-1.5">
                <Variable className="w-4 h-4 text-primary" />متغیرها
              </label>
              <span className="text-xs text-muted-foreground">در متن از {`{{نام_متغیر}}`} استفاده کنید</span>
            </div>

            {/* Existing variables */}
            {variables.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {variables.map((v) => (
                  <span key={v} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-mono border border-primary/20">
                    {`{{${v}}}`}
                    <button onClick={() => removeVariable(v)} className="hover:text-red-400 transition-colors ms-0.5">
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Add variable */}
            <div className="relative">
              <div className="flex gap-2">
                <input value={newVar} onChange={(e) => setNewVar(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addVariable(newVar); } }}
                  onFocus={() => setShowVarSuggestions(true)}
                  placeholder="نام متغیر جدید..."
                  className="flex-1 px-3 py-2 rounded-xl bg-muted border border-border text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/40" />
                <button onClick={() => addVariable(newVar)}
                  className="px-3 py-2 rounded-xl bg-primary/10 text-primary text-sm hover:bg-primary/20 transition-colors border border-primary/20">
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Suggestions dropdown */}
              <AnimatePresence>
                {showVarSuggestions && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                    className="absolute top-full mt-1 left-0 right-0 z-10 bg-card border border-border rounded-xl shadow-xl overflow-hidden">
                    <div className="p-2 grid grid-cols-2 gap-1 max-h-48 overflow-y-auto">
                      {VARIABLE_SUGGESTIONS.filter((s) => !variables.includes(s.key) && s.key.includes(newVar.toLowerCase())).map((s) => (
                        <button key={s.key} onClick={() => { addVariable(s.key); setShowVarSuggestions(false); }}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted text-right transition-colors">
                          <Tag className="w-3 h-3 text-primary shrink-0" />
                          <span className="text-xs font-mono text-primary">{s.key}</span>
                          <span className="text-xs text-muted-foreground">{s.label}</span>
                        </button>
                      ))}
                    </div>
                    <button onClick={() => setShowVarSuggestions(false)}
                      className="w-full py-2 text-xs text-muted-foreground hover:bg-muted transition-colors border-t border-border">
                      بستن
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Quick-insert buttons */}
            {variables.length > 0 && (
              <div className="mt-3">
                <p className="text-xs text-muted-foreground mb-2">درج سریع در متن:</p>
                <div className="flex flex-wrap gap-1.5">
                  {variables.map((v) => (
                    <button key={v} onClick={() => insertVariable(v)}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg bg-muted hover:bg-primary/10 hover:text-primary text-muted-foreground text-xs font-mono transition-colors border border-border hover:border-primary/20">
                      <Copy className="w-2.5 h-2.5" />{`{{${v}}}`}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Undeclared vars warning */}
            {undeclaredVars.length > 0 && (
              <div className="mt-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <p className="text-xs text-amber-400 flex items-center gap-1.5">
                  <Variable className="w-3 h-3" />
                  متغیرهای استفاده‌شده در متن اما ثبت‌نشده: {undeclaredVars.map((v) => `{{${v}}}`).join(", ")}
                </p>
                <button onClick={() => setVariables((prev) => [...new Set([...prev, ...undeclaredVars])])}
                  className="mt-1.5 text-xs text-amber-400 hover:text-amber-300 underline">
                  اضافه کردن همه
                </button>
              </div>
            )}
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">متن قالب</label>
            <textarea ref={textareaRef} value={content} onChange={(e) => setContent(e.target.value)} rows={14}
              dir="rtl"
              placeholder={`متن قالب قرارداد را وارد کنید...\n\nاز {{نام_متغیر}} برای قسمت‌های متغیر استفاده کنید.\nمثال: این قرارداد با {{client_name}} از شرکت {{client_company}} منعقد می‌گردد.`}
              className="w-full px-4 py-3 rounded-xl bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none leading-relaxed font-mono" />
            <p className="text-xs text-muted-foreground mt-1 text-left" dir="ltr">
              {content.length} کاراکتر
            </p>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-border flex gap-3 shrink-0">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border bg-muted text-foreground text-sm hover:bg-muted/80 transition-colors">انصراف</button>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={handleSave} disabled={!name.trim() || isSaving}
            className="flex-1 py-2.5 rounded-xl gradient-brand text-black font-semibold text-sm gold-glow disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
            {isSaving ? <><span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />در حال ذخیره...</> : <><Save className="w-4 h-4" />ذخیره قالب</>}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────
export default function ContractTemplatesPage() {
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTarget, setEditTarget] = useState<ContractTemplate | null>(null);
  const [previewTarget, setPreviewTarget] = useState<ContractTemplate | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    apiClient.get("/contract-templates")
      .then((r) => setTemplates(r.data.data ?? []))
      .catch(() => toast.error("خطا در بارگذاری قالب‌ها"))
      .finally(() => setIsLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm("آیا از حذف این قالب مطمئن هستید؟")) return;
    try {
      await apiClient.delete(`/contract-templates/${id}`);
      setTemplates((prev) => prev.filter((t) => t.id !== id));
      toast.success("قالب حذف شد");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "خطا در حذف قالب";
      toast.error(msg);
    }
  };

  const handleSaved = (template: ContractTemplate) => {
    setTemplates((prev) => {
      const idx = prev.findIndex((t) => t.id === template.id);
      if (idx >= 0) return prev.map((t) => t.id === template.id ? template : t);
      return [template, ...prev];
    });
  };

  const handleUseTemplate = async (template: ContractTemplate) => {
    // Navigate to contracts page with template pre-selected
    window.location.href = `/contracts?template=${template.id}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-4xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <LayoutTemplate className="w-6 h-6 text-primary" />قالب‌های قرارداد
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {templates.length} قالب · از متغیرها برای شخصی‌سازی استفاده کنید
          </p>
        </div>
        <button
          onClick={() => { setEditTarget(null); setShowEditModal(true); }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-brand text-black font-semibold text-sm gold-glow">
          <Plus className="w-4 h-4" />قالب جدید
        </button>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "کل قالب‌ها", value: templates.length, color: "text-foreground" },
          { label: "استفاده شده", value: templates.reduce((s, t) => s + (t._count?.contracts ?? 0), 0), color: "text-primary" },
          { label: "بدون استفاده", value: templates.filter((t) => (t._count?.contracts ?? 0) === 0).length, color: "text-muted-foreground" },
        ].map((s) => (
          <div key={s.label} className="p-4 rounded-2xl bg-card border border-border">
            <p className="text-xs text-muted-foreground mb-1">{s.label}</p>
            <p className={`text-2xl font-bold tabular-nums ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Templates list */}
      <div className="space-y-3">
        {templates.length === 0 ? (
          <div className="py-16 text-center">
            <LayoutTemplate className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-30" />
            <p className="text-muted-foreground">هنوز قالبی ایجاد نشده</p>
            <button onClick={() => { setEditTarget(null); setShowEditModal(true); }}
              className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl border border-dashed border-primary/30 text-primary text-sm mx-auto hover:bg-primary/5 transition-colors">
              <Plus className="w-4 h-4" />اولین قالب را بسازید
            </button>
          </div>
        ) : (
          templates.map((t, i) => {
            const isExpanded = expandedId === t.id;
            const varCount = t.variables.length;
            const usedInContracts = t._count?.contracts ?? 0;

            return (
              <motion.div key={t.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="rounded-2xl bg-card border border-border overflow-hidden hover:border-primary/20 transition-colors">
                <div className="flex items-center gap-4 p-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground">{t.name}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-muted-foreground">
                        {varCount > 0 ? `${varCount} متغیر` : "بدون متغیر"}
                      </span>
                      {usedInContracts > 0 && (
                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">
                          {usedInContracts} قرارداد
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">{timeAgo(t.updatedAt)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => setPreviewTarget(t)}
                      className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors" title="پیش‌نمایش">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button onClick={() => { setEditTarget(t); setShowEditModal(true); }}
                      className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors" title="ویرایش">
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleUseTemplate(t)}
                      className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-muted-foreground hover:text-emerald-400 transition-colors" title="استفاده در قرارداد">
                      <Check className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(t.id)}
                      className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors" title="حذف">
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => setExpandedId(isExpanded ? null : t.id)}
                      className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }}
                      className="overflow-hidden border-t border-border">
                      <div className="p-5 space-y-4" dir="rtl">
                        {t.variables.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                              <Variable className="w-3 h-3" />متغیرها:
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {t.variables.map((v) => (
                                <span key={v} className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-mono border border-primary/20">
                                  {`{{${v}}}`}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-2">پیش‌نمایش متن:</p>
                          <div className="p-4 rounded-xl bg-muted/50 text-sm text-foreground leading-relaxed line-clamp-6 whitespace-pre-line font-mono text-xs">
                            {t.content || <span className="text-muted-foreground italic">متنی وارد نشده</span>}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showEditModal && (
          <TemplateEditModal
            template={editTarget}
            onClose={() => { setShowEditModal(false); setEditTarget(null); }}
            onSaved={handleSaved}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {previewTarget && (
          <PreviewModal template={previewTarget} onClose={() => setPreviewTarget(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}
