"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Edit3, Trash2, Pin, Star, Share2, Eye, Clock, ChevronDown,
  History, Send, MessageSquare, Lock, Users, Printer,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/utils";
import type { WikiArticle, WikiComment } from "@/types";
import { TableOfContents } from "./TableOfContents";
import { useAuth } from "@/lib/auth/context";
import { toast } from "sonner";

// WikiComment is now imported from @/types via WikiArticle
type RichArticle = WikiArticle;

const REACTIONS = ["👍", "❤️", "🔥", "💡", "✅"];

const FOLDER_LABELS: Record<string, string> = {
  onboarding: "🚀 آموزش ورود",
  coding: "💻 کدنویسی",
  design: "🎨 دیزاین",
  workflow: "⚙️ فرآیندها",
  faq: "❓ سوالات",
};

// ── inject heading IDs into HTML for TOC anchors ───────────────────
function injectHeadingIds(html: string): string {
  return html.replace(/<h([23])([^>]*)>(.*?)<\/h[23]>/gi, (_, level, attrs, text) => {
    const id = text
      .replace(/<[^>]+>/g, "")
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w؀-ۿ-]/g, "");
    return `<h${level}${attrs} id="${id}">${text}</h${level}>`;
  });
}

interface Props {
  article: RichArticle;
  onEdit: () => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string) => void;
  onToggleStar: (id: string) => void;
  onReact: (articleId: string, emoji: string) => void;
  onAddComment: (articleId: string, content: string, parentId?: string) => void;
  onDeleteComment: (articleId: string, commentId: string) => void;
  onRestoreVersion: (articleId: string, versionId: string) => void;
}

