"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search, Pin, Star, Clock, FileText, ChevronLeft, Plus, BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { WikiArticle } from "@/types";
import { WIKI_TEMPLATES } from "@/lib/constants";

interface Folder { id: string; label: string; icon: string; color: string; }

const FOLDERS: Folder[] = [
  { id: "onboarding", label: "آموزش ورود", icon: "🚀", color: "text-emerald-400" },
  { id: "coding",     label: "کدنویسی",    icon: "💻", color: "text-blue-400"    },
  { id: "design",     label: "دیزاین",     icon: "🎨", color: "text-pink-400"    },
  { id: "workflow",   label: "فرآیندها",   icon: "⚙️", color: "text-amber-400"   },
  { id: "faq",        label: "سوالات",     icon: "❓", color: "text-purple-400"  },
];

interface Props {
  articles: WikiArticle[];
  activeFolder: string;
  onFolderChange: (id: string) => void;
  search: string;
  onSearchChange: (s: string) => void;
  onNewArticle: (templateContent?: string) => void;
  recentIds: string[];
  onSelectArticle: (id: string) => void;
  activeId: string;
}

export function WikiSidebar({
  articles, activeFolder, onFolderChange, search, onSearchChange,
  onNewArticle, recentIds, onSelectArticle, activeId,
}: Props) {
  const [showTemplates, setShowTemplates] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(["onboarding", "coding", "design", "workflow", "faq"])
  );

  const toggleFolder = (id: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  };

  const pinned = articles.filter((a) => a.isPinned);
  const starred = articles.filter((a) => a.isStarred);
  const recent = recentIds
    .map((id) => articles.find((a) => a.id === id))
    .filter(Boolean) as WikiArticle[];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Search */}
      <div className="p-3 border-b border-border">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="جستجو در ویکی..."
            className="w-full pe-9 ps-3 py-2 rounded-xl bg-muted border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
        {/* All */}
        <NavItem
          icon={<BookOpen className="w-3.5 h-3.5" />}
          label="همه مقالات"
          count={articles.length}
          active={activeFolder === "all"}
          onClick={() => onFolderChange("all")}
        />

        {/* Pinned */}
        {pinned.length > 0 && (
          <CollapsibleSection title="📌 پین‌شده‌ها" defaultOpen>
            {pinned.map((a) => (
              <ArticleNavItem key={a.id} article={a} active={activeId === a.id} onClick={() => onSelectArticle(a.id)} />
            ))}
          </CollapsibleSection>
        )}

        {/* Starred */}
        {starred.length > 0 && (
          <CollapsibleSection title="⭐ نشان‌شده‌ها" defaultOpen={false}>
            {starred.map((a) => (
              <ArticleNavItem key={a.id} article={a} active={activeId === a.id} onClick={() => onSelectArticle(a.id)} />
            ))}
          </CollapsibleSection>
        )}

        {/* Recent */}
        {recent.length > 0 && (
          <CollapsibleSection title="🕐 اخیراً دیده‌شده" defaultOpen={false}>
            {recent.map((a) => (
              <ArticleNavItem key={a.id} article={a} active={activeId === a.id} onClick={() => onSelectArticle(a.id)} />
            ))}
          </CollapsibleSection>
        )}

        {/* Folder tree */}
        <div className="mt-2">
          <p className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-widest px-2 py-1">
            دسته‌بندی‌ها
          </p>
          {FOLDERS.map((folder) => {
            const folderArticles = articles.filter((a) => a.folderId === folder.id);
            const isExpanded = expandedFolders.has(folder.id);
            const isActive = activeFolder === folder.id;

            return (
              <div key={folder.id}>
                <div
                  className={cn(
                    "flex items-center gap-2 px-2 py-2 rounded-xl cursor-pointer transition-all group",
                    isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <button className="p-0.5" onClick={() => toggleFolder(folder.id)}>
                    <ChevronLeft className={cn("w-3 h-3 transition-transform", isExpanded && "-rotate-90")} />
                  </button>
                  <button className="flex items-center gap-2 flex-1 text-sm text-right" onClick={() => onFolderChange(folder.id)}>
                    <span>{folder.icon}</span>
                    <span className="flex-1 truncate">{folder.label}</span>
                    {folderArticles.length > 0 && (
                      <span className="text-[10px] bg-muted rounded-full px-1.5 text-muted-foreground">
                        {folderArticles.length}
                      </span>
                    )}
                  </button>
                </div>

                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.18 }}
                      className="overflow-hidden pr-4"
                    >
                      {folderArticles.map((a) => (
                        <ArticleNavItem
                          key={a.id}
                          article={a}
                          active={activeId === a.id}
                          onClick={() => { onSelectArticle(a.id); onFolderChange(folder.id); }}
                        />
                      ))}
                      {folderArticles.length === 0 && (
                        <p className="text-[10px] text-muted-foreground/50 px-2 py-1">خالی</p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>

      {/* Templates + New */}
      <div className="border-t border-border p-3 space-y-2">
        <button
          onClick={() => setShowTemplates(!showTemplates)}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <span>🧩</span>
          <span>قالب‌های آماده</span>
          <ChevronLeft className={cn("w-3 h-3 ms-auto transition-transform", showTemplates && "-rotate-90")} />
        </button>

        <AnimatePresence>
          {showTemplates && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="space-y-1 pb-1">
                {WIKI_TEMPLATES.map((tpl) => (
                  <button key={tpl.id}
                    onClick={() => { onNewArticle(tpl.content); setShowTemplates(false); }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors text-right">
                    <span>{tpl.icon}</span>
                    <span>{tpl.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => onNewArticle()}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl gradient-brand text-black text-xs font-semibold gold-glow"
        >
          <Plus className="w-3.5 h-3.5" />
          مقاله جدید
        </button>
      </div>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────

function NavItem({ icon, label, count, active, onClick }: {
  icon: React.ReactNode; label: string; count?: number; active: boolean; onClick: () => void;
}) {
  return (
    <button onClick={onClick}
      className={cn(
        "w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-all text-right",
        active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"
      )}>
      {icon}
      <span className="flex-1">{label}</span>
      {count !== undefined && (
        <span className="text-[10px] bg-muted rounded-full px-1.5">{count}</span>
      )}
    </button>
  );
}

function CollapsibleSection({ title, children, defaultOpen }: {
  title: string; children: React.ReactNode; defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-1 px-2 py-1.5 text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors">
        <ChevronLeft className={cn("w-3 h-3 transition-transform", open && "-rotate-90")} />
        {title}
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden">
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ArticleNavItem({ article, active, onClick }: {
  article: WikiArticle; active: boolean; onClick: () => void;
}) {
  return (
    <button onClick={onClick}
      className={cn(
        "w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs transition-all text-right truncate",
        active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"
      )}>
      <FileText className="w-3 h-3 shrink-0" />
      <span className="truncate flex-1">{article.title}</span>
      {article.status === "draft" && (
        <span className="text-[9px] px-1 py-0.5 rounded bg-amber-500/10 text-amber-400 shrink-0">پیش‌نویس</span>
      )}
    </button>
  );
}
