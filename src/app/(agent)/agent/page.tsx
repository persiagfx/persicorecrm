"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAgentAuth } from "@/lib/agent-auth/context";

const FEATURES = [
  { icon: "🧠", title: "مصاحبه هوشمند", desc: "AI به صورت خودکار اطلاعات کسب‌وکارت رو جمع‌آوری می‌کنه و دانش‌پایه می‌سازه." },
  { icon: "📚", title: "سه منبع دانش", desc: "متن مستقیم، فایل PDF/Word، یا آدرس سایت — هر سه رو پشتیبانی می‌کنیم." },
  { icon: "🔗", title: "نصب ۱ دقیقه‌ای", desc: "یه خط کد برای هر سایتی. پلاگین اختصاصی وردپرس هم داریم." },
  { icon: "🎯", title: "لید خودکار", desc: "وقتی بازدیدکننده اطلاعاتش رو داد، لید رو مستقیم تو CRM ثبت می‌کنیم." },
  { icon: "🌍", title: "چندزبانه", desc: "فارسی، انگلیسی، عربی، چینی و روسی. کاربر زبانش رو انتخاب می‌کنه." },
  { icon: "📊", title: "آنالیز مکالمات", desc: "تعداد مکالمات، لیدها، و پیام‌ها رو تو داشبورد ببین و بهینه کن." },
];

const PLANS = [
  { name: "رایگان", price: "۰", period: "همیشه", color: "#64748b", agents: 1, msgs: "۱۰۰", highlight: false, badge: null },
  { name: "پایه", price: "۱۴۹,۰۰۰", period: "ماهانه", color: "#3b82f6", agents: 3, msgs: "۱,۰۰۰", highlight: false, badge: null },
  { name: "حرفه‌ای", price: "۳۴۹,۰۰۰", period: "ماهانه", color: "#8b5cf6", agents: 10, msgs: "۵,۰۰۰", highlight: true, badge: "محبوب‌ترین" },
  { name: "سازمانی", price: "۸۹۹,۰۰۰", period: "ماهانه", color: "#f59e0b", agents: 50, msgs: "۵۰,۰۰۰", highlight: false, badge: null },
];

const STEPS = [
  { n: "۱", title: "ثبت‌نام", desc: "با ایمیل یا موبایل، در ۳۰ ثانیه حساب بساز." },
  { n: "۲", title: "مصاحبه AI", desc: "AI چند سوال درباره کسب‌وکارت می‌پرسه و دانش‌پایه می‌سازه." },
  { n: "۳", title: "شخصی‌سازی", desc: "رنگ، نام، آواتار، و لحن ایجنت رو تنظیم کن." },
  { n: "۴", title: "نصب", desc: "کد رو تو سایتت بذار و ایجنت فعال میشه." },
];

