"use client";

import { useState } from "react";
import { Globe, Twitter, Search, Settings2, BarChart3, Link2, Eye, EyeOff } from "lucide-react";
import { SeoPreview } from "./SeoPreview";
import { SeoAnalyzer } from "./SeoAnalyzer";
import { cn } from "@/lib/utils";

export interface SeoData {
  // کلمه کلیدی
  focusKeyword: string;
  // SEO پایه
  seoTitle: string;
  seoDesc: string;
  seoKeywords: string;
  canonicalUrl: string;
  // Robots
  noIndex: boolean;
  noFollow: boolean;
  // OG
  ogTitle: string;
  ogDesc: string;
  ogImage: string;
  // Twitter
  twitterTitle: string;
  twitterDesc: string;
  twitterImage: string;
  twitterCard: string;
  // Schema
  schemaType: string;
  // Sitemap
  sitemapPriority: number;
  sitemapChangeFreq: string;
}

interface Props {
  data: SeoData;
  onChange: (data: Partial<SeoData>) => void;
  // برای analyzer
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  readingTime: number;
}

const TABS = [
  { id: "analyze", label: "آنالیز", icon: BarChart3 },
  { id: "basic", label: "پایه", icon: Search },
  { id: "social", label: "شبکه اجتماعی", icon: Twitter },
  { id: "advanced", label: "پیشرفته", icon: Settings2 },
  { id: "preview", label: "پیش‌نمایش", icon: Eye },
] as const;

const SCHEMA_TYPES = ["BlogPosting", "Article", "HowTo", "FAQPage", "NewsArticle", "TechArticle"];
const CHANGE_FREQS = ["always", "hourly", "daily", "weekly", "monthly", "yearly", "never"];
const CHANGE_FREQ_LABELS: Record<string, string> = {
  always: "همیشه", hourly: "ساعتی", daily: "روزانه",
  weekly: "هفتگی", monthly: "ماهانه", yearly: "سالانه", never: "هرگز",
};

