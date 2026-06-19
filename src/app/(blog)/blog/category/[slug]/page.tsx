"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "motion/react";
import { BlogCard } from "@/components/blog/BlogCard";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

interface Post {
  id: string; title: string; slug: string; excerpt: string | null;
  coverImage: string | null; publishedAt: string | null;
  readingTime: number; views: number; featured: boolean;
  author: { name: string; avatar: string | null };
  category: { name: string; slug: string; color: string } | null;
  tags: string[];
}

interface Category { id: string; name: string; slug: string; color: string; description: string | null; }

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const [posts, setPosts] = useState<Post[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/blog/posts?category=${slug}&perPage=50`).then(r => r.json()),
      fetch("/api/blog/categories").then(r => r.json()),
    ]).then(([postsData, catsData]) => {
      setPosts(postsData.data ?? []);
      const cat = (catsData.data ?? []).find((c: Category) => c.slug === slug);
      setCategory(cat ?? null);
    }).finally(() => setLoading(false));
  }, [slug]);

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="mb-10">
        <Link href="/blog" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors w-fit">
          <ArrowRight className="w-4 h-4" />برگشت به بلاگ
        </Link>
        {category && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-4 h-10 rounded-full" style={{ background: category.color }} />
              <h1 className="text-3xl font-black text-foreground">{category.name}</h1>
            </div>
            {category.description && <p className="text-muted-foreground mr-7">{category.description}</p>}
            <p className="text-sm text-muted-foreground mr-7 mt-1">{posts.length} مقاله</p>
          </motion.div>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => <div key={i} className="h-64 rounded-2xl bg-card animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post, i) => <BlogCard key={post.id} post={post} index={i} />)}
        </div>
      )}
    </div>
  );
}
