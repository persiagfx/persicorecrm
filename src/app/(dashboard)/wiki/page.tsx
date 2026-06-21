"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { motion } from "motion/react";
import { BookOpen } from "lucide-react";
import { apiClient } from "@/lib/api/client";
import { toast } from "sonner";
import type { WikiArticle } from "@/types";
import { WikiSidebar } from "@/components/wiki/WikiSidebar";
import { WikiArticleList } from "@/components/wiki/WikiArticleList";
import { WikiViewer } from "@/components/wiki/WikiViewer";
import { WikiEditor } from "@/components/wiki/WikiEditor";
import { useAuth } from "@/lib/auth/context";
import { WIKI_CATEGORIES } from "@/lib/constants";

const FOLDERS = WIKI_CATEGORIES.map((c) => ({ ...c, color: "" }));

export default function WikiPage() {
  const { user } = useAuth();

  const [articles, setArticles] = useState<WikiArticle[]>([]);
  const [activeFolder, setActiveFolder] = useState("all");
  const [activeId, setActiveId] = useState("");

  useEffect(() => {
    apiClient.get("/wiki/articles?perPage=100")
      .then(res => {
        const data: WikiArticle[] = res.data?.data ?? [];
        setArticles(data);
        if (data.length > 0) setActiveId(data[0].id);
      })
      .catch(() => toast.error("خطا در دریافت مقالات"));
  }, []);
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [recentIds, setRecentIds] = useState<string[]>([]);

  // ── derived ──────────────────────────────────────────────────────
  const activeArticle = articles.find((a) => a.id === activeId) ?? articles[0];

  const visibleArticles = useMemo(() => {
    return articles.filter((a) => {
      if (activeFolder !== "all" && a.folderId !== activeFolder) return false;
      if (activeTag && !a.tags.includes(activeTag)) return false;
      if (search) {
        const q = search.toLowerCase();
        return a.title.toLowerCase().includes(q) || a.content.replace(/<[^>]+>/g, "").toLowerCase().includes(q);
      }
      return true;
    });
  }, [articles, activeFolder, search, activeTag]);

  // ── handlers ─────────────────────────────────────────────────────
  const selectArticle = useCallback((id: string) => {
    setActiveId(id);
    setIsEditing(false);
    setRecentIds((prev) => [id, ...prev.filter((r) => r !== id)].slice(0, 5));
  }, []);

  const handleNewArticle = useCallback(async (templateContent?: string) => {
    const folderId = activeFolder === "all" ? (WIKI_CATEGORIES[0]?.id ?? "general") : activeFolder;
    try {
      const res = await apiClient.post("/wiki/articles", {
        folderId,
        title: "مقاله جدید",
        content: templateContent ?? "<p>محتوای مقاله را اینجا بنویسید...</p>",
        tags: [],
      });
      const newArt: WikiArticle = res.data?.data ?? res.data;
      setArticles((prev) => [newArt, ...prev]);
      setActiveId(newArt.id);
      setIsEditing(true);
    } catch { toast.error("خطا در ایجاد مقاله"); }
  }, [activeFolder]);

  const handleSave = useCallback(async (html: string, title: string) => {
    try {
      await apiClient.patch(`/wiki/articles/${activeId}`, { content: html, title });
      setArticles((prev) => prev.map((a) =>
        a.id === activeId ? { ...a, title, content: html, updatedAt: new Date().toISOString() } : a
      ));
      toast.success("مقاله ذخیره شد");
    } catch { toast.error("خطا در ذخیره"); }
    setIsEditing(false);
  }, [activeId]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await apiClient.delete(`/wiki/articles/${id}`);
      setArticles((prev) => prev.filter((a) => a.id !== id));
      const remaining = articles.filter((a) => a.id !== id);
      if (remaining.length > 0) setActiveId(remaining[0].id);
    } catch { toast.error("خطا در حذف"); }
  }, [articles]);

  const handleTogglePin = useCallback(async (id: string) => {
    const art = articles.find(a => a.id === id);
    if (!art) return;
    try {
      await apiClient.patch(`/wiki/articles/${id}`, { isPinned: !art.isPinned });
      setArticles((prev) => prev.map((a) => a.id === id ? { ...a, isPinned: !a.isPinned } : a));
    } catch { toast.error("خطا"); }
  }, [articles]);

  const handleToggleStar = useCallback((_id: string) => { /* no-op — not in DB model */ }, []);
  const handleReact = useCallback((_articleId: string, _emoji: string) => { /* no-op */ }, []);

  const handleAddComment = useCallback((articleId: string, content: string, parentId?: string) => {
    setArticles((prev) => prev.map((a) => {
      if (a.id !== articleId) return a;
      return {
        ...a,
        comments: [...(a.comments ?? []), {
          id: `c${Date.now()}`,
          authorId: user?.id ?? "u1",
          content,
          createdAt: new Date().toISOString(),
          parentId,
        }],
      };
    }));
  }, [user]);

  const handleDeleteComment = useCallback((articleId: string, commentId: string) => {
    setArticles((prev) => prev.map((a) =>
      a.id === articleId ? { ...a, comments: (a.comments ?? []).filter((c) => c.id !== commentId && c.parentId !== commentId) } : a
    ));
  }, []);

  const handleRestoreVersion = useCallback((articleId: string, versionId: string) => {
    setArticles((prev) => prev.map((a) => {
      if (a.id !== articleId) return a;
      const version = (a.versions ?? []).find((v) => v.id === versionId);
      if (!version) return a;
      return { ...a, title: version.title, content: version.content, updatedAt: new Date().toISOString() };
    }));
  }, []);

  const handleEditorStatusChange = useCallback((status: "draft" | "published") => {
    setArticles((prev) => prev.map((a) => a.id === activeId ? { ...a } : a)); // status not in DB model
  }, [activeId]);

  const handleEditorFolderChange = useCallback((folderId: string) => {
    setArticles((prev) => prev.map((a) => a.id === activeId ? { ...a, folderId } : a));
  }, [activeId]);

  const handleEditorTagsChange = useCallback((tags: string[]) => {
    setArticles((prev) => prev.map((a) => a.id === activeId ? { ...a, tags } : a));
  }, [activeId]);

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] -mx-6 -mt-6 overflow-hidden">
      {/* Header bar */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between px-6 py-3 border-b border-border bg-card/50 backdrop-blur-sm shrink-0 z-10">
        <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          ویکی داخلی
        </h1>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{articles.length} مقاله</span>
          <span>·</span>
          <span>{articles.filter((a) => a.status === "published").length} منتشرشده</span>
        </div>
      </motion.div>

      {/* 3-panel layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Panel 1: Sidebar */}
        <div className="w-56 shrink-0 border-l border-border bg-card/30">
          <WikiSidebar
            articles={visibleArticles}
            activeFolder={activeFolder}
            onFolderChange={setActiveFolder}
            search={search}
            onSearchChange={setSearch}
            onNewArticle={handleNewArticle}
            recentIds={recentIds}
            onSelectArticle={selectArticle}
            activeId={activeId}
          />
        </div>

        {/* Panel 2: Article list */}
        <div className="w-72 shrink-0 border-l border-border bg-card/20">
          <WikiArticleList
            articles={visibleArticles}
            activeId={activeId}
            onSelect={(a) => selectArticle(a.id)}
            activeTag={activeTag}
            onTagClick={(tag) => setActiveTag(tag === activeTag ? "" : tag)}
          />
        </div>

        {/* Panel 3: Content / Editor */}
        <div className="flex-1 overflow-hidden bg-card">
          {!activeArticle ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
              <BookOpen className="w-12 h-12 opacity-20" />
              <p className="text-sm">مقاله‌ای انتخاب نشده</p>
              <p className="text-xs opacity-60">برای شروع یک مقاله جدید بسازید</p>
            </div>
          ) : isEditing ? (
            <WikiEditor
              key={activeId}
              content={activeArticle.content}
              initialTitle={activeArticle.title}
              status={activeArticle.status ?? "draft"}
              onStatusChange={handleEditorStatusChange}
              folderId={activeArticle.folderId}
              folders={FOLDERS}
              onFolderChange={handleEditorFolderChange}
              tags={activeArticle.tags}
              onTagsChange={handleEditorTagsChange}
              onSave={handleSave}
              onCancel={() => setIsEditing(false)}
            />
          ) : (
            <WikiViewer
              key={activeId}
              article={activeArticle}
              onEdit={() => setIsEditing(true)}
              onDelete={handleDelete}
              onTogglePin={handleTogglePin}
              onToggleStar={handleToggleStar}
              onReact={handleReact}
              onAddComment={handleAddComment}
              onDeleteComment={handleDeleteComment}
              onRestoreVersion={handleRestoreVersion}
            />
          )}
        </div>
      </div>
    </div>
  );
}
