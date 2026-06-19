"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAgentAuth } from "@/lib/agent-auth/context";

type Step = 1 | 2 | 3 | 4 | 5 | 6;

const LANGS = [
  { code: "fa", label: "فارسی", flag: "🇮🇷" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "ar", label: "العربية", flag: "🇸🇦" },
  { code: "zh", label: "中文", flag: "🇨🇳" },
  { code: "ru", label: "Русский", flag: "🇷🇺" },
];
const TONES = [
  { key: "friendly", label: "صمیمی", desc: "دوستانه و راحت" },
  { key: "formal", label: "رسمی", desc: "محترمانه و جدی" },
  { key: "professional", label: "حرفه‌ای", desc: "مختصر و دقیق" },
];

interface BusinessType { key: string; nameFa: string; icon: string; }
interface ChatMessage { role: "user" | "assistant"; content: string; }
interface KnowledgeItem { title: string; content: string; }

function apiFetch(path: string, options?: RequestInit) {
  const token = typeof window !== "undefined"
    ? (localStorage.getItem("agent-token") || localStorage.getItem("crm-token"))
    : null;
  return fetch(`/api/agent${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.headers ?? {}),
    },
  });
}

export default function NewAgentPage() {
  const { user, isLoading } = useAgentAuth();
  const router = useRouter();

  const [step, setStep] = useState<Step>(1);
  const [businessTypes, setBusinessTypes] = useState<BusinessType[]>([]);

  // Step 1 – business type
  const [selectedType, setSelectedType] = useState("");
  // Step 2 – basic info
  const [agentName, setAgentName] = useState("");
  const [selectedLangs, setSelectedLangs] = useState<string[]>(["fa"]);
  const [selectedTone, setSelectedTone] = useState("friendly");
  // Step 3 – AI interview
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [interviewComplete, setInterviewComplete] = useState(false);
  const [interviewKnowledge, setInterviewKnowledge] = useState<KnowledgeItem[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  // Step 4 – extra knowledge
  const [extraText, setExtraText] = useState("");
  const [extraTitle, setExtraTitle] = useState("");
  const [knowledgeMode, setKnowledgeMode] = useState<"text" | "url">("text");
  const [crawlUrl, setCrawlUrl] = useState("");
  const [crawling, setCrawling] = useState(false);
  const [crawlDone, setCrawlDone] = useState<{ pageTitle: string; chunksCreated: number } | null>(null);
  const [crawlError, setCrawlError] = useState("");
  // Step 5 – customization
  const [primaryColor, setPrimaryColor] = useState("#5b6cff");
  const [avatarType, setAvatarType] = useState<"emoji" | "url">("emoji");
  const [avatarEmoji, setAvatarEmoji] = useState("🤖");
  const [logoUrl, setLogoUrl] = useState("");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [position, setPosition] = useState("bottom-left");
  const [welcomeMsg, setWelcomeMsg] = useState("");
  // Step 6 – done
  const [createdAgentId, setCreatedAgentId] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) router.push("/agent/login");
  }, [user, isLoading, router]);

  useEffect(() => {
    apiFetch("/business-types").then((r) => r.json()).then((d) => setBusinessTypes(d.data ?? []));
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Kick off the AI interview when entering step 3
  useEffect(() => {
    if (step === 3 && chatMessages.length === 0) {
      startInterview();
    }
  }, [step]);

  const startInterview = async () => {
    setChatLoading(true);
    try {
      const res = await apiFetch("/onboarding", {
        method: "POST",
        body: JSON.stringify({ businessType: selectedType, messages: [] }),
      });
      const data = await res.json();
      setChatMessages([{ role: "assistant", content: data.data.message }]);
    } finally {
      setChatLoading(false);
    }
  };

  const sendChatMessage = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const userMsg: ChatMessage = { role: "user", content: chatInput };
    const updated = [...chatMessages, userMsg];
    setChatMessages(updated);
    setChatInput("");
    setChatLoading(true);
    try {
      const res = await apiFetch("/onboarding", {
        method: "POST",
        body: JSON.stringify({ businessType: selectedType, messages: updated }),
      });
      const data = await res.json();
      const { message, isComplete, knowledge } = data.data;
      setChatMessages((prev) => [...prev, { role: "assistant", content: message }]);
      if (isComplete) {
        setInterviewComplete(true);
        setInterviewKnowledge(knowledge ?? []);
      }
    } finally {
      setChatLoading(false);
    }
  };

  const doCrawl = async () => {
    if (!crawlUrl.trim()) return;
    setCrawling(true); setCrawlError(""); setCrawlDone(null);
    try {
      // Store URL to crawl after agent is created; just validate it here
      const res = await fetch(crawlUrl, { method: "HEAD", signal: AbortSignal.timeout(5000) }).catch(() => null);
      if (!res || !res.ok) { setCrawlError("آدرس قابل دسترسی نیست. بعد از ساخت ایجنت از بخش دانش‌پایه اضافه کنید."); return; }
      setCrawlDone({ pageTitle: new URL(crawlUrl).hostname, chunksCreated: 1 });
    } catch { setCrawlError("خطا در دسترسی به URL"); }
    finally { setCrawling(false); }
  };

  const createAgent = async () => {
    setCreating(true);
    try {
      // 1. Create agent
      const res = await apiFetch("/agents", {
        method: "POST",
        body: JSON.stringify({
          name: agentName,
          businessType: selectedType,
          welcomeMessage: welcomeMsg || `سلام! من دستیار ${agentName} هستم. چطور می‌تونم کمکتون کنم؟`,
          tone: selectedTone,
          languages: selectedLangs,
        }),
      });
      const agentData = await res.json();
      if (!res.ok) throw new Error(agentData?.error ?? "خطا در ساخت ایجنت");
      const agentId = agentData?.data?.id;
      if (!agentId) throw new Error("پاسخ سرور نامعتبر است");

      // 2. Add interview knowledge
      for (const k of interviewKnowledge) {
        await apiFetch(`/agents/${agentId}/knowledge`, {
          method: "POST",
          body: JSON.stringify({ type: "TEXT", title: k.title, content: k.content }),
        });
      }

      // 3. Add extra knowledge if provided
      if (extraText.trim() && extraTitle.trim()) {
        await apiFetch(`/agents/${agentId}/knowledge`, {
          method: "POST",
          body: JSON.stringify({ type: "TEXT", title: extraTitle, content: extraText }),
        });
      }

      // 4. Crawl URL knowledge if provided
      if (knowledgeMode === "url" && crawlUrl.trim() && crawlDone) {
        await apiFetch(`/agents/${agentId}/knowledge/crawl`, {
          method: "POST",
          body: JSON.stringify({ url: crawlUrl }),
        });
      }

      // 5. Update customization
      await apiFetch(`/agents/${agentId}/customization`, {
        method: "PATCH",
        body: JSON.stringify({ primaryColor, avatarType: avatarType, avatarEmoji, avatarUrl: logoUrl, position }),
      });

      // 5. Activate
      await apiFetch(`/agents/${agentId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "ACTIVE" }),
      });

      setCreatedAgentId(agentId);
      setStep(6);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "خطا در ساخت ایجنت";
      toast.error(msg);
    } finally {
      setCreating(false);
    }
  };

  const STEPS = ["نوع کسب‌وکار", "اطلاعات پایه", "مصاحبه AI", "غنی‌سازی", "شخصی‌سازی", "راه‌اندازی"];

  return (
    <div className="min-h-screen bg-[#07071a] text-white" dir="rtl">
      {/* Header */}
      <div className="border-b border-white/10 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-lg">
            <span>🤖</span> ایجنت‌ساز
          </div>
          <div className="flex items-center gap-1">
            {STEPS.map((s, i) => (
              <div key={i} className="flex items-center gap-1">
                <div
                  className={`w-7 h-7 rounded-full text-xs flex items-center justify-center font-medium transition-all ${
                    i + 1 === step
                      ? "bg-[#5b6cff] text-white"
                      : i + 1 < step
                      ? "bg-[#5b6cff]/30 text-[#5b6cff]"
                      : "bg-white/5 text-white/30"
                  }`}
                >
                  {i + 1 < step ? "✓" : i + 1}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`w-6 h-px ${i + 1 < step ? "bg-[#5b6cff]/50" : "bg-white/10"}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-10">
        {/* Step 1: Business type */}
        {step === 1 && (
          <div>
            <h1 className="text-2xl font-bold mb-2">نوع کسب‌وکار شما چیست؟</h1>
            <p className="text-white/50 mb-8">ایجنت بر اساس این انتخاب سوالات هدفمند می‌پرسد</p>
            <div className="grid grid-cols-3 gap-3 mb-8">
              {businessTypes.map((bt) => (
                <button
                  key={bt.key}
                  onClick={() => setSelectedType(bt.key)}
                  className={`p-4 rounded-2xl border text-right transition-all hover:border-[#5b6cff]/50 ${
                    selectedType === bt.key
                      ? "border-[#5b6cff] bg-[#5b6cff]/10"
                      : "border-white/10 bg-white/3"
                  }`}
                >
                  <div className="text-2xl mb-2">{bt.icon}</div>
                  <div className="text-sm font-medium">{bt.nameFa}</div>
                </button>
              ))}
            </div>
            <button
              disabled={!selectedType}
              onClick={() => setStep(2)}
              className="bg-[#5b6cff] hover:bg-[#4a5ae8] disabled:opacity-40 text-white px-8 py-3 rounded-xl font-medium transition-colors"
            >
              مرحله بعد →
            </button>
          </div>
        )}

        {/* Step 2: Basic info */}
        {step === 2 && (
          <div>
            <h1 className="text-2xl font-bold mb-2">اطلاعات پایه ایجنت</h1>
            <p className="text-white/50 mb-8">این اطلاعات در ویجت چت نمایش داده می‌شوند</p>
            <div className="space-y-6">
              <div>
                <label className="block text-sm text-white/70 mb-2">نام ایجنت *</label>
                <input
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  placeholder="مثال: دستیار فروشگاه ایران‌مد"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-[#5b6cff]/60 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-3">زبان‌های پشتیبانی</label>
                <div className="flex flex-wrap gap-2">
                  {LANGS.map((l) => (
                    <button
                      key={l.code}
                      onClick={() =>
                        setSelectedLangs((prev) =>
                          prev.includes(l.code) ? prev.filter((x) => x !== l.code) : [...prev, l.code]
                        )
                      }
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm transition-all ${
                        selectedLangs.includes(l.code)
                          ? "border-[#5b6cff] bg-[#5b6cff]/15 text-white"
                          : "border-white/10 text-white/50 hover:border-white/25"
                      }`}
                    >
                      <span>{l.flag}</span> {l.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm text-white/70 mb-3">لحن ایجنت</label>
                <div className="grid grid-cols-3 gap-3">
                  {TONES.map((t) => (
                    <button
                      key={t.key}
                      onClick={() => setSelectedTone(t.key)}
                      className={`p-4 rounded-xl border text-right transition-all ${
                        selectedTone === t.key
                          ? "border-[#5b6cff] bg-[#5b6cff]/10"
                          : "border-white/10 hover:border-white/25"
                      }`}
                    >
                      <div className="font-medium text-sm">{t.label}</div>
                      <div className="text-white/40 text-xs mt-1">{t.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setStep(1)} className="px-6 py-3 rounded-xl border border-white/15 text-white/60 hover:text-white transition-colors">
                ← قبلی
              </button>
              <button
                disabled={!agentName.trim() || selectedLangs.length === 0}
                onClick={() => setStep(3)}
                className="bg-[#5b6cff] hover:bg-[#4a5ae8] disabled:opacity-40 text-white px-8 py-3 rounded-xl font-medium transition-colors"
              >
                مرحله بعد →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: AI Interview */}
        {step === 3 && (
          <div>
            <h1 className="text-2xl font-bold mb-2">مصاحبه با هوش مصنوعی</h1>
            <p className="text-white/50 mb-6">ایجنت سوالاتی می‌پرسد تا دانش کسب‌وکار شما را بسازد</p>
            <div className="bg-white/3 border border-white/10 rounded-2xl flex flex-col h-[420px]">
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {chatMessages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                        m.role === "user"
                          ? "bg-[#5b6cff] text-white rounded-bl-sm"
                          : "bg-white/8 text-white/90 rounded-br-sm"
                      }`}
                    >
                      {m.role === "assistant" && (
                        <div className="flex items-center gap-1.5 mb-1.5 text-[#5b6cff] text-xs font-medium">
                          🤖 ایجنت‌ساز
                        </div>
                      )}
                      {m.content}
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-white/8 px-4 py-3 rounded-2xl">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce [animation-delay:0ms]" />
                        <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce [animation-delay:150ms]" />
                        <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce [animation-delay:300ms]" />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
              {!interviewComplete ? (
                <div className="border-t border-white/10 p-3 flex gap-2">
                  <input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendChatMessage()}
                    placeholder="پاسخ خود را بنویسید..."
                    disabled={chatLoading}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:border-[#5b6cff]/50 text-sm transition-colors disabled:opacity-50"
                  />
                  <button
                    onClick={sendChatMessage}
                    disabled={chatLoading || !chatInput.trim()}
                    className="bg-[#5b6cff] hover:bg-[#4a5ae8] disabled:opacity-40 text-white px-4 py-2.5 rounded-xl transition-colors text-sm"
                  >
                    ارسال
                  </button>
                </div>
              ) : (
                <div className="border-t border-white/10 p-4">
                  <div className="flex items-center gap-2 text-green-400 text-sm">
                    <span>✅</span>
                    <span>مصاحبه کامل شد — {interviewKnowledge.length} بخش دانش ذخیره شد</span>
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setStep(2)} className="px-6 py-3 rounded-xl border border-white/15 text-white/60 hover:text-white transition-colors">
                ← قبلی
              </button>
              <button
                disabled={!interviewComplete && chatMessages.length < 4}
                onClick={() => setStep(4)}
                className="bg-[#5b6cff] hover:bg-[#4a5ae8] disabled:opacity-40 text-white px-8 py-3 rounded-xl font-medium transition-colors"
              >
                {interviewComplete ? "مرحله بعد →" : "رد کردن →"}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Extra knowledge */}
        {step === 4 && (
          <div>
            <h1 className="text-2xl font-bold mb-2">غنی‌سازی دانش (اختیاری)</h1>
            <p className="text-white/50 mb-6">اطلاعات بیشتری اضافه کنید تا ایجنت دقیق‌تر پاسخ دهد</p>

            {/* Mode tabs */}
            <div className="flex gap-1 bg-white/5 rounded-xl p-1 mb-6">
              {([["text", "📝 متن مستقیم"], ["url", "🌐 کرال سایت"]] as ["text" | "url", string][]).map(([m, l]) => (
                <button
                  key={m}
                  onClick={() => { setKnowledgeMode(m); setCrawlError(""); setCrawlDone(null); }}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${knowledgeMode === m ? "bg-[#5b6cff] text-white" : "text-white/50 hover:text-white"}`}
                >
                  {l}
                </button>
              ))}
            </div>

            {knowledgeMode === "text" ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-white/70 mb-2">عنوان این بخش</label>
                  <input
                    value={extraTitle}
                    onChange={(e) => setExtraTitle(e.target.value)}
                    placeholder="مثال: سوالات متداول، سیاست بازگشت کالا، ..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-[#5b6cff]/60 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/70 mb-2">محتوا</label>
                  <textarea
                    value={extraText}
                    onChange={(e) => setExtraText(e.target.value)}
                    placeholder="هر اطلاعاتی که می‌خواهید ایجنت بداند را اینجا بنویسید..."
                    rows={8}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-[#5b6cff]/60 transition-colors resize-none"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-white/3 border border-white/10 rounded-xl p-4 text-sm text-white/60 leading-relaxed">
                  آدرس صفحات سایت خود را وارد کنید. سیستم متن صفحه را استخراج و به دانش‌پایه اضافه می‌کند.
                  پس از ساخت ایجنت هم می‌توانید از بخش دانش‌پایه URL های بیشتری اضافه کنید.
                </div>
                <div className="flex gap-2">
                  <input
                    value={crawlUrl}
                    onChange={(e) => setCrawlUrl(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && crawlUrl.trim() && doCrawl()}
                    placeholder="https://example.com/about"
                    dir="ltr"
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-[#5b6cff]/60 transition-colors"
                  />
                  <button
                    onClick={doCrawl}
                    disabled={crawling || !crawlUrl.trim()}
                    className="bg-[#5b6cff] hover:bg-[#4a5ae8] disabled:opacity-40 text-white px-6 py-3 rounded-xl font-medium transition-colors whitespace-nowrap"
                  >
                    {crawling ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        در حال کرال...
                      </span>
                    ) : "کرال کن"}
                  </button>
                </div>
                {crawlError && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-300 text-sm rounded-xl px-4 py-3">❌ {crawlError}</div>
                )}
                {crawlDone && (
                  <div className="bg-green-500/10 border border-green-500/20 text-green-300 text-sm rounded-xl px-4 py-3">
                    ✅ <span className="font-medium">{crawlDone.pageTitle}</span> — {crawlDone.chunksCreated} بخش دانش ذخیره شد. پس از ساخت ایجنت اضافه می‌شود.
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3 mt-8">
              <button onClick={() => setStep(3)} className="px-6 py-3 rounded-xl border border-white/15 text-white/60 hover:text-white transition-colors">
                ← قبلی
              </button>
              <button
                onClick={() => setStep(5)}
                className="bg-[#5b6cff] hover:bg-[#4a5ae8] text-white px-8 py-3 rounded-xl font-medium transition-colors"
              >
                مرحله بعد →
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Customization */}
        {step === 5 && (
          <div>
            <h1 className="text-2xl font-bold mb-2">شخصی‌سازی ظاهر</h1>
            <p className="text-white/50 mb-8">ویجت چت را با برند خود هماهنگ کنید</p>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm text-white/70 mb-2">رنگ اصلی</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-10 h-10 rounded-lg border-0 cursor-pointer bg-transparent"
                    />
                    <span className="text-sm text-white/50">{primaryColor}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-white/70 mb-2">آواتار ایجنت</label>
                  <div className="flex gap-1 bg-white/5 rounded-xl p-1 mb-3">
                    {([["emoji", "ایموجی"], ["url", "لوگو"]] as ["emoji" | "url", string][]).map(([t, l]) => (
                      <button key={t} onClick={() => setAvatarType(t)} className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${avatarType === t ? "bg-[#5b6cff] text-white" : "text-white/50 hover:text-white"}`}>{l}</button>
                    ))}
                  </div>
                  {avatarType === "emoji" ? (
                    <div className="flex flex-wrap gap-2">
                      {["🤖", "💬", "🎯", "✨", "🌟", "💡", "🔷", "🎪"].map((emoji) => (
                        <button key={emoji} onClick={() => setAvatarEmoji(emoji)} className={`w-10 h-10 text-xl rounded-xl border transition-all ${avatarEmoji === emoji ? "border-[#5b6cff] bg-[#5b6cff]/15" : "border-white/10 hover:border-white/25"}`}>{emoji}</button>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className={`flex items-center justify-center gap-2 w-full border-2 border-dashed rounded-xl py-4 cursor-pointer transition-colors ${uploadingLogo ? "border-[#5b6cff]/50 bg-[#5b6cff]/5" : "border-white/15 hover:border-white/30"}`}>
                        <input type="file" accept="image/*" className="sr-only" onChange={async (e) => {
                          const file = e.target.files?.[0]; if (!file) return;
                          setUploadingLogo(true);
                          const fd = new FormData(); fd.append("file", file);
                          try {
                            const token = localStorage.getItem("agent-token") || localStorage.getItem("crm-token");
                            const r = await fetch("/api/agent/upload", { method: "POST", headers: token ? { Authorization: `Bearer ${token}` } : {}, body: fd });
                            const d = await r.json();
                            if (d.data?.url) { setLogoUrl(d.data.url); setAvatarType("url"); }
                          } catch { } finally { setUploadingLogo(false); }
                        }} />
                        {uploadingLogo ? <span className="text-sm text-white/50">در حال آپلود...</span> : logoUrl ? <img src={logoUrl} className="w-12 h-12 rounded-full object-cover" alt="logo" /> : <span className="text-sm text-white/40">📁 آپلود لوگو (PNG, JPG)</span>}
                      </label>
                      {!logoUrl && <input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="یا آدرس لوگو را وارد کنید" dir="ltr" className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none" />}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm text-white/70 mb-2">موقعیت ویجت</label>
                  <div className="flex gap-2">
                    {[
                      { key: "bottom-left", label: "پایین چپ" },
                      { key: "bottom-right", label: "پایین راست" },
                    ].map((p) => (
                      <button
                        key={p.key}
                        onClick={() => setPosition(p.key)}
                        className={`flex-1 py-2.5 rounded-xl border text-sm transition-all ${
                          position === p.key ? "border-[#5b6cff] bg-[#5b6cff]/10 text-white" : "border-white/10 text-white/50 hover:border-white/25"
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-white/70 mb-2">پیام خوش‌آمد</label>
                  <input
                    value={welcomeMsg}
                    onChange={(e) => setWelcomeMsg(e.target.value)}
                    placeholder={`سلام! من دستیار ${agentName} هستم...`}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-[#5b6cff]/60 transition-colors text-sm"
                  />
                </div>
              </div>
              {/* Live preview */}
              <div className="relative bg-white/3 border border-white/10 rounded-2xl p-4 flex items-end justify-start min-h-[300px]">
                <div className="text-xs text-white/30 absolute top-3 right-3">پیش‌نمایش</div>
                <div className="w-72">
                  <div className="bg-[#0f0f1f] border border-white/15 rounded-2xl overflow-hidden shadow-2xl">
                    <div className="px-4 py-3 flex items-center gap-3" style={{ background: primaryColor + "22", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-lg overflow-hidden" style={{ background: primaryColor + "33" }}>
                        {avatarType === "url" && logoUrl ? <img src={logoUrl} className="w-full h-full object-cover" alt="" /> : avatarEmoji}
                      </div>
                      <div>
                        <div className="text-white text-sm font-medium">{agentName || "دستیار من"}</div>
                        <div className="flex items-center gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                          <span className="text-white/40 text-xs">آنلاین</span>
                        </div>
                      </div>
                    </div>
                    <div className="p-3 space-y-2">
                      <div className="bg-white/8 rounded-2xl rounded-br-sm px-3 py-2 text-xs text-white/80 max-w-[85%]">
                        {welcomeMsg || `سلام! من دستیار ${agentName || "شما"} هستم. چطور می‌تونم کمکتون کنم؟`}
                      </div>
                    </div>
                    <div className="p-2 border-t border-white/8 flex gap-2">
                      <div className="flex-1 bg-white/5 rounded-xl px-3 py-2 text-xs text-white/30">بنویسید...</div>
                      <div className="w-7 h-7 rounded-xl flex items-center justify-center text-xs" style={{ background: primaryColor }}>
                        ↑
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setStep(4)} className="px-6 py-3 rounded-xl border border-white/15 text-white/60 hover:text-white transition-colors">
                ← قبلی
              </button>
              <button
                disabled={creating}
                onClick={createAgent}
                className="bg-[#5b6cff] hover:bg-[#4a5ae8] disabled:opacity-50 text-white px-8 py-3 rounded-xl font-medium transition-colors flex items-center gap-2"
              >
                {creating ? (
                  <><span className="animate-spin">⏳</span> در حال ساخت ایجنت...</>
                ) : (
                  "ساخت ایجنت 🚀"
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 6: Done */}
        {step === 6 && (
          <div className="text-center py-8">
            <div className="text-6xl mb-6">🎉</div>
            <h1 className="text-3xl font-bold mb-3">ایجنت شما آماده است!</h1>
            <p className="text-white/50 mb-10">ایجنت «{agentName}» با موفقیت ساخته و فعال شد</p>
            <div className="flex gap-4 justify-center flex-wrap">
              <button
                onClick={() => router.push(`/agent/agents/${createdAgentId}/embed`)}
                className="bg-[#5b6cff] hover:bg-[#4a5ae8] text-white px-8 py-3 rounded-xl font-medium transition-colors"
              >
                دریافت کد نصب
              </button>
              <button
                onClick={() => router.push(`/agent/agents/${createdAgentId}`)}
                className="border border-white/15 hover:border-white/30 text-white px-8 py-3 rounded-xl font-medium transition-colors"
              >
                رفتن به داشبورد
              </button>
              <button
                onClick={() => router.push("/agent/dashboard")}
                className="text-white/50 hover:text-white px-6 py-3 rounded-xl transition-colors"
              >
                همه ایجنت‌ها
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
