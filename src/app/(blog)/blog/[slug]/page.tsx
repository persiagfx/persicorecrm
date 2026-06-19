"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  Clock, Eye, Calendar, Share2, Copy, ArrowRight,
  Twitter, Linkedin, AlignLeft, X, MessageSquare, Send, User, Mail, Loader2,
} from "lucide-react";
import Link from "next/link";
import { buildJsonLd, buildBreadcrumbJsonLd } from "./metadata";
import { ReadingProgress } from "@/components/blog/ReadingProgress";
import { BlogCard } from "@/components/blog/BlogCard";
import { toast } from "sonner";

interface Post {
  id: string; title: string; slug: string; excerpt: string | null;
  content: string; contentType: string;
  schemaType?: string; canonicalUrl?: string | null;
  noIndex?: boolean; noFollow?: boolean;
  seoTitle?: string | null; seoDesc?: string | null;
  ogTitle?: string | null; ogDesc?: string | null; ogImage?: string | null;
  coverImage: string | null; publishedAt: string | null;
  readingTime: number; views: number; featured: boolean;
  tags: string[];
  author: { id: string; name: string; avatar: string | null };
  category: { name: string; slug: string; color: string } | null;
  related: {
    id: string; title: string; slug: string; excerpt: string | null;
    coverImage: string | null; publishedAt: string | null;
    readingTime: number; views: number; featured: boolean;
    author: { name: string; avatar: string | null };
    category: { name: string; slug: string; color: string } | null;
    tags: string[];
  }[];
}

interface TocItem { id: string; text: string; level: number; }

interface BlogComment {
  id: string;
  authorName: string;
  content: string;
  createdAt: string;
}

