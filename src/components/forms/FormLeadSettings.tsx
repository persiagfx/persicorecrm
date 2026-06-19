"use client";

import { useState } from "react";
import { UserPlus, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Question {
  id: string;
  title: string;
  name?: string;
  type?: string;
}

export type LeadFieldKey = "contactName" | "contactEmail" | "contactPhone" | "companyName";

export interface LeadMappingConfig {
  leadMappingEnabled: boolean;
  /** questionId → LeadFieldKey */
  fieldMappings: Partial<Record<LeadFieldKey, string>>;
}

interface FormLeadSettingsProps {
  questions: Question[];
  value: LeadMappingConfig;
  onChange: (config: LeadMappingConfig) => void;
  className?: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const LEAD_FIELDS: { key: LeadFieldKey; label: string; required?: boolean }[] = [
  { key: "contactName",  label: "نام مخاطب",    required: true },
  { key: "contactEmail", label: "ایمیل مخاطب" },
  { key: "contactPhone", label: "شماره تماس" },
  { key: "companyName",  label: "نام شرکت" },
];

// ── Component ─────────────────────────────────────────────────────────────────

export function FormLeadSettings({ questions, value, onChange, className }: FormLeadSettingsProps) {
  const [expanded, setExpanded] = useState(false);

  const toggle = (enabled: boolean) => {
    onChange({ ...value, leadMappingEnabled: enabled });
    if (enabled) setExpanded(true);
  };

  const setMapping = (leadField: LeadFieldKey, questionId: string) => {
    onChange({
      ...value,
      fieldMappings: {
        ...value.fieldMappings,
        [leadField]: questionId || undefined,
      },
    });
  };

  const mappingComplete =
    Boolean(value.fieldMappings.contactName) &&
    (Boolean(value.fieldMappings.contactEmail) || Boolean(value.fieldMappings.contactPhone));

  return (
    <div className={cn("rounded-2xl border border-border bg-card", className)}>
      {/* Header / toggle */}
      <div className="flex items-center gap-3 p-4">
        <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <UserPlus className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">تبدیل پاسخ به لید</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            با فعال‌سازی، هر پاسخ جدید به‌صورت خودکار یک لید ایجاد می‌کند
          </p>
        </div>

        {/* Toggle switch */}
        <button
          type="button"
          role="switch"
          aria-checked={value.leadMappingEnabled}
          onClick={() => toggle(!value.leadMappingEnabled)}
          className={cn(
            "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none",
            value.leadMappingEnabled ? "bg-primary" : "bg-muted"
          )}
        >
          <span
            className={cn(
              "inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform",
              value.leadMappingEnabled ? "translate-x-6" : "translate-x-1"
            )}
          />
        </button>

        {/* Expand/collapse mapping panel */}
        {value.leadMappingEnabled && (
          <button
            type="button"
            onClick={() => setExpanded((p) => !p)}
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Field mapping panel */}
      {value.leadMappingEnabled && expanded && (
        <div className="border-t border-border px-4 pb-4 pt-3 space-y-3">
          <p className="text-xs text-muted-foreground mb-2">
            برای هر فیلد لید، سوال معادل را انتخاب کنید
          </p>

          {LEAD_FIELDS.map(({ key, label, required }) => (
            <div key={key} className="flex items-center gap-3">
              <label className="text-xs text-foreground w-28 shrink-0">
                {label}
                {required && <span className="text-red-400 ml-0.5">*</span>}
              </label>
              <select
                value={value.fieldMappings[key] ?? ""}
                onChange={(e) => setMapping(key, e.target.value)}
                className="flex-1 text-xs rounded-xl bg-muted border border-border px-3 py-1.5 text-foreground focus:outline-none focus:border-primary"
              >
                <option value="">— انتخاب سوال —</option>
                {questions.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.title || q.name || q.id}
                  </option>
                ))}
              </select>
            </div>
          ))}

          {!mappingComplete && (
            <p className="text-xs text-amber-500 mt-2">
              حداقل «نام مخاطب» و یکی از «ایمیل» یا «شماره تماس» باید نگاشت شوند
            </p>
          )}

          {mappingComplete && (
            <p className="text-xs text-green-500 mt-2">نگاشت فیلدها کامل است</p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Helper: pack/unpack config into SurveyForm.questions JSON ─────────────────
//
// SurveyForm.questions is a plain JSON array. We embed the lead-mapping config
// as a sentinel object at the END of the array so the form builder can persist
// it without a schema migration.
//
// Sentinel shape: { __config__: true, leadMappingEnabled: boolean, fieldMappings: {...} }

export function injectLeadConfig(questions: Question[], config: LeadMappingConfig): unknown[] {
  const clean = questions.filter((q) => !(q as unknown as Record<string, unknown>).__config__);
  return [
    ...clean,
    { __config__: true, ...config },
  ];
}

export function extractLeadConfig(questions: unknown[]): LeadMappingConfig {
  const sentinel = questions.find(
    (q) => typeof q === "object" && q !== null && (q as Record<string, unknown>).__config__ === true
  ) as Record<string, unknown> | undefined;

  if (!sentinel) return { leadMappingEnabled: false, fieldMappings: {} };
  return {
    leadMappingEnabled: Boolean(sentinel.leadMappingEnabled),
    fieldMappings: (sentinel.fieldMappings as Partial<Record<LeadFieldKey, string>>) ?? {},
  };
}