export function SeoPanel({ data, onChange, title, slug, excerpt, content, coverImage, readingTime }: Props) {
  const [tab, setTab] = useState<typeof TABS[number]["id"]>("analyze");

  const inputCls = "w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white/70 text-sm focus:outline-none focus:border-violet-500/50 transition-colors placeholder:text-white/20";
  const labelCls = "block text-xs font-medium text-white/40 mb-1.5";
  const hintCls = "text-[10px] text-white/25 mt-1";

  const effectiveTitle = data.seoTitle || title;
  const effectiveDesc = data.seoDesc || excerpt;

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-0.5">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all shrink-0",
              tab === id ? "bg-violet-600/25 text-violet-300 border border-violet-500/30" : "text-white/40 hover:text-white/70 hover:bg-white/5"
            )}>
            <Icon className="w-3 h-3" />{label}
          </button>
        ))}
      </div>

      {/* ── آنالیز SEO (Yoast-style) ─────────────────────────── */}
      {tab === "analyze" && (
        <div className="space-y-4">
          {/* Focus keyword input */}
          <div>
            <label className={labelCls}>کلمه کلیدی اصلی (Focus Keyword)</label>
            <input value={data.focusKeyword} onChange={e => onChange({ focusKeyword: e.target.value })}
              placeholder="مثال: طراحی سایت، Next.js، CRM"
              className={inputCls} />
            <p className={hintCls}>مهم‌ترین کلیدواژه‌ای که می‌خوای برای آن رتبه بگیری</p>
          </div>
          <SeoAnalyzer
            title={title} slug={slug} excerpt={excerpt} content={content}
            focusKeyword={data.focusKeyword} seoTitle={data.seoTitle} seoDesc={data.seoDesc}
            coverImage={coverImage} readingTime={readingTime}
          />
        </div>
      )}

      {/* ── SEO پایه ────────────────────────────────────────── */}
      {tab === "basic" && (
        <div className="space-y-4">
          <div>
            <label className={labelCls}>
              عنوان SEO (Title Tag)
              <span className={`mr-2 ${(data.seoTitle || title).length > 60 ? "text-red-400" : "text-green-400"}`}>
                {(data.seoTitle || title).length}/60
              </span>
            </label>
            <input value={data.seoTitle} onChange={e => onChange({ seoTitle: e.target.value })}
              placeholder={title || "عنوان SEO..."} className={inputCls} />
            <p className={hintCls}>اگر خالی بماند، عنوان پست استفاده می‌شود</p>
          </div>

          <div>
            <label className={labelCls}>
              Meta Description
              <span className={`mr-2 ${(data.seoDesc || excerpt).length > 155 ? "text-red-400" : "text-green-400"}`}>
                {(data.seoDesc || excerpt).length}/155
              </span>
            </label>
            <textarea value={data.seoDesc} onChange={e => onChange({ seoDesc: e.target.value })}
              placeholder={excerpt || "توضیح برای موتورهای جستجو..."} rows={3}
              className={inputCls + " resize-none"} />
            <p className={hintCls}>توضیح کوتاه که در نتایج گوگل نمایش داده می‌شود</p>
          </div>

          <div>
            <label className={labelCls}>کلیدواژه‌ها (Keywords)</label>
            <input value={data.seoKeywords} onChange={e => onChange({ seoKeywords: e.target.value })}
              placeholder="keyword1, keyword2, keyword3" dir="ltr" className={inputCls} />
            <p className={hintCls}>کلیدواژه‌های جانبی، جدا با کاما</p>
          </div>

          <div>
            <label className={labelCls}>Canonical URL</label>
            <input value={data.canonicalUrl} onChange={e => onChange({ canonicalUrl: e.target.value })}
              placeholder="https://blog.persicore.ir/..." dir="ltr" className={inputCls} />
            <p className={hintCls}>اگر محتوا جای دیگری هم منتشر شده، آدرس اصلی را وارد کنید</p>
          </div>

          {/* Robots */}
          <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-2">
            <p className="text-xs font-medium text-white/50 mb-2">Robots Meta Tag</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/70">noindex</p>
                <p className="text-[10px] text-white/30">از ایندکس شدن جلوگیری کن</p>
              </div>
              <button onClick={() => onChange({ noIndex: !data.noIndex })}
                className={`w-10 h-5.5 rounded-full transition-colors relative ${data.noIndex ? "bg-red-500" : "bg-white/10"}`}>
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${data.noIndex ? "right-0.5" : "right-5"}`} />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/70">nofollow</p>
                <p className="text-[10px] text-white/30">از دنبال کردن لینک‌ها جلوگیری کن</p>
              </div>
              <button onClick={() => onChange({ noFollow: !data.noFollow })}
                className={`w-10 h-5.5 rounded-full transition-colors relative ${data.noFollow ? "bg-red-500" : "bg-white/10"}`}>
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${data.noFollow ? "right-0.5" : "right-5"}`} />
              </button>
            </div>
            {data.noIndex && (
              <p className="text-[10px] text-red-400 bg-red-500/10 p-2 rounded-lg">
                ⚠️ این صفحه در گوگل ایندکس نخواهد شد
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── شبکه اجتماعی ────────────────────────────────────── */}
      {tab === "social" && (
        <div className="space-y-5">
          {/* Open Graph */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Globe className="w-3.5 h-3.5 text-blue-400" />
              <p className="text-xs font-semibold text-white/60">Open Graph (Facebook, LinkedIn, WhatsApp)</p>
            </div>
            <div className="space-y-3">
              <div>
                <label className={labelCls}>عنوان OG <span className="text-white/20 font-normal">(اختیاری)</span></label>
                <input value={data.ogTitle} onChange={e => onChange({ ogTitle: e.target.value })}
                  placeholder={effectiveTitle} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>توضیح OG</label>
                <textarea value={data.ogDesc} onChange={e => onChange({ ogDesc: e.target.value })}
                  placeholder={effectiveDesc} rows={2} className={inputCls + " resize-none"} />
              </div>
              <div>
                <label className={labelCls}>تصویر OG (1200×630px)</label>
                <input value={data.ogImage} onChange={e => onChange({ ogImage: e.target.value })}
                  placeholder={coverImage || "https://..."} dir="ltr" className={inputCls} />
                {(data.ogImage || coverImage) && (
                  <div className="mt-2 rounded-xl overflow-hidden border border-white/10">
                    <img src={data.ogImage || coverImage} alt="OG" className="w-full h-32 object-cover" />
                    <div className="p-2 bg-[#1b1b2b]">
                      <p className="text-[10px] text-white/40 uppercase">blog.persicore.ir</p>
                      <p className="text-xs text-white font-medium line-clamp-1">{data.ogTitle || effectiveTitle}</p>
                      <p className="text-[10px] text-white/50 line-clamp-1">{data.ogDesc || effectiveDesc}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Twitter */}
          <div className="border-t border-white/10 pt-4">
            <div className="flex items-center gap-2 mb-3">
              <Twitter className="w-3.5 h-3.5 text-sky-400" />
              <p className="text-xs font-semibold text-white/60">Twitter / X Card</p>
            </div>
            <div className="space-y-3">
              <div>
                <label className={labelCls}>نوع کارت</label>
                <select value={data.twitterCard} onChange={e => onChange({ twitterCard: e.target.value })}
                  className={inputCls}>
                  <option value="summary_large_image">Summary Large Image (توصیه شده)</option>
                  <option value="summary">Summary</option>
                  <option value="app">App</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>عنوان Twitter</label>
                <input value={data.twitterTitle} onChange={e => onChange({ twitterTitle: e.target.value })}
                  placeholder={data.ogTitle || effectiveTitle} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>توضیح Twitter</label>
                <textarea value={data.twitterDesc} onChange={e => onChange({ twitterDesc: e.target.value })}
                  placeholder={data.ogDesc || effectiveDesc} rows={2} className={inputCls + " resize-none"} />
              </div>
              <div>
                <label className={labelCls}>تصویر Twitter</label>
                <input value={data.twitterImage} onChange={e => onChange({ twitterImage: e.target.value })}
                  placeholder={data.ogImage || coverImage || "https://..."} dir="ltr" className={inputCls} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── تنظیمات پیشرفته ──────────────────────────────────── */}
      {tab === "advanced" && (
        <div className="space-y-4">
          <div>
            <label className={labelCls}>نوع Schema.org</label>
            <select value={data.schemaType} onChange={e => onChange({ schemaType: e.target.value })}
              className={inputCls}>
              {SCHEMA_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <p className={hintCls}>نوع محتوا برای داده‌های ساختاریافته JSON-LD</p>
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <p className="text-xs font-semibold text-white/50 mb-3">تنظیمات Sitemap</p>
            <div className="space-y-3">
              <div>
                <label className={labelCls}>اولویت (Priority)</label>
                <div className="flex items-center gap-3">
                  <input type="range" min="0" max="1" step="0.1" value={data.sitemapPriority}
                    onChange={e => onChange({ sitemapPriority: Number(e.target.value) })}
                    className="flex-1 accent-violet-500" />
                  <span className="text-sm font-bold text-white/70 w-8 text-center">{data.sitemapPriority}</span>
                </div>
                <p className={hintCls}>۰.۱ (کم اهمیت) تا ۱.۰ (خیلی مهم) — پیش‌فرض: ۰.۷</p>
              </div>
              <div>
                <label className={labelCls}>تناوب تغییر (Change Frequency)</label>
                <select value={data.sitemapChangeFreq} onChange={e => onChange({ sitemapChangeFreq: e.target.value })}
                  className={inputCls}>
                  {CHANGE_FREQS.map(f => <option key={f} value={f}>{CHANGE_FREQ_LABELS[f]}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* JSON-LD preview */}
          <div>
            <p className="text-xs font-semibold text-white/40 mb-2">پیش‌نمایش JSON-LD Schema</p>
            <pre className="text-[10px] text-white/40 bg-black/30 rounded-xl p-3 overflow-x-auto leading-relaxed border border-white/5">
{`{
  "@context": "https://schema.org",
  "@type": "${data.schemaType}",
  "headline": "${(data.seoTitle || title).slice(0, 50)}...",
  "description": "${(data.seoDesc || excerpt).slice(0, 80)}...",
  "url": "https://blog.persicore.ir/${slug}",
  "image": "${data.ogImage || coverImage || ''}",
  "author": { "@type": "Person" },
  "datePublished": "${new Date().toISOString().split('T')[0]}"
}`}
            </pre>
          </div>
        </div>
      )}

      {/* ── پیش‌نمایش ────────────────────────────────────────── */}
      {tab === "preview" && (
        <div className="space-y-4">
          <SeoPreview
            title={data.seoTitle || title}
            description={data.seoDesc || excerpt}
            slug={slug}
            image={data.ogImage || coverImage}
          />
        </div>
      )}
    </div>
  );
}
