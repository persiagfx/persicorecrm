"use client";

import { useEffect, useState, useRef } from "react";
import { Plus, Trash2, Edit3, Check, X, Download, ChevronDown, MapPin, Smile, Meh, Frown, Phone, Mail, Globe, Share2, Video, Users, AlertCircle } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Touchpoint {
  id: string;
  type: "meeting" | "email" | "website" | "social" | "call" | "demo";
  channel: string;
  content: string;
  emotion: "happy" | "neutral" | "sad";
  painPoint: string;
}

interface Stage {
  id: string;
  name: string;
  touchpoints: Touchpoint[];
}

interface Journey {
  id: string;
  name: string;
  description: string | null;
  persona: string | null;
  stages: Stage[];
  createdAt: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const TOUCHPOINT_TYPES: { value: Touchpoint["type"]; label: string; icon: React.ReactNode; color: string }[] = [
  { value: "meeting", label: "جلسه", icon: <Users size={14} />, color: "#6366f1" },
  { value: "email", label: "ایمیل", icon: <Mail size={14} />, color: "#0ea5e9" },
  { value: "website", label: "وب‌سایت", icon: <Globe size={14} />, color: "#10b981" },
  { value: "social", label: "شبکه اجتماعی", icon: <Share2 size={14} />, color: "#f59e0b" },
  { value: "call", label: "تماس", icon: <Phone size={14} />, color: "#8b5cf6" },
  { value: "demo", label: "دمو", icon: <Video size={14} />, color: "#ec4899" },
];

const EMOTION_CONFIG: Record<Touchpoint["emotion"], { icon: React.ReactNode; label: string; color: string; bg: string }> = {
  happy: { icon: <Smile size={16} />, label: "مثبت", color: "#10b981", bg: "#d1fae5" },
  neutral: { icon: <Meh size={16} />, label: "خنثی", color: "#f59e0b", bg: "#fef3c7" },
  sad: { icon: <Frown size={16} />, label: "منفی", color: "#ef4444", bg: "#fee2e2" },
};

const STAGE_HEADER_COLORS = [
  "#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#ec4899",
  "#8b5cf6", "#06b6d4", "#84cc16", "#f97316", "#14b8a6",
];

const newTouchpoint = (): Touchpoint => ({
  id: crypto.randomUUID(),
  type: "meeting",
  channel: "",
  content: "",
  emotion: "neutral",
  painPoint: "",
});

const newStage = (): Stage => ({
  id: crypto.randomUUID(),
  name: "مرحله جدید",
  touchpoints: [],
});

// ─── Inline editable text ────────────────────────────────────────────────────

function InlineEdit({
  value,
  onChange,
  className,
  placeholder = "کلیک کنید تا ویرایش کنید",
  multiline = false,
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
  placeholder?: string;
  multiline?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLInputElement & HTMLTextAreaElement>(null);

  useEffect(() => { setDraft(value); }, [value]);
  useEffect(() => { if (editing) ref.current?.focus(); }, [editing]);

  const commit = () => { onChange(draft); setEditing(false); };
  const cancel = () => { setDraft(value); setEditing(false); };

  if (editing) {
    return multiline ? (
      <textarea
        ref={ref as React.RefObject<HTMLTextAreaElement>}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === "Escape") cancel(); }}
        className={cn("bg-transparent border-b border-indigo-400 outline-none resize-none w-full text-sm", className)}
        rows={2}
      />
    ) : (
      <input
        ref={ref as React.RefObject<HTMLInputElement>}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") cancel(); }}
        className={cn("bg-transparent border-b border-indigo-400 outline-none w-full", className)}
      />
    );
  }

  return (
    <span
      onClick={() => setEditing(true)}
      className={cn("cursor-pointer hover:opacity-70 transition-opacity", !value && "text-gray-500 italic", className)}
    >
      {value || placeholder}
    </span>
  );
}

// ─── Touchpoint Card ──────────────────────────────────────────────────────────

