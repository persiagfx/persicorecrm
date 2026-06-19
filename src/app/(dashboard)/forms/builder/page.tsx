"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ClipboardList, Plus, Trash2, GripVertical, ChevronUp, ChevronDown,
  Settings, Save, Check, X, Star, AlignLeft, List, CheckSquare,
  ToggleLeft, Hash, Calendar, Upload, Type,
} from "lucide-react";
import { RoleGuard } from "@/components/common/RoleGuard";
import { useAuth } from "@/lib/auth/context";
import { apiClient } from "@/lib/api/client";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import type { FormQuestion, QuestionType, SurveyForm } from "@/types";
import {
  FormLeadSettings,
  injectLeadConfig,
  extractLeadConfig,
  type LeadMappingConfig,
} from "@/components/forms/FormLeadSettings";

const QUESTION_TYPES: { type: QuestionType; label: string; icon: React.ElementType }[] = [
  { type: "short_text", label: "متن کوتاه", icon: Type },
  { type: "long_text", label: "متن بلند", icon: AlignLeft },
  { type: "single_choice", label: "تک‌انتخابی", icon: List },
  { type: "multiple_choice", label: "چندانتخابی", icon: CheckSquare },
  { type: "rating", label: "امتیاز (۱-۵)", icon: Star },
  { type: "scale", label: "مقیاس", icon: Hash },
  { type: "yes_no", label: "بله / خیر", icon: ToggleLeft },
  { type: "date", label: "تاریخ", icon: Calendar },
  { type: "file_upload", label: "آپلود فایل", icon: Upload },
];

const FORM_TYPES: { id: SurveyForm["type"]; label: string }[] = [
  { id: "internal", label: "داخلی" },
  { id: "client", label: "مشتری" },
  { id: "exit_interview", label: "مصاحبه خروج" },
  { id: "performance", label: "ارزیابی عملکرد" },
  { id: "custom", label: "سفارشی" },
];