export default function AgentLanding() {
  const { user, isLoading } = useAgentAuth();
  const router = useRouter();
  const [chatDemo, setChatDemo] = useState<{ role: string; text: string }[]>([
    { role: "bot", text: "سلام! من دستیار هوشمند این فروشگاهم 👋 چطور می‌تونم کمکتون کنم؟" },
  ]);
  const [demoInput, setDemoInput] = useState("");
  const DEMO_REPLIES = [
    "محصولات ما شامل لپ‌تاپ، موبایل و تبلت می‌شه. کدوم رو می‌خواید ببینید؟",
    "برای سفارش، می‌تونید از سایت یا با شماره ۰۲۱-۱۲۳۴ تماس بگیرید.",
    "ارسال به سراسر کشور انجام میشه. زمان تحویل ۲ تا ۵ روز کاری.",
    "ممنون از پیامتون! اطلاعاتتون رو ثبت کردم، همکارانم تماس می‌گیرن. 🎯",
  ];
  const [demoIdx, setDemoIdx] = useState(0);

  useEffect(() => {
    if (!isLoading && user) router.replace("/agent/dashboard");
  }, [user, isLoading, router]);

  const sendDemo = () => {
    if (!demoInput.trim()) return;
    const reply = DEMO_REPLIES[demoIdx % DEMO_REPLIES.length];
    setChatDemo((p) => [...p, { role: "user", text: demoInput }, { role: "bot", text: reply }]);
    setDemoIdx((i) => i + 1);
    setDemoInput("");
  };

  if (isLoading || user) return null;

  return (
    <div className="min-h-screen bg-[#07071a] text-white" dir="rtl" style={{ fontFamily: "Vazirmatn, sans-serif" }}>

      {/* Navbar */}
      <nav className="border-b border-white/8 px-6 py-4 sticky top-0 z-40 bg-[#07071a]/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-violet-500 flex items-center justify-center text-sm font-bold">P</div>
            <span className="font-bold">Persicore <span className="text-violet-400">Agent</span></span>
          </div>
          <div className="flex items-center gap-4">
            <a href="#pricing" className="text-sm text-white/60 hover:text-white transition-colors">قیمت‌ها</a>
            <a href="#how" className="text-sm text-white/60 hover:text-white transition-colors">نحوه کار</a>
            <Link href="/agent/login" className="text-sm text-white/60 hover:text-white transition-colors">ورود</Link>
            <Link href="/agent/register" className="text-sm bg-violet-500 hover:bg-violet-600 px-4 py-2 rounded-xl font-medium transition-colors">
              شروع رایگان
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 py-24 grid grid-cols-[1fr_400px] gap-16 items-center">
        <div>
          <div className="inline-flex items-center gap-2 text-xs bg-violet-500/15 border border-violet-500/20 rounded-full px-4 py-1.5 text-violet-300 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            هوش مصنوعی فارسی‌زبان
          </div>
          <h1 className="text-5xl font-black leading-tight mb-6">
            ایجنت هوشمند<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-l from-violet-400 to-blue-400">کسب‌وکارت</span><br />
            رو بساز
          </h1>
          <p className="text-lg text-white/60 leading-relaxed mb-8 max-w-lg">
            در کمتر از ۱۵ دقیقه یه چت‌بات هوشمند برای سایتت بساز. بدون کدنویسی، با دانش کسب‌وکارت.
          </p>
          <div className="flex gap-3">
            <Link href="/agent/register" className="bg-violet-500 hover:bg-violet-600 text-white px-8 py-3.5 rounded-2xl font-semibold text-lg transition-colors shadow-lg shadow-violet-500/25">
              رایگان شروع کن ←
            </Link>
            <a href="#demo" className="border border-white/15 hover:border-white/30 text-white/70 hover:text-white px-8 py-3.5 rounded-2xl font-medium text-lg transition-all">
              دمو زنده
            </a>
          </div>
          <div className="flex items-center gap-6 mt-8 text-sm text-white/40">
            <span>✓ بدون کارت بانکی</span>
            <span>✓ ۵ دقیقه تا راه‌اندازی</span>
            <span>✓ پشتیبانی فارسی</span>
          </div>
        </div>

        {/* Live demo widget */}
        <div id="demo">
          <div className="text-xs text-white/40 mb-3 text-center">نمونه زنده — امتحانش کن 👇</div>
          <div className="rounded-2xl overflow-hidden shadow-2xl shadow-violet-500/10 border border-white/8">
            {/* Header */}
            <div className="bg-gradient-to-l from-violet-600 to-violet-500 p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-lg">🤖</div>
              <div>
                <div className="font-semibold text-sm">دستیار فروشگاه</div>
                <div className="text-xs text-white/70 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                  آنلاین
                </div>
              </div>
            </div>
            {/* Messages */}
            <div className="bg-[#0f0f23] p-4 space-y-3 min-h-[200px] max-h-[220px] overflow-y-auto">
              {chatDemo.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-start" : "justify-end"} gap-2`}>
                  {m.role === "bot" && <div className="w-6 h-6 rounded-full bg-violet-500 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">🤖</div>}
                  <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${m.role === "bot" ? "bg-white/8 text-white/90 rounded-tr-sm" : "bg-violet-500 text-white rounded-tl-sm"}`}>
                    {m.text}
                  </div>
                </div>
              ))}
            </div>
            {/* Input */}
            <div className="bg-[#0f0f23] border-t border-white/8 p-3 flex gap-2">
              <input
                value={demoInput}
                onChange={(e) => setDemoInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendDemo()}
                placeholder="یه چیزی بپرس..."
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500/50"
              />
              <button onClick={sendDemo} className="w-9 h-9 rounded-xl bg-violet-500 hover:bg-violet-600 flex items-center justify-center transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m22 2-7 20-4-9-9-4 20-7z"/></svg>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <div className="border-y border-white/8 bg-white/2">
        <div className="max-w-6xl mx-auto px-6 py-6 grid grid-cols-4 gap-6">
          {[["۱۲+", "نوع کسب‌وکار"], ["۵", "زبان پشتیبانی‌شده"], ["۱ دقیقه", "نصب روی سایت"], ["۲۴/۷", "پاسخگویی خودکار"]].map(([v, l]) => (
            <div key={l} className="text-center">
              <div className="text-2xl font-black text-violet-400">{v}</div>
              <div className="text-xs text-white/50 mt-1">{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black mb-3">همه چیز که لازم داری</h2>
          <p className="text-white/50">از ساخت تا تحلیل، همه چیز یکجاست</p>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-white/3 border border-white/8 hover:border-violet-500/25 rounded-2xl p-6 transition-all group">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-bold mb-2">{f.title}</h3>
              <p className="text-sm text-white/50 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="bg-white/2 border-y border-white/8">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black mb-3">چطور کار می‌کنه؟</h2>
            <p className="text-white/50">چهار قدم تا داشتن یک دستیار هوشمند</p>
          </div>
          <div className="grid grid-cols-4 gap-6 relative">
            <div className="absolute top-8 right-[12.5%] left-[12.5%] h-px bg-gradient-to-l from-transparent via-violet-500/30 to-transparent" />
            {STEPS.map((s) => (
              <div key={s.n} className="text-center relative">
                <div className="w-16 h-16 rounded-2xl bg-violet-500/15 border border-violet-500/25 flex items-center justify-center text-2xl font-black text-violet-400 mx-auto mb-4">
                  {s.n}
                </div>
                <h3 className="font-bold mb-2">{s.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black mb-3">قیمت‌گذاری ساده</h2>
          <p className="text-white/50">هر پلن شامل تمام امکانات پایه‌ایه</p>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {PLANS.map((p) => (
            <div key={p.name} className={`relative rounded-2xl p-6 border transition-all ${p.highlight ? "border-violet-500/50 bg-violet-500/8 shadow-lg shadow-violet-500/10" : "border-white/10 bg-white/3"}`}>
              {p.badge && (
                <div className="absolute -top-3 right-1/2 translate-x-1/2 text-xs bg-violet-500 text-white px-3 py-1 rounded-full font-medium whitespace-nowrap">
                  {p.badge}
                </div>
              )}
              <div className="font-bold text-lg mb-1" style={{ color: p.color }}>{p.name}</div>
              <div className="text-3xl font-black mb-1">
                {p.price === "۰" ? "رایگان" : <><span className="text-lg font-normal text-white/50">﷼ </span>{p.price}</>}
              </div>
              <div className="text-xs text-white/40 mb-5">{p.period}</div>
              <div className="space-y-2.5 mb-6 text-sm">
                <div className="flex justify-between text-white/70">
                  <span>تعداد ایجنت</span>
                  <span className="font-semibold text-white">{p.agents}</span>
                </div>
                <div className="flex justify-between text-white/70">
                  <span>پیام ماهانه</span>
                  <span className="font-semibold text-white">{p.msgs}</span>
                </div>
                <div className="flex justify-between text-white/70">
                  <span>برند Persicore</span>
                  <span>{p.name === "سازمانی" ? "❌" : "✓"}</span>
                </div>
                <div className="flex justify-between text-white/70">
                  <span>CRM sync</span>
                  <span>✓</span>
                </div>
              </div>
              <Link
                href="/agent/register"
                className={`block text-center py-2.5 rounded-xl text-sm font-medium transition-colors ${p.highlight ? "bg-violet-500 hover:bg-violet-600 text-white" : "border border-white/15 hover:border-white/30 text-white/70 hover:text-white"}`}
              >
                {p.price === "۰" ? "شروع رایگان" : "انتخاب پلن"}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-b from-violet-500/10 to-transparent border-t border-violet-500/15">
        <div className="max-w-2xl mx-auto px-6 py-20 text-center">
          <h2 className="text-4xl font-black mb-4">آماده‌ای شروع کنی؟</h2>
          <p className="text-white/60 mb-8 text-lg">اولین ایجنت رو رایگان بساز. کارت بانکی لازم نیست.</p>
          <Link href="/agent/register" className="inline-block bg-violet-500 hover:bg-violet-600 text-white px-10 py-4 rounded-2xl font-bold text-lg transition-colors shadow-xl shadow-violet-500/25">
            ساخت ایجنت رایگان ←
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/8 px-6 py-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-sm text-white/30">
          <span>© ۱۴۰۴ پرسی‌کور — همه حقوق محفوظ است</span>
          <div className="flex gap-4">
            <Link href="/agent/login" className="hover:text-white transition-colors">ورود</Link>
            <Link href="/agent/register" className="hover:text-white transition-colors">ثبت‌نام</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
