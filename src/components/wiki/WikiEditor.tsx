"use client";

import { useCallback, useEffect, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import UnderlineExt from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import LinkExt from "@tiptap/extension-link";
import ImageExt from "@tiptap/extension-image";
import TableExt from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import CharacterCount from "@tiptap/extension-character-count";
import Highlight from "@tiptap/extension-highlight";
import TextStyle from "@tiptap/extension-text-style";
import {
  Bold, Italic, Underline, Strikethrough, Code, List, ListOrdered,
  Heading2, Heading3, Quote, Undo, Redo, AlignRight, AlignCenter,
  AlignLeft, Save, X, Link2, Image, Table, Minus, Maximize2,
  Minimize2, Type, Highlighter, RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ─── Toolbar separator ───────────────────────────────────────────────
const Sep = () => <div className="w-px h-4 bg-border mx-0.5 shrink-0" />;

// ─── Toolbar Button ───────────────────────────────────────────────────
function Btn({
  onClick, active, disabled, title, children,
}: {
  onClick: () => void; active?: boolean; disabled?: boolean;
  title?: string; children: React.ReactNode;
}) {
  return (
    <button type="button" title={title} onClick={onClick} disabled={disabled}
      className={cn(
        "p-1.5 rounded-md transition-colors text-sm shrink-0",
        active ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted",
        disabled && "opacity-30 cursor-not-allowed pointer-events-none"
      )}>
      {children}
    </button>
  );
}

// ─── Highlight color picker ───────────────────────────────────────────
const HIGHLIGHT_COLORS = [
  { color: "#fef08a", label: "زرد" },
  { color: "#bbf7d0", label: "سبز" },
  { color: "#bfdbfe", label: "آبی" },
  { color: "#fecdd3", label: "صورتی" },
  { color: "#fed7aa", label: "نارنجی" },
];

interface WikiEditorProps {
  content: string;
  onSave: (html: string, title: string) => void;
  onCancel: () => void;
  initialTitle: string;
  status: "draft" | "published";
  onStatusChange: (s: "draft" | "published") => void;
  folderId: string;
  folders: { id: string; label: string; icon: string }[];
  onFolderChange: (id: string) => void;
  tags: string[];
  onTagsChange: (tags: string[]) => void;
}

export function WikiEditor({
  content, onSave, onCancel, initialTitle,
  status, onStatusChange, folderId, folders, onFolderChange,
  tags, onTagsChange,
}: WikiEditorProps) {
  const [title, setTitle] = useState(initialTitle);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [showImageInput, setShowImageInput] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [showHighlights, setShowHighlights] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [autoSaved, setAutoSaved] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      UnderlineExt,
      TextStyle,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder: "متن مقاله را اینجا بنویسید... (/ برای دستورات)" }),
      LinkExt.configure({ openOnClick: false, HTMLAttributes: { class: "text-primary underline cursor-pointer" } }),
      ImageExt.configure({ HTMLAttributes: { class: "rounded-xl max-w-full my-2" } }),
      TableExt.configure({ resizable: false }),
      TableRow,
      TableCell,
      TableHeader,
      CharacterCount,
    ],
    content,
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none min-h-[360px] p-5 outline-none text-foreground leading-loose",
        dir: "rtl",
      },
    },
  });

  // Auto-save every 30s
  useEffect(() => {
    if (!editor) return;
    const interval = setInterval(() => {
      setAutoSaved(true);
      setTimeout(() => setAutoSaved(false), 2000);
    }, 30_000);
    return () => clearInterval(interval);
  }, [editor]);

  const handleSave = useCallback(() => {
    if (!editor) return;
    if (!title.trim()) { toast.error("عنوان مقاله نمی‌تواند خالی باشد"); return; }
    onSave(editor.getHTML(), title);
    toast.success("مقاله ذخیره شد");
  }, [editor, title, onSave]);

  const insertLink = () => {
    if (!linkUrl.trim() || !editor) return;
    editor.chain().focus().setLink({ href: linkUrl }).run();
    setLinkUrl(""); setShowLinkInput(false);
  };

  const insertImage = () => {
    if (!imageUrl.trim() || !editor) return;
    editor.chain().focus().setImage({ src: imageUrl }).run();
    setImageUrl(""); setShowImageInput(false);
  };

  const insertTable = () => {
    editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  const addTag = () => {
    const trimmed = tagInput.trim();
    if (!trimmed || tags.includes(trimmed)) { setTagInput(""); return; }
    onTagsChange([...tags, trimmed]);
    setTagInput("");
  };

  const wordCount = editor?.storage.characterCount?.words() ?? 0;
  const readTime = Math.max(1, Math.round(wordCount / 200));

  if (!editor) return null;

  return (
    <div className={cn(
      "flex flex-col bg-card border border-border rounded-2xl overflow-hidden transition-all",
      isFullscreen && "fixed inset-4 z-50 shadow-2xl"
    )}>
      {/* Meta bar */}
      <div className="flex flex-wrap items-center gap-3 px-4 py-2.5 border-b border-border bg-muted/20">
        {/* Folder */}
        <select value={folderId} onChange={(e) => onFolderChange(e.target.value)}
          className="text-xs px-2 py-1 rounded-lg bg-muted border border-border text-foreground focus:outline-none">
          {folders.map((f) => (
            <option key={f.id} value={f.id}>{f.icon} {f.label}</option>
          ))}
        </select>

        {/* Status toggle */}
        <button onClick={() => onStatusChange(status === "draft" ? "published" : "draft")}
          className={cn("flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium border transition-all",
            status === "published"
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
              : "bg-amber-500/10 text-amber-400 border-amber-500/20"
          )}>
          <span className={cn("w-1.5 h-1.5 rounded-full", status === "published" ? "bg-emerald-400" : "bg-amber-400")} />
          {status === "published" ? "منتشرشده" : "پیش‌نویس"}
        </button>

        {/* Tags */}
        <div className="flex items-center gap-1 flex-wrap">
          {tags.map((tag) => (
            <span key={tag} className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
              {tag}
              <button onClick={() => onTagsChange(tags.filter((t) => t !== tag))} className="hover:text-red-400">×</button>
            </span>
          ))}
          <input value={tagInput} onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addTag(); } }}
            placeholder="+ تگ"
            className="text-[10px] w-14 bg-transparent text-muted-foreground placeholder:text-muted-foreground/50 outline-none" />
        </div>

        <div className="flex-1" />

        {/* Stats */}
        <span className="text-[10px] text-muted-foreground hidden sm:block">
          {wordCount.toLocaleString("fa-IR")} کلمه · {readTime} دقیقه مطالعه
        </span>
        {autoSaved && <span className="text-[10px] text-emerald-400">✓ ذخیره خودکار</span>}

        {/* Fullscreen */}
        <button onClick={() => setIsFullscreen(!isFullscreen)}
          className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
          {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Title */}
      <div className="px-5 pt-4 pb-2 border-b border-border">
        <input value={title} onChange={(e) => setTitle(e.target.value)}
          className="w-full text-xl font-bold text-foreground bg-transparent outline-none placeholder:text-muted-foreground"
          placeholder="عنوان مقاله..." />
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-border bg-muted/20 overflow-x-auto">
        <Btn onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="واگرد (Ctrl+Z)">
          <Undo className="w-3.5 h-3.5" />
        </Btn>
        <Btn onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="بازگشت (Ctrl+Y)">
          <Redo className="w-3.5 h-3.5" />
        </Btn>
        <Sep />

        {/* Headings */}
        <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive("heading", { level: 1 })} title="عنوان ۱">
          <span className="text-[11px] font-bold leading-none">H1</span>
        </Btn>
        <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} title="عنوان ۲">
          <Heading2 className="w-3.5 h-3.5" />
        </Btn>
        <Btn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })} title="عنوان ۳">
          <Heading3 className="w-3.5 h-3.5" />
        </Btn>
        <Sep />

        {/* Text formatting */}
        <Btn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="ضخیم (Ctrl+B)">
          <Bold className="w-3.5 h-3.5" />
        </Btn>
        <Btn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="کج (Ctrl+I)">
          <Italic className="w-3.5 h-3.5" />
        </Btn>
        <Btn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")} title="زیرخط (Ctrl+U)">
          <Underline className="w-3.5 h-3.5" />
        </Btn>
        <Btn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} title="خط‌خورده">
          <Strikethrough className="w-3.5 h-3.5" />
        </Btn>
        <Btn onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive("code")} title="کد داخلی">
          <Code className="w-3.5 h-3.5" />
        </Btn>
        <Sep />

        {/* Highlight */}
        <div className="relative">
          <Btn onClick={() => { setShowHighlights(!showHighlights); setShowLinkInput(false); setShowImageInput(false); }}
            active={editor.isActive("highlight")} title="هایلایت">
            <Highlighter className="w-3.5 h-3.5" />
          </Btn>
          {showHighlights && (
            <div className="absolute top-full mt-1 right-0 z-20 flex gap-1 p-1.5 bg-card border border-border rounded-xl shadow-xl">
              {HIGHLIGHT_COLORS.map(({ color, label }) => (
                <button key={color} title={label}
                  onClick={() => { editor.chain().focus().toggleHighlight({ color }).run(); setShowHighlights(false); }}
                  className="w-5 h-5 rounded-md border border-border/50 hover:scale-110 transition-transform"
                  style={{ backgroundColor: color }} />
              ))}
              <button title="حذف هایلایت"
                onClick={() => { editor.chain().focus().unsetHighlight().run(); setShowHighlights(false); }}
                className="w-5 h-5 rounded-md bg-muted flex items-center justify-center text-muted-foreground hover:text-red-400">
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
        <Sep />

        {/* Lists */}
        <Btn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="لیست">
          <List className="w-3.5 h-3.5" />
        </Btn>
        <Btn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="لیست شماره‌دار">
          <ListOrdered className="w-3.5 h-3.5" />
        </Btn>
        <Btn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="نقل‌قول">
          <Quote className="w-3.5 h-3.5" />
        </Btn>
        <Btn onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive("codeBlock")} title="بلوک کد">
          <span className="text-[10px] font-mono leading-none px-0.5">{"{}"}</span>
        </Btn>
        <Sep />

        {/* Alignment */}
        <Btn onClick={() => editor.chain().focus().setTextAlign("right").run()} active={editor.isActive({ textAlign: "right" })} title="راست‌چین">
          <AlignRight className="w-3.5 h-3.5" />
        </Btn>
        <Btn onClick={() => editor.chain().focus().setTextAlign("center").run()} active={editor.isActive({ textAlign: "center" })} title="وسط‌چین">
          <AlignCenter className="w-3.5 h-3.5" />
        </Btn>
        <Btn onClick={() => editor.chain().focus().setTextAlign("left").run()} active={editor.isActive({ textAlign: "left" })} title="چپ‌چین">
          <AlignLeft className="w-3.5 h-3.5" />
        </Btn>
        <Sep />

        {/* Link */}
        <div className="relative">
          <Btn onClick={() => { setShowLinkInput(!showLinkInput); setShowImageInput(false); setShowHighlights(false); }}
            active={editor.isActive("link")} title="درج لینک">
            <Link2 className="w-3.5 h-3.5" />
          </Btn>
          {showLinkInput && (
            <div className="absolute top-full mt-1 right-0 z-20 flex gap-1 p-1.5 bg-card border border-border rounded-xl shadow-xl w-64">
              <input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && insertLink()}
                placeholder="https://..." dir="ltr"
                className="flex-1 text-xs px-2 py-1 rounded-lg bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none" />
              <button onClick={insertLink} className="text-xs px-2 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20">درج</button>
            </div>
          )}
        </div>

        {/* Image */}
        <div className="relative">
          <Btn onClick={() => { setShowImageInput(!showImageInput); setShowLinkInput(false); setShowHighlights(false); }} title="درج تصویر">
            <Image className="w-3.5 h-3.5" />
          </Btn>
          {showImageInput && (
            <div className="absolute top-full mt-1 right-0 z-20 flex gap-1 p-1.5 bg-card border border-border rounded-xl shadow-xl w-64">
              <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && insertImage()}
                placeholder="آدرس URL تصویر..." dir="ltr"
                className="flex-1 text-xs px-2 py-1 rounded-lg bg-muted border border-border text-foreground placeholder:text-muted-foreground focus:outline-none" />
              <button onClick={insertImage} className="text-xs px-2 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20">درج</button>
            </div>
          )}
        </div>

        {/* Table */}
        <Btn onClick={insertTable} title="درج جدول">
          <Table className="w-3.5 h-3.5" />
        </Btn>

        {/* HR */}
        <Btn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="خط جدا‌کننده">
          <Minus className="w-3.5 h-3.5" />
        </Btn>

        {/* Clear formatting */}
        <Btn onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()} title="پاک کردن قالب‌بندی">
          <Type className="w-3.5 h-3.5" />
        </Btn>

        <div className="flex-1" />

        {/* Actions */}
        <button onClick={onCancel} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-muted text-muted-foreground hover:text-foreground transition-colors">
          <X className="w-3 h-3" />لغو
        </button>
        <button onClick={handleSave} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg gradient-brand text-black font-semibold gold-glow">
          <Save className="w-3 h-3" />ذخیره
        </button>
      </div>

      {/* Editor area */}
      <div className="flex-1 overflow-y-auto">
        <EditorContent editor={editor} />
      </div>

      {/* Table bubble controls */}
      {editor.isActive("table") && (
        <div className="px-4 py-2 border-t border-border bg-muted/20 flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">جدول:</span>
          {[
            { label: "افزودن ستون قبل", fn: () => editor.chain().focus().addColumnBefore().run() },
            { label: "افزودن ستون بعد", fn: () => editor.chain().focus().addColumnAfter().run() },
            { label: "حذف ستون", fn: () => editor.chain().focus().deleteColumn().run() },
            { label: "افزودن ردیف", fn: () => editor.chain().focus().addRowAfter().run() },
            { label: "حذف ردیف", fn: () => editor.chain().focus().deleteRow().run() },
            { label: "حذف جدول", fn: () => editor.chain().focus().deleteTable().run() },
          ].map(({ label, fn }) => (
            <button key={label} onClick={fn} className="text-[10px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors">
              {label}
            </button>
          ))}
        </div>
      )}

      <style>{`
        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder); float: right;
          color: hsl(var(--muted-foreground)); pointer-events: none; height: 0;
        }
        .ProseMirror:focus { outline: none; }
        .ProseMirror h1 { font-size: 1.5rem; font-weight: 800; margin: 1.2rem 0 0.6rem; color: hsl(var(--foreground)); }
        .ProseMirror h2 { font-size: 1.25rem; font-weight: 700; margin: 1rem 0 0.5rem; color: hsl(var(--foreground)); }
        .ProseMirror h3 { font-size: 1.05rem; font-weight: 600; margin: 0.75rem 0 0.25rem; color: hsl(var(--foreground)); }
        .ProseMirror p { margin: 0.4rem 0; }
        .ProseMirror ul, .ProseMirror ol { padding-right: 1.5rem; margin: 0.5rem 0; }
        .ProseMirror li { margin: 0.2rem 0; }
        .ProseMirror li[data-type="taskItem"] { display: flex; align-items: flex-start; gap: 0.5rem; }
        .ProseMirror li[data-type="taskItem"] > label { margin-top: 0.1rem; }
        .ProseMirror blockquote { border-right: 3px solid hsl(var(--primary)); padding-right: 1rem; color: hsl(var(--muted-foreground)); margin: 0.75rem 0; font-style: italic; background: hsl(var(--muted)/0.3); padding: 0.75rem 1rem; border-radius: 0 8px 8px 0; }
        .ProseMirror code { background: hsl(var(--muted)); padding: 0.1em 0.4em; border-radius: 4px; font-family: monospace; font-size: 0.85em; color: hsl(var(--primary)); }
        .ProseMirror pre { background: hsl(240 10% 8%); border: 1px solid hsl(var(--border)); border-radius: 10px; padding: 1rem; margin: 0.75rem 0; overflow-x: auto; }
        .ProseMirror pre code { background: transparent; padding: 0; color: #e2e8f0; font-size: 0.85rem; }
        .ProseMirror strong { font-weight: 700; }
        .ProseMirror em { font-style: italic; }
        .ProseMirror s { text-decoration: line-through; }
        .ProseMirror hr { border: none; border-top: 1px solid hsl(var(--border)); margin: 1rem 0; }
        .ProseMirror a { color: hsl(var(--primary)); text-decoration: underline; cursor: pointer; }
        .ProseMirror img { max-width: 100%; border-radius: 10px; margin: 0.5rem 0; }
        .ProseMirror table { border-collapse: collapse; width: 100%; margin: 0.75rem 0; }
        .ProseMirror th, .ProseMirror td { border: 1px solid hsl(var(--border)); padding: 0.5rem 0.75rem; text-align: right; }
        .ProseMirror th { background: hsl(var(--muted)); font-weight: 600; }
        .ProseMirror mark { border-radius: 3px; padding: 0 2px; }
      `}</style>
    </div>
  );
}
