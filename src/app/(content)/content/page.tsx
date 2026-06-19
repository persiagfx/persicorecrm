"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useContentAuth } from "@/lib/content-auth/context";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Sparkles, Instagram, MessageCircle, FileText, Mail, MessageSquare,
  ChevronLeft, ChevronRight, RefreshCw, Check, Zap, Globe, History,
  CreditCard, LogOut, User, RotateCcw, Loader2, X
} from "lucide-react";
import ContentEditor from "@/components/content/ContentEditor";
import SeoPanel from "@/components/content/SeoPanel";

const PLATFORMS = [
  { id: "instagram", label: "اینستاگرام", icon: Instagram, color: "from-pink-500 to-purple-600", bg: "bg-pink-500/10", border: "border-pink-500/30", glow: "shadow-pink-500/20" },
  { id: "telegram", label: "تلگرام", icon: MessageCircle, color: "from-sky-400 to-blue-600", bg: "bg-sky-500/10", border: "border-sky-500/30", glow: "shadow-sky-500/20" },
  { id: "bale", label: "بله", icon: MessageSquare, color: "from-emerald-400 to-teal-600", bg: "bg-emerald-500/10", border: "border-emerald-500/30", glow: "shadow-emerald-500/20" },
  { id: "blog", label: "مقاله", icon: FileText, color: "from-amber-400 to-orange-600", bg: "bg-amber-500/10", border: "border-amber-500/30", glow: "shadow-amber-500/20" },
  { id: "email", label: "ایمیل", icon: Mail, color: "from-violet-400 to-purple-600", bg: "bg-violet-500/10", border: "border-violet-500/30", glow: "shadow-violet-500/20" },
  { id: "sms", label: "پیامک", icon: MessageSquare, color: "from-rose-400 to-red-600", bg: "bg-rose-500/10", border: "border-rose-500/30", glow: "shadow-rose-500/20" },
];

const TONES = [
  { id: "friendly", label: "دوستانه", emoji: "😊", desc: "صمیمی و نزدیک" },
  { id: "formal", label: "رسمی", emoji: "💼", desc: "حرفه‌ای و جدی" },
  { id: "fun", label: "فان", emoji: "🎉", desc: "شاد و سرگرم‌کننده" },
];

const CONTENT_TYPES = [
  { id: "news", label: "خبری", emoji: "📰", desc: "اطلاع‌رسانی رویدادها" },
  { id: "educational", label: "آموزشی", emoji: "📚", desc: "انتقال دانش و مهارت" },
  { id: "promotional", label: "تبلیغاتی", emoji: "🚀", desc: "معرفی محصول یا سرویس" },
  { id: "fun", label: "طنز", emoji: "😄", desc: "محتوای سرگرم‌کننده" },
];

type Step = 1 | 2 | 3 | 4 | 5 | 6;

interface GenerationState {
  id: string;
  text: string;
}

