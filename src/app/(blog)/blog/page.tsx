"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Sparkles, TrendingUp, Clock, Eye } from "lucide-react";
import Link from "next/link";
import { BlogCard } from "@/components/blog/BlogCard";

interface Post {
  id: string; title: string; slug: string; excerpt: string | null;
  coverImage: string | null; publishedAt: string | null;
  readingTime: number; views: number; featured: boolean;
  author: { name: string; avatar: string | null };
  category: { name: string; slug: string; color: string } | null;
  tags: string[];
}
interface Category { id: string; name: string; slug: string; color: string; _count: { posts: number } }

const API_BASE = "/api/blog";

export default function BlogHomePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), perPage: "9" });
      if (activeCategory) params.set("category", activeCategory);
      const res = await fetch(`${API_BASE}/posts?${params}`);
      const data = await res.json();
      if (page === 1) setPosts(data.data ?? []);
      else setPosts(prev => [...prev, ...(data.data ?? [])]);
      setTotalPages(data.meta?.totalPages ?? 1);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [page, activeCategory]);

  useEffect(() => {
    fetch(`${API_BASE}/categories`).then(r => r.json()).then(d => setCategories(d.data ?? []));
  }, []);

  useEffect(() => {
    setPage(1);
  }, [activeCategory]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const featured = posts.find(p => p.featured) ?? posts[0];
  const rest = posts.filter(p => p !== featured);

  return (
    <div className="min-h-screen bg-background">
      {/* ── Hero Section ─────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-violet-950/20 via-background to-background" />
        <div className="absolute top-20 right-0 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-10 left-10 w-72 h-72 bg-fuchsia-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-6 pt-16 pb-12">
          {/* Title */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-600/10 border border-violet-500/20 text-violet-400 text-sm mb-6">
              <Sparkles className="w-3.5 h-3.5" />آخرین مقالات
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-foreground leading-tight mb-4">
              بلاگ <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">پرسی‌کور</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              راهنماها، بینش‌ها و داستان‌های تیم ما در حوزه طراحی وب، فناوری و کسب‌وکار
            </p>
          </motion.div>

          {/* Featured Post */}
          {!loading && featured && (
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="mb-16">
              <Link href={`/blog/${featured.slug}`} className="group block">
                <div className="relative rounded-3xl overflow-hidden border border-border hover:border-violet-500/40 transition-all duration-500 hover:shadow-2xl hover:shadow-violet-500/10">
                  {/* Background image */}
                  <div className="relative h-[480px] overflow-hidden">
                    {featured.coverImage ? (
                      <img src={featured.coverImage} alt={featured.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-violet-900/60 via-fuchsia-900/40 to-background" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent" />
                  </div>

                  {/* Content overlay */}
                  <div className="absolute bottom-0 right-0 left-0 p-8 md:p-12">
                    <div className="max-w-2xl">
                      {featured.category && (
                        <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full mb-4"
                          style={{ background: featured.category.color + "33", color: featured.category.color }}>
                          {featured.category.name}
                        </span>
                      )}
                      <h2 className="text-2xl md:text-3xl font-black text-white leading-tight mb-3 group-hover:text-violet-200 transition-colors">
                        {featured.title}
                      </h2>
                      {featured.excerpt && (
                        <p className="text-white/60 text-sm md:text-base leading-relaxed line-clamp-2 mb-5">
                          {featured.excerpt}
                        </p>
                      )}
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          {featured.author.avatar ? (
                            <img src={featured.author.avatar} alt="" className="w-7 h-7 rounded-full" />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center text-xs text-white font-bold">
                              {featured.author.name.charAt(0)}
                            </div>
                          )}
                          <span className="text-sm text-white/70">{featured.author.name}</span>
                        </div>
                        <span className="text-white/30">·</span>
                        <span className="flex items-center gap-1 text-sm text-white/50">
                          <Clock className="w-3.5 h-3.5" />{featured.readingTime} دقیقه مطالعه
                        </span>
                        <span className="flex items-center gap-1 text-sm text-white/50">
                          <Eye className="w-3.5 h-3.5" />{featured.views}
                        </span>
                        <span className="flex items-center gap-1.5 text-sm text-violet-400 group-hover:gap-3 transition-all mr-auto">
                          بخوانید <ArrowLeft className="w-4 h-4" />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          )}
        </div>
      </section>

      {/* ── Posts Section ─────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        {/* Category filter */}
        {categories.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            className="flex items-center gap-2 flex-wrap mb-10">
            <button onClick={() => setActiveCategory("")}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                !activeCategory
                  ? "bg-violet-600 text-white shadow-lg shadow-violet-500/25"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-violet-500/30"
              }`}>
              همه
            </button>
            {categories.map(cat => (
              <button key={cat.id} onClick={() => setActiveCategory(cat.slug)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeCategory === cat.slug
                    ? "text-white shadow-lg"
                    : "bg-card border border-border text-muted-foreground hover:text-foreground"
                }`}
                style={activeCategory === cat.slug ? { background: cat.color, boxShadow: `0 4px 20px ${cat.color}44` } : {}}>
                {cat.name}
                <span className="mr-1.5 text-[10px] opacity-60">({cat._count.posts})</span>
              </button>
            ))}
          </motion.div>
        )}

        {/* Grid */}
        {loading && page === 1 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="rounded-2xl bg-card border border-border overflow-hidden animate-pulse">
                <div className="h-48 bg-muted" />
                <div className="p-5 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-full" />
                  <div className="h-3 bg-muted rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : rest.length === 0 && !featured ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-violet-600/10 flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-7 h-7 text-violet-400" />
            </div>
            <p className="text-muted-foreground">هنوز مقاله‌ای منتشر نشده</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {rest.map((post, i) => (
                  <BlogCard key={post.id} post={post} index={i} />
                ))}
              </AnimatePresence>
            </div>

            {/* Load more */}
            {page < totalPages && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center mt-12">
                <button onClick={() => setPage(p => p + 1)} disabled={loading}
                  className="flex items-center gap-2 px-8 py-3 rounded-full border border-border hover:border-violet-500/30 text-muted-foreground hover:text-foreground transition-all disabled:opacity-50">
                  {loading ? "در حال بارگذاری..." : "مقالات بیشتر"}
                </button>
              </motion.div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
