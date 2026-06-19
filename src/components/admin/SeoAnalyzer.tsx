"use client";

import { useMemo } from "react";
import { CheckCircle2, XCircle, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface SeoCheck {
  id: string;
  label: string;
  status: "good" | "warning" | "error" | "info";
  message: string;
}

interface Props {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  focusKeyword: string;
  seoTitle: string;
  seoDesc: string;
  coverImage: string;
  readingTime: number;
}

function getTextFromHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function countWords(text: string): number {
  return text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
}

function keywordDensity(text: string, kw: string): number {
  if (!kw || !text) return 0;
  const count = (text.toLowerCase().match(new RegExp(kw.toLowerCase(), "g")) ?? []).length;
  const words = countWords(text);
  return words > 0 ? (count / words) * 100 : 0;
}

export function SeoAnalyzer({ title, slug, excerpt, content, focusKeyword, seoTitle, seoDesc, coverImage, readingTime }: Props) {
  const bodyText = useMemo(() => getTextFromHtml(content), [content]);
  const wordCount = useMemo(() => countWords(bodyText), [bodyText]);

  const checks = useMemo<SeoCheck[]>(() => {
    const kw = focusKeyword.trim().toLowerCase();
    const results: SeoCheck[] = [];

    // ─── Focus Keyword ───────────────────────────────────────────
    if (!kw) {
      results.push({ id: "kw-set", label: "کلمه کلیدی اصلی", status: "error", message: "کلمه کلیدی اصلی تنظیم نشده است" });
    } else {
      results.push({ id: "kw-set", label: "کلمه کلیدی اصلی", status: "good", message: `کلمه کلیدی: «${focusKeyword}»` });

      // در عنوان
      const inTitle = title.toLowerCase().includes(kw);
      results.push({ id: "kw-title", label: "کلمه کلیدی در عنوان", status: inTitle ? "good" : "error", message: inTitle ? "✓ عنوان شامل کلمه کلیدی است" : "عنوان شامل کلمه کلیدی نیست" });

      // در meta description
      const inDesc = (seoDesc || excerpt).toLowerCase().includes(kw);
      results.push({ id: "kw-desc", label: "کلمه کلیدی در Meta Description", status: inDesc ? "good" : "warning", message: inDesc ? "✓ توضیح شامل کلمه کلیدی است" : "توضیح Meta شامل کلمه کلیدی نیست" });

      // در slug
      const inSlug = slug.toLowerCase().includes(kw.replace(/\s+/g, "-"));
      results.push({ id: "kw-slug", label: "کلمه کلیدی در URL", status: inSlug ? "good" : "warning", message: inSlug ? "✓ URL شامل کلمه کلیدی است" : "URL شامل کلمه کلیدی نیست" });

      // چگالی در محتوا
      const density = keywordDensity(bodyText, kw);
      const densityStatus = density === 0 ? "error" : density < 0.5 ? "warning" : density > 4 ? "warning" : "good";
      results.push({
        id: "kw-density",
        label: "چگالی کلمه کلیدی",
        status: densityStatus,
        message: density === 0
          ? "کلمه کلیدی در محتوا استفاده نشده"
          : density < 0.5
          ? `چگالی ${density.toFixed(1)}% — کم است (توصیه: ۱-۳%)`
          : density > 4
          ? `چگالی ${density.toFixed(1)}% — زیاد است (توصیه: ۱-۳%)`
          : `چگالی ${density.toFixed(1)}% — مناسب`
      });

      // در اولین پاراگراف
      const firstParagraph = bodyText.slice(0, 200).toLowerCase();
      const inFirst = firstParagraph.includes(kw);
      results.push({ id: "kw-first", label: "کلمه کلیدی در مقدمه", status: inFirst ? "good" : "warning", message: inFirst ? "✓ در ۲۰۰ کاراکتر اول ذکر شده" : "کلمه کلیدی در مقدمه مقاله نیست" });
    }

    // ─── SEO Title ───────────────────────────────────────────────
    const effectiveTitle = seoTitle || title;
    const titleLen = effectiveTitle.length;
    results.push({
      id: "title-len",
      label: "طول عنوان SEO",
      status: titleLen === 0 ? "error" : titleLen < 30 ? "warning" : titleLen > 60 ? "warning" : "good",
      message: titleLen === 0 ? "عنوان SEO تنظیم نشده" : titleLen < 30 ? `${titleLen} کاراکتر — کوتاه است (۳۰-۶۰)` : titleLen > 60 ? `${titleLen} کاراکتر — بلند است (۳۰-۶۰)` : `${titleLen} کاراکتر — مناسب`
    });

    // ─── Meta Description ────────────────────────────────────────
    const effectiveDesc = seoDesc || excerpt;
    const descLen = effectiveDesc.length;
    results.push({
      id: "desc-len",
      label: "طول Meta Description",
      status: descLen === 0 ? "error" : descLen < 70 ? "warning" : descLen > 155 ? "warning" : "good",
      message: descLen === 0 ? "Meta Description تنظیم نشده" : descLen < 70 ? `${descLen} کاراکتر — کوتاه است (۷۰-۱۵۵)` : descLen > 155 ? `${descLen} کاراکتر — بلند است (۷۰-۱۵۵)` : `${descLen} کاراکتر — مناسب`
    });

    // ─── محتوا ───────────────────────────────────────────────────
    results.push({
      id: "word-count",
      label: "طول محتوا",
      status: wordCount === 0 ? "error" : wordCount < 300 ? "error" : wordCount < 600 ? "warning" : "good",
      message: wordCount === 0 ? "محتوایی نوشته نشده" : wordCount < 300 ? `${wordCount} کلمه — بسیار کم (حداقل ۳۰۰)` : wordCount < 600 ? `${wordCount} کلمه — کم (توصیه: ۶۰۰+)` : `${wordCount} کلمه — مناسب`
    });

    // هدینگ H2
    const h2Count = (content.match(/<h2/gi) ?? []).length;
    results.push({
      id: "h2-count",
      label: "استفاده از H2",
      status: h2Count === 0 ? "warning" : "good",
      message: h2Count === 0 ? "محتوا هیچ H2 ندارد" : `${h2Count} عنوان H2 — خوب`
    });

    // لینک داخلی
    const internalLinks = (content.match(/href="\/[^"]*"/gi) ?? []).length;
    results.push({
      id: "internal-links",
      label: "لینک‌های داخلی",
      status: internalLinks === 0 ? "warning" : "good",
      message: internalLinks === 0 ? "لینک داخلی ندارد — توصیه: حداقل ۱ لینک" : `${internalLinks} لینک داخلی`
    });

    // تصویر alt
    const imgWithoutAlt = (content.match(/<img(?![^>]*alt=)[^>]*>/gi) ?? []).length;
    results.push({
      id: "img-alt",
      label: "alt تصاویر",
      status: imgWithoutAlt > 0 ? "warning" : "good",
      message: imgWithoutAlt > 0 ? `${imgWithoutAlt} تصویر بدون alt text` : "همه تصاویر alt دارند"
    });

    // ─── تصویر اصلی ─────────────────────────────────────────────
    results.push({
      id: "cover-image",
      label: "تصویر کاور (OG Image)",
      status: coverImage ? "good" : "warning",
      message: coverImage ? "✓ تصویر کاور تنظیم شده" : "تصویر کاور ندارد — برای شبکه اجتماعی مهم است"
    });

    // ─── Slug ────────────────────────────────────────────────────
    results.push({
      id: "slug-len",
      label: "طول URL",
      status: !slug ? "error" : slug.length > 75 ? "warning" : "good",
      message: !slug ? "Slug تنظیم نشده" : slug.length > 75 ? `Slug بلند است (${slug.length} کاراکتر)` : `Slug مناسب (${slug.length} کاراکتر)`
    });

    // ─── زمان مطالعه ────────────────────────────────────────────
    results.push({
      id: "reading-time",
      label: "زمان مطالعه",
      status: readingTime < 1 ? "info" : "good",
      message: readingTime < 1 ? "محتوا کافی نیست" : `${readingTime} دقیقه — در Schema نمایش داده می‌شود`
    });

    return results;
  }, [title, slug, excerpt, content, focusKeyword, seoTitle, seoDesc, coverImage, readingTime, bodyText, wordCount]);

  const score = useMemo(() => {
    const good = checks.filter(c => c.status === "good").length;
    const total = checks.filter(c => c.status !== "info").length;
    return total > 0 ? Math.round((good / total) * 100) : 0;
  }, [checks]);

  const scoreColor = score >= 80 ? "text-green-400" : score >= 50 ? "text-yellow-400" : "text-red-400";
  const scoreBg = score >= 80 ? "bg-green-500" : score >= 50 ? "bg-yellow-500" : "bg-red-500";

  const grouped = {
    error: checks.filter(c => c.status === "error"),
    warning: checks.filter(c => c.status === "warning"),
    good: checks.filter(c => c.status === "good"),
    info: checks.filter(c => c.status === "info"),
  };

  return (
    <div className="space-y-4">
      {/* Score */}
      <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
        <div className="relative w-16 h-16 shrink-0">
          <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="26" fill="none" stroke="currentColor" strokeWidth="6" className="text-white/10" />
            <circle cx="32" cy="32" r="26" fill="none" strokeWidth="6"
              strokeDasharray={`${score * 1.634} 163.4`}
              strokeLinecap="round"
              className={scoreBg.replace("bg-", "stroke-")} />
          </svg>
          <span className={`absolute inset-0 flex items-center justify-center text-lg font-black ${scoreColor}`}>
            {score}
          </span>
        </div>
        <div>
          <p className="font-bold text-white text-sm">امتیاز SEO</p>
          <p className={`text-xs mt-0.5 ${scoreColor}`}>
            {score >= 80 ? "عالی" : score >= 60 ? "خوب" : score >= 40 ? "متوسط" : "نیاز به بهبود"}
          </p>
          <p className="text-[10px] text-white/30 mt-1">
            {grouped.good.length} خوب · {grouped.warning.length} هشدار · {grouped.error.length} خطا
          </p>
        </div>
      </div>

      {/* Checks list */}
      {grouped.error.length > 0 && (
        <CheckGroup title="مشکلات" items={grouped.error} />
      )}
      {grouped.warning.length > 0 && (
        <CheckGroup title="هشدارها" items={grouped.warning} />
      )}
      {grouped.good.length > 0 && (
        <CheckGroup title="موارد خوب" items={grouped.good} collapsed />
      )}
      {grouped.info.length > 0 && (
        <CheckGroup title="اطلاعات" items={grouped.info} collapsed />
      )}
    </div>
  );
}

function CheckGroup({ title, items, collapsed = false }: { title: string; items: SeoCheck[]; collapsed?: boolean }) {
  const statusConfig = {
    good: { icon: CheckCircle2, color: "text-green-400", bg: "bg-green-500/10" },
    warning: { icon: AlertCircle, color: "text-yellow-400", bg: "bg-yellow-500/10" },
    error: { icon: XCircle, color: "text-red-400", bg: "bg-red-500/10" },
    info: { icon: Info, color: "text-blue-400", bg: "bg-blue-500/10" },
  };

  return (
    <div>
      <p className="text-[10px] font-semibold text-white/30 uppercase tracking-wider mb-2">{title} ({items.length})</p>
      <div className="space-y-1.5">
        {items.map(check => {
          const cfg = statusConfig[check.status];
          const Icon = cfg.icon;
          return (
            <div key={check.id} className={`flex items-start gap-2.5 p-2.5 rounded-xl ${cfg.bg}`}>
              <Icon className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${cfg.color}`} />
              <div className="min-w-0 flex-1">
                <p className={`text-xs font-medium ${cfg.color}`}>{check.label}</p>
                <p className="text-[10px] text-white/50 mt-0.5 leading-relaxed">{check.message}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