export function WikiViewer({
  article, onEdit, onDelete, onTogglePin, onToggleStar,
  onReact, onAddComment, onDeleteComment, onRestoreVersion,
}: Props) {
  const { user } = useAuth();
  const [commentText, setCommentText] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [showToc, setShowToc] = useState(true);

  const author = article.author;
  const canEdit = user?.role === "admin" || user?.id === article.authorId;
  const processedContent = injectHeadingIds(article.content);

  const topComments = (article.comments ?? []).filter((c) => !c.parentId);
  const getReplies = (parentId: string) => (article.comments ?? []).filter((c) => c.parentId === parentId);

  function copyLink() {
    navigator.clipboard.writeText(`${window.location.origin}/wiki?id=${article.id}`);
    toast.success("لینک کپی شد");
  }

  function handlePrint() {
    window.print();
  }

  function submitComment(parentId?: string) {
    const text = parentId ? replyText : commentText;
    if (!text.trim()) return;
    onAddComment(article.id, text.trim(), parentId);
    if (parentId) { setReplyText(""); setReplyTo(null); }
    else setCommentText("");
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* ── Header ── */}
      <div className="px-6 pt-5 pb-4 border-b border-border shrink-0">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
          <span>ویکی</span>
          <span>/</span>
          <span>{FOLDER_LABELS[article.folderId] ?? article.folderId}</span>
          <span>/</span>
          <span className="text-foreground truncate max-w-[200px]">{article.title}</span>
        </div>

        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <h1 className="text-2xl font-bold text-foreground leading-tight">{article.title}</h1>
              {article.status === "draft" && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">پیش‌نویس</span>
              )}
              {article.visibility !== "all" && (
                <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                  <Lock className="w-3 h-3" />
                  {article.visibility === "admin" ? "فقط ادمین" : article.visibility === "developer" ? "توسعه‌دهندگان" : "طراحان"}
                </span>
              )}
            </div>

            {/* Author + meta */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
              {author && (
                <div className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full gradient-brand flex items-center justify-center text-[9px] font-bold text-black shrink-0">
                    {author.name.slice(0, 1)}
                  </div>
                  <span>{author.name}</span>
                </div>
              )}
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{timeAgo(article.updatedAt)}</span>
              <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{article.viewCount ?? 0} بازدید</span>
              <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" />{(article.comments ?? []).length} کامنت</span>
            </div>

            {/* Tags */}
            {article.tags.length > 0 && (
              <div className="flex gap-1.5 mt-2 flex-wrap">
                {article.tags.map((tag) => (
                  <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
            <ActionBtn onClick={() => onTogglePin(article.id)} title={article.isPinned ? "برداشتن پین" : "پین کردن"}>
              <Pin className={cn("w-3.5 h-3.5", article.isPinned && "text-primary fill-primary")} />
            </ActionBtn>
            <ActionBtn onClick={() => onToggleStar(article.id)} title={(article.isStarred ?? false) ? "حذف نشان" : "نشان‌گذاری"}>
              <Star className={cn("w-3.5 h-3.5", (article.isStarred ?? false) && "text-amber-400 fill-amber-400")} />
            </ActionBtn>
            <ActionBtn onClick={copyLink} title="کپی لینک">
              <Share2 className="w-3.5 h-3.5" />
            </ActionBtn>
            <ActionBtn onClick={handlePrint} title="چاپ">
              <Printer className="w-3.5 h-3.5" />
            </ActionBtn>
            {(article.versions ?? []).length > 0 && (
              <ActionBtn onClick={() => setShowHistory(!showHistory)} title="تاریخچه" active={showHistory}>
                <History className="w-3.5 h-3.5" />
              </ActionBtn>
            )}
            {canEdit && (
              <>
                <button onClick={onEdit}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors">
                  <Edit3 className="w-3.5 h-3.5" />ویرایش
                </button>
                <button onClick={() => {
                  if (window.confirm("آیا از حذف این مقاله مطمئن هستید؟")) onDelete(article.id);
                }}
                  className="p-1.5 rounded-xl bg-muted text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Version History ── */}
      <AnimatePresence>
        {showHistory && (article.versions ?? []).length > 0 && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="px-6 py-3 bg-muted/30 border-b border-border overflow-hidden">
            <p className="text-xs font-semibold text-muted-foreground mb-2">تاریخچه نسخه‌ها</p>
            <div className="flex gap-2 flex-wrap">
              {(article.versions ?? []).map((v) => {
                const savedBy = { name: v.savedById };
                return (
                  <div key={v.id} className="flex items-center gap-2 p-2 rounded-xl bg-card border border-border">
                    <div className="text-xs">
                      <p className="text-foreground font-medium">{timeAgo(v.savedAt)}</p>
                      <p className="text-muted-foreground">{savedBy?.name}</p>
                    </div>
                    {canEdit && (
                      <button onClick={() => onRestoreVersion(article.id, v.id)}
                        className="text-[10px] px-2 py-0.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                        بازگشت
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main content area ── */}
      <div className="flex-1 overflow-hidden flex">
        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div
            className="wiki-content p-6 prose prose-sm max-w-none text-foreground leading-loose"
            dir="rtl"
            dangerouslySetInnerHTML={{ __html: processedContent }}
          />

          {/* ── Reactions ── */}
          <div className="px-6 pb-4 border-t border-border pt-4">
            <p className="text-xs text-muted-foreground mb-2">واکنش‌ها</p>
            <div className="flex gap-2 flex-wrap">
              {REACTIONS.map((emoji) => {
                const reaction = (article.reactions ?? []).find((r) => r.emoji === emoji);
                const count = reaction?.userIds.length ?? 0;
                const reacted = reaction?.userIds.includes(user?.id ?? "") ?? false;
                return (
                  <button key={emoji} onClick={() => onReact(article.id, emoji)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm border transition-all",
                      reacted
                        ? "bg-primary/10 border-primary/30 text-primary"
                        : "bg-muted border-border text-muted-foreground hover:border-primary/20 hover:text-foreground"
                    )}>
                    <span>{emoji}</span>
                    {count > 0 && <span className="text-xs tabular-nums">{count}</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Comments ── */}
          <div className="px-6 pb-6 border-t border-border pt-4">
            <p className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" />
              بحث و گفتگو
              <span className="text-xs font-normal text-muted-foreground">({(article.comments ?? []).length})</span>
            </p>

            {/* Comment input */}
            <div className="flex gap-2 mb-5">
              <div className="w-7 h-7 rounded-full gradient-brand flex items-center justify-center text-[10px] font-bold text-black shrink-0 mt-0.5">
                {user?.name.slice(0, 1)}
              </div>
              <div className="flex-1 flex gap-2">
                <input value={commentText} onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submitComment()}
                  placeholder="نظر خود را بنویسید..."
                  className="flex-1 px-3 py-2 rounded-xl bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
                <button onClick={() => submitComment()}
                  disabled={!commentText.trim()}
                  className="px-3 py-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Comment list */}
            <div className="space-y-4">
              {topComments.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">هنوز کامنتی ثبت نشده</p>
              )}
              {topComments.map((comment) => (
                <CommentItem key={comment.id}
                  comment={comment}
                  replies={getReplies(comment.id)}
                  currentUserId={user?.id ?? ""}
                  currentUserName={user?.name ?? ""}
                  isAdmin={user?.role === "admin"}
                  replyTo={replyTo}
                  replyText={replyText}
                  onReplyTextChange={setReplyText}
                  onSetReplyTo={setReplyTo}
                  onSubmitReply={() => submitComment(comment.id)}
                  onDelete={(cid) => onDeleteComment(article.id, cid)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* TOC sidebar */}
        <div className="w-48 shrink-0 border-r border-border p-4 overflow-y-auto hidden xl:block">
          <button onClick={() => setShowToc(!showToc)}
            className="flex items-center gap-1 text-[10px] text-muted-foreground mb-2">
            <ChevronDown className={cn("w-3 h-3 transition-transform", !showToc && "-rotate-90")} />
            فهرست
          </button>
          {showToc && <TableOfContents content={article.content} />}
        </div>
      </div>

      <style>{`
        .wiki-content h1 { font-size: 1.5rem; font-weight: 800; margin: 1.2rem 0 0.6rem; color: hsl(var(--foreground)); scroll-margin-top: 80px; }
        .wiki-content h2 { font-size: 1.25rem; font-weight: 700; margin: 1.2rem 0 0.5rem; color: hsl(var(--foreground)); border-bottom: 1px solid hsl(var(--border)); padding-bottom: 0.3rem; scroll-margin-top: 80px; }
        .wiki-content h3 { font-size: 1.05rem; font-weight: 600; margin: 0.9rem 0 0.3rem; color: hsl(var(--foreground)); scroll-margin-top: 80px; }
        .wiki-content p { margin: 0.5rem 0; line-height: 1.9; }
        .wiki-content ul, .wiki-content ol { padding-right: 1.5rem; margin: 0.5rem 0; }
        .wiki-content li { margin: 0.3rem 0; }
        .wiki-content blockquote { border-right: 3px solid hsl(var(--primary)); padding: 0.75rem 1rem; color: hsl(var(--muted-foreground)); margin: 0.75rem 0; background: hsl(var(--primary)/0.05); border-radius: 0 10px 10px 0; font-style: italic; }
        .wiki-content code { background: hsl(var(--muted)); padding: 0.1em 0.4em; border-radius: 4px; font-family: monospace; font-size: 0.85em; color: hsl(var(--primary)); }
        .wiki-content pre { background: hsl(240 10% 8%); border: 1px solid hsl(var(--border)); border-radius: 10px; padding: 1rem; margin: 0.75rem 0; overflow-x: auto; }
        .wiki-content pre code { background: transparent; color: #e2e8f0; font-size: 0.85rem; padding: 0; }
        .wiki-content strong { font-weight: 700; }
        .wiki-content a { color: hsl(var(--primary)); text-decoration: underline; }
        .wiki-content img { max-width: 100%; border-radius: 10px; margin: 0.5rem 0; }
        .wiki-content hr { border: none; border-top: 1px solid hsl(var(--border)); margin: 1rem 0; }
        .wiki-content table { border-collapse: collapse; width: 100%; margin: 0.75rem 0; }
        .wiki-content th, .wiki-content td { border: 1px solid hsl(var(--border)); padding: 0.5rem 0.75rem; text-align: right; }
        .wiki-content th { background: hsl(var(--muted)); font-weight: 600; }
        .wiki-content mark { border-radius: 3px; padding: 0 2px; }
        @media print {
          .wiki-content { font-size: 12pt; }
          .wiki-content h2 { page-break-after: avoid; }
        }
      `}</style>
    </div>
  );
}

// ── ActionBtn ─────────────────────────────────────────────────────────
function ActionBtn({ onClick, title, children, active }: {
  onClick: () => void; title?: string; children: React.ReactNode; active?: boolean;
}) {
  return (
    <button onClick={onClick} title={title}
      className={cn(
        "p-1.5 rounded-xl transition-colors",
        active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
      )}>
      {children}
    </button>
  );
}

// ── CommentItem ───────────────────────────────────────────────────────
function CommentItem({
  comment, replies, currentUserId, currentUserName, isAdmin,
  replyTo, replyText, onReplyTextChange, onSetReplyTo, onSubmitReply, onDelete,
}: {
  comment: WikiComment; replies: WikiComment[]; currentUserId: string; currentUserName: string;
  isAdmin: boolean; replyTo: string | null; replyText: string;
  onReplyTextChange: (t: string) => void; onSetReplyTo: (id: string | null) => void;
  onSubmitReply: () => void; onDelete: (id: string) => void;
}) {
  const author = { name: comment.authorName ?? comment.authorId };
  const canDelete = isAdmin || comment.authorId === currentUserId;

  return (
    <div className="flex gap-3">
      <div className="w-7 h-7 rounded-full gradient-brand flex items-center justify-center text-[10px] font-bold text-black shrink-0 mt-0.5">
        {author?.name.slice(0, 1) ?? "?"}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-medium text-foreground">{author?.name}</span>
          <span className="text-[10px] text-muted-foreground">{timeAgo(comment.createdAt)}</span>
          {canDelete && (
            <button onClick={() => onDelete(comment.id)}
              className="text-[10px] text-muted-foreground hover:text-red-400 transition-colors mr-auto">
              حذف
            </button>
          )}
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">{comment.content}</p>
        <button onClick={() => onSetReplyTo(replyTo === comment.id ? null : comment.id)}
          className="text-[10px] text-muted-foreground hover:text-primary transition-colors mt-1">
          پاسخ
        </button>

        {/* Replies */}
        {replies.length > 0 && (
          <div className="mt-3 space-y-3 pr-4 border-r border-border/50">
            {replies.map((reply) => {
              const replyAuthor = { name: reply.authorName ?? reply.authorId };
              return (
                <div key={reply.id} className="flex gap-2">
                  <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[9px] font-medium text-foreground shrink-0">
                    {replyAuthor?.name.slice(0, 1)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-medium text-foreground">{replyAuthor?.name}</span>
                      <span className="text-[10px] text-muted-foreground">{timeAgo(reply.createdAt)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{reply.content}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Reply input */}
        {replyTo === comment.id && (
          <div className="flex gap-2 mt-2">
            <input value={replyText} onChange={(e) => onReplyTextChange(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onSubmitReply()}
              placeholder="پاسخ بدهید..."
              className="flex-1 px-3 py-1.5 rounded-xl bg-muted border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40" />
            <button onClick={onSubmitReply} className="px-2 py-1.5 rounded-xl bg-primary/10 text-primary text-xs hover:bg-primary/20 transition-colors">
              <Send className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
