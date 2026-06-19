"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { List } from "lucide-react";

interface TocItem {
  id: string;
  text: string;
  level: 2 | 3;
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w؀-ۿ-]/g, "");
}

export function TableOfContents({ content, className }: { content: string; className?: string }) {
  const [activeId, setActiveId] = useState<string>("");

  const items: TocItem[] = [];
  const regex = /<h([23])[^>]*>(.*?)<\/h[23]>/gi;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const level = parseInt(match[1]) as 2 | 3;
    const text = match[2].replace(/<[^>]+>/g, "");
    if (text.trim()) {
      items.push({ id: slugify(text), text, level });
    }
  }

  useEffect(() => {
    if (items.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
            break;
          }
        }
      },
      { rootMargin: "0px 0px -70% 0px", threshold: 0.1 }
    );
    items.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [content]);

  if (items.length < 2) return null;

  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">
        <List className="w-3 h-3" />
        فهرست مطالب
      </div>
      {items.map((item) => (
        <a
          key={item.id}
          href={`#${item.id}`}
          className={cn(
            "block text-xs leading-relaxed transition-all duration-150 hover:text-foreground truncate",
            item.level === 3 ? "pr-3 text-muted-foreground/70" : "text-muted-foreground",
            activeId === item.id && "text-primary font-medium"
          )}
          onClick={(e) => {
            e.preventDefault();
            document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth" });
          }}
        >
          {item.level === 3 && <span className="opacity-40 mr-1">└</span>}
          {item.text}
        </a>
      ))}
    </div>
  );
}
