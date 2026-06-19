"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Clock, Eye, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface Post {
  id: string; title: string; slug: string; excerpt: string | null;
  coverImage: string | null; publishedAt: string | null;
  readingTime: number; views: number; featured: boolean;
  author: { name: string; avatar: string | null };
  category: { name: string; slug: string; color: string } | null;
  tags: string[];
}

interface BlogCardProps {
  post: Post;
  variant?: "default" | "featured" | "compact";
  index?: number;
}

export function BlogCard({ post, variant = "default", index = 0 }: BlogCardProps) {
  if (variant === "featured") {
    return (
      <motion.article
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className="group relative overflow-hidden rounded-3xl bg-card border border-border hover:border-violet-500/30 transition-all duration-500"
      >
        <Link href={`/blog/${post.slug}`} className="block">
          {/* Cover image */}
          <div className="relative h-72 overflow-hidden">
            {post.coverImage ? (
              <img src={post.coverImage} alt={post.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-violet-900/50 via-fuchsia-900/30 to-background" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />

            {/* Category badge */}
            {post.category && (
              <div className="absolute top-4 right-4">
                <span className="text-xs font-semibold px-3 py-1 rounded-full"
                  style={{ background: post.category.color + "33", color: post.category.color, border: `1px solid ${post.category.color}44` }}>
                  {post.category.name}
                </span>
              </div>
            )}

            {post.featured && (
              <div className="absolute top-4 left-4">
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  ✦ ویژه
                </span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-6">
            <h2 className="text-xl font-bold text-foreground group-hover:text-violet-400 transition-colors leading-tight mb-3">
              {post.title}
            </h2>
            {post.excerpt && (
              <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 mb-4">{post.excerpt}</p>
            )}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />{post.readingTime} دقیقه
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />{post.views}
                </span>
              </div>
              <span className="flex items-center gap-1 text-xs text-violet-500 group-hover:gap-2 transition-all">
                بیشتر بخوانید <ArrowLeft className="w-3 h-3" />
              </span>
            </div>
          </div>
        </Link>
      </motion.article>
    );
  }

  if (variant === "compact") {
    return (
      <motion.article
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.05 }}
        className="group flex gap-4 py-4 border-b border-border last:border-0"
      >
        {post.coverImage && (
          <Link href={`/blog/${post.slug}`} className="shrink-0">
            <img src={post.coverImage} alt="" className="w-16 h-16 object-cover rounded-xl" />
          </Link>
        )}
        <div className="flex-1 min-w-0">
          <Link href={`/blog/${post.slug}`}>
            <h3 className="text-sm font-semibold text-foreground group-hover:text-violet-400 transition-colors line-clamp-2 leading-snug">
              {post.title}
            </h3>
          </Link>
          <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
            {post.category && (
              <span style={{ color: post.category.color }}>{post.category.name}</span>
            )}
            <span>·</span>
            <span>{post.readingTime} دقیقه</span>
          </div>
        </div>
      </motion.article>
    );
  }

  // Default card
  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
      className="group relative overflow-hidden rounded-2xl bg-card border border-border hover:border-violet-500/20 hover:shadow-lg hover:shadow-violet-500/5 transition-all duration-300"
    >
      <Link href={`/blog/${post.slug}`} className="block">
        {/* Cover */}
        <div className="relative h-48 overflow-hidden">
          {post.coverImage ? (
            <img src={post.coverImage} alt={post.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-violet-900/30 to-fuchsia-900/20" />
          )}
          {post.category && (
            <div className="absolute bottom-3 right-3">
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                style={{ background: post.category.color + "33", color: post.category.color }}>
                {post.category.name}
              </span>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="p-5">
          <h2 className="font-bold text-foreground group-hover:text-violet-400 transition-colors leading-snug mb-2 line-clamp-2">
            {post.title}
          </h2>
          {post.excerpt && (
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 mb-4">{post.excerpt}</p>
          )}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {post.author.avatar ? (
                <img src={post.author.avatar} alt="" className="w-6 h-6 rounded-full" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center text-[10px] text-white font-bold">
                  {post.author.name.charAt(0)}
                </div>
              )}
              <span className="text-xs text-muted-foreground">{post.author.name}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />{post.readingTime} دقیقه
            </div>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