function TouchpointCard({
  tp,
  onUpdate,
  onDelete,
}: {
  tp: Touchpoint;
  onUpdate: (updated: Touchpoint) => void;
  onDelete: () => void;
}) {
  const typeInfo = TOUCHPOINT_TYPES.find((t) => t.value === tp.type)!;
  const emotionInfo = EMOTION_CONFIG[tp.emotion];

  return (
    <div className="bg-[#1e2130] rounded-xl p-3 border border-white/10 hover:border-white/20 transition-all group relative">
      {/* Delete */}
      <button
        onClick={onDelete}
        className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300"
      >
        <X size={12} />
      </button>

      {/* Type selector */}
      <div className="flex items-center gap-2 mb-2">
        <select
          value={tp.type}
          onChange={(e) => onUpdate({ ...tp, type: e.target.value as Touchpoint["type"] })}
          className="text-xs bg-[#252836] border border-white/10 rounded-lg px-2 py-1 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 flex-1"
          style={{ color: typeInfo.color }}
        >
          {TOUCHPOINT_TYPES.map((t) => (
            <option key={t.value} value={t.value} style={{ color: t.color, backgroundColor: "#252836" }}>
              {t.label}
            </option>
          ))}
        </select>
        {/* Emotion selector */}
        <div className="flex gap-1">
          {(["happy", "neutral", "sad"] as const).map((e) => (
            <button
              key={e}
              onClick={() => onUpdate({ ...tp, emotion: e })}
              title={EMOTION_CONFIG[e].label}
              className={cn(
                "p-1 rounded-lg transition-all",
                tp.emotion === e ? "opacity-100 scale-110" : "opacity-30 hover:opacity-60"
              )}
              style={{ color: EMOTION_CONFIG[e].color }}
            >
              {EMOTION_CONFIG[e].icon}
            </button>
          ))}
        </div>
      </div>

      {/* Channel */}
      <div className="text-xs text-gray-400 mb-1">کانال:</div>
      <InlineEdit
        value={tp.channel}
        onChange={(v) => onUpdate({ ...tp, channel: v })}
        placeholder="نام کانال..."
        className="text-xs text-white block w-full mb-2"
      />

      {/* Content */}
      <div className="text-xs text-gray-400 mb-1">محتوا:</div>
      <InlineEdit
        value={tp.content}
        onChange={(v) => onUpdate({ ...tp, content: v })}
        placeholder="توضیح نقطه تماس..."
        className="text-xs text-gray-200 block w-full mb-2"
        multiline
      />

      {/* Pain point */}
      {(tp.painPoint || tp.emotion === "sad") && (
        <div className="mt-2 flex items-start gap-1 bg-red-950/30 rounded-lg p-2">
          <AlertCircle size={12} className="text-red-400 mt-0.5 shrink-0" />
          <InlineEdit
            value={tp.painPoint}
            onChange={(v) => onUpdate({ ...tp, painPoint: v })}
            placeholder="نقطه درد..."
            className="text-xs text-red-300 block w-full"
            multiline
          />
        </div>
      )}
      {!tp.painPoint && tp.emotion !== "sad" && (
        <button
          onClick={() => onUpdate({ ...tp, painPoint: " " })}
          className="text-xs text-gray-600 hover:text-red-400 transition-colors"
        >
          + نقطه درد
        </button>
      )}
    </div>
  );
}

// ─── Stage Column ─────────────────────────────────────────────────────────────

