"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Zap, RefreshCw, CheckCircle, AlertCircle, Loader2,
  Plus, Trash2, ToggleLeft, ToggleRight, X, ChevronRight,
  ChevronLeft, Play, GripVertical, Bell, Tag, Webhook,
  User, FileText, Pencil, MoreVertical,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ─── Types ─────────────────────────────────────────────────────────────────

type RunState = "idle" | "loading" | "success" | "error";

interface TriggerConfig {
  type: string;
  from?: string;
  to?: string;
  formId?: string;
  assigneeId?: string;
}

interface ActionConfig {
  type: string;
  // create_task
  title?: string;
  projectId?: string;
  dueInDays?: number;
  // send_notification
  message?: string;
  targetType?: "assignee" | "all_admins" | "specific";
  userId?: string;
  // add_tag
  tag?: string;
  // update_lead_field
  field?: string;
  value?: string;
  // trigger_webhook
  webhookId?: string;
}

interface AutomationRule {
  id: string;
  name: string;
  description?: string | null;
  trigger: TriggerConfig;
  actions: ActionConfig[];
  isActive: boolean;
  runCount: number;
  lastRunAt?: string | null;
  createdAt: string;
}

// ─── Constants ──────────────────────────────────────────────────────────────

const TRIGGER_TYPES = [
  { value: "new_lead", label: "لید جدید", icon: User, color: "text-blue-400" },
  { value: "lead_stage_changed", label: "تغییر مرحله لید", icon: ChevronRight, color: "text-purple-400" },
  { value: "lead_assigned", label: "واگذاری لید", icon: User, color: "text-orange-400" },
  { value: "invoice_paid", label: "پرداخت فاکتور", icon: CheckCircle, color: "text-green-400" },
  { value: "form_submitted", label: "ارسال فرم", icon: FileText, color: "text-pink-400" },
];

const ACTION_TYPES = [
  { value: "create_task", label: "ایجاد وظیفه", icon: Plus, color: "text-blue-400" },
  { value: "send_notification", label: "ارسال اعلان", icon: Bell, color: "text-yellow-400" },
  { value: "add_tag", label: "افزودن تگ", icon: Tag, color: "text-green-400" },
  { value: "update_lead_field", label: "به‌روزرسانی فیلد لید", icon: Pencil, color: "text-purple-400" },
  { value: "trigger_webhook", label: "فراخوانی Webhook", icon: Webhook, color: "text-pink-400" },
];

