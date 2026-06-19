"use client";

import { useMemo } from "react";
import { motion } from "motion/react";
import { Search, CheckCircle, XCircle, AlertCircle, TrendingUp } from "lucide-react";

interface Props {
  text: string;
  keyword: string;
  platform: string;
  language: "fa" | "en";
}

const PLATFORM_IDEAL: Record<string, { minWords: number; maxWords: number; label: string }> = {
  instagram: { minWords: 80, maxWords: 220, label: "اینستاگرام" },
  telegram: { minWords: 100, maxWords: 400, label: "تلگرام" },
  bale: { minWords: 80, maxWords: 300, label: "بله" },
  blog: { minWords: 600, maxWords: 1800, label: "مقاله" },
  email: { minWords: 100, maxWords: 400, label: "ایمیل" },
  sms: { minWords: 10, maxWords: 30, label: "پیامک" },
};

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function countKeywordOccurrences(text: string, keyword: string): number {
  if (!keyword) return 0;
  const regex = new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
  return (text.match(regex) || []).length;
}

interface Check {
  label: string;
  pass: boolean;
  warn?: boolean;
  detail: string;
}

export default function SeoPanel({ text, keyword, platform, language }: Props) {
  const analysis = useMemo(() => {
    const wordCount = countWords(text);
    const charCount = text.length;
    const ideal = PLATFORM_IDEAL[platform] ?? { minWords: 50, maxWords: 1000, label: platform };
    const kwCount = countKeywordOccurrences(text, keyword);
    const kwDensity = wordCount > 0 ? (kwCount / wordCount) * 100 : 0;
    const paragraphs = text.split(/\n\n+/).filter(Boolean).length;
    const hasH1 = /^#\s/.test(text) || /<h1/i.test(text);
    const hasH2 = /^##\s/m.test(text) || /<h2/i.test(text);
    const sentences = text.split(/[.!?؟]+/).filter((s) => s.trim().length > 5);
    const avgSentenceLength = sentences.length > 0 ? sentences.reduce((sum, s) => sum + countWords(s), 0) / sentences.length : 0;
    const hasMetaDesc = text.includes("meta") || text.includes("توضیحات") || text.includes("description");
    const emojis = (text.match(/[\u{1F300}-\u{1FAD6}]/gu) || []).length;
    const hashtags = (text.match(/#\w+/g) || []).length;

    const checks: Check[] = [
      {
        label: "طول محتوا",
        pass: wordCount >= ideal.minWords && wordCount <= ideal.maxWords,
        warn: wordCount > 0 && (wordCount < ideal.minWords * 0.8 || wordCount > ideal.maxWords * 1.2),
        detail: `${wordCount} کلمه (ایده‌آل: ${ideal.minWords}-${ideal.maxWords})`,
      },
      ...(keyword ? [{
        label: "کلمه کلیدی در متن",
        pass: kwCount >= 1,
        warn: kwDensity > 5,
        detail: kwCount === 0 ? "کلمه کلیدی پیدا نشد" : `${kwCount} بار (${kwDensity.toFixed(1)}%)`,
      }] : []),
      {
        label: "طول جملات",
        pass: avgSentenceLength > 0 && avgSentenceLength <= 20,
        warn: avgSentenceLength > 20 && avgSentenceLength <= 30,
        detail: avgSentenceLength > 0 ? `میانگین ${Math.round(avgSentenceLength)} کلمه/جمله` : "قابل اندازه‌گیری نیست",
      },
      ...(platform === "blog" ? [
        {
          label: "ساختار عناوین",
          pass: hasH2,
          warn: !hasH1 && !hasH2,
          detail: hasH2 ? "زیرعنوان‌ها موجود است" : "H2 یا زیرعنوان یافت نشد",
        },
        {
          label: "پاراگراف‌بندی",
          pass: paragraphs >= 3,
          warn: paragraphs === 2,
          detail: `${paragraphs} بخش/پاراگراف`,
        },
        {
          label: "توضیحات متا",
          pass: hasMetaDesc,
          warn: false,
          detail: hasMetaDesc ? "پیشنهاد متا وجود دارد" : "توضیحات متا اضافه کنید",
        },
      ] : []),
      ...(platform === "instagram" ? [
        {
          label: "هشتگ‌ها",
          pass: hashtags >= 5 && hashtags <= 20,
          warn: hashtags > 20,
          detail: `${hashtags} هشتگ (ایده‌آل: ۵-۲۰)`,
        },
        {
          label: "ایموجی",
          pass: emojis >= 2 && emojis <= 15,
          warn: emojis > 15,
          detail: `${emojis} ایموجی`,
        },
      ] : []),
      {
        label: "قابل خواندن",
        pass: charCount > 50,
        warn: false,
        detail: charCount > 50 ? "محتوا کافی است" : "محتوا خیلی کوتاه است",
      },
    ];

    const passCount = checks.filter((c) => c.pass).length;
    const score = Math.round((passCount / checks.length) * 100);

    return { wordCount, charCount, checks, score, kwDensity: kwDensity.toFixed(1), kwCount, ideal };
  }, [text, keyword, platform, language]);

  const scoreColor =
    analysis.score >= 80 ? "from-emerald-500 to-teal-500" :
    analysis.score >= 50 ? "from-amber-500 to-yellow-500" :
    "from-rose-500 to-red-500";

  const scoreTextColor =
    analysis.score >= 80 ? "text-emerald-400" :
    analysis.score >= 50 ? "text-amber-400" :
    "text-rose-400";

  return (
    <div className="bg-white/3 border border-white/8 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="border-b border-white/8 bg-black/20 px-4 py-3 flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-violet-400" />
        <span className="text-white/70 text-sm font-medium">تحلیل SEO</span>
      </div>

      <div className="p-4 space-y-4">
        {/* Score circle */}
        <div className="flex items-center gap-4">
          <div className="relative w-20 h-20 flex-shrink-0">
            <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
              <motion.circle cx="40" cy="40" r="32" fill="none"
                stroke="url(#seoGrad)" strokeWidth="8" strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 32}`}
                initial={{ strokeDashoffset: 2 * Math.PI * 32 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 32 * (1 - analysis.score / 100) }}
                transition={{ duration: 1.2, ease: "easeOut" }} />
              <defs>
                <linearGradient id="seoGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#6366f1" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                className={`text-2xl font-bold ${scoreTextColor}`}>{analysis.score}</motion.span>
              <span className="text-white/20 text-[10px]">امتیاز</span>
            </div>
          </div>
          <div>
            <p className={`font-semibold ${scoreTextColor}`}>
              {analysis.score >= 80 ? "عالی" : analysis.score >= 60 ? "خوب" : analysis.score >= 40 ? "متوسط" : "نیاز به بهبود"}
            </p>
            <p className="text-white/30 text-xs mt-0.5">{analysis.wordCount} کلمه · {analysis.charCount} کاراکتر</p>
            {keyword && <p className="text-white/30 text-xs">{analysis.kwCount} تکرار کلمه کلیدی ({analysis.kwDensity}%)</p>}
          </div>
        </div>

        {/* Checks */}
        <div className="space-y-2">
          {analysis.checks.map((check, i) => (
            <motion.div key={check.label}
              initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className={`flex items-start gap-2.5 p-2.5 rounded-xl border ${
                check.pass ? "bg-emerald-500/5 border-emerald-500/15" :
                check.warn ? "bg-amber-500/5 border-amber-500/15" :
                "bg-rose-500/5 border-rose-500/15"
              }`}>
              {check.pass ? <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" /> :
               check.warn ? <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" /> :
               <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />}
              <div>
                <p className="text-white/70 text-xs font-medium">{check.label}</p>
                <p className="text-white/30 text-xs">{check.detail}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