export default function FormBuilderPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");
  const [formTitle, setFormTitle] = useState("فرم بدون عنوان");
  const [formDesc, setFormDesc] = useState("");
  const [formType, setFormType] = useState<SurveyForm["type"]>("internal");
  const [questions, setQuestions] = useState<FormQuestion[]>([]);
  const [selectedQId, setSelectedQId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [leadConfig, setLeadConfig] = useState<LeadMappingConfig>({
    leadMappingEnabled: false,
    fieldMappings: {},
  });

  const selectedQ = questions.find(q => q.id === selectedQId);

  // Load existing form when editing
  useEffect(() => {
    if (!editId) return;
    apiClient.get(`/forms/${editId}`).then((res) => {
      const form = res.data?.data ?? res.data;
      if (!form) return;
      if (form.title) setFormTitle(form.title);
      if (form.description) setFormDesc(form.description);
      if (form.type) setFormType(form.type);
      const rawQuestions: unknown[] = Array.isArray(form.questions) ? form.questions : [];
      const config = extractLeadConfig(rawQuestions);
      setLeadConfig(config);
      const realQs = rawQuestions.filter(
        (q) => typeof q === "object" && q !== null && !(q as Record<string, unknown>).__config__
      ) as FormQuestion[];
      setQuestions(realQs);
    }).catch((err) => console.error(err));
  }, [editId]);

  const addQuestion = (type: QuestionType) => {
    const newQ: FormQuestion = {
      id: `q${Date.now()}`,
      type,
      title: `سوال جدید — ${QUESTION_TYPES.find(t => t.type === type)?.label}`,
      isRequired: false,
      options: ["single_choice", "multiple_choice"].includes(type) ? ["گزینه ۱", "گزینه ۲"] : undefined,
      minValue: ["rating"].includes(type) ? 1 : ["scale"].includes(type) ? 1 : undefined,
      maxValue: ["rating"].includes(type) ? 5 : ["scale"].includes(type) ? 10 : undefined,
    };
    setQuestions(prev => [...prev, newQ]);
    setSelectedQId(newQ.id);
  };

  const updateQ = useCallback((id: string, updates: Partial<FormQuestion>) => {
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, ...updates } : q));
  }, []);

  const removeQ = (id: string) => {
    setQuestions(prev => prev.filter(q => q.id !== id));
    if (selectedQId === id) setSelectedQId(null);
  };

  const moveQ = (id: string, dir: -1 | 1) => {
    setQuestions(prev => {
      const idx = prev.findIndex(q => q.id === id);
      if ((dir === -1 && idx === 0) || (dir === 1 && idx === prev.length - 1)) return prev;
      const arr = [...prev];
      [arr[idx], arr[idx + dir]] = [arr[idx + dir], arr[idx]];
      return arr;
    });
  };

  const addOption = (qId: string) => {
    const q = questions.find(q => q.id === qId);
    if (!q) return;
    updateQ(qId, { options: [...(q.options ?? []), `گزینه ${(q.options?.length ?? 0) + 1}`] });
  };

  const updateOption = (qId: string, idx: number, value: string) => {
    const q = questions.find(q => q.id === qId);
    if (!q?.options) return;
    const opts = [...q.options]; opts[idx] = value;
    updateQ(qId, { options: opts });
  };

  const removeOption = (qId: string, idx: number) => {
    const q = questions.find(q => q.id === qId);
    if (!q?.options) return;
    updateQ(qId, { options: q.options.filter((_, i) => i !== idx) });
  };

  const handleSave = async () => {
    if (!formTitle.trim()) { toast.error("عنوان فرم الزامی است"); return; }
    setSaving(true);
    try {
      const questionsWithConfig = injectLeadConfig(questions, leadConfig);
      const payload = { title: formTitle, description: formDesc, type: formType, questions: questionsWithConfig };
      if (editId) {
        await apiClient.put(`/forms/${editId}`, payload);
      } else {
        await apiClient.post("/forms", payload);
      }
      setSaved(true);
      toast.success("فرم ذخیره شد");
      setTimeout(() => { setSaved(false); router.push("/forms"); }, 1500);
    } catch {
      toast.error("خطا در ذخیره فرم");
    } finally {
      setSaving(false);
    }
  };

  return (
    <RoleGuard roles={["admin", "hr", "sales_manager"]}>
      <div className="flex h-[calc(100vh-140px)] gap-4 overflow-hidden">
        {/* Left: Question Types */}
        <div className="w-48 shrink-0 overflow-y-auto">
          <p className="text-xs font-semibold text-muted-foreground mb-3 uppercase tracking-wide">افزودن سوال</p>
          <div className="space-y-1">
            {QUESTION_TYPES.map(({ type, label, icon: Icon }) => (
              <button key={type} onClick={() => addQuestion(type)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs hover:bg-muted transition-colors text-right">
                <Icon className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Middle: Canvas */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Form Header */}
          <div className="card p-4 mb-3 space-y-2 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <ClipboardList className="w-4 h-4 text-primary" />
              </div>
              <input value={formTitle} onChange={(e) => setFormTitle(e.target.value)}
                className="flex-1 text-lg font-bold bg-transparent border-none outline-none focus:ring-0 placeholder:text-muted-foreground/50"
                placeholder="عنوان فرم..." />
            </div>
            <input value={formDesc} onChange={(e) => setFormDesc(e.target.value)}
              className="w-full text-sm bg-transparent border-none outline-none text-muted-foreground placeholder:text-muted-foreground/40"
              placeholder="توضیح مختصر فرم (اختیاری)..." />
            <div className="flex items-center gap-3">
              <label className="text-xs text-muted-foreground">نوع:</label>
              <select value={formType} onChange={(e) => setFormType(e.target.value as SurveyForm["type"])}
                className="text-xs bg-muted border-none outline-none rounded px-2 py-1">
                {FORM_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </div>
          </div>

          {/* Questions */}
          <div className="flex-1 overflow-y-auto space-y-3 pb-4">
            <AnimatePresence>
              {questions.map((q, i) => {
                const QIcon = QUESTION_TYPES.find(t => t.type === q.type)?.icon ?? Type;
                const isSelected = selectedQId === q.id;
                return (
                  <motion.div key={q.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                    className={`card p-4 cursor-pointer transition-colors ${isSelected ? "border-primary/50 bg-primary/5" : "hover:border-border/80"}`}
                    onClick={() => setSelectedQId(isSelected ? null : q.id)}>
                    <div className="flex items-start gap-3">
                      <GripVertical className="w-4 h-4 text-muted-foreground mt-1 shrink-0 cursor-grab" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-primary">{i + 1}.</span>
                          <QIcon className="w-3.5 h-3.5 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{QUESTION_TYPES.find(t => t.type === q.type)?.label}</span>
                          {q.isRequired && <span className="text-xs text-red-500">*اجباری</span>}
                        </div>
                        <p className="text-sm font-medium">{q.title}</p>
                        {/* Preview */}
                        {q.type === "rating" && (
                          <div className="flex gap-1 mt-2">
                            {Array.from({ length: q.maxValue ?? 5 }).map((_, i) => (
                              <Star key={i} className="w-4 h-4 text-muted-foreground" />
                            ))}
                          </div>
                        )}
                        {(q.type === "single_choice" || q.type === "multiple_choice") && q.options && (
                          <div className="mt-2 space-y-1">
                            {q.options.slice(0, 3).map((opt, i) => (
                              <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                                <div className={`w-3 h-3 border border-muted-foreground ${q.type === "multiple_choice" ? "rounded" : "rounded-full"}`} />
                                {opt}
                              </div>
                            ))}
                            {(q.options?.length ?? 0) > 3 && <p className="text-xs text-muted-foreground">+{(q.options?.length ?? 0) - 3} گزینه دیگر</p>}
                          </div>
                        )}
                        {q.type === "yes_no" && (
                          <div className="flex gap-2 mt-2">
                            <span className="text-xs bg-muted px-2 py-0.5 rounded">بله</span>
                            <span className="text-xs bg-muted px-2 py-0.5 rounded">خیر</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={(e) => { e.stopPropagation(); moveQ(q.id, -1); }} className="p-1 rounded hover:bg-muted"><ChevronUp className="w-3.5 h-3.5" /></button>
                        <button onClick={(e) => { e.stopPropagation(); moveQ(q.id, 1); }} className="p-1 rounded hover:bg-muted"><ChevronDown className="w-3.5 h-3.5" /></button>
                        <button onClick={(e) => { e.stopPropagation(); removeQ(q.id); }} className="p-1 rounded hover:bg-destructive/10 text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            {questions.length === 0 && (
              <div className="text-center py-16 text-muted-foreground">
                <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">از ستون چپ نوع سوال را انتخاب کنید</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Settings Panel */}
        <div className="w-72 shrink-0 overflow-y-auto">
          {selectedQ ? (
            <div className="card p-4 space-y-4">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-primary" />
                <p className="text-sm font-semibold">تنظیمات سوال</p>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium mb-1">عنوان سوال</label>
                  <textarea value={selectedQ.title} onChange={(e) => updateQ(selectedQ.id, { title: e.target.value })}
                    className="input-field w-full text-sm resize-none" rows={2} />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">توضیح (اختیاری)</label>
                  <input value={selectedQ.description ?? ""} onChange={(e) => updateQ(selectedQ.id, { description: e.target.value })}
                    className="input-field w-full text-sm" placeholder="راهنمای پاسخ‌دهنده..." />
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium">اجباری</label>
                  <button onClick={() => updateQ(selectedQ.id, { isRequired: !selectedQ.isRequired })}
                    className={`relative w-10 h-5 rounded-full transition-colors ${selectedQ.isRequired ? "bg-primary" : "bg-muted"}`}>
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${selectedQ.isRequired ? "right-0.5" : "left-0.5"}`} />
                  </button>
                </div>

                {(selectedQ.type === "single_choice" || selectedQ.type === "multiple_choice") && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-medium">گزینه‌ها</label>
                      <button onClick={() => addOption(selectedQ.id)} className="text-xs text-primary hover:underline flex items-center gap-1">
                        <Plus className="w-3 h-3" />افزودن
                      </button>
                    </div>
                    <div className="space-y-1.5">
                      {selectedQ.options?.map((opt, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                          <input value={opt} onChange={(e) => updateOption(selectedQ.id, i, e.target.value)}
                            className="input-field flex-1 text-xs py-1" />
                          <button onClick={() => removeOption(selectedQ.id, i)} className="p-1 text-muted-foreground hover:text-destructive">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {(selectedQ.type === "rating" || selectedQ.type === "scale") && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium mb-1">حداقل</label>
                      <input type="number" value={selectedQ.minValue ?? 1} onChange={(e) => updateQ(selectedQ.id, { minValue: Number(e.target.value) })} className="input-field w-full text-xs" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">حداکثر</label>
                      <input type="number" value={selectedQ.maxValue ?? 5} onChange={(e) => updateQ(selectedQ.id, { maxValue: Number(e.target.value) })} className="input-field w-full text-xs" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="card p-4 text-center text-muted-foreground">
              <Settings className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs">یک سوال انتخاب کنید</p>
            </div>
          )}

          {/* Lead Mapping Settings */}
          <div className="mt-3">
            <FormLeadSettings
              questions={questions}
              value={leadConfig}
              onChange={setLeadConfig}
            />
          </div>

          {/* Save Button */}
          <div className="mt-3 space-y-2">
            <button onClick={handleSave} disabled={saving}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60">
              {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {saving ? "در حال ذخیره..." : saved ? "ذخیره شد!" : "ذخیره فرم"}
            </button>
            <p className="text-xs text-center text-muted-foreground">{questions.length} سوال تعریف‌شده</p>
          </div>
        </div>
      </div>
    </RoleGuard>
  );
}
