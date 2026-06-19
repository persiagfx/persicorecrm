"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "motion/react";
import { ChevronRight, Save, Send, Calendar, Eye, ExternalLink, Trash2 } from "lucide-react";
import Link from "next/link";
import { apiClient } from "@/lib/api/client";
import { toast } from "sonner";
import { BlogEditor } from "@/components/admin/BlogEditor";
import { SeoPanel, type SeoData } from "@/components/admin/SeoPanel";
import { X, Plus, Tag, Folder } from "lucide-react";

interface Category { id: string; name: string; color: string; }

function slugify(t: string) {
  return t.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "").replace(/--+/g, "-").replace(/^-+|-+$/g, "");
}

export default function EditPostPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activePanel, setActivePanel] = useState<"settings" | "seo">("settings");

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [contentType, setContentType] = useState<"rich" | "mdx">("rich");
  const [coverImage, setCoverImage] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [featured, setFeatured] = useState(false);
  const [status, setStatus] = useState("draft");
  const [scheduledAt, setScheduledAt] = useState("");
  const [seo, setSeo] = useState<SeoData>({
    focusKeyword: "", seoTitle: "", seoDesc: "", seoKeywords: "", canonicalUrl: "",
    noIndex: false, noFollow: false,
    ogTitle: "", ogDesc: "", ogImage: "",
    twitterTitle: "", twitterDesc: "", twitterImage: "", twitterCard: "summary_large_image",
    schemaType: "BlogPosting", sitemapPriority: 0.7, sitemapChangeFreq: "weekly",
  });
  const [views, setViews] = useState(0);
  const [readingTime, setReadingTime] = useState(1);

  useEffect(() => {
    Promise.all([
      apiClient.get(`/admin/posts/${id}`),
      apiClient.get("/admin/categories"),
    ]).then(([postRes, catRes]) => {
      const p = postRes.data.data;
      setTitle(p.title); setSlug(p.slug); setExcerpt(p.excerpt ?? "");
      setContent(p.content ?? ""); setContentType(p.contentType ?? "rich");
      setCoverImage(p.coverImage ?? ""); setCategoryId(p.categoryId ?? "");
      setTags(p.tags ?? []); setFeatured(p.featured); setStatus(p.status);
      setScheduledAt(p.scheduledAt ? new Date(p.scheduledAt).toISOString().slice(0, 16) : "");
      setViews(p.views ?? 0); setReadingTime(p.readingTime ?? 1);
      setSeo({
        focusKeyword: p.focusKeyword ?? "", seoTitle: p.seoTitle ?? "",
        seoDesc: p.seoDesc ?? "", seoKeywords: p.seoKeywords ?? "",
        canonicalUrl: p.canonicalUrl ?? "", noIndex: p.noIndex ?? false, noFollow: p.noFollow ?? false,
        ogTitle: p.ogTitle ?? "", ogDesc: p.ogDesc ?? "", ogImage: p.ogImage ?? "",
        twitterTitle: p.twitterTitle ?? "", twitterDesc: p.twitterDesc ?? "",
        twitterImage: p.twitterImage ?? "", twitterCard: p.twitterCard ?? "summary_large_image",
        schemaType: p.schemaType ?? "BlogPosting", sitemapPriority: p.sitemapPriority ?? 0.7,
        sitemapChangeFreq: p.sitemapChangeFreq ?? "weekly",
      });
      setCategories(catRes.data.data ?? []);
    }).catch(() => toast.error("خطا در دریافت پست"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleCoverUpload = async (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await apiClient.post("/upload", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setCoverImage(res.data.data?.url ?? "");
    } catch { toast.error("خطا در آپلود"); }
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) setTags(prev => [...prev, t]);
    setTagInput("");
  };

  const save = useCallback(async (newStatus?: string) => {
    setSaving(true);
    try {
      await apiClient.put(`/admin/posts/${id}`, {
        title, slug, excerpt, content, contentType,
        coverImage: coverImage || undefined, categoryId: categoryId || undefined,
        tags, featured, status: newStatus ?? status,
        scheduledAt: scheduledAt || undefined,
        readingTime,
        ...seo,
        ogImage: seo.ogImage || coverImage || undefined,
      });
      if (newStatus) setStatus(newStatus);
      toast.success(newStatus === "published" ? "پست منتشر شد! 🎉" : "ذخیره شد ✓");
    } catch (e: any) {
      toast.error(e?.response?.data?.error ?? "خطا در ذخیره");
    } finally { setSaving(false); }
  }, [id, title, slug, excerpt, content, contentType, coverImage, categoryId, tags, featured, status, seo, scheduledAt, readingTime]);

  const handleDelete = async () => {
    if (!confirm("آیا مطمئنید؟")) return;
    await apiClient.delete(`/admin/posts/${id}`);
    toast.success("حذف شد");
    router.push("/admin/blog");
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center">
      <div className="w-8 h-8 rounded-xl bg-violet-600/20 animate-pulse" />
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0f]" dir="rtl">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-white/10 bg-[#0f0f14] shrink-0 z-20">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Link href="/admin/blog" className="text-white/30 hover:text-white transition-colors shrink-0">
            <ChevronRight className="w-5 h-5 rotate-180" />
          </Link>
          <input value={title} onChange={e => setTitle(e.target.value)}
            className="bg-transparent text-white text-lg font-bold placeholder:text-white/20 focus:outline-none flex-1 min-w-0 truncate" />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="flex items-center gap-1 text-xs text-white/30">
            <Eye className="w-3 h-3" />{views}
          </span>
          {status === "published" && (
            <a href={`https://blog.persicore.ir/${slug}`} target="_blank" rel="noreferrer"
              className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 px-2 py-1.5 rounded-lg hover:bg-violet-500/10">
              <ExternalLink className="w-3 h-3" />مشاهده
            </a>
          )}
          <button onClick={() => save()} disabled={saving}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 text-white/70 text-sm hover:bg-white/15 disabled:opacity-50">
            <Save className="w-3.5 h-3.5" />ذخیره
          </button>
          {status !== "published" && (
            <button onClick={() => save("published")} disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50">
              <Send className="w-4 h-4" />انتشار
            </button>
          )}
          <button onClick={handleDelete} className="p-2 rounded-xl hover:bg-red-500/10 text-white/30 hover:text-red-400">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Editor */}
        <div className="flex-1 overflow-y-auto">
          {/* Cover */}
          <div className="relative">
            {coverImage ? (
              <div className="relative h-64 group">
                <img src={coverImage} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <label className="px-4 py-2 rounded-xl bg-white/20 text-white text-sm cursor-pointer">
                    تغییر<input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleCoverUpload(e.target.files[0])} />
                  </label>
                  <button onClick={() => setCoverImage("")} className="px-4 py-2 rounded-xl bg-red-500/80 text-white text-sm">حذف</button>
                </div>
              </div>
            ) : (
              <label className="flex items-center gap-3 p-6 border-b border-white/5 cursor-pointer hover:bg-white/[0.02] transition-colors">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                  <Save className="w-4 h-4 text-white/20" />
                </div>
                <p className="text-sm text-white/30">آپلود کاور</p>
                <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleCoverUpload(e.target.files[0])} />
              </label>
            )}
          </div>
          <div className="px-10 py-4 border-b border-white/5">
            <textarea value={excerpt} onChange={e => setExcerpt(e.target.value)} placeholder="خلاصه..." rows={2}
              className="w-full bg-transparent text-white/60 text-sm placeholder:text-white/20 focus:outline-none resize-none" />
          </div>
          <div className="px-10 pt-4 flex gap-2">
            {(["rich", "mdx"] as const).map(t => (
              <button key={t} onClick={() => setContentType(t)}
                className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${contentType === t ? "bg-violet-600/20 border-violet-500/30 text-violet-300" : "border-white/10 text-white/30"}`}>
                {t === "rich" ? "Rich Text" : "MDX"}
              </button>
            ))}
          </div>
          <div className="px-6 py-4">
            <BlogEditor content={content} onChange={setContent} contentType={contentType} />
          </div>
        </div>

        {/* Right panel */}
        <div className="w-80 shrink-0 border-r border-white/10 bg-[#0f0f14] overflow-y-auto">
          <div className="flex border-b border-white/10">
            {(["settings", "seo"] as const).map(t => (
              <button key={t} onClick={() => setActivePanel(t)}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${activePanel === t ? "text-white border-b-2 border-violet-500" : "text-white/30 hover:text-white/60"}`}>
                {t === "settings" ? "⚙️ تنظیمات" : "🔍 SEO"}
              </button>
            ))}
          </div>
          <div className="p-4 space-y-5">
            {activePanel === "settings" && (
              <>
                <div>
                  <label className="block text-xs text-white/40 mb-1.5">Slug</label>
                  <input value={slug} onChange={e => setSlug(e.target.value)} dir="ltr"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white/70 focus:outline-none focus:border-violet-500/50" />
                  <p className="text-[10px] text-white/20 mt-1">blog.persicore.ir/{slug}</p>
                </div>
                <div>
                  <label className="block text-xs text-white/40 mb-1.5 flex items-center gap-1"><Folder className="w-3 h-3" />دسته</label>
                  <select value={categoryId} onChange={e => setCategoryId(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white/70 focus:outline-none">
                    <option value="">بدون دسته</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-white/40 mb-1.5 flex items-center gap-1"><Tag className="w-3 h-3" />تگ‌ها</label>
                  <div className="flex gap-2">
                    <input value={tagInput} onChange={e => setTagInput(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(); } }}
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white/70 focus:outline-none" placeholder="تگ..." />
                    <button onClick={addTag} className="p-2 rounded-xl bg-violet-600/20 text-violet-400"><Plus className="w-4 h-4" /></button>
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
                  <p className="text-sm text-white/70">پست ویژه</p>
                  <button onClick={() => setFeatured(!featured)}
                    className={`w-11 h-6 rounded-full transition-colors relative ${featured ? "bg-violet-600" : "bg-white/10"}`}>
                    <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${featured ? "right-1" : "right-5"}`} />
                  </button>
                </div>
                <div>
                  <label className="block text-xs text-white/40 mb-1.5">زمان‌بندی</label>
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