const NOTIFICATION_TARGET_TYPES = [
  { value: "assignee", label: "مسئول لید" },
  { value: "all_admins", label: "همه ادمین‌ها" },
  { value: "specific", label: "کاربر مشخص" },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

function authHeaders() {
  const token = typeof window !== "undefined" ? localStorage.getItem("crm-token") : null;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function triggerSummary(trigger: TriggerConfig): string {
  const t = TRIGGER_TYPES.find((x) => x.value === trigger.type);
  const base = t?.label ?? trigger.type;
  if (trigger.type === "lead_stage_changed") {
    if (trigger.from && trigger.to) return `${base}: از ${trigger.from} به ${trigger.to}`;
    if (trigger.to) return `${base}: به ${trigger.to}`;
  }
  if (trigger.type === "form_submitted" && trigger.formId) {
    return `${base} (فرم: ${trigger.formId.slice(0, 8)}...)`;
  }
  return base;
}

function actionSummary(action: ActionConfig): string {
  const t = ACTION_TYPES.find((x) => x.value === action.type);
  const base = t?.label ?? action.type;
  if (action.type === "create_task" && action.title) return `${base}: "${action.title}"`;
  if (action.type === "add_tag" && action.tag) return `${base}: #${action.tag}`;
  if (action.type === "send_notification" && action.message)
    return `${base}: "${action.message.slice(0, 30)}${action.message.length > 30 ? "..." : ""}"`;
  return base;
}

function newAction(): ActionConfig {
  return { type: "send_notification", message: "", targetType: "assignee" };
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function TriggerFields({ trigger, onChange }: { trigger: TriggerConfig; onChange: (t: TriggerConfig) => void }) {
  return (
    <div className="space-y-3 mt-3">
      {trigger.type === "lead_stage_changed" && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">از مرحله (اختیاری)</label>
            <input
              className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="مثلاً: new"
              value={trigger.from ?? ""}
              onChange={(e) => onChange({ ...trigger, from: e.target.value || undefined })}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">به مرحله</label>
            <input
              className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="مثلاً: won"
              value={trigger.to ?? ""}
              onChange={(e) => onChange({ ...trigger, to: e.target.value || undefined })}
            />
          </div>
        </div>
      )}
      {trigger.type === "form_submitted" && (
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">شناسه فرم (اختیاری)</label>
          <input
            className="w-full px-3 py-2 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="همه فرم‌ها"
            value={trigger.formId ?? ""}
            onChange={(e) => onChange({ ...trigger, formId: e.target.value || undefined })}
          />
        </div>
      )}
    </div>
  );
}

function ActionCard({
  action,
  index,
  onChange,
  onRemove,
}: {
  action: ActionConfig;
  index: number;
  onChange: (a: ActionConfig) => void;
  onRemove: () => void;
}) {
  const t = ACTION_TYPES.find((x) => x.value === action.type);

  return (
    <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
        <span className="text-xs font-medium text-muted-foreground">اکشن {index + 1}</span>
        <div className="flex-1" />
        <button
          onClick={onRemove}
          className="p-1 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Action type selector */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {ACTION_TYPES.map((at) => (
          <button
            key={at.value}
            onClick={() => onChange({ type: at.value })}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium transition-all",
              action.type === at.value
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-background text-muted-foreground hover:border-muted-foreground/50"
            )}
          >
            <at.icon className={cn("w-3.5 h-3.5", at.color)} />
            {at.label}
          </button>
        ))}
      </div>

      {/* Action-specific fields */}
      {action.type === "create_task" && (
        <div className="space-y-2">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">عنوان وظیفه</label>
            <input
              className="w-full px-3 py-2 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="عنوان وظیفه را وارد کنید"
              value={action.title ?? ""}
              onChange={(e) => onChange({ ...action, title: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">سررسید (روز از الان، اختیاری)</label>
            <input
              type="number"
              min={1}
              className="w-full px-3 py-2 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="مثلاً: 3"
              value={action.dueInDays ?? ""}
              onChange={(e) =>
                onChange({ ...action, dueInDays: e.target.value ? Number(e.target.value) : undefined })
              }
            />
          </div>
        </div>
      )}

      {action.type === "send_notification" && (
        <div className="space-y-2">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">متن اعلان</label>
            <textarea
              rows={2}
              className="w-full px-3 py-2 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              placeholder="متن پیام را وارد کنید"
              value={action.message ?? ""}
              onChange={(e) => onChange({ ...action, message: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">گیرنده</label>
            <select
              className="w-full px-3 py-2 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              value={action.targetType ?? "assignee"}
              onChange={(e) =>
                onChange({ ...action, targetType: e.target.value as ActionConfig["targetType"] })
              }
            >
              {NOTIFICATION_TARGET_TYPES.map((nt) => (
                <option key={nt.value} value={nt.value}>{nt.label}</option>
              ))}
            </select>
          </div>
          {action.targetType === "specific" && (
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">شناسه کاربر</label>
              <input
                className="w-full px-3 py-2 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="userId"
                value={action.userId ?? ""}
                onChange={(e) => onChange({ ...action, userId: e.target.value })}
              />
            </div>
          )}
        </div>
      )}

      {action.type === "add_tag" && (
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">نام تگ</label>
          <input
            className="w-full px-3 py-2 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="مثلاً: VIP"
            value={action.tag ?? ""}
            onChange={(e) => onChange({ ...action, tag: e.target.value })}
          />
        </div>
      )}

      {action.type === "update_lead_field" && (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">فیلد</label>
            <input
              className="w-full px-3 py-2 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="مثلاً: status"
              value={action.field ?? ""}
              onChange={(e) => onChange({ ...action, field: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">مقدار</label>
            <input
              className="w-full px-3 py-2 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="مقدار جدید"
              value={action.value ?? ""}
              onChange={(e) => onChange({ ...action, value: e.target.value })}
            />
          </div>
        </div>
      )}

      {action.type === "trigger_webhook" && (
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">شناسه Webhook</label>
          <input
            className="w-full px-3 py-2 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="webhookId"
            value={action.webhookId ?? ""}
            onChange={(e) => onChange({ ...action, webhookId: e.target.value })}
          />
        </div>
      )}
    </div>
  );
}

// ─── Builder Modal ───────────────────────────────────────────────────────────

interface BuilderModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (rule: Partial<AutomationRule>) => Promise<void>;
  initial?: AutomationRule | null;
}

function BuilderModal({ open, onClose, onSave, initial }: BuilderModalProps) {
  const [step, setStep] = useState(0); // 0=trigger, 1=actions, 2=name+activate
  const [trigger, setTrigger] = useState<TriggerConfig>({ type: "new_lead" });
  const [actions, setActions] = useState<ActionConfig[]>([newAction()]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  // Reset when opening
  useEffect(() => {
    if (open) {
      if (initial) {
        setTrigger(initial.trigger);
        setActions(initial.actions.length > 0 ? initial.actions : [newAction()]);
        setName(initial.name);
        setDescription(initial.description ?? "");
        setIsActive(initial.isActive);
      } else {
        setTrigger({ type: "new_lead" });
        setActions([newAction()]);
        setName("");
        setDescription("");
        setIsActive(true);
      }
      setStep(0);
    }
  }, [open, initial]);

  function handleActionChange(index: number, updated: ActionConfig) {
    setActions((prev) => prev.map((a, i) => (i === index ? updated : a)));
  }

  function handleActionRemove(index: number) {
    setActions((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    if (!name.trim()) { toast.error("نام قانون الزامی است"); return; }
    if (actions.length === 0) { toast.error("حداقل یک اکشن الزامی است"); return; }
    setSaving(true);
    try {
      await onSave({ name: name.trim(), description: description.trim() || undefined, trigger, actions, isActive });
      onClose();
    } finally {
      setSaving(false);
    }
  }

  const steps = ["تریگر", "اکشن‌ها", "نام‌گذاری"];

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="relative w-full max-w-xl bg-card border border-border rounded-2xl shadow-2xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-border shrink-0">
          <div className="w-8 h-8 rounded-xl gradient-brand flex items-center justify-center">
            <Zap className="w-4 h-4 text-black" />
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-foreground text-sm">
              {initial ? "ویرایش قانون اتوماسیون" : "قانون جدید اتوماسیون"}
            </h2>
            <p className="text-xs text-muted-foreground">اگر این — پس آن</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Step indicators */}
        <div className="flex items-center gap-2 px-6 py-3 border-b border-border shrink-0">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <button
                onClick={() => i < step || step === i ? undefined : undefined}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all",
                  step === i
                    ? "gradient-brand text-black"
                    : i < step
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground"
                )}
              >
                <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold bg-black/20">
                  {i + 1}
                </span>
                {s}
              </button>
              {i < steps.length - 1 && <ChevronLeft className="w-3 h-3 text-muted-foreground" />}
            </div>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div
                key="step0"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <p className="text-sm text-muted-foreground">چه رویدادی باید این قانون را فعال کند؟</p>
                <div className="grid grid-cols-1 gap-2">
                  {TRIGGER_TYPES.map((tt) => (
                    <button
                      key={tt.value}
                      onClick={() => setTrigger({ type: tt.value })}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-all text-right",
                        trigger.type === tt.value
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-background text-foreground hover:border-muted-foreground/50"
                      )}
                    >
                      <tt.icon className={cn("w-4 h-4 shrink-0", tt.color)} />
                      {tt.label}
                    </button>
                  ))}
                </div>
                <TriggerFields trigger={trigger} onChange={setTrigger} />
              </motion.div>
            )}

            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-3"
              >
                <p className="text-sm text-muted-foreground">چه اقداماتی انجام شود؟</p>
                {actions.map((action, i) => (
                  <ActionCard
                    key={i}
                    action={action}
                    index={i}
                    onChange={(a) => handleActionChange(i, a)}
                    onRemove={() => handleActionRemove(i)}
                  />
                ))}
                <button
                  onClick={() => setActions((prev) => [...prev, newAction()])}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-dashed border-border text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  افزودن اکشن
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block font-medium">نام قانون *</label>
                  <input
                    autoFocus
                    className="w-full px-4 py-2.5 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    placeholder="مثلاً: اعلان هنگام تغییر مرحله لید"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block font-medium">توضیحات (اختیاری)</label>
                  <textarea
                    rows={2}
                    className="w-full px-4 py-2.5 rounded-xl bg-muted border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                    placeholder="توضیح کوتاهی برای این قانون"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                {/* Summary preview */}
                <div className="rounded-xl bg-muted border border-border p-4 space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground">خلاصه قانون</p>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 text-xs border border-blue-500/20">
                      اگر
                    </span>
                    <span className="text-foreground text-xs">{triggerSummary(trigger)}</span>
                  </div>
                  {actions.map((a, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <span className="px-2 py-0.5 rounded-md bg-green-500/10 text-green-400 text-xs border border-green-500/20">
                        سپس
                      </span>
                      <span className="text-foreground text-xs">{actionSummary(a)}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl bg-muted border border-border">
                  <span className="text-sm text-foreground flex-1">فعال‌سازی فوری</span>
                  <button
                    onClick={() => setIsActive((v) => !v)}
                    className={cn(
                      "transition-colors",
                      isActive ? "text-primary" : "text-muted-foreground"
                    )}
                  >
                    {isActive ? <ToggleRight className="w-7 h-7" /> : <ToggleLeft className="w-7 h-7" />}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border shrink-0">
          <button
            onClick={() => step > 0 ? setStep(step - 1) : onClose()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
            {step === 0 ? "انصراف" : "قبلی"}
          </button>

          {step < 2 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={step === 1 && actions.length === 0}
              className="flex items-center gap-2 px-5 py-2 rounded-xl gradient-brand text-black text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              بعدی
              <ChevronLeft className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={saving || !name.trim()}
              className="flex items-center gap-2 px-5 py-2 rounded-xl gradient-brand text-black text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              {initial ? "ذخیره تغییرات" : "ایجاد قانون"}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ─── Rule Card ───────────────────────────────────────────────────────────────

function RuleCard({
  rule,
  onToggle,
  onEdit,
  onDelete,
}: {
  rule: AutomationRule;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const triggerMeta = TRIGGER_TYPES.find((t) => t.value === rule.trigger.type);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      className="flex items-start gap-4 p-4 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all group"
    >
      {/* Trigger icon */}
      <div className={cn(
        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5",
        rule.isActive ? "bg-primary/10" : "bg-muted"
      )}>
        {triggerMeta && (
          <triggerMeta.icon className={cn("w-5 h-5", rule.isActive ? triggerMeta.color : "text-muted-foreground")} />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2">
          <span className="font-semibold text-sm text-foreground">{rule.name}</span>
          {!rule.isActive && (
            <span className="px-1.5 py-0.5 rounded text-[10px] bg-muted text-muted-foreground border border-border">
              غیرفعال
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{triggerSummary(rule.trigger)}</p>
        <div className="flex items-center gap-3 mt-1.5">
          <span className="text-xs text-muted-foreground">
            {rule.actions.length} اکشن
          </span>
          <span className="text-xs text-muted-foreground">•</span>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Play className="w-2.5 h-2.5" />
            {rule.runCount} بار اجرا
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onToggle}
          className={cn(
            "transition-colors",
            rule.isActive ? "text-primary" : "text-muted-foreground"
          )}
          title={rule.isActive ? "غیرفعال‌سازی" : "فعال‌سازی"}
        >
          {rule.isActive ? <ToggleRight className="w-6 h-6" /> : <ToggleLeft className="w-6 h-6" />}
        </button>

        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute left-0 top-8 z-20 w-36 rounded-xl bg-card border border-border shadow-lg overflow-hidden"
              >
                <button
                  onClick={() => { onEdit(); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted text-foreground transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  ویرایش
                </button>
                <button
                  onClick={() => { onDelete(); setMenuOpen(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-destructive/10 text-destructive transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  حذف
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function AutomationSettingsPage() {
  const [runState, setRunState] = useState<RunState>("idle");
  const [lastResult, setLastResult] = useState<{ count: number; generated: string[] } | null>(null);

  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [loadingRules, setLoadingRules] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);

  const fetchRules = useCallback(async () => {
    setLoadingRules(true);
    try {
      const res = await fetch("/api/automation", { headers: authHeaders() });
      const json = await res.json();
      setRules(json.data ?? []);
    } catch {
      toast.error("خطا در بارگذاری قوانین اتوماسیون");
    } finally {
      setLoadingRules(false);
    }
  }, []);

  useEffect(() => { fetchRules(); }, [fetchRules]);

  async function handleSaveRule(data: Partial<AutomationRule>) {
    if (editingRule) {
      const res = await fetch(`/api/automation/${editingRule.id}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("خطا در ذخیره");
      toast.success("قانون به‌روزرسانی شد");
    } else {
      const res = await fetch("/api/automation", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("خطا در ایجاد قانون");
      toast.success("قانون جدید ایجاد شد");
    }
    setEditingRule(null);
    await fetchRules();
  }

  async function handleToggle(rule: AutomationRule) {
    try {
      await fetch(`/api/automation/${rule.id}`, {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify({ isActive: !rule.isActive }),
      });
      setRules((prev) =>
        prev.map((r) => (r.id === rule.id ? { ...r, isActive: !r.isActive } : r))
      );
    } catch {
      toast.error("خطا در تغییر وضعیت");
    }
  }

  async function handleDelete(rule: AutomationRule) {
    if (!confirm(`آیا از حذف قانون "${rule.name}" اطمینان دارید؟`)) return;
    try {
      await fetch(`/api/automation/${rule.id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      setRules((prev) => prev.filter((r) => r.id !== rule.id));
      toast.success("قانون حذف شد");
    } catch {
      toast.error("خطا در حذف قانون");
    }
  }

  async function handleGenerateRecurring() {
    setRunState("loading");
    setLastResult(null);
    try {
      const res = await fetch("/api/invoices/generate-recurring", {
        method: "POST",
        headers: authHeaders(),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "خطای سرور");
      const data = json?.data ?? json;
      setLastResult({ count: data.count ?? 0, generated: data.generated ?? [] });
      setRunState("success");
      if (data.count === 0) toast.info("هیچ فاکتور تکرارشونده‌ای برای تولید وجود ندارد");
      else toast.success(`${data.count} فاکتور تکرارشونده با موفقیت تولید شد`);
    } catch (err) {
      setRunState("error");
      toast.error(err instanceof Error ? err.message : "خطا در تولید فاکتورها");
    }
  }

  const activeCount = rules.filter((r) => r.isActive).length;

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Zap className="w-6 h-6 text-primary" />
          اتوماسیون
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          قوانین هوشمند «اگر این — پس آن» برای خودکارسازی فرایندها
        </p>
      </motion.div>

      {/* Automation Rules Section */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="rounded-2xl bg-card border border-border overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div>
            <h3 className="font-semibold text-foreground">قوانین اتوماسیون</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {activeCount} فعال از {rules.length} قانون
            </p>
          </div>
          <button
            onClick={() => { setEditingRule(null); setModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-brand text-black text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            افزودن قانون
          </button>
        </div>

        <div className="p-4 space-y-3 min-h-[80px]">
          {loadingRules ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : rules.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center mb-3">
                <Zap className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">هیچ قانونی ایجاد نشده</p>
              <p className="text-xs text-muted-foreground mt-1">اولین قانون اتوماسیون خود را بسازید</p>
            </div>
          ) : (
            <AnimatePresence>
              {rules.map((rule) => (
                <RuleCard
                  key={rule.id}
                  rule={rule}
                  onToggle={() => handleToggle(rule)}
                  onEdit={() => { setEditingRule(rule); setModalOpen(true); }}
                  onDelete={() => handleDelete(rule)}
                />
              ))}
            </AnimatePresence>
          )}
        </div>
      </motion.div>

      {/* Recurring Invoices Section */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="p-6 rounded-2xl bg-card border border-border space-y-4"
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <RefreshCw className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground">تولید فاکتورهای تکراری</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              فاکتورهایی که <span className="text-foreground font-medium">پرداخت شده</span>، تکراری هستند و تاریخ تولید بعدی‌شان رسیده را به صورت پیش‌نویس جدید ایجاد می‌کند.
            </p>
          </div>
        </div>

        <button
          onClick={handleGenerateRecurring}
          disabled={runState === "loading"}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all",
            runState === "loading"
              ? "bg-muted text-muted-foreground cursor-not-allowed"
              : "gradient-brand text-black gold-glow hover:opacity-90"
          )}
        >
          {runState === "loading" ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> در حال اجرا...</>
          ) : (
            <><RefreshCw className="w-4 h-4" /> اجرای دستی تولید فاکتورهای تکراری</>
          )}
        </button>

        {runState === "success" && lastResult && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="rounded-xl bg-green-500/10 border border-green-500/20 p-4 space-y-2"
          >
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">
                {lastResult.count === 0
                  ? "هیچ فاکتوری برای تولید یافت نشد"
                  : `${lastResult.count} فاکتور جدید تولید شد`}
              </span>
            </div>
            {lastResult.generated.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {lastResult.generated.map((num) => (
                  <span key={num} className="px-2 py-0.5 rounded-md bg-green-500/10 text-green-600 dark:text-green-400 text-xs font-mono border border-green-500/20">
                    {num}
                  </span>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {runState === "error" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="rounded-xl bg-destructive/10 border border-destructive/20 p-4"
          >
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm font-medium">خطا در اجرا — لطفاً دوباره تلاش کنید</span>
            </div>
          </motion.div>
        )}
      </motion.div>

      <p className="text-xs text-muted-foreground">
        قوانین اتوماسیون به صورت خودکار با رویدادهای سیستم اجرا می‌شوند.
      </p>

      {/* Builder Modal */}
      <AnimatePresence>
        {modalOpen && (
          <BuilderModal
            open={modalOpen}
            onClose={() => { setModalOpen(false); setEditingRule(null); }}
            onSave={handleSaveRule}
            initial={editingRule}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