function extractToc(html: string): TocItem[] {
  const regex = /<h([23])[^>]*id="([^"]*)"[^>]*>(.*?)<\/h[23]>/gi;
  const items: TocItem[] = [];
  let match;
  while ((match = regex.exec(html)) !== null) {
    items.push({
      level: parseInt(match[1]),
      id: match[2],
      text: match[3].replace(/<[^>]+>/g, ""),
    });
  }
  return items;
}

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [tocOpen, setTocOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const contentRef = useRef<HTMLDivElement>(null);

  // Comments state
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [commentForm, setCommentForm] = useState({ authorName: "", authorEmail: "", content: "" });
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [commentSubmitted, setCommentSubmitted] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/blog/posts/${slug}`)
      .then(r => r.json())
      .then(d => {
        if (!d.data) { router.replace("/blog"); return; }
        setPost(d.data);
      })
      .finally(() => setLoading(false));
  }, [slug, router]);

  // Fetch approved comments once post is loaded
  useEffect(() => {
    if (!post?.id) return;
    fetch(`/api/blog/comments?postId=${post.id}`)
      .then(r => r.json())
      .then(d => { if (Array.isArray(d.data)) setComments(d.data); })
      .catch(() => {});
  }, [post?.id]);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!post?.id) return;
    setCommentSubmitting(true);
    setCommentError(null);
    try {
      const res = await fetch("/api/blog/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: post.id, ...commentForm }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCommentError(data.error ?? "خطایی رخ داد");
      } else {
        setCommentSubmitted(true);
        setCommentForm({ authorName: "", authorEmail: "", content: "" });
      }
    } catch {
      setCommentError("خطا در ارتباط با سرور");
    } finally {
      setCommentSubmitting(false);
    }
  };

  // Active TOC section on scroll
  useEffect(() => {
    if (!post) return;
    const toc = extractToc(post.content);
    if (!toc.length) return;

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { rootMargin: "-100px 0px -60% 0px" }
    );

    toc.forEach(item => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [post]);

  const share = async (platform?: string) => {
    const url = window.location.href;
    const text = post?.title ?? "";
    if (platform === "twitter") window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`);
    else if (platform === "linkedin") window.open(`https://linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`);
    else {
      await navigator.clipboard.writeText(url);
      toast.success("لینک کپی شد!");
    }
  };

  if (loading) return (
    <div className="max-w-3xl mx-auto px-6 py-20 space-y-6 animate-pulse">
      <div className="h-8 bg-muted rounded-xl w-3/4" />
      <div className="h-4 bg-muted rounded w-full" />
      <div className="h-[400px] bg-muted rounded-2xl" />
      <div className="space-y-3">
        {[...Array(8)].map((_, i) => <div key={i} className="h-4 bg-muted rounded" style={{ width: `${70 + Math.random() * 30}%` }} />)}
      </div>
    </div>
  );

  if (!post) return null;

  const toc = extractToc(post.content);
  const formattedDate = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString("fa-IR", { year: "numeric", month: "long", day: "numeric" })
    : "";

  return (
    <>
      <ReadingProgress />

      {/* JSON-LD Structured Data */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: buildJsonLd({ ...post, schemaType: post.schemaType ?? "BlogPosting" }) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: buildBreadcrumbJsonLd(post) }} />

      <article className="min-h-screen bg-background">
        {/* ── Cover Image ─────────────────────────────── */}
        {post.coverImage && (
          <div className="relative h-[50vh] md:h-[60vh] overflow-hidden">
            <img src={post.coverImage} alt={post.title}
              className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
          </div>
        )}

        <div className="relative max-w-6xl mx-auto px-6">
          <div className="flex gap-12">
            {/* ── Main content ─────────────────────────── */}
            <div className="flex-1 min-w-0 max-w-3xl">
              {/* Post header */}
              <div className={`${post.coverImage ? "-mt-32" : "pt-12"} mb-8`}>
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                  <Link href="/blog" className="hover:text-foreground transition-colors">بلاگ</Link>
                  {post.category && (
                    <>
                      <span>/</span>
                      <Link href={`/blog/category/${post.category.slug}`}
                        className="hover:text-foreground transition-colors" style={{ color: post.category.color }}>
                        {post.category.name}
                      </Link>
                    </>
                  )}
                </div>

                {/* Title */}
                <h1 className="text-3xl md:text-4xl font-black text-foreground leading-tight mb-4">
                  {post.title}
                </h1>

                {post.excerpt && (
                  <p className="text-lg text-muted-foreground leading-relaxed mb-6">{post.excerpt}</p>
                )}

                {/* Meta row */}
                <div className="flex items-center flex-wrap gap-4 pb-6 border-b border-border">
                  <div className="flex items-center gap-2.5">
                    {post.author.avatar ? (
                      <img src={post.author.avatar} alt="" className="w-9 h-9 rounded-full" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center text-sm text-white font-bold">
                        {post.author.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-foreground">{post.author.name}</p>
                      {formattedDate && <p className="text-xs text-muted-foreground">{formattedDate}</p>}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-sm text-muted-foreground mr-auto">
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{post.readingTime} دقیقه</span>
                    <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" />{post.views}</span>
                  </div>

                  {/* Share */}
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => share("twitter")} className="p-2 rounded-xl hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                      <Twitter className="w-4 h-4" />
                    </button>
                    <button onClick={() => share("linkedin")} className="p-2 rounded-xl hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                      <Linkedin className="w-4 h-4" />
                    </button>
                    <button onClick={() => share()} className="p-2 rounded-xl hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                      <Copy className="w-4 h-4" />
                    </button>
                    {toc.length > 0 && (
                      <button onClick={() => setTocOpen(!tocOpen)}
                        className="lg:hidden p-2 rounded-xl hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                        <AlignLeft className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Article content */}
              <div
                ref={contentRef}
                className="prose prose-invert dark:prose-invert max-w-none
                  prose-headings:font-bold prose-headings:text-foreground
                  prose-p:text-muted-foreground prose-p:leading-8
                  prose-a:text-violet-400 prose-a:no-underline hover:prose-a:underline
                  prose-code:text-violet-300 prose-code:bg-violet-950/50 prose-code:rounded prose-code:px-1.5 prose-code:py-0.5 prose-code:text-sm
                  prose-pre:bg-[#0d0d14] prose-pre:border prose-pre:border-white/10 prose-pre:rounded-2xl
                  prose-blockquote:border-r-4 prose-blockquote:border-violet-500 prose-blockquote:pr-5 prose-blockquote:not-italic
                  prose-img:rounded-2xl prose-img:shadow-xl
                  prose-strong:text-foreground prose-li:text-muted-foreground
                  mb-12"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />

              {/* Tags */}
              {post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 py-6 border-t border-border mb-8">
                  {post.tags.map(tag => (
                    <span key={tag} className="text-xs px-3 py-1.5 rounded-full bg-card border border-border text-muted-foreground hover:border-violet-500/30 hover:text-foreground transition-colors cursor-pointer">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Author card */}
              <div className="flex items-start gap-4 p-6 rounded-2xl bg-card border border-border mb-12">
                {post.author.avatar ? (
                  <img src={post.author.avatar} alt="" className="w-14 h-14 rounded-full shrink-0" />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center text-xl text-white font-bold shrink-0">
                    {post.author.name.charAt(0)}
                  </div>
                )}
                <div>
                  <p className="font-bold text-foreground">{post.author.name}</p>
                  <p className="text-sm text-muted-foreground mt-1">نویسنده در تیم Persicore</p>
                </div>
              </div>

              {/* Related posts */}
              {post.related.length > 0 && (
                <div className="mt-12">
                  <h2 className="text-xl font-bold text-foreground mb-6">مقالات مرتبط</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {post.related.map((rel, i) => (
                      <BlogCard key={rel.id} post={rel} index={i} variant="default" />
                    ))}
                  </div>
                </div>
              )}

              {/* ── Comments Section ──────────────────────── */}
              <div className="mt-16" dir="rtl">
                {/* Heading */}
                <div className="flex items-center gap-3 mb-8">
                  <MessageSquare className="w-5 h-5 text-violet-400" />
                  <h2 className="text-xl font-bold text-foreground">
                    دیدگاه‌ها
                    {comments.length > 0 && (
                      <span className="mr-2 text-base font-normal text-muted-foreground">({comments.length})</span>
                    )}
                  </h2>
                </div>

                {/* Comment list */}
                {comments.length > 0 ? (
                  <div className="space-y-4 mb-10">
                    {comments.map((comment, i) => (
                      <motion.div
                        key={comment.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="p-5 rounded-2xl bg-card border border-border"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center text-sm text-white font-bold shrink-0">
                            {comment.authorName.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground">{comment.authorName}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(comment.createdAt).toLocaleDateString("fa-IR", {
                                year: "numeric", month: "long", day: "numeric",
                              })}
                            </p>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground leading-7 whitespace-pre-wrap">{comment.content}</p>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 mb-10 rounded-2xl bg-card/50 border border-border border-dashed text-center">
                    <MessageSquare className="w-10 h-10 text-muted-foreground/40 mb-3" />
                    <p className="text-sm text-muted-foreground">هنوز دیدگاهی ثبت نشده. اولین نفر باشید!</p>
                  </div>
                )}

                {/* Comment form */}
                <div className="p-6 rounded-2xl bg-card border border-border">
                  <h3 className="text-base font-bold text-foreground mb-6">ثبت دیدگاه</h3>

                  <AnimatePresence mode="wait">
                    {commentSubmitted ? (
                      <motion.div
                        key="success"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center py-8 text-center gap-3"
                      >
                        <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-1">
                          <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <p className="text-sm font-semibold text-foreground">دیدگاه شما ثبت شد</p>
                        <p className="text-xs text-muted-foreground">دیدگاه شما پس از تایید نمایش داده می‌شود</p>
                        <button
                          onClick={() => setCommentSubmitted(false)}
                          className="mt-3 text-xs text-violet-400 hover:text-violet-300 transition-colors"
                        >
                          ثبت دیدگاه جدید
                        </button>
                      </motion.div>
                    ) : (
                      <motion.form
                        key="form"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        onSubmit={handleCommentSubmit}
                        className="space-y-4"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* Name */}
                          <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5" />
                              نام <span className="text-red-400">*</span>
                            </label>
                            <input
                              type="text"
                              required
                              value={commentForm.authorName}
                              onChange={e => setCommentForm(f => ({ ...f, authorName: e.target.value }))}
                              placeholder="نام شما"
                              className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all"
                            />
                          </div>
                          {/* Email */}
                          <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                              <Mail className="w-3.5 h-3.5" />
                              ایمیل <span className="text-red-400">*</span>
                            </label>
                            <input
                              type="email"
                              required
                              value={commentForm.authorEmail}
                              onChange={e => setCommentForm(f => ({ ...f, authorEmail: e.target.value }))}
                              placeholder="email@example.com"
                              dir="ltr"
                              className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all"
                            />
                          </div>
                        </div>

                        {/* Content */}
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-muted-foreground">
                            متن دیدگاه <span className="text-red-400">*</span>
                          </label>
                          <textarea
                            required
                            rows={4}
                            value={commentForm.content}
                            onChange={e => setCommentForm(f => ({ ...f, content: e.target.value }))}
                            placeholder="دیدگاه خود را بنویسید..."
                            className="w-full px-4 py-3 rounded-xl bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all resize-none"
                          />
                        </div>

                        {commentError && (
                          <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">
                            {commentError}
                          </p>
                        )}

                        <div className="flex items-center justify-between pt-1">
                          <p className="text-xs text-muted-foreground/60">ایمیل شما منتشر نخواهد شد</p>
                          <button
                            type="submit"
                            disabled={commentSubmitting}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
                          >
                            {commentSubmitting ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Send className="w-4 h-4" />
                            )}
                            ارسال دیدگاه
                          </button>
                        </div>
                      </motion.form>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* ── TOC Sidebar (desktop) ─────────────────── */}
            {toc.length > 0 && (
              <div className="hidden lg:block w-60 shrink-0 pt-12">
                <div className="sticky top-24">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">فهرست مطالب</p>
                  <nav className="space-y-1">
                    {toc.map(item => (
                      <a key={item.id} href={`#${item.id}`}
                        className={`block text-sm py-1 pr-${item.level === 3 ? 4 : 0} transition-colors hover:text-foreground ${
                          activeSection === item.id ? "text-violet-400 font-medium" : "text-muted-foreground"
                        }`}
                        style={{ paddingRight: item.level === 3 ? "1rem" : 0 }}>
                        {item.text}
                      </a>
                    ))}
                  </nav>
                </div>
              </div>
            )}
          </div>
        </div>
      </article>

      {/* Mobile TOC drawer */}
      <AnimatePresence>
        {tocOpen && toc.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm lg:hidden"
            onClick={() => setTocOpen(false)}>
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              onClick={e => e.stopPropagation()}
              className="absolute bottom-0 left-0 right-0 bg-card border-t border-border rounded-t-3xl p-6 max-h-[70vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <p className="font-semibold">فهرست مطالب</p>
                <button onClick={() => setTocOpen(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
              </div>
              <nav className="space-y-2">
                {toc.map(item => (
                  <a key={item.id} href={`#${item.id}`} onClick={() => setTocOpen(false)}
                    className="block text-sm text-muted-foreground hover:text-foreground py-1"
                    style={{ paddingRight: item.level === 3 ? "1rem" : 0 }}>
                    {item.text}
                  </a>
                ))}
              </nav>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