export default function ContentPage() {
  const { user, isLoading, logout } = useContentAuth();
  const router = useRouter();

  const [step, setStep] = useState<Step>(1);
  const [platform, setPlatform] = useState("");
  const [language, setLanguage] = useState<"fa" | "en">("fa");
  const [topic, setTopic] = useState("");
  const [keyword, setKeyword] = useState("");
  const [subtopics, setSubtopics] = useState<string[]>([]);
  const [selectedSubtopics, setSelectedSubtopics] = useState<string[]>([]);
  const [loadingSubtopics, setLoadingSubtopics] = useState(false);
  const [tone, setTone] = useState("friendly");
  const [contentType, setContentType] = useState("educational");
  const [generating, setGenerating] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [generation, setGeneration] = useState<GenerationState | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const token = typeof window !== "undefined" ? localStorage.getItem("content-token") || localStorage.getItem("crm-token") : null;

  useEffect(() => {
    if (!isLoading && !user) router.push("/content/login");
  }, [user, isLoading, router]);

  const fetchSubtopics = useCallback(async () => {
    if (!topic.trim()) return;
    setLoadingSubtopics(true);
    try {
      const res = await fetch("/api/content/subtopics", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ topic, platform, language }),
      });
      const data = await res.json();
      setSubtopics(data.data?.subtopics ?? []);
      setSelectedSubtopics([]);
    } catch {
      toast.error("خطا در دریافت زیرموضوعات");
    } finally {
      setLoadingSubtopics(false);
    }
  }, [topic, platform, language, token]);

  const generate = async () => {
    if (selectedSubtopics.length === 0) { toast.error("حداقل یک زیرموضوع انتخاب کنید"); return; }
    setGenerating(true);
    setStreamText("");
    setGeneration(null);
    setStep(6);

    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/content/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ platform, language, topic, subtopics: selectedSubtopics, tone, contentType, keyword: keyword || undefined }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "خطا در تولید");
      }

      const reader = res.body!.getReader();
      const dec = new TextDecoder();
      let genId = "";
      let full = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = dec.decode(value);
        const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));
        for (const line of lines) {
          try {
            const payload = JSON.parse(line.slice(6));
            if (payload.error) throw new Error(payload.error);
            if (payload.text) { full += payload.text; setStreamText((p) => p + payload.text); }
            if (payload.done) genId = payload.id;
          } catch {}
        }
      }

      setGeneration({ id: genId, text: full });
    } catch (e: unknown) {
      if ((e as Error)?.name !== "AbortError") {
        toast.error(e instanceof Error ? e.message : "خطا در تولید محتوا");
        setStep(5);
      }
    } finally {
      setGenerating(false);
    }
  };


  const saveEdited = async (editedText: string, seoScore?: number) => {
    if (!generation?.id) return;
    await fetch(`/api/content/history/${generation.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ editedText, seoScore }),
    });
    toast.success("ذخیره شد");
  };

  const resetWizard = () => {
    setStep(1);
    setPlatform("");
    setTopic("");
    setKeyword("");
    setSubtopics([]);
    setSelectedSubtopics([]);
    setStreamText("");
    setGeneration(null);
  };

  const planLabel = { FREE: "رایگان", PRO: "پرو", PLUS: "پلاس", UNLIMITED: "نامحدود" };
  const planLimit = { FREE: 5, PRO: 20, PLUS: 50, UNLIMITED: Infinity };
  const usagePercent = user?.plan === "UNLIMITED" ? 0 : Math.min(100, ((user?.usedThisMonth ?? 0) / (planLimit[user?.plan ?? "FREE"] ?? 5)) * 100);

  if (isLoading) return (
    <div className="min-h-screen bg-[#050508] flex items-center justify-center">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="w-8 h-8 border-2 border-violet-500/30 border-t-violet-500 rounded-full" />
    </div>
  );

  if (!user) return null;

  const selectedPlatform = PLATFORMS.find((p) => p.id === platform);

  return (
    <div className="min-h-screen bg-[#050508] text-white" dir="rtl">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div animate={{ x: [0, 30, 0], y: [0, -20, 0] }} transition={{ duration: 14, repeat: Infinity }}
          className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-violet-600/10 blur-[120px]" />
        <motion.div animate={{ x: [0, -20, 0], y: [0, 30, 0] }} transition={{ duration: 18, repeat: Infinity, delay: 3 }}
          className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-indigo-600/10 blur-[100px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/5 bg-black/20 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white">Persicore Content</span>
          </div>

          <div className="flex items-center gap-4">
            {/* Usage bar */}
            {user.plan !== "UNLIMITED" && (
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-white/40 text-xs">{user.usedThisMonth}/{planLimit[user.plan ?? "FREE"] ?? 5}</span>
                <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${usagePercent}%` }}
                    className={`h-full rounded-full ${usagePercent > 80 ? "bg-rose-500" : "bg-gradient-to-r from-violet-500 to-indigo-500"}`}
                  />
                </div>
              </div>
            )}

            <span className={`text-xs px-2.5 py-1 rounded-full border font-medium
              ${user.plan === "PLUS" ? "bg-amber-500/10 border-amber-500/30 text-amber-400" :
                user.plan === "PRO" ? "bg-violet-500/10 border-violet-500/30 text-violet-400" :
                user.plan === "UNLIMITED" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" :
                "bg-white/5 border-white/10 text-white/40"}`}>
              {planLabel[user.plan ?? "FREE"]}
            </span>

            <div className="flex items-center gap-1">
              <button onClick={() => router.push("/content/history")}
                className="p-2 hover:bg-white/5 rounded-lg text-white/40 hover:text-white/70 transition-all" title="تاریخچه">
                <History className="w-4 h-4" />
              </button>
              {user.plan !== "UNLIMITED" && (
                <button onClick={() => router.push("/content/billing")}
                  className="p-2 hover:bg-white/5 rounded-lg text-white/40 hover:text-violet-400 transition-all" title="ارتقا">
                  <CreditCard className="w-4 h-4" />
                </button>
              )}
              <button onClick={logout}
                className="p-2 hover:bg-white/5 rounded-lg text-white/40 hover:text-rose-400 transition-all" title="خروج">
                <LogOut className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-1.5">
              <User className="w-3.5 h-3.5 text-white/40" />
              <span className="text-white/60 text-sm">{user.name}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Progress bar */}
      {step < 6 && (
        <div className="relative z-10 h-0.5 bg-white/5">
          <motion.div
            animate={{ width: `${((step - 1) / 5) * 100}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-violet-500 to-indigo-500"
          />
        </div>
      )}

      {/* Steps indicator */}
      {step < 6 && (
        <div className="relative z-10 max-w-3xl mx-auto px-6 pt-6 pb-2">
          <div className="flex items-center justify-center gap-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  step > s ? "bg-gradient-to-r from-violet-500 to-indigo-500 text-white" :
                  step === s ? "bg-gradient-to-r from-violet-500/30 to-indigo-500/30 border border-violet-500/50 text-violet-300" :
                  "bg-white/5 border border-white/10 text-white/30"}`}>
                  {step > s ? <Check className="w-3.5 h-3.5" /> : s}
                </div>
                {s < 5 && <div className={`w-8 h-0.5 rounded-full transition-all duration-500 ${step > s ? "bg-violet-500" : "bg-white/10"}`} />}
              </div>
            ))}
          </div>
          <div className="text-center mt-2 text-white/30 text-xs">
            {["پلتفرم", "زبان و موضوع", "زیرموضوعات", "تنظیمات محتوا", "تایید و تولید"][step - 1]}
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        <AnimatePresence mode="wait">

          {/* Step 1: Platform */}
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.35, ease: "easeOut" }}>
              <div className="text-center mb-10">
                <h1 className="text-3xl font-bold text-white mb-2">محتوا برای کجاست؟</h1>
                <p className="text-white/40">پلتفرم مناسب را انتخاب کنید تا محتوا بهینه‌سازی شود</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
                {PLATFORMS.map((p, i) => (
                  <motion.button key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.07, duration: 0.3 }}
                    whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }}
                    onClick={() => { setPlatform(p.id); setStep(2); }}
                    className={`group relative p-6 rounded-2xl border ${p.bg} ${p.border} hover:shadow-lg ${p.glow} transition-all duration-300 flex flex-col items-center gap-3`}>
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${p.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <p.icon className="w-7 h-7 text-white" />
                    </div>
                    <span className="font-semibold text-white">{p.label}</span>
                    <ChevronLeft className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-hover:text-white/60 group-hover:-translate-x-1 transition-all duration-200" />
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 2: Language + Topic */}
          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.35 }}>
              <div className="text-center mb-10">
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${selectedPlatform?.bg} ${selectedPlatform?.border} border mb-4`}>
                  {selectedPlatform && <selectedPlatform.icon className="w-4 h-4" />}
                  <span className="text-sm font-medium">{selectedPlatform?.label}</span>
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">موضوع محتوا</h1>
                <p className="text-white/40">زبان و موضوع اصلی محتوای خود را وارد کنید</p>
              </div>

              <div className="max-w-xl mx-auto space-y-6">
                {/* Language toggle */}
                <div>
                  <label className="text-white/50 text-sm mb-3 block">زبان محتوا</label>
                  <div className="flex bg-white/5 rounded-xl p-1 gap-1">
                    {([["fa", "🇮🇷", "فارسی"], ["en", "🇺🇸", "English"]] as const).map(([l, flag, name]) => (
                      <button key={l} onClick={() => setLanguage(l)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                          language === l ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg" : "text-white/50 hover:text-white/80"
                        }`}>
                        <span>{flag}</span> <span>{name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Topic input */}
                <div>
                  <label className="text-white/50 text-sm mb-2 block">موضوع اصلی *</label>
                  <input value={topic} onChange={(e) => setTopic(e.target.value)}
                    placeholder={language === "fa" ? "مثال: مزایای استفاده از هوش مصنوعی در کسب‌وکار" : "e.g., Benefits of AI in business"}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-white/20 focus:outline-none focus:border-violet-500/50 transition-all"
                    dir={language === "fa" ? "rtl" : "ltr"} />
                </div>

                {/* Keyword input */}
                <div>
                  <label className="text-white/50 text-sm mb-2 block">کلمه کلیدی SEO <span className="text-white/20">(اختیاری)</span></label>
                  <input value={keyword} onChange={(e) => setKeyword(e.target.value)}
                    placeholder={language === "fa" ? "مثال: هوش مصنوعی کسب‌وکار" : "e.g., AI business growth"}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder-white/20 focus:outline-none focus:border-violet-500/50 transition-all"
                    dir={language === "fa" ? "rtl" : "ltr"} />
                </div>

                <div className="flex gap-3 pt-2">
                  <button onClick={() => setStep(1)}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl border border-white/10 text-white/50 hover:text-white/80 hover:bg-white/5 transition-all">
                    <ChevronRight className="w-4 h-4" /> برگشت
                  </button>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={() => { fetchSubtopics(); setStep(3); }}
                    disabled={!topic.trim()}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold shadow-lg shadow-violet-500/25 disabled:opacity-40 transition-all">
                    <Sparkles className="w-4 h-4" /> پیشنهاد زیرموضوع <ChevronLeft className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 3: Subtopics */}
          {step === 3 && (
            <motion.div key="step3" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.35 }}>
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">زیرموضوعات</h1>
                <p className="text-white/40">موضوعاتی که می‌خواهید محتوا درباره‌شان باشد را انتخاب کنید</p>
              </div>

              <div className="max-w-2xl mx-auto">
                {loadingSubtopics ? (
                  <div className="flex flex-col items-center gap-4 py-16">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                      className="w-12 h-12 border-2 border-violet-500/30 border-t-violet-500 rounded-full" />
                    <p className="text-white/40">در حال تولید پیشنهادات...</p>
                  </div>
                ) : (
                  <div className="space-y-3 mb-6">
                    {subtopics.map((s, i) => {
                      const selected = selectedSubtopics.includes(s);
                      return (
                        <motion.button key={s} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.06 }} whileHover={{ x: -4 }}
                          onClick={() => setSelectedSubtopics((prev) => selected ? prev.filter((x) => x !== s) : [...prev, s])}
                          className={`w-full flex items-center gap-4 p-4 rounded-xl border text-right transition-all duration-200 ${
                            selected ? "bg-violet-500/15 border-violet-500/40 shadow-lg shadow-violet-500/10" : "bg-white/3 border-white/8 hover:bg-white/5 hover:border-white/15"
                          }`}>
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                            selected ? "bg-gradient-to-br from-violet-500 to-indigo-500 shadow-md" : "bg-white/10 border border-white/20"
                          }`}>
                            {selected && <Check className="w-3.5 h-3.5 text-white" />}
                          </div>
                          <span className={`font-medium ${selected ? "text-white" : "text-white/70"}`}>{s}</span>
                          <span className="mr-auto text-white/20 text-sm">#{i + 1}</span>
                        </motion.button>
                      );
                    })}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-3 justify-between">
                  <div className="flex gap-3">
                    <button onClick={() => setStep(2)}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 text-white/50 hover:text-white/80 hover:bg-white/5 transition-all text-sm">
                      <ChevronRight className="w-4 h-4" /> برگشت
                    </button>
                    <button onClick={fetchSubtopics} disabled={loadingSubtopics}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 text-white/50 hover:text-white/80 hover:bg-white/5 transition-all text-sm">
                      <RefreshCw className={`w-4 h-4 ${loadingSubtopics ? "animate-spin" : ""}`} /> پیشنهاد جدید
                    </button>
                  </div>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={() => setStep(4)} disabled={selectedSubtopics.length === 0}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold shadow-lg disabled:opacity-40 transition-all text-sm">
                    ادامه ({selectedSubtopics.length}) <ChevronLeft className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 4: Tone + Content type */}
          {step === 4 && (
            <motion.div key="step4" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.35 }}>
              <div className="text-center mb-10">
                <h1 className="text-3xl font-bold text-white mb-2">شخصیت محتوا</h1>
                <p className="text-white/40">لحن و نوع محتوا را مشخص کنید</p>
              </div>

              <div className="max-w-2xl mx-auto space-y-8">
                <div>
                  <h3 className="text-white/60 font-medium mb-4 flex items-center gap-2">
                    <span>💬</span> لحن محتوا
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    {TONES.map((t) => (
                      <motion.button key={t.id} whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
                        onClick={() => setTone(t.id)}
                        className={`p-4 rounded-xl border text-center transition-all duration-200 ${
                          tone === t.id ? "bg-violet-500/15 border-violet-500/40 shadow-lg shadow-violet-500/10" : "bg-white/3 border-white/8 hover:bg-white/5"
                        }`}>
                        <div className="text-2xl mb-2">{t.emoji}</div>
                        <div className={`font-semibold text-sm ${tone === t.id ? "text-violet-300" : "text-white/70"}`}>{t.label}</div>
                        <div className="text-white/30 text-xs mt-1">{t.desc}</div>
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-white/60 font-medium mb-4 flex items-center gap-2">
                    <span>📝</span> نوع محتوا
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {CONTENT_TYPES.map((ct) => (
                      <motion.button key={ct.id} whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
                        onClick={() => setContentType(ct.id)}
                        className={`p-4 rounded-xl border text-right transition-all duration-200 flex items-center gap-3 ${
                          contentType === ct.id ? "bg-violet-500/15 border-violet-500/40 shadow-lg shadow-violet-500/10" : "bg-white/3 border-white/8 hover:bg-white/5"
                        }`}>
                        <span className="text-2xl">{ct.emoji}</span>
                        <div>
                          <div className={`font-semibold text-sm ${contentType === ct.id ? "text-violet-300" : "text-white/70"}`}>{ct.label}</div>
                          <div className="text-white/30 text-xs">{ct.desc}</div>
                        </div>
                        {contentType === ct.id && <Check className="w-4 h-4 text-violet-400 mr-auto" />}
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button onClick={() => setStep(3)}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl border border-white/10 text-white/50 hover:text-white/80 hover:bg-white/5 transition-all">
                    <ChevronRight className="w-4 h-4" /> برگشت
                  </button>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={() => setStep(5)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold shadow-lg shadow-violet-500/25 transition-all">
                    ادامه <ChevronLeft className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 5: Summary + Generate */}
          {step === 5 && (
            <motion.div key="step5" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.35 }}>
              <div className="text-center mb-10">
                <h1 className="text-3xl font-bold text-white mb-2">آماده تولید</h1>
                <p className="text-white/40">خلاصه تنظیمات را بررسی کنید</p>
              </div>

              <div className="max-w-xl mx-auto space-y-4 mb-8">
                {[
                  { label: "پلتفرم", value: selectedPlatform?.label },
                  { label: "زبان", value: language === "fa" ? "فارسی" : "English" },
                  { label: "موضوع", value: topic },
                  { label: "کلمه کلیدی", value: keyword || "—" },
                  { label: "زیرموضوعات", value: selectedSubtopics.join("، ") },
                  { label: "لحن", value: TONES.find((t) => t.id === tone)?.label },
                  { label: "نوع محتوا", value: CONTENT_TYPES.find((ct) => ct.id === contentType)?.label },
                ].map((row) => (
                  <div key={row.label} className="flex items-start gap-4 bg-white/3 rounded-xl px-4 py-3 border border-white/8">
                    <span className="text-white/40 text-sm w-24 flex-shrink-0">{row.label}</span>
                    <span className="text-white text-sm font-medium">{row.value}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 max-w-xl mx-auto">
                <button onClick={() => setStep(4)}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl border border-white/10 text-white/50 hover:text-white/80 hover:bg-white/5 transition-all">
                  <ChevronRight className="w-4 h-4" /> برگشت
                </button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={generate}
                  className="flex-1 flex items-center justify-center gap-3 py-4 rounded-xl bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 text-white font-bold text-lg shadow-xl shadow-violet-500/30 hover:shadow-violet-500/50 transition-all duration-300">
                  <Zap className="w-5 h-5" />
                  تولید محتوا
                  <Sparkles className="w-5 h-5" />
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Step 6: Result */}
          {step === 6 && (
            <motion.div key="step6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
              {/* Generating state */}
              {generating && !streamText && (
                <div className="flex flex-col items-center justify-center py-24 gap-6">
                  <div className="relative w-24 h-24">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 rounded-full border-2 border-transparent border-t-violet-500 border-r-indigo-500" />
                    <motion.div animate={{ rotate: -360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-3 rounded-full border-2 border-transparent border-b-purple-500 border-l-blue-500" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Sparkles className="w-8 h-8 text-violet-400" />
                    </div>
                  </div>
                  <div className="text-center">
                    <motion.p animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1.5, repeat: Infinity }}
                      className="text-white/70 text-lg font-medium">در حال تولید محتوا...</motion.p>
                    <p className="text-white/30 text-sm mt-1">هوش مصنوعی در حال کار است</p>
                  </div>
                </div>
              )}

              {/* Streaming text preview */}
              {generating && streamText && (
                <div className="max-w-3xl mx-auto">
                  <div className="flex items-center gap-2 mb-4">
                    <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 1, repeat: Infinity }}
                      className="w-2 h-2 rounded-full bg-violet-500" />
                    <span className="text-white/50 text-sm">در حال تولید...</span>
                  </div>
                  <div className="bg-white/3 border border-white/8 rounded-2xl p-6 min-h-[300px] text-white/80 leading-8 font-light" dir={language === "fa" ? "rtl" : "ltr"}>
                    <div className="whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: streamText.replace(/^#{1,3} /gm, "").replace(/\*\*(.+?)\*\*/g, "$1") }} />
                    <motion.span animate={{ opacity: [0, 1, 0] }} transition={{ duration: 0.8, repeat: Infinity }}
                      className="inline-block w-0.5 h-5 bg-violet-400 mr-1 align-middle" />
                  </div>
                </div>
              )}

              {/* Final result: Editor + SEO */}
              {!generating && generation && (
                <div className="space-y-6">
                  {/* Top bar */}
                  <div className="flex items-center justify-end">
                    <button onClick={resetWizard}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-white/50 hover:text-white/80 hover:bg-white/5 transition-all text-sm">
                      <RotateCcw className="w-4 h-4" /> محتوای جدید
                    </button>
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    <div className="xl:col-span-2">
                      <ContentEditor
                        initialContent={generation.text}
                        language={language}
                        onSave={saveEdited}
                      />
                    </div>
                    <div>
                      <SeoPanel text={generation.text} keyword={keyword} platform={platform} language={language} />
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
}
