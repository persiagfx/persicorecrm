"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "motion/react";
import {
  CheckCircle2, Zap, Building2, Rocket, Star, ArrowLeft, Bot,
  ChevronRight, MessageSquare, Users, TrendingUp, Shield, Globe,
  BarChart3, Sparkles, Play, ChefHat, Cpu, Factory,
  ShoppingCart, GraduationCap, Wrench, Ship, Check, X,
  Brain, Layers, Database, Webhook, LayoutDashboard,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

// ─── Data ─────────────────────────────────────────────────────────────────────

const INDUSTRIES = [
  { key: "restaurant", label: "رستوران", icon: ChefHat, color: "from-orange-500/20 to-red-500/10 border-orange-500/30",
    modules: ["داشبورد رستوران", "منوی دیجیتال", "سیستم POS", "KDS آشپزخانه", "رزرو میز", "انبار مواد"] },
  { key: "it", label: "IT", icon: Cpu, color: "from-blue-500/20 to-cyan-500/10 border-blue-500/30",
    modules: ["Sprint Board", "Bug Tracker", "Roadmap", "لایسنس نرم‌افزار", "دارایی IT", "تایمر پروژه"] },
  { key: "manufacturing", label: "تولیدی", icon: Factory, color: "from-gray-500/20 to-slate-500/10 border-gray-500/30",
    modules: ["خطوط تولید", "BOM", "کنترل کیفیت", "ماشین‌آلات", "مدیریت ضایعات", "OEE Analytics"] },
  { key: "ecommerce", label: "فروشگاه", icon: ShoppingCart, color: "from-pink-500/20 to-rose-500/10 border-pink-500/30",
    modules: ["محصولات", "سفارش‌ها", "کد تخفیف", "ردیابی ارسال", "نظرات", "انبار"] },
  { key: "education", label: "آموزشگاه", icon: GraduationCap, color: "from-violet-500/20 to-purple-500/10 border-violet-500/30",
    modules: ["دوره‌ها", "دانش‌آموزان", "آزمون", "دفتر نمرات", "گواهینامه", "برنامه کلاس"] },
  { key: "service", label: "خدماتی", icon: Wrench, color: "from-yellow-500/20 to-amber-500/10 border-yellow-500/30",
    modules: ["درخواست خدمات", "زمان‌بندی تکنسین", "SLA", "نظرسنجی", "نقشه میدانی", "گزارش SLA"] },
  { key: "trading", label: "بازرگانی", icon: Ship, color: "from-teal-500/20 to-emerald-500/10 border-teal-500/30",
    modules: ["محموله‌ها", "واردات/صادرات", "قیمت‌گذاری", "انبار", "تامین‌کنندگان", "حقوقی"] },
];

const BASE_FEATURES = [
  { icon: TrendingUp, label: "قیف فروش", desc: "Pipeline بصری با drag & drop" },
  { icon: Users, label: "مدیریت مشتری", desc: "CRM کامل با تاریخچه تعاملات" },
  { icon: BarChart3, label: "گزارش مالی", desc: "ERP یکپارچه با حسابداری" },
  { icon: Shield, label: "پورتال مشتری", desc: "پنل اختصاصی برای مشتریان" },
  { icon: MessageSquare, label: "تیکتینگ", desc: "پشتیبانی سازمان‌یافته" },
  { icon: LayoutDashboard, label: "HR کامل", desc: "حضور، مرخصی، حقوق" },
  { icon: Globe, label: "مارکتینگ", desc: "کمپین، UTM، A/B Test" },
  { icon: Database, label: "انبارداری", desc: "موجودی، خرید، تامین‌کننده" },
];

const AGENT_MESSAGES = [
  { from: "user" as const, text: "سلام، میز برای ۴ نفر دارید؟" },
  { from: "bot" as const, text: "بله! برای چه تاریخ و ساعتی؟" },
  { from: "user" as const, text: "فردا شب ساعت ۸" },
  { from: "bot" as const, text: "میز رو رزرو کردم ✓ اسم و شماره موبایل رو بفرمایید" },
  { from: "user" as const, text: "علی احمدی — ۰۹۱۲..." },
  { from: "bot" as const, text: "رزرو شما ثبت شد! SMS تأیید فرستادم 🎉" },
];

const AGENT_FEATURES = [
  "آموزش با داده‌های اختصاصی کسب‌وکار",
  "پشتیبانی کامل از زبان فارسی و RTL",
  "تولید سرنخ و ثبت مستقیم در CRM",
  "قابل نصب روی هر سایت یا اپ",
  "تنظیم شخصیت، رنگ و لحن ایجنت",
  "آنالیتیکس مکالمات و نرخ تبدیل",
];

const PLANS = [
  {
    name: "Starter", icon: Zap, price: "۲۹۰,۰۰۰", period: "ماه",
    color: "from-blue-600/15 to-blue-600/5", border: "border-blue-500/20",
    badge: null as null | string, accent: "text-blue-400",
    features: ["تا ۵ کاربر", "تا ۱۰۰ مشتری", "CRM کامل", "صدور فاکتور", "مدیریت پروژه", "پشتیبانی ایمیلی"],
    notIncluded: ["ایجنت AI", "ERP مالی", "سرور اختصاصی"],
  },
  {
    name: "Pro", icon: Rocket, price: "۵۹۰,۰۰۰", period: "ماه",
    color: "from-violet-600/25 to-fuchsia-600/10", border: "border-violet-500/40",
    badge: "محبوب‌ترین" as null | string, accent: "text-violet-400",
    features: ["تا ۲۰ کاربر", "تا ۵۰۰ مشتری", "همه Starter", "ERP مالی کامل", "پورتال مشتری", "ایجنت AI (۱ ایجنت)", "پشتیبانی اولویت‌دار"],
    notIncluded: ["ایجنت‌های نامحدود", "سرور اختصاصی"],
  },
  {
    name: "Enterprise", icon: Building2, price: "تماس", period: "",
    color: "from-emerald-600/15 to-emerald-600/5", border: "border-emerald-500/20",
    badge: null as null | string, accent: "text-emerald-400",
    features: ["کاربران نامحدود", "مشتریان نامحدود", "همه Pro", "ایجنت‌های نامحدود", "سرور اختصاصی", "پیاده‌سازی سفارشی", "آموزش تیم", "پشتیبانی ۲۴/۷"],
    notIncluded: [] as string[],
  },
];

const STATS = [
  { value: 8, label: "صنف مختلف", suffix: "+" },
  { value: 150, label: "ابزار یکپارچه", suffix: "+" },
  { value: 14, label: "روز تریال رایگان", suffix: "" },
  { value: 100, label: "رضایت مشتری", suffix: "%" },
];

const INDUSTRY_NAMES = ["رستوران‌ها", "شرکت‌های IT", "کارخانه‌ها", "فروشگاه‌های آنلاین", "آموزشگاه‌ها", "شرکت‌های خدماتی", "بازرگان‌ها"];

// ─── Animated Number ───────────────────────────────────────────────────────────

function AnimatedNumber({ target }: { target: number }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true;
        let current = 0;
        const step = Math.ceil(target / 40);
        const timer = setInterval(() => {
          current = Math.min(current + step, target);
          setDisplay(current);
          if (current >= target) clearInterval(timer);
        }, 30);
      }
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  return <span ref={ref}>{display.toLocaleString("fa-IR")}</span>;
}

