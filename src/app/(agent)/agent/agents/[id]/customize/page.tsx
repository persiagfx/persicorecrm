"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowRight, Palette, Save, Eye, EyeOff, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

function agentFetch(path: string, options?: RequestInit) {
  const token = typeof window !== "undefined" ? localStorage.getItem("agent-token") || localStorage.getItem("crm-token") : null;
  return fetch(`/api/agent${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.headers ?? {}),
    },
  }).then(async (r) => { const d = await r.json(); if (!r.ok) throw new Error(d.message ?? "خطا"); return d; });
}

const PRESET_COLORS = ["#8B5CF6", "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#EC4899", "#14B8A6", "#6366F1", "#F97316", "#64748B"];
const EMOJI_AVATARS = ["🤖", "🧠", "💬", "✨", "🌟", "🎯", "🔮", "👾", "🦄", "🌊", "🔥", "💡", "🎪", "🚀", "🏆"];
const TONES = [
  { key: "formal", label: "رسمی", desc: "حرفه‌ای و محترمانه" },
  { key: "friendly", label: "دوستانه", desc: "صمیمی و صادق" },
  { key: "casual", label: "غیررسمی", desc: "ساده و راحت" },
  { key: "technical", label: "تخصصی", desc: "دقیق و فنی" },
];

interface CustomizationData {
  primaryColor: string;
  avatarType: string;
  avatarEmoji: string;
  avatarUrl: string;
  position: string;
  widgetTitle: string;
  inputPlaceholder: string;
  showBranding: boolean;
  darkMode: boolean;
  borderRadius: number;
  welcomeMessage: string;
  tone: string;
}

const DEFAULT_CUSTOM: CustomizationData = {
  primaryColor: "#8B5CF6",
  avatarType: "emoji",
  avatarEmoji: "🤖",
  avatarUrl: "",
  position: "bottom-right",
  widgetTitle: "دستیار من",
  inputPlaceholder: "پیام خود را بنویسید...",
  showBranding: true,
  darkMode: false,
  borderRadius: 16,
  welcomeMessage: "سلام! چطور می‌تونم کمکتون کنم؟",
  tone: "friendly",
};

export default function AgentCustomizePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [form, setForm] = useState<CustomizationData>(DEFAULT_CUSTOM);
  const [agentName, setAgentName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewMessages, setPreviewMessages] = useState<{ role: string; text: string }[]>([
    { role: "bot", text: form.welcomeMessage },
  ]);

  const set = (key: keyof CustomizationData, value: CustomizationData[keyof CustomizationData]) =>
    setForm((f) => ({ ...f, [key]: value }));

  useEffect(() => {
    (async () => {
      try {
        const res = await agentFetch(`/agents/${id}`);
        const agent = res.data;
        setAgentName(agent.name ?? "");
        if (agent.customization) {
          setForm({
            primaryColor: agent.customization.primaryColor ?? DEFAULT_CUSTOM.primaryColor,
            avatarType: agent.customization.avatarType ?? DEFAULT_CUSTOM.avatarType,
            avatarEmoji: agent.customization.avatarEmoji ?? DEFAULT_CUSTOM.avatarEmoji,
            avatarUrl: agent.customization.avatarUrl ?? "",
            position: agent.customization.position ?? DEFAULT_CUSTOM.position,
            widgetTitle: agent.customization.widgetTitle ?? DEFAULT_CUSTOM.widgetTitle,
            inputPlaceholder: agent.customization.inputPlaceholder ?? DEFAULT_CUSTOM.inputPlaceholder,
            showBranding: agent.customization.showBranding ?? true,
            darkMode: agent.customization.darkMode ?? false,
            borderRadius: agent.customization.borderRadius ?? 16,
            welcomeMessage: agent.welcomeMessage ?? DEFAULT_CUSTOM.welcomeMessage,
            tone: agent.tone ?? DEFAULT_CUSTOM.tone,
          });
          setPreviewMessages([{ role: "bot", text: agent.welcomeMessage ?? DEFAULT_CUSTOM.welcomeMessage }]);
        } else {
          if (agent.welcomeMessage) {
            setForm((f) => ({ ...f, welcomeMessage: agent.welcomeMessage, tone: agent.tone ?? "friendly" }));
            setPreviewMessages([{ role: "bot", text: agent.welcomeMessage }]);
          }
        }
      } catch { toast.error("خطا در بارگذاری"); }
      finally { setLoading(false); }
    })();
  }, [id]);

  const save = async () => {
    setSaving(true);
    try {
      const { welcomeMessage, tone, ...customization } = form;
      await Promise.all([
        agentFetch(`/agents/${id}/customization`, { method: "PATCH", body: JSON.stringify(customization) }),
        agentFetch(`/agents/${id}`, { method: "PATCH", body: JSON.stringify({ welcomeMessage, tone }) }),
      ]);
      toast.success("تنظیمات ذخیره شد");
    } catch { toast.error("خطا در ذخیره"); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="p-8 text-white/40 text-center">در حال بارگذاری...</div>;

  const isDark = form.darkMode;
  const chatBg = isDark ? "#1a1a2e" : "#ffffff";
  const msgBg = isDark ? "#16213e" : "#f3f4f6";
  const textColor = isDark ? "#e2e8f0" : "#1f2937";
  const br = `${form.borderRadius}px`;

  return (
    <div dir="rtl" className="p-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href={`/agent/agents/${id}`} className="p-1.5 rounded-lg hover:bg-white/8 text-white/50 hover:text-white transition-all">
          <ArrowRight className="w-4 h-4" />
        </Link>
        <Palette className="w-5 h-5 text-violet-400" />
        <h1 className="text-lg font-semibold">شخصی‌سازی — {agentName}</h1>
        <button
          onClick={() => setPreviewOpen((p) => !p)}
          className="mr-auto flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/15 text-sm text-white/60 hover:text-white hover:border-white/30 transition-all"
        >
          {previewOpen ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          {previewOpen ? "مخفی پیش‌نمایش" : "نمایش پیش‌نمایش"}
        </button>
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2 bg-violet-500 hover:bg-violet-600 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors"
        >
          <Save className="w-3.5 h-3.5" />
          {saving ? "ذخیره..." : "ذخیره تغییرات"}
        </button>
      </div>

      <div className="grid grid-cols-[1fr_360px] gap-6">
        {/* Settings panel */}
        <div className="space-y-5">
          {/* Colors */}
          <section className="bg-white/3 border border-white/8 rounded-xl p-5">
            <h3 className="font-medium mb-4 text-sm">رنگ اصلی</h3>
            <div className="flex gap-2 flex-wrap mb-3">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => set("primaryColor", c)}
                  style={{ background: c }}
                  className={`w-8 h-8 rounded-full transition-transform hover:scale-110 ${form.primaryColor === c ? "ring-2 ring-white ring-offset-1 ring-offset-[#12121a] scale-110" : ""}`}
                />
              ))}
              <label className="w-8 h-8 rounded-full border-2 border-dashed border-white/20 hover:border-white/40 cursor-pointer flex items-center justify-center transition-colors">
                <input type="color" value={form.primaryColor} onChange={(e) => set("primaryColor", e.target.value)} className="sr-only" />
                <span className="text-xs text-white/50">+</span>
              </label>
            </div>
          </section>

          {/* Avatar */}
          <section className="bg-white/3 border border-white/8 rounded-xl p-5">
            <h3 className="font-medium mb-4 text-sm">آواتار</h3>
            <div className="flex gap-1 bg-white/5 rounded-xl p-1 mb-4">
              {(["emoji", "upload", "url"] as const).map((t) => (
                <button key={t} onClick={() => set("avatarType", t)} className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${form.avatarType === t ? "bg-violet-500 text-white" : "text-white/50 hover:text-white"}`}>
                  {t === "emoji" ? "ایموجی" : t === "upload" ? "آپلود لوگو" : "لینک تصویر"}
                </button>
              ))}
            </div>
            {form.avatarType === "emoji" && (
              <div className="grid grid-cols-8 gap-2">
                {EMOJI_AVATARS.map((e) => (
                  <button key={e} onClick={() => set("avatarEmoji", e)} className={`text-2xl p-1.5 rounded-xl hover:bg-white/8 transition-all ${form.avatarEmoji === e ? "bg-white/12 ring-1 ring-violet-400/50" : ""}`}>{e}</button>
                ))}
              </div>
            )}
            {form.avatarType === "upload" && (
              <div className="space-y-3">
                {form.avatarUrl && <img src={form.avatarUrl} alt="logo" className="w-16 h-16 rounded-full object-cover border border-white/15" />}
                <label className="flex items-center justify-center gap-2 w-full border-2 border-dashed border-white/15 hover:border-violet-500/40 rounded-xl py-4 cursor-pointer transition-colors">
                  <input type="file" accept="image/*" className="sr-only" onChange={async (e) => {
                    const file = e.target.files?.[0]; if (!file) return;
                    const fd = new FormData(); fd.append("file", file);
                    const token = localStorage.getItem("agent-token") || localStorage.getItem("crm-token");
                    try {
                      const r = await fetch("/api/agent/upload", { method: "POST", headers: token ? { Authorization: `Bearer ${token}` } : {}, body: fd });
                      const d = await r.json();
                      if (d.data?.url) set("avatarUrl", d.data.url);
                      else toast.error("خطا در آپلود");
                    } catch { toast.error("خطا در آپلود"); }
                  }} />
                  <span className="text-sm text-white/40">📁 انتخاب لوگو (PNG, JPG — حداکثر ۲MB)</span>
                </label>
              </div>
            )}
            {form.avatarType === "url" && (
              <input placeholder="https://example.com/logo.png" value={form.avatarUrl} onChange={(e) => set("avatarUrl", e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500/50" />
            )}
          </section>

          {/* Widget text */}
          <section className="bg-white/3 border border-white/8 rounded-xl p-5">
            <h3 className="font-medium mb-4 text-sm">متن ویجت</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-white/50 mb-1">عنوان ویجت</label>
                <input
                  value={form.widgetTitle}
                  onChange={(e) => set("widgetTitle", e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/50"
                />
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1">متن جای‌نگهدار ورودی</label>
                <input
                  value={form.inputPlaceholder}
                  onChange={(e) => set("inputPlaceholder", e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-violet-500/50"
                />
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1">پیام خوش‌آمدگویی</label>
                <textarea
                  value={form.welcomeMessage}
                  onChange={(e) => {
                    set("welcomeMessage", e.target.value);
                    setPreviewMessages([{ role: "bot", text: e.target.value }]);
                  }}
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white resize-none focus:outline-none focus:border-violet-500/50"
                />
              </div>
            </div>
          </section>

          {/* Tone */}
          <section className="bg-white/3 border border-white/8 rounded-xl p-5">
            <h3 className="font-medium mb-4 text-sm">لحن مکالمه</h3>
            <div className="grid grid-cols-2 gap-2">
              {TONES.map((t) => (
                <button
                  key={t.key}
                  onClick={() => set("tone", t.key)}
                  className={`p-3 rounded-xl text-right border transition-all ${form.tone === t.key ? "bg-violet-500/15 border-violet-500/40" : "border-white/8 hover:border-white/20 bg-white/2"}`}
                >
                  <div className="font-medium text-sm">{t.label}</div>
                  <div className="text-xs text-white/40 mt-0.5">{t.desc}</div>
                </button>
              ))}
            </div>
          </section>

          {/* Appearance */}
          <section className="bg-white/3 border border-white/8 rounded-xl p-5">
            <h3 className="font-medium mb-4 text-sm">ظاهر و موقعیت</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-white/50 mb-2">موقعیت ویجت</label>
                <div className="flex gap-2">
                  {[{ v: "bottom-right", label: "پایین راست" }, { v: "bottom-left", label: "پایین چپ" }].map((opt) => (
                    <button
                      key={opt.v}
                      onClick={() => set("position", opt.v)}
                      className={`flex-1 py-2 rounded-xl text-sm border transition-all ${form.position === opt.v ? "bg-violet-500/20 border-violet-500/40 text-violet-300" : "border-white/10 text-white/50 hover:border-white/20"}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-2">شعاع گوشه‌ها ({form.borderRadius}px)</label>
                <input
                  type="range" min={0} max={32} step={2}
                  value={form.borderRadius}
                  onChange={(e) => set("borderRadius", parseInt(e.target.value))}
                  className="w-full accent-violet-500"
                />
              </div>
              <div className="flex items-center justify-between py-1">
                <div>
                  <div className="text-sm font-medium">حالت تاریک</div>
                  <div className="text-xs text-white/40">ویجت با تم تاریک نمایش داده می‌شود</div>
                </div>
                <div
                  onClick={() => set("darkMode", !form.darkMode)}
                  className={`w-11 h-6 rounded-full cursor-pointer transition-colors relative ${form.darkMode ? "bg-violet-500" : "bg-white/20"}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${form.darkMode ? "right-1" : "left-1"}`} />
                </div>
              </div>
              <div className="flex items-center justify-between py-1">
                <div>
                  <div className="text-sm font-medium">نمایش برند Persicore</div>
                  <div className="text-xs text-white/40">«Powered by Persicore» در پایین ویجت</div>
                </div>
                <div
                  onClick={() => set("showBranding", !form.showBranding)}
                  className={`w-11 h-6 rounded-full cursor-pointer transition-colors relative ${form.showBranding ? "bg-violet-500" : "bg-white/20"}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${form.showBranding ? "right-1" : "left-1"}`} />
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Live preview */}
        <div className="sticky top-6 h-fit">
          <div className="bg-white/3 border border-white/8 rounded-xl p-4 mb-3">
            <div className="flex items-center gap-2 text-sm text-white/50">
              <Eye className="w-4 h-4" />
              پیش‌نمایش زنده
            </div>
          </div>

          {/* Widget preview */}
          <div
            style={{
              background: chatBg,
              borderRadius: br,
              overflow: "hidden",
              boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
              fontFamily: "Vazirmatn, sans-serif",
              direction: "rtl",
            }}
          >
            {/* Header */}
            <div style={{ background: form.primaryColor, padding: "14px 16px", display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
                {form.avatarType === "url" && form.avatarUrl
                  ? <img src={form.avatarUrl} alt="" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
                  : form.avatarEmoji}
              </div>
              <span style={{ color: "#fff", fontWeight: 600, fontSize: 14 }}>{form.widgetTitle || "دستیار"}</span>
              <div style={{ marginRight: "auto", display: "flex", gap: 4 }}>
                {["FF6B6B", "FFE66D"].map((c) => (
                  <div key={c} style={{ width: 8, height: 8, borderRadius: "50%", background: `#${c}`, opacity: 0.8 }} />
                ))}
              </div>
            </div>

            {/* Messages */}
            <div style={{ padding: "12px 12px 8px", minHeight: 200, maxHeight: 260, overflowY: "auto", background: chatBg }}>
              {previewMessages.map((m, i) => (
                <div key={i} style={{ marginBottom: 8, display: "flex", flexDirection: m.role === "user" ? "row-reverse" : "row", gap: 6 }}>
                  {m.role === "bot" && (
                    <div style={{ width: 24, height: 24, borderRadius: "50%", background: form.primaryColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, flexShrink: 0 }}>
                      {form.avatarEmoji}
                    </div>
                  )}
                  <div style={{
                    maxWidth: "75%",
                    padding: "8px 12px",
                    borderRadius: m.role === "bot" ? `4px ${br} ${br} ${br}` : `${br} 4px ${br} ${br}`,
                    background: m.role === "bot" ? msgBg : form.primaryColor,
                    color: m.role === "bot" ? textColor : "#fff",
                    fontSize: 13,
                    lineHeight: 1.5,
                  }}>
                    {m.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <div style={{ padding: "8px 10px 10px", borderTop: `1px solid ${isDark ? "#2d2d4a" : "#e5e7eb"}`, background: chatBg }}>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <input
                  readOnly
                  placeholder={form.inputPlaceholder}
                  style={{
                    flex: 1, background: isDark ? "rgba(255,255,255,0.06)" : "#f3f4f6",
                    border: "none", borderRadius: 20, padding: "8px 12px",
                    fontSize: 12, color: textColor, outline: "none", direction: "rtl",
                  }}
                />
                <button
                  style={{ width: 32, height: 32, borderRadius: "50%", background: form.primaryColor, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                  onClick={() => {
                    setPreviewMessages((prev) => [
                      ...prev,
                      { role: "user", text: "این یک پیام آزمایشی است" },
                      { role: "bot", text: "ممنون از پیامتون! این یک پاسخ نمونه است." },
                    ]);
                  }}
                >
                  <MessageSquare style={{ width: 14, height: 14, color: "#fff" }} />
                </button>
              </div>
              {form.showBranding && (
                <div style={{ textAlign: "center", marginTop: 6, fontSize: 10, color: isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.25)" }}>
                  Powered by Persicore
                </div>
              )}
            </div>
          </div>

          {/* Floating button preview */}
          <div className="mt-4 flex items-center justify-between px-2">
            <span className="text-xs text-white/30">دکمه شناور</span>
            <div
              style={{ width: 52, height: 52, borderRadius: "50%", background: form.primaryColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, boxShadow: `0 4px 20px ${form.primaryColor}55`, cursor: "pointer" }}
            >
              {form.avatarType === "emoji" ? form.avatarEmoji : "💬"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