function StageColumn({
  stage,
  index,
  onUpdate,
  onDelete,
}: {
  stage: Stage;
  index: number;
  onUpdate: (updated: Stage) => void;
  onDelete: () => void;
}) {
  const color = STAGE_HEADER_COLORS[index % STAGE_HEADER_COLORS.length];

  const addTouchpoint = () => {
    onUpdate({ ...stage, touchpoints: [...stage.touchpoints, newTouchpoint()] });
  };

  const updateTouchpoint = (tpId: string, updated: Touchpoint) => {
    onUpdate({ ...stage, touchpoints: stage.touchpoints.map((t) => (t.id === tpId ? updated : t)) });
  };

  const deleteTouchpoint = (tpId: string) => {
    onUpdate({ ...stage, touchpoints: stage.touchpoints.filter((t) => t.id !== tpId) });
  };

  return (
    <div className="flex-shrink-0 w-72 flex flex-col rounded-2xl overflow-hidden border border-white/10 bg-[#181b27]">
      {/* Stage Header */}
      <div className="px-4 py-3 flex items-center justify-between" style={{ backgroundColor: color }}>
        <InlineEdit
          value={stage.name}
          onChange={(v) => onUpdate({ ...stage, name: v })}
          className="font-bold text-white text-base"
        />
        <button onClick={onDelete} className="text-white/60 hover:text-white transition-colors ml-2">
          <Trash2 size={14} />
        </button>
      </div>

      {/* Touchpoints */}
      <div className="flex-1 p-3 flex flex-col gap-2 overflow-y-auto max-h-[480px]">
        {stage.touchpoints.map((tp) => (
          <TouchpointCard
            key={tp.id}
            tp={tp}
            onUpdate={(updated) => updateTouchpoint(tp.id, updated)}
            onDelete={() => deleteTouchpoint(tp.id)}
          />
        ))}
      </div>

      {/* Add Touchpoint */}
      <div className="p-3 border-t border-white/5">
        <button
          onClick={addTouchpoint}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all border border-dashed border-white/10 hover:border-white/20"
        >
          <Plus size={14} />
          افزودن نقطه تماس
        </button>
      </div>
    </div>
  );
}

// ─── Emotion Timeline ─────────────────────────────────────────────────────────