// ─── Chat Demo ────────────────────────────────────────────────────────────────

function ChatDemo() {
  const [visibleCount, setVisibleCount] = useState(0);
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      while (!cancelled) {
        for (let i = 0; i < AGENT_MESSAGES.length; i++) {
          if (cancelled) return;
          await new Promise(r => setTimeout(r, i === 0 ? 800 : 1200));
          if (cancelled) return;
          if (AGENT_MESSAGES[i].from === "bot") {
            setTyping(true);
            await new Promise(r => setTimeout(r, 900));
            if (cancelled) return;
            setTyping(false);
          }
          setVisibleCount(i + 1);
        }
        await new Promise(r => setTimeout(r, 2500));
        if (!cancelled) setVisibleCount(0);
      }
    };
    run();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="relative w-full max-w-sm mx-auto">
      <div className="relative bg-[#0e0e1a] rounded-[2rem] border border-white/10 shadow-2xl shadow-violet-500/10 overflow-hidden">
        <div className="bg-white/[0.04] px-4 py-3 flex items-center gap-3 border-b border-white/[0.06]">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shrink-0">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-xs font-semibold text-white">دستیار هوشمند رستوران</p>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <p className="text-[10px] text-emerald-400">آنلاین</p>
            </div>
          </div>
        </div>
        <div className="h-64 p-3 space-y-2.5 overflow-hidden flex flex-col justify-end">
          <AnimatePresence>
            {AGENT_MESSAGES.slice(0, visibleCount).map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.3 }}
                className={cn("flex", msg.from === "user" ? "justify-start" : "justify-end")}
              >
                <div className={cn(
                  "max-w-[75%] px-3 py-2 rounded-2xl text-xs leading-relaxed",
                  msg.from === "user"
                    ? "bg-white/10 text-white/80 rounded-bl-sm"
                    : "bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white rounded-br-sm"
                )}>
                  {msg.text}
                </div>
              </motion.div>
            ))}
            {typing && (
              <motion.div
                key="typing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-end"
              >
                <div className="bg-gradient-to-br from-violet-600/50 to-fuchsia-600/50 px-3 py-2 rounded-2xl rounded-br-sm flex items-center gap-1">
                  {[0, 1, 2].map(i => (
                    <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-white/80"
                      animate={{ y: [0, -4, 0] }}
                      transition={{ duration: 0.6, delay: i * 0.15, repeat: Infinity }} />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="px-3 pb-4">
          <div className="bg-white/[0.06] border border-white/10 rounded-xl px-3 py-2.5 flex items-center gap-2">
            <span className="text-xs text-white/20 flex-1">پیام خود را بنویسید...</span>
            <div className="w-6 h-6 rounded-lg bg-violet-600/50 flex items-center justify-center">
              <ArrowLeft className="w-3 h-3 text-white" />
            </div>
          </div>
        </div>
      </div>
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-3 -right-3 bg-emerald-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-lg shadow-emerald-500/30"
      >
        سرنخ ثبت شد ✓
      </motion.div>
      <motion.div
        animate={{ y: [0, 6, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute -bottom-3 -left-3 bg-violet-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-lg shadow-violet-500/30"
      >
        +۱۲ lead این هفته
      </motion.div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const [activeIndustry, setActiveIndustry] = useState(0);
  const [industryIdx, setIndustryIdx] = useState(0);
  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, -60]);

  useEffect(() => {
    const t = setInterval(() => setIndustryIdx(i => (i + 1) % INDUSTRY_NAMES.length), 2200);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-screen bg-[#07070f] text-white overflow-x-hidden" dir="rtl">

      {/* ── Background ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-violet-600/8 rounded-full blur-[140px]" />
        <div className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-fuchsia-600/6 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[400px] bg-cyan-500/5 rounded-full blur-[120px]" />
        <div className="absolute inset-0 opacity-[0.025]"
          style={{ backgroundImage: "linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)", backgroundSize: "60px 60px" }} />
      </div>

      {/* ── Navbar ── */}
      <nav className="relative z-50 flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl gradient-brand flex items-center justify-center shadow-lg">
            <span className="text-base font-black text-black">P</span>
          </div>
          <span className="font-bold text-lg text-white">Persicore</span>
        </div>
        <div className="hidden md:flex items-center gap-6 text-sm text-white/50">
          <a href="#features" className="hover:text-white transition-colors">امکانات</a>
          <a href="#agent" className="hover:text-white transition-colors">ایجنت AI</a>
          <a href="#pricing" className="hover:text-white transition-colors">قیمت‌ها</a>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-white/50 hover:text-white transition-colors px-4 py-2">
            ورود
          </Link>
          <Link href="/register" className="text-sm font-semibold px-4 py-2 rounded-xl gradient-brand text-black hover:opacity-90 transition-opacity shadow-lg shadow-yellow-500/20">
            شروع رایگان
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <motion.section style={{ y: heroY }} className="relative z-10 pt-16 pb-24 px-6 text-center max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.06] border border-white/[0.1] text-sm text-white/60 mb-8"
        >
          <Sparkles className="w-3.5 h-3.5 text-violet-400" />
          هوشمندانه‌ترین CRM فارسی
          <ChevronRight className="w-3.5 h-3.5 opacity-50" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl md:text-7xl font-black mb-6"
          style={{ lineHeight: 1.15 }}
        >
          <span className="text-white">CRM که برای </span>
          <span className="relative inline-block min-h-[1.2em] min-w-[6rem]">
            <AnimatePresence mode="wait">
              <motion.span
                key={industryIdx}
                initial={{ opacity: 0, y: 20, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -20, filter: "blur(8px)" }}
                transition={{ duration: 0.4 }}
                className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent block"
              >
                {INDUSTRY_NAMES[industryIdx]}
              </motion.span>
            </AnimatePresence>
          </span>
          <span className="text-white block">ساخته شده</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg md:text-xl text-white/45 mb-10 max-w-2xl mx-auto leading-relaxed"
        >
          یک پلتفرم کامل برای مدیریت مشتری، مالی، تیم و ایجنت هوشمند — با پشتیبانی از ۸ صنف مختلف
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link href="/register"
            className="group flex items-center gap-3 px-8 py-4 rounded-2xl gradient-brand text-black font-bold text-base shadow-xl shadow-yellow-500/20 hover:shadow-yellow-500/30 hover:scale-105 transition-all duration-300">
            <Rocket className="w-5 h-5" />
            شروع ۱۴ روز رایگان
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          </Link>
          <a href="#features"
            className="flex items-center gap-2 px-8 py-4 rounded-2xl border border-white/10 bg-white/[0.04] text-white/70 font-medium text-base hover:bg-white/[0.08] hover:border-white/20 transition-all duration-200">
            <Play className="w-4 h-4" />
            مشاهده امکانات
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.45 }}
          className="flex flex-wrap items-center justify-center gap-6 mt-12 text-xs text-white/30"
        >
          {["بدون نیاز به کارت اعتباری", "راه‌اندازی در ۵ دقیقه", "پشتیبانی فارسی"].map((t, i) => (
            <span key={i} className="flex items-center gap-1.5">
              <Check className="w-3 h-3 text-emerald-400" />{t}
            </span>
          ))}
        </motion.div>
      </motion.section>

      {/* ── Stats ── */}
      <section className="relative z-10 py-12 border-y border-white/[0.06] bg-white/[0.02]">
        <div className="max-w-4xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="text-center"
            >
              <p className="text-3xl md:text-4xl font-black text-white mb-1">
                <AnimatedNumber target={s.value} />{s.suffix}
              </p>
              <p className="text-sm text-white/40">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CRM Features ── */}
      <section id="features" className="relative z-10 py-28 px-6 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/20 mb-4 inline-block">
            سیستم CRM
          </span>
          <h2 className="text-3xl md:text-5xl font-black mb-4">
            یک پلتفرم —{" "}
            <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              هر صنف
            </span>
          </h2>
          <p className="text-white/40 text-lg max-w-xl mx-auto">
            بر اساس صنف شما، ماژول‌های مرتبط فعال می‌شوند. هیچ چیز اضافه‌ای ندارید.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex flex-wrap justify-center gap-2 mb-10"
        >
          {INDUSTRIES.map((ind, i) => {
            const Icon = ind.icon;
            return (
              <button key={i} onClick={() => setActiveIndustry(i)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all duration-200",
                  activeIndustry === i
                    ? "bg-white/10 border-white/25 text-white shadow-lg"
                    : "border-white/[0.07] text-white/40 hover:text-white/70 hover:border-white/15 bg-transparent"
                )}>
                <Icon className="w-3.5 h-3.5" />
                {ind.label}
              </button>
            );
          })}
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeIndustry}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.35 }}
            className={cn("rounded-3xl border p-8 bg-gradient-to-br", INDUSTRIES[activeIndustry].color)}
          >
            <div className="flex items-center gap-4 mb-8">
              {(() => {
                const Icon = INDUSTRIES[activeIndustry].icon;
                return (
                  <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                );
              })()}
              <div>
                <h3 className="text-xl font-bold text-white">{INDUSTRIES[activeIndustry].label}</h3>
                <p className="text-white/40 text-sm">ماژول‌های اختصاصی این صنف</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {INDUSTRIES[activeIndustry].modules.map((mod, i) => (
                <motion.div
                  key={mod}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.06 }}
                  className="flex items-center gap-2.5 bg-white/[0.08] border border-white/10 rounded-xl px-4 py-3"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                  <span className="text-sm text-white/80 font-medium">{mod}</span>
                </motion.div>
              ))}
            </div>
            <div className="mt-6 pt-6 border-t border-white/10 flex items-center gap-2 text-sm text-white/40">
              <Layers className="w-4 h-4 text-emerald-400" />
              به علاوه تمام امکانات پایه CRM (فروش، مالی، HR، همکاری، گزارش‌ها)
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          {BASE_FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: (i % 4) * 0.07 }}
                className="group p-4 rounded-2xl border border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/15 transition-all duration-200 cursor-default"
              >
                <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center mb-3 group-hover:bg-white/10 transition-colors">
                  <Icon className="w-4 h-4 text-white/50" />
                </div>
                <p className="text-sm font-semibold text-white/80 mb-1">{f.label}</p>
                <p className="text-xs text-white/35">{f.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ── Agent Builder ── */}
      <section id="agent" className="relative z-10 py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-400 text-xs font-medium mb-6"
              >
                <Brain className="w-3.5 h-3.5" />
                ایجنت‌ساز هوش مصنوعی
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-3xl md:text-5xl font-black mb-6"
                style={{ lineHeight: 1.2 }}
              >
                ایجنت هوشمند با{" "}
                <span className="bg-gradient-to-r from-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
                  برند خودتان
                </span>
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.15 }}
                className="text-white/45 text-lg mb-8 leading-relaxed"
              >
                در چند دقیقه یک دستیار هوشمند بسازید که ۲۴/۷ به مشتریانتان پاسخ دهد،
                سرنخ جمع‌آوری کند و مستقیم با CRM شما هماهنگ باشد.
              </motion.p>

              <ul className="space-y-3 mb-10">
                {AGENT_FEATURES.map((f, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.07, duration: 0.4 }}
                    className="flex items-center gap-3"
                  >
                    <div className="w-5 h-5 rounded-full bg-fuchsia-500/20 border border-fuchsia-500/30 flex items-center justify-center shrink-0">
                      <Check className="w-2.5 h-2.5 text-fuchsia-400" />
                    </div>
                    <span className="text-sm text-white/65">{f}</span>
                  </motion.li>
                ))}
              </ul>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.4 }}
                className="flex items-center gap-4"
              >
                <Link href="/register"
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white font-semibold text-sm hover:shadow-xl hover:shadow-fuchsia-500/25 hover:scale-105 transition-all duration-200">
                  <Bot className="w-4 h-4" />
                  ساخت ایجنت رایگان
                </Link>
                <div className="flex items-center gap-2 text-xs text-white/30">
                  <Webhook className="w-3.5 h-3.5" />
                  بدون نیاز به کد
                </div>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex justify-center relative"
            >
              <div className="absolute inset-0 bg-fuchsia-500/10 rounded-full blur-[80px]" />
              <ChatDemo />
            </motion.div>
          </div>

          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6">
            {([
              { step: "۱", icon: Cpu, title: "انتخاب صنف و تنظیم", desc: "صنف، شخصیت، رنگ و لحن ایجنت را تعریف کنید" },
              { step: "۲", icon: Database, title: "آموزش با داده‌های شما", desc: "فایل، وب‌سایت یا دانش سازمانی را آپلود کنید" },
              { step: "۳", icon: Globe, title: "نصب روی هر پلتفرم", desc: "یک خط کد — آماده برای سایت، اپ یا واتساپ" },
            ] as const).map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 25 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="relative p-6 rounded-2xl border border-white/[0.07] bg-white/[0.03] hover:border-fuchsia-500/20 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-fuchsia-500/10 border border-fuchsia-500/20 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-fuchsia-400" />
                    </div>
                    <div>
                      <p className="text-[10px] text-fuchsia-400/70 font-bold mb-1">مرحله {s.step}</p>
                      <h3 className="font-bold text-white mb-1.5">{s.title}</h3>
                      <p className="text-sm text-white/40">{s.desc}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="relative z-10 py-28 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-4 inline-block">
              قیمت‌گذاری شفاف
            </span>
            <h2 className="text-3xl md:text-5xl font-black mb-4">
              پلنی که مناسب{" "}
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                کسب‌وکار شما
              </span>
              {" "}است
            </h2>
            <p className="text-white/40 text-lg">۱۴ روز تریال رایگان برای همه پلن‌ها — بدون کارت اعتباری</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {PLANS.map((plan, i) => {
              const Icon = plan.icon;
              return (
                <motion.div
                  key={plan.name}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  className={cn(
                    "relative p-6 rounded-3xl border bg-gradient-to-b flex flex-col transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl",
                    plan.color, plan.border,
                    plan.badge && "shadow-xl shadow-violet-500/15"
                  )}
                >
                  {plan.badge && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-xs font-bold text-white flex items-center gap-1.5 shadow-lg">
                      <Star className="w-3 h-3" />{plan.badge}
                    </div>
                  )}
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                      <Icon className={cn("w-5 h-5", plan.accent)} />
                    </div>
                    <h3 className="text-lg font-bold">{plan.name}</h3>
                  </div>
                  <div className="mb-6">
                    {plan.period ? (
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black">{plan.price}</span>
                        <span className="text-white/30 text-sm">تومان / {plan.period}</span>
                      </div>
                    ) : (
                      <p className={cn("text-2xl font-black", plan.accent)}>{plan.price}</p>
                    )}
                  </div>
                  <ul className="space-y-2.5 flex-1 mb-5">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-center gap-2 text-sm text-white/65">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />{f}
                      </li>
                    ))}
                    {plan.notIncluded.map(f => (
                      <li key={f} className="flex items-center gap-2 text-sm text-white/25 line-through">
                        <X className="w-3.5 h-3.5 shrink-0" />{f}
                      </li>
                    ))}
                  </ul>
                  <Link href="/register"
                    className={cn(
                      "w-full py-3 rounded-xl text-sm font-bold text-center block transition-all duration-200",
                      plan.badge
                        ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:shadow-lg hover:shadow-violet-500/30"
                        : "bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:border-white/20"
                    )}>
                    {plan.price === "تماس" ? "درخواست دمو" : "شروع رایگان"}
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="relative z-10 py-24 px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto text-center"
        >
          <div className="relative p-12 rounded-3xl border border-violet-500/20 bg-gradient-to-br from-violet-600/8 to-fuchsia-600/5 overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-violet-500/15 blur-[60px] pointer-events-none" />
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl gradient-brand flex items-center justify-center mx-auto mb-6 shadow-xl shadow-yellow-500/20">
                <span className="text-2xl font-black text-black">P</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-black mb-4">آماده شروع هستید؟</h2>
              <p className="text-white/45 text-lg mb-8">
                همین الان ثبت‌نام کنید — ۱۴ روز کامل رایگان، بدون محدودیت
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/register"
                  className="flex items-center gap-3 px-8 py-4 rounded-2xl gradient-brand text-black font-bold text-base shadow-xl shadow-yellow-500/20 hover:shadow-yellow-500/30 hover:scale-105 transition-all duration-200">
                  <Rocket className="w-5 h-5" />
                  شروع تریال رایگان
                </Link>
                <Link href="/login" className="text-sm text-white/40 hover:text-white/70 transition-colors">
                  حساب دارید؟ وارد شوید
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-white/[0.06] py-8 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-white/25">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg gradient-brand flex items-center justify-center">
              <span className="text-[10px] font-black text-black">P</span>
            </div>
            <span>Persicore CRM — ساخته شده با ❤️ در ایران</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/login" className="hover:text-white/50 transition-colors">ورود</Link>
            <Link href="/register" className="hover:text-white/50 transition-colors">ثبت‌نام</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
