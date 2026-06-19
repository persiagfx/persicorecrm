"use client";

import { useState, useCallback, useEffect } from "react";
import { motion } from "motion/react";
import {
  ChevronRight, Image as ImageIcon, Tag, Folder,
  Save, Send, X, Plus, Calendar, Settings, Search as SearchIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api/client";
import { toast } from "sonner";
import { BlogEditor } from "@/components/admin/BlogEditor";
import { SeoPanel, type SeoData } from "@/components/admin/SeoPanel";

interface Category { id: string; name: string; color: string; }

function slugify(text: string) {
  return text.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "").replace(/--+/g, "-").replace(/^-+|-+$/g, "");
}

const DEFAULT_SEO: SeoData = {
  focusKeyword: "", seoTitle: "", seoDesc: "", seoKeywords: "", canonicalUrl: "",
  noIndex: false, noFollow: false,
  ogTitle: "", ogDesc: "", ogImage: "",
  twitterTitle: "", twitterDesc: "", twitterImage: "", twitterCard: "summary_large_image",
  schemaType: "BlogPosting", sitemapPriority: 0.7, sitemapChangeFreq: "weekly",
};

export default function NewPostPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);
  const [activePanel, setActivePanel] = useState<"settings" | "seo">("settings");
  const [readingTime, setReadingTime] = useState(0);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugManual, setSlugManual] = useState(false);
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [contentType, setContentType] = useState<"rich" | "mdx">("rich");
  const [coverImage, setCoverImage] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [featured, setFeatured] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  const [seo, setSeo] = useState<SeoData>(DEFAULT_SEO);

  useEffect(() => {
    apiClient.get("/admin/categories").then(r => setCategories(r.data.data ?? [])).catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    if (!slugManual && title) setSlug(slugify(title));
  }, [title, slugManual]);

  // auto reading time
  useEffect(() => {
    const text = content.replace(/<[^>]+>/g, " ");
    const words = text.trim().split(/\s+/).length;
    setReadingTime(Math.max(1, Math.ceil(words / 200)));
  }, [content]);

  const handleCoverUpload = async (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await apiClient.post("/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setCoverImage(res.data.data?.url ?? "");
    } catch { toast.error("خطا در آپلود تصویر"); }
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) setTags(prev => [...prev, t]);
    setTagInput("");
  };

  const save = useCallback(async (status: "draft" | "published" | "scheduled") => {
    if (!title.trim()) { toast.error("عنوان الزامی است"); return; }
    setSaving(true);
    try {
      const payload = {
        title, slug, excerpt, content, contentType,
        coverImage: coverImage || undefined, categoryId: categoryId || undefined,
        tags, featured, status, readingTime,
        scheduledAt: status === "scheduled" && scheduledAt ? scheduledAt : undefined,
        ...seo,
        ogImage: seo.ogImage || coverImage || undefined,
      };
      const res = await apiClient.post("/admin/posts", payload);
      toast.success(status === "published" ? "پست منتشر شد! 🎉" : "ذخیره شد ✓");
      router.push(`/admin/blog/${res.data.data.id}`);
    } catch (e: any) {
      toast.error(e?.response?.data?.error ?? "خطا در ذخیره");
    } finally { setSaving(false); }
  }, [title, slug, excerpt, content, contentType, coverImage, categoryId, tags, featured, seo, scheduledAt, readingTime, router]);

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0f]" dir="rtl">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-white/10 bg-[#0f0f14] shrink-0 z-20">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Link href="/admin/blog" className="text-white/30 hover:text-white transition-colors shrink-0">
            <ChevronRight className="w-5 h-5 rotate-180" />
          </Link>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="عنوان پست را بنویسید..."
            className="bg-transparent text-white text-lg font-bold placeholder:text-white/20 focus:outline-none flex-1 min-w-0" />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => save("draft")} disabled={saving}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 text-white/70 text-sm hover:bg-white/15 disabled:opacity-50">
            <Save className="w-3.5 h-3.5" />پیش‌نویس
          </button>
          {scheduledAt ? (
            <button onClick={() => save("scheduled")} disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
              <Calendar className="w-4 h-4" />زمان‌بندی
            </button>
          ) : (
            <button onClick={() => save("published")} disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50">
              <Send className="w-4 h-4" />انتشار
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Editor */}
        <div className="flex-1 overflow-y-auto">
          {/* Cover */}
          <div className="relative">
            {coverImage ? (
              <div className="relative h-64 group">
                <img src={coverImage} alt="cover" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <label className="px-4 py-2 rounded-xl bg-white/20 text-white text-sm cursor-pointer hover:bg-white/30">
                    تغییر<input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleCoverUpload(e.target.files[0])} />
                  </label>
                  <button onClick={() => setCoverImage("")} className="px-4 py-2 rounded-xl bg-red-500/80 text-white text-sm">حذف</button>
                </div>
              </div>
            ) : (
              <label className="flex flex-col items-center gap-3 p-10 border-b border-white/5 cursor-pointer hover:bg-white/[0.02] group">
                <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-violet-500/10 transition-colors">
                  <ImageIcon className="w-6 h-6 text-white/20 group-hover:text-violet-400" />
                </div>
                <p className="text-sm text-white/30">تصویر کاور را آپلود کنید</p>
                <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleCoverUpload(e.target.files[0])} />
              </label>
            )}
          </div>

          <div className="px-10 py-4 border-b border-white/5">
            <textarea value={excerpt} onChange={e => setExcerpt(e.target.value)} placeholder="خلاصه کوتاه پست..."
              rows={2} className="w-full bg-transparent text-white/60 text-sm placeholder:text-white/20 focus:outline-none resize-none leading-relaxed" />
          </div>

          <div className="px-10 pt-4 flex gap-2">
            {(["rich", "mdx"] as const).map(t => (
              <button key={t} onClick={() => setContentType(t)}
                className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${contentType === t ? "bg-violet-600/20 border-violet-500/30 text-violet-300" : "border-white/10 text-white/30 hover:border-white/20"}`}>
                {t === "rich" ? "Rich Text" : "MDX"}
              </button>
            ))}
          </div>

          <div className="px-6 py-4">
            <BlogEditor content={content} onChange={setContent} contentType={contentType} />
          </div>
        </div>

        {/* Right panel */}
        <div className="w-80 shrink-0 border-r border-white/10 bg-[#0f0f14] flex flex-col overflow-hidden">
          {/* Panel tabs */}
          <div className="flex border-b border-white/10 shrink-0">
            {([
              { id: "settings", label: "⚙️ تنظیمات", icon: Settings },
              { id: "seo", label: "🔍 SEO", icon: SearchIcon },
            ] as const).map(({ id, label }) => (
              <button key={id} onClick={() => setActivePanel(id as any)}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${activePanel === id ? "text-white border-b-2 border-violet-500" : "text-white/30 hover:text-white/60"}`}>
                {label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            {activePanel === "settings" && (
              <>
                <div>
                  <label className="block text-xs font-medium text-white/40 mb-1.5">Slug URL</label>
                  <input value={slug} onChange={e => { setSlug(e.target.value); setSlugManual(true); }} dir="ltr"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white/70 focus:outline-none focus:border-violet-500/50" />
                  <p className="text-[10px] text-white/20 mt-1">blog.persicore.ir/{slug || "..."}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/40 mb-1.5 flex items-center gap-1.5"><Folder className="w-3 h-3" />دسته</label>
                  <select value={categoryId} onChange={e => setCategoryId(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white/70 focus:outline-none">
                    <option value="">بدون دسته</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/40 mb-1.5 flex items-center gap-1.5"><Tag className="w-3 h-3" />تگ‌ها</label>
                  <div className="flex gap-2">
                    <input value={tagInput} onChange={e => setTagInput(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(); } }}
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white/70 focus:outline-none" placeholder="تگ..." />
                    <button onClick={addTag} className="p-2 rounded-xl bg-violet-600/20 text-violet-400 hover:bg-violet-600/30">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {tags.map(t => (
                        <span key={t} className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-violet-600/15 text-violet-300 border border-violet-500/20">
                          {t}<button onClick={() => setTags(p => p.filter(x => x !== t))}><X className="w-2.5 h-2.5" /></button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                  <div>
                    <p className="text-sm text-white/70">پست ویژه</p>
                    <p className="text-xs text-white/30">در hero homepage</p>
                  </div>
                  <button onClick={() => setFeatured(!featured)}
                    className={`w-11 h-6 rounded-full transition-colors relative ${featured ? "bg-violet-600" : "bg-white/10"}`}>
                    <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${featured ? "right-1" : "right-5"}`} />
                  </button>
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/40 mb-1.5 flex items-center gap-1"><Calendar className="w-3 h-3" />زمان‌بندی</label>
                  <input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} dir="ltr"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white/70 focus:outline-none" />
                </div>
              </>
            )}

            {activePanel === "seo" && (
              <SeoPanel
                data={seo}
                onChange={partial => setSeo(prev => ({ ...prev, ...partial }))}
                title={title} slug={slug} excerpt={excerpt} content={content}
                coverImage={coverImage} readingTime={readingTime}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
