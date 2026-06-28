"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Search, ArrowRight } from "lucide-react";
import { BlogCard } from "@/components/blog/BlogCard";

interface Post {
  id: string; title: string; slug: string; excerpt: string | null;
  coverImage: string | null; publishedAt: string | null;
  readingTime: number; views: number; featured: boolean;
  author: { name: string; avatar: string | null };
  category: { name: string; slug: string; color: string } | null;
  tags: string[];
}

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const q = searchParams.get("q") ?? "";
  const [results, setResults] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState(q);

  useEffect(() => {
    if (!q) return;
    setLoading(true);
    fetch(`/api/blog/search?q=${encodeURIComponent(q)}`)
      .then(r => r.json()).then(d => setResults(d.data ?? []))
      .finally(() => setLoading(false));
  }, [q]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) router.push(`/blog/search?q=${encodeURIComponent(query)}`);
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="mb-10">
        <h1 className="text-2xl font-bold text-foreground mb-6">جستجو در بلاگ</h1>
        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={query} onChange={e => setQuery(e.target.value)} autoFocus
              placeholder="جستجو در مقالات..." dir="rtl"
              className="w-full bg-card border border-border rounded-2xl pr-11 pl-4 py-3.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-violet-500/50 transition-colors" />
          </div>
          <button type="submit" className="px-6 py-3.5 rounded-2xl bg-violet-600 text-white font-medium hover:bg-violet-700 transition-colors">
            جستجو
          </button>
        </form>
      </div>

      {q && (
        <div>
          <p className="text-sm text-muted-foreground mb-6">
            {loading ? "در حال جستجو..." : `${results.length} نتیجه برای «${q}»`}
          </p>

          {!loading && results.length === 0 && (
            <div className="text-center py-20">
              <Search className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-30" />
              <p className="text-muted-foreground">نتیجه‌ای یافت نشد</p>
              <p className="text-sm text-muted-foreground mt-1">با کلمات دیگری امتحان کنید</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {results.map((post, i) => (
              <BlogCard key={post.id} post={post} index={i} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <SearchContent />
    </Suspense>
  );
}