function EmotionTimeline({ stages }: { stages: Stage[] }) {
  // collect one emotion per stage (first touchpoint's emotion, or neutral)
  const emotions = stages.map((s) => s.touchpoints[0]?.emotion ?? "neutral");

  if (stages.length === 0) return null;

  const yMap: Record<string, number> = { happy: 10, neutral: 30, sad: 50 };
  const width = stages.length * 288 + (stages.length - 1) * 12; // 288px per stage + 12px gap
  const pointX = (i: number) => i * 300 + 144; // center of each stage column (288 + 12 gap / 2)

  return (
    <div className="px-6 pb-4">
      <div className="bg-[#181b27] rounded-2xl border border-white/10 p-4">
        <div className="text-xs text-gray-400 mb-3 font-medium">نمودار احساسات</div>
        <div className="overflow-x-auto">
          <svg width={Math.max(width, 400)} height={70} className="min-w-full">
            {/* Grid lines */}
            <line x1={0} y1={10} x2={Math.max(width, 400)} y2={10} stroke="#10b981" strokeWidth={0.5} strokeDasharray="4" opacity={0.3} />
            <line x1={0} y1={30} x2={Math.max(width, 400)} y2={30} stroke="#f59e0b" strokeWidth={0.5} strokeDasharray="4" opacity={0.3} />
            <line x1={0} y1={50} x2={Math.max(width, 400)} y2={50} stroke="#ef4444" strokeWidth={0.5} strokeDasharray="4" opacity={0.3} />

            {/* Labels */}
            <text x={4} y={14} fill="#10b981" fontSize={9} opacity={0.7}>مثبت</text>
            <text x={4} y={34} fill="#f59e0b" fontSize={9} opacity={0.7}>خنثی</text>
            <text x={4} y={54} fill="#ef4444" fontSize={9} opacity={0.7}>منفی</text>

            {/* Path */}
            {emotions.length > 1 && (
              <polyline
                points={emotions.map((e, i) => `${pointX(i)},${yMap[e]}`).join(" ")}
                fill="none"
                stroke="url(#emotionGrad)"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Gradient def */}
            <defs>
              <linearGradient id="emotionGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#ec4899" />
              </linearGradient>
            </defs>

            {/* Points */}
            {emotions.map((e, i) => (
              <g key={i}>
                <circle
                  cx={pointX(i)}
                  cy={yMap[e]}
                  r={6}
                  fill={EMOTION_CONFIG[e].color}
                  stroke="#181b27"
                  strokeWidth={2}
                />
                <text
                  x={pointX(i)}
                  y={yMap[e] - 10}
                  textAnchor="middle"
                  fill="#9ca3af"
                  fontSize={9}
                >
                  {stages[i].name.slice(0, 8)}
                </text>
              </g>
            ))}
          </svg>
        </div>
      </div>
    </div>
  );
}

// ─── Create Journey Modal ─────────────────────────────────────────────────────

function CreateJourneyModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (j: Journey) => void;
}) {
  const [form, setForm] = useState({ name: "", description: "", persona: "" });
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!form.name.trim()) { toast.error("نام الزامی است"); return; }
    setSaving(true);
    try {
      const r = await apiClient.post("/journeys", { ...form, stages: [] });
      onCreate(r.data.data);
      toast.success("سفر مشتری ایجاد شد");
      onClose();
    } catch {
      toast.error("خطا در ایجاد");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#1e2130] rounded-2xl p-6 w-full max-w-md border border-white/10 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-white mb-4">سفر مشتری جدید</h2>
        <div className="space-y-3">
          <input
            placeholder="نام سفر مشتری *"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full bg-[#252836] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          />
          <input
            placeholder="شخصیت (پرسونا)"
            value={form.persona}
            onChange={(e) => setForm({ ...form, persona: e.target.value })}
            className="w-full bg-[#252836] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          />
          <textarea
            placeholder="توضیحات"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={2}
            className="w-full bg-[#252836] border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
          />
        </div>
        <div className="flex gap-3 mt-5">
          <button
            onClick={submit}
            disabled={saving}
            className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl py-2.5 text-sm font-medium transition-colors"
          >
            {saving ? "در حال ذخیره..." : "ایجاد"}
          </button>
          <button onClick={onClose} className="px-4 text-gray-400 hover:text-white transition-colors text-sm">
            انصراف
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Print/Export View ────────────────────────────────────────────────────────

function PrintView({ journey, onClose }: { journey: Journey; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-white overflow-auto print:p-0">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="flex items-start justify-between mb-8 print:hidden">
          <div />
          <div className="flex gap-3">
            <button
              onClick={() => window.print()}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-500"
            >
              چاپ / PDF
            </button>
            <button onClick={onClose} className="border border-gray-300 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50">
              بستن
            </button>
          </div>
        </div>

        {/* Title */}
        <div className="mb-8 border-b pb-6" dir="rtl">
          <h1 className="text-3xl font-bold text-gray-900">{journey.name}</h1>
          {journey.persona && <p className="text-gray-500 mt-1">پرسونا: {journey.persona}</p>}
          {journey.description && <p className="text-gray-600 mt-2">{journey.description}</p>}
        </div>

        {/* Stages */}
        <div className="overflow-x-auto" dir="rtl">
          <div className="flex gap-4 min-w-max">
            {journey.stages.map((stage, si) => {
              const color = STAGE_HEADER_COLORS[si % STAGE_HEADER_COLORS.length];
              return (
                <div key={stage.id} className="w-64 border border-gray-200 rounded-xl overflow-hidden">
                  <div className="px-4 py-3 text-white font-bold text-sm" style={{ backgroundColor: color }}>
                    {stage.name}
                  </div>
                  <div className="p-3 space-y-2 bg-gray-50">
                    {stage.touchpoints.map((tp) => {
                      const typeInfo = TOUCHPOINT_TYPES.find((t) => t.value === tp.type)!;
                      const emInfo = EMOTION_CONFIG[tp.emotion];
                      return (
                        <div key={tp.id} className="bg-white rounded-lg p-3 border border-gray-100 text-xs">
                          <div className="flex items-center gap-1 mb-1" style={{ color: typeInfo.color }}>
                            {typeInfo.icon} <span className="font-medium">{typeInfo.label}</span>
                            <span className="mr-auto" style={{ color: emInfo.color }}>{emInfo.icon}</span>
                          </div>
                          {tp.channel && <div className="text-gray-500 mb-1">کانال: {tp.channel}</div>}
                          {tp.content && <div className="text-gray-700">{tp.content}</div>}
                          {tp.painPoint && (
                            <div className="mt-1 text-red-500 flex items-start gap-1">
                              <AlertCircle size={10} className="mt-0.5 shrink-0" />
                              {tp.painPoint}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {stage.touchpoints.length === 0 && (
                      <div className="text-gray-400 text-xs text-center py-2">بدون نقطه تماس</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function JourneyPage() {
  const [journeys, setJourneys] = useState<Journey[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showPrint, setShowPrint] = useState(false);
  const [showSelector, setShowSelector] = useState(false);
  const [editHeader, setEditHeader] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const active = journeys.find((j) => j.id === activeId) ?? null;

  // ─── Load journeys ───────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const r = await apiClient.get("/journeys");
        const list: Journey[] = (r.data.data ?? []).map((j: Journey & { stages: unknown }) => ({
          ...j,
          stages: Array.isArray(j.stages) ? j.stages : [],
        }));
        setJourneys(list);
        if (list.length > 0) setActiveId(list[0].id);
      } catch {
        toast.error("خطا در بارگذاری");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ─── Auto-save on stages change ──────────────────────────────────────────
  const updateActiveJourney = (updated: Journey) => {
    setJourneys((prev) => prev.map((j) => (j.id === updated.id ? updated : j)));
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      setSaving(true);
      try {
        await apiClient.put(`/journeys/${updated.id}`, {
          name: updated.name,
          description: updated.description,
          persona: updated.persona,
          stages: updated.stages,
        });
      } catch {
        toast.error("خطا در ذخیره");
      } finally {
        setSaving(false);
      }
    }, 800);
  };

  const addStage = () => {
    if (!active) return;
    updateActiveJourney({ ...active, stages: [...active.stages, newStage()] });
  };

  const updateStage = (stageId: string, updated: Stage) => {
    if (!active) return;
    updateActiveJourney({ ...active, stages: active.stages.map((s) => (s.id === stageId ? updated : s)) });
  };

  const deleteStage = (stageId: string) => {
    if (!active) return;
    updateActiveJourney({ ...active, stages: active.stages.filter((s) => s.id !== stageId) });
  };

  const deleteJourney = async () => {
    if (!active) return;
    if (!confirm("آیا از حذف این سفر مشتری مطمئن هستید؟")) return;
    try {
      await apiClient.delete(`/journeys/${active.id}`);
      const remaining = journeys.filter((j) => j.id !== active.id);
      setJourneys(remaining);
      setActiveId(remaining[0]?.id ?? null);
      toast.success("سفر مشتری حذف شد");
    } catch {
      toast.error("خطا در حذف");
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen bg-[#12141f]">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-400 text-sm">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#12141f] text-white" dir="rtl">
      {/* ─── Top Bar ──────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-40 bg-[#12141f]/95 backdrop-blur-sm border-b border-white/5 px-6 py-4">
        <div className="flex items-center gap-4 flex-wrap">
          {/* Journey Selector */}
          <div className="relative">
            <button
              onClick={() => setShowSelector((v) => !v)}
              className="flex items-center gap-2 bg-[#1e2130] border border-white/10 rounded-xl px-4 py-2.5 text-sm hover:bg-[#252836] transition-colors min-w-[200px]"
            >
              <MapPin size={16} className="text-indigo-400" />
              <span className="flex-1 text-right text-white font-medium truncate max-w-[180px]">
                {active?.name ?? "انتخاب سفر مشتری"}
              </span>
              <ChevronDown size={14} className="text-gray-400" />
            </button>

            {showSelector && (
              <div className="absolute top-full mt-2 right-0 bg-[#1e2130] border border-white/10 rounded-xl shadow-xl z-50 min-w-[260px] overflow-hidden">
                {journeys.map((j) => (
                  <button
                    key={j.id}
                    onClick={() => { setActiveId(j.id); setShowSelector(false); }}
                    className={cn(
                      "w-full text-right px-4 py-3 text-sm hover:bg-white/5 transition-colors block",
                      j.id === activeId ? "text-indigo-400 bg-indigo-500/10" : "text-gray-300"
                    )}
                  >
                    <div className="font-medium">{j.name}</div>
                    {j.persona && <div className="text-xs text-gray-500 mt-0.5">پرسونا: {j.persona}</div>}
                  </button>
                ))}
                {journeys.length === 0 && (
                  <div className="px-4 py-3 text-sm text-gray-500">هنوز سفری ایجاد نشده</div>
                )}
                <div className="border-t border-white/5 p-2">
                  <button
                    onClick={() => { setShowSelector(false); setShowCreate(true); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors"
                  >
                    <Plus size={14} /> سفر جدید
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Journey Meta (inline editable) */}
          {active && (
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {editHeader ? (
                <>
                  <input
                    value={active.name}
                    onChange={(e) => updateActiveJourney({ ...active, name: e.target.value })}
                    className="bg-[#252836] border border-indigo-500 rounded-lg px-3 py-1.5 text-sm text-white outline-none w-40"
                    placeholder="نام سفر"
                  />
                  <input
                    value={active.persona ?? ""}
                    onChange={(e) => updateActiveJourney({ ...active, persona: e.target.value })}
                    className="bg-[#252836] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white outline-none w-32"
                    placeholder="پرسونا"
                  />
                  <input
                    value={active.description ?? ""}
                    onChange={(e) => updateActiveJourney({ ...active, description: e.target.value })}
                    className="bg-[#252836] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white outline-none flex-1 min-w-0"
                    placeholder="توضیحات"
                  />
                  <button onClick={() => setEditHeader(false)} className="text-green-400 hover:text-green-300">
                    <Check size={16} />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setEditHeader(true)}
                  className="flex items-center gap-3 text-sm text-gray-300 hover:text-white transition-colors group"
                >
                  <span className="font-semibold text-white">{active.name}</span>
                  {active.persona && (
                    <span className="text-gray-500 border-r border-white/10 pr-3">پرسونا: {active.persona}</span>
                  )}
                  {active.description && (
                    <span className="text-gray-500 truncate max-w-[240px]">{active.description}</span>
                  )}
                  <Edit3 size={14} className="text-gray-600 group-hover:text-gray-400 transition-colors" />
                </button>
              )}
            </div>
          )}

          {/* Right actions */}
          <div className="flex items-center gap-2 mr-auto">
            {saving && <span className="text-xs text-gray-500">در حال ذخیره...</span>}
            {active && (
              <>
                <button
                  onClick={() => setShowPrint(true)}
                  className="flex items-center gap-2 bg-[#1e2130] border border-white/10 rounded-xl px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-[#252836] transition-all"
                >
                  <Download size={14} /> خروجی
                </button>
                <button
                  onClick={deleteJourney}
                  className="flex items-center gap-2 bg-red-950/30 border border-red-900/30 rounded-xl px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-950/50 transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </>
            )}
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl px-4 py-2 text-sm font-medium transition-colors"
            >
              <Plus size={14} /> سفر جدید
            </button>
          </div>
        </div>
      </div>

      {/* ─── Main Content ─────────────────────────────────────────────────── */}
      {!active ? (
        <div className="flex-1 flex items-center justify-center flex-col gap-4">
          <MapPin size={48} className="text-gray-700" />
          <p className="text-gray-500 text-lg">هنوز سفر مشتری‌ای ایجاد نشده</p>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl px-5 py-2.5 text-sm font-medium transition-colors"
          >
            <Plus size={16} /> ایجاد اولین سفر مشتری
          </button>
        </div>
      ) : (
        <>
          {/* Stage columns */}
          <div className="flex-1 overflow-x-auto px-6 pt-6 pb-4">
            <div className="flex gap-3 items-start min-w-max">
              {active.stages.map((stage, idx) => (
                <StageColumn
                  key={stage.id}
                  stage={stage}
                  index={idx}
                  onUpdate={(updated) => updateStage(stage.id, updated)}
                  onDelete={() => deleteStage(stage.id)}
                />
              ))}

              {/* Add Stage Button */}
              <button
                onClick={addStage}
                className="flex-shrink-0 w-64 flex flex-col items-center justify-center gap-2 h-40 rounded-2xl border-2 border-dashed border-white/10 hover:border-indigo-500/40 text-gray-500 hover:text-indigo-400 transition-all"
              >
                <Plus size={24} />
                <span className="text-sm">افزودن مرحله</span>
              </button>
            </div>
          </div>

          {/* Emotion timeline */}
          {active.stages.length > 0 && <EmotionTimeline stages={active.stages} />}
        </>
      )}

      {/* ─── Modals ───────────────────────────────────────────────────────── */}
      {showCreate && (
        <CreateJourneyModal
          onClose={() => setShowCreate(false)}
          onCreate={(j) => {
            setJourneys((prev) => [j, ...prev]);
            setActiveId(j.id);
          }}
        />
      )}

      {showPrint && active && (
        <PrintView journey={active} onClose={() => setShowPrint(false)} />
      )}
    </div>
  );
}
