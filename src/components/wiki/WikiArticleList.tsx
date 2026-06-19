"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Pin, Star, Eye, Clock, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/utils";
import type { WikiArticle } from "@/types";

type SortKey = "updated" | "created" | "title" | "views";

const SORT_LABELS: Record<SortKey, string> = {
  updated: "آخرین بروزرسانی",
  created: "تاریخ ایجاد",
  title: "عنوان (A-Z)",
  views: "پربازدیدترین",
};

interface Props {
  articles: WikiArticle[];
  activeId: string;
  onSelect: (article: WikiArticle) => void;
  activeTag: string;
  onTagClick: (tag: string) => void;
}

export function WikiArticleList({ articles, activeId, onSelect, activeTag, onTagClick }: Props) {
  const [sortBy, setSortBy] = useState<SortKey>("updated");
  const [showSort, setShowSort] = useState(false);

  const sorted = [...articles].sort((a, b) => {
    if (sortBy === "updated") return b.updatedAt.localeCompare(a.updatedAt);
    if (sortBy === "created") return b.createdAt.localeCompare(a.createdAt);
    if (sortBy === "title")   return a.title.localeCompare(b.title);
    if (sortBy === "views")   return (b.viewCount ?? 0) - (a.viewCount ?? 0);
    return 0;
  });

  // collect all unique tags
  const allTags = Array.from(new Set(articles.flatMap((a) => a.tags)));

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Sort + count */}
      <div className="px-3 py-2.5 border-b border-border flex items-center justify-between shrink-0">
        <span className="text-xs text-muted-foreground">{articles.length} مقاله</span>
        <div className="relative">
          <button onClick={() => setShowSort(!showSort)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
            {SORT_LABELS[sortBy]}
            <ChevronDown className={cn("w-3 h-3 transition-transform", showSort && "rotate-180")} />
          </button>
          {showSort && (
            <div className="absolute left-0 top-full mt-1 z-20 bg-card border border-border rounded-xl shadow-xl py-1 w-40">
              {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
                <button key={k}
                  onClick={() => { setSortBy(k); setShowSort(false); }}
                  className={cn("w-full text-right px-3 py-2 text-xs hover:bg-muted transition-colors",
                    sortBy === k ? "text-primary" : "text-muted-foreground"
                  )}>
                  {SORT_LABELS[k]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tag filter chips */}
      {allTags.length > 0 && (
        <div className="px-3 py-2 border-b border-border flex gap-1 flex-wrap shrink-0">
          <button onClick={() => onTagClick("")}
            className={cn("text-[10px] px-2 py-0.5 rounded-full border transition-all",
              activeTag === "" ? "bg-primary/10 text-primary border-primary/30" : "border-border text-muted-foreground hover:text-foreground"
            )}>
            همه
          </button>
          {allTags.map((tag) => (
            <button key={tag} onClick={() => onTagClick(tag)}
              className={cn("text-[10px] px-2 py-0.5 rounded-full border transition-all",
                activeTag === tag ? "bg-primary/10 text-primary border-primary/30" : "border-border text-muted-foreground hover:text-foreground"
              )}>
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto py-2 px-2 space-y-1.5">
        {sorted.length === 0 && (
          <div className="text-center py-12 text-muted-foreground text-sm">
            <p className="text-2xl mb-2">📭</p>
            مقاله‌ای یافت نشد
          </div>
        )}
        {sorted.map((article) => (
          <motion.div
            key={article.id}
            whileHover={{ x: -2 }}
            onClick={() => onSelect(article)}
            className={cn(
              "p-3 rounded-xl border cursor-pointer transition-all",
              activeId === article.id
                ? "bg-primary/10 border-primary/30 shadow-sm"
                : "bg-card border-border hover:border-primary/20 hover:bg-muted/30"
            )}
          >
            {/* Title row */}
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <h3 className="text-sm font-medium text-foreground leading-snug line-clamp-2 flex-1">
                {article.title}
              </h3>
              <div className="flex items-center gap-1 shrink-0 mt-0.5">
                {article.isPinned && <Pin className="w-3 h-3 text-primary" />}
                {article.isStarred && <Star className="w-3 h-3 text-amber-400 fill-amber-400" />}
              </div>
            </div>

            {/* Snippet */}
            <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed mb-2">
              {article.content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 90)}…
            </p>

            {/* Tags */}
            {article.tags.length > 0 && (
              <div className="flex gap-1 flex-wrap mb-2">
                {article.tags.slice(0, 3).map((tag) => (
                  <span key={tag}
                    onClick={(e) => { e.stopPropagation(); onTagClick(tag); }}
                    className={cn(
                      "text-[9px] px-1.5 py-0.5 rounded-full cursor-pointer transition-colors",
                      activeTag === tag ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary"
                    )}>
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Meta */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-0.5">
                  <Clock className="w-2.5 h-2.5" />{timeAgo(article.updatedAt)}
                </span>
                <span className="flex items-center gap-0.5">
                  <Eye className="w-2.5 h-2.5" />{article.viewCount}
                </span>
              </div>
              <div className="flex items-center gap-1">
                {article.status === "draft" && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400">پیش‌نویس</span>
                )}
                {article.visibility !== "all" && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">🔒</span>
                )}
                {(article.comments?.length ?? 0) > 0 && (
                  <span className="text-[9px] text-muted-foreground">💬 {article.comments!.length}</span>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
