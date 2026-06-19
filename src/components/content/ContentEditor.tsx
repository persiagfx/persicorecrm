"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextStyle from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Bold, Italic, Underline as UnderlineIcon, Strikethrough, AlignRight, AlignLeft, AlignCenter, AlignJustify,
  List, ListOrdered, Heading1, Heading2, Heading3, Type, Palette, Highlighter, Copy, Save, Check,
  RotateCcw, RotateCw, ChevronDown, Quote
} from "lucide-react";
import { toast } from "sonner";

const FA_FONTS = ["Vazirmatn", "IranSans", "Yekan", "Shabnam", "Sahel", "Estedad"];
const EN_FONTS = ["Inter", "Roboto", "Playfair Display", "Merriweather", "Lato", "Open Sans"];

const COLORS = [
  "#ffffff", "#e2e8f0", "#94a3b8", "#64748b",
  "#f43f5e", "#fb923c", "#facc15", "#4ade80",
  "#22d3ee", "#818cf8", "#c084fc", "#f472b6",
];

const FONT_SIZES = ["12", "14", "16", "18", "20", "24", "28", "32", "36", "48"];

function markdownToHtml(md: string): string {
  const lines = md.split("\n");
  const result: string[] = [];
  let inUl = false;
  let inOl = false;

  const inline = (t: string) =>
    t.replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/_(.+?)_/g, "<em>$1</em>");

  const closeList = () => {
    if (inUl) { result.push("</ul>"); inUl = false; }
    if (inOl) { result.push("</ol>"); inOl = false; }
  };

  for (const line of lines) {
    const t = line.trim();
    if (!t) { closeList(); continue; }
    if (t.startsWith("### ")) { closeList(); result.push(`<h3>${inline(t.slice(4))}</h3>`); continue; }
    if (t.startsWith("## ")) { closeList(); result.push(`<h2>${inline(t.slice(3))}</h2>`); continue; }
    if (t.startsWith("# ")) { closeList(); result.push(`<h1>${inline(t.slice(2))}</h1>`); continue; }
    if (/^---+$/.test(t)) { closeList(); result.push("<hr/>"); continue; }
    if (/^[-*•] /.test(t)) {
      if (inOl) { result.push("</ol>"); inOl = false; }
      if (!inUl) { result.push("<ul>"); inUl = true; }
      result.push(`<li>${inline(t.slice(2).trim())}</li>`);
      continue;
    }
    if (/^\d+\. /.test(t)) {
      if (inUl) { result.push("</ul>"); inUl = false; }
      if (!inOl) { result.push("<ol>"); inOl = true; }
      result.push(`<li>${inline(t.replace(/^\d+\. /, ""))}</li>`);
      continue;
    }
    closeList();
    result.push(`<p>${inline(t)}</p>`);
  }
  closeList();
  return result.join("");
}

interface Props {
  initialContent: string;
  language: "fa" | "en";
  onSave?: (text: string, seoScore?: number) => void;
}

function ToolbarButton({
  active, onClick, title, children
}: {
  active?: boolean; onClick: () => void; title: string; children: React.ReactNode
}) {
  return (
    <button title={title} onClick={onClick}
      className={`p-1.5 rounded-lg transition-all duration-150 ${active ? "bg-violet-500/20 text-violet-300" : "text-white/40 hover:text-white/80 hover:bg-white/8"}`}>
      {children}
    </button>
  );
}

export default function ContentEditor({ initialContent, language, onSave }: Props) {
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [fontFamily, setFontFamily] = useState(language === "fa" ? "Vazirmatn" : "Inter");
  const [fontSize, setFontSize] = useState("16");
  const [showFontPicker, setShowFontPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const fontPickerRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder: "محتوا را اینجا ویرایش کنید..." }),
      CharacterCount,
    ],
    content: markdownToHtml(initialContent),
    editorProps: {
      attributes: {
        class: "focus:outline-none min-h-[400px] text-white/85 leading-8",
        dir: language === "fa" ? "rtl" : "ltr",
        style: `font-family: ${fontFamily}; font-size: ${fontSize}px;`,
      },
    },
  });

  useEffect(() => {
    if (editor && fontFamily) {
      editor.view.dom.setAttribute("style", `font-family: ${fontFamily}; font-size: ${fontSize}px;`);
    }
  }, [fontFamily, fontSize, editor]);

  const handleCopy = async () => {
    const text = editor?.getText() ?? "";
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("کپی شد");
  };

  const handleSave = () => {
    if (!editor || !onSave) return;
    onSave(editor.getText());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const allFonts = language === "fa" ? [...FA_FONTS, ...EN_FONTS] : [...EN_FONTS, ...FA_FONTS];

  if (!editor) return null;

  const wordCount = editor.storage.characterCount?.words() ?? 0;
  const charCount = editor.storage.characterCount?.characters() ?? 0;

  return (
    <div className="bg-white/3 border border-white/8 rounded-2xl overflow-hidden">
      {/* Toolbar */}
      <div className="border-b border-white/8 bg-black/20 p-3 flex flex-wrap items-center gap-1">
        {/* Font family */}
        <div className="relative" ref={fontPickerRef}>
          <button onClick={() => { setShowFontPicker(!showFontPicker); setShowColorPicker(false); setShowHighlightPicker(false); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 text-xs transition-all border border-white/10">
            <Type className="w-3.5 h-3.5" />
            <span className="max-w-[80px] truncate">{fontFamily}</span>
            <ChevronDown className="w-3 h-3" />
          </button>
          <AnimatePresence>
            {showFontPicker && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="absolute top-full mt-1 right-0 bg-[#0d0d16] border border-white/10 rounded-xl shadow-2xl z-50 min-w-[180px] p-1">
                {allFonts.map((f) => (
                  <button key={f} onClick={() => { setFontFamily(f); setShowFontPicker(false); }}
                    style={{ fontFamily: f }}
                    className={`w-full text-right px-3 py-2 rounded-lg text-sm transition-all ${fontFamily === f ? "bg-violet-500/20 text-violet-300" : "text-white/60 hover:bg-white/5 hover:text-white"}`}>
                    {f}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Font size */}
        <select value={fontSize} onChange={(e) => setFontSize(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-white/60 text-xs focus:outline-none hover:bg-white/10 transition-all">
          {FONT_SIZES.map((s) => <option key={s} value={s} className="bg-[#0d0d16]">{s}px</option>)}
        </select>

        <div className="w-px h-5 bg-white/10 mx-1" />

        {/* Text formatting */}
        <ToolbarButton active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold">
          <Bold className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic">
          <Italic className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Underline">
          <UnderlineIcon className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()} title="Strikethrough">
          <Strikethrough className="w-4 h-4" />
        </ToolbarButton>

        <div className="w-px h-5 bg-white/10 mx-1" />

        {/* Headings */}
        <ToolbarButton active={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} title="H1">
          <Heading1 className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="H2">
          <Heading2 className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="H3">
          <Heading3 className="w-4 h-4" />
        </ToolbarButton>

        <div className="w-px h-5 bg-white/10 mx-1" />

        {/* Lists */}
        <ToolbarButton active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Bullet list">
          <List className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Numbered list">
          <ListOrdered className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()} title="Quote">
          <Quote className="w-4 h-4" />
        </ToolbarButton>

        <div className="w-px h-5 bg-white/10 mx-1" />

        {/* Alignment */}
        <ToolbarButton active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()} title="Align right">
          <AlignRight className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()} title="Align center">
          <AlignCenter className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()} title="Align left">
          <AlignLeft className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton active={editor.isActive({ textAlign: "justify" })} onClick={() => editor.chain().focus().setTextAlign("justify").run()} title="Justify">
          <AlignJustify className="w-4 h-4" />
        </ToolbarButton>

        <div className="w-px h-5 bg-white/10 mx-1" />

        {/* Color */}
        <div className="relative">
          <button onClick={() => { setShowColorPicker(!showColorPicker); setShowFontPicker(false); setShowHighlightPicker(false); }}
            className="flex items-center gap-1 p-1.5 rounded-lg hover:bg-white/8 transition-all" title="Text color">
            <Palette className="w-4 h-4 text-white/40" />
            <div className="w-2 h-2 rounded-full border border-white/20" style={{ backgroundColor: editor.getAttributes("textStyle").color || "#ffffff" }} />
          </button>
          <AnimatePresence>
            {showColorPicker && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="absolute top-full mt-1 right-0 bg-[#0d0d16] border border-white/10 rounded-xl shadow-2xl z-50 p-3">
                <div className="grid grid-cols-6 gap-1.5">
                  {COLORS.map((c) => (
                    <button key={c} onClick={() => { editor.chain().focus().setColor(c).run(); setShowColorPicker(false); }}
                      className="w-6 h-6 rounded-md hover:scale-110 transition-transform border border-white/10"
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
                <button onClick={() => { editor.chain().focus().unsetColor().run(); setShowColorPicker(false); }}
                  className="w-full mt-2 py-1 text-white/40 hover:text-white/70 text-xs hover:bg-white/5 rounded-lg transition-all">
                  حذف رنگ
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Highlight */}
        <div className="relative">
          <button onClick={() => { setShowHighlightPicker(!showHighlightPicker); setShowFontPicker(false); setShowColorPicker(false); }}
            className="p-1.5 rounded-lg hover:bg-white/8 text-white/40 hover:text-white/80 transition-all" title="Highlight">
            <Highlighter className="w-4 h-4" />
          </button>
          <AnimatePresence>
            {showHighlightPicker && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="absolute top-full mt-1 right-0 bg-[#0d0d16] border border-white/10 rounded-xl shadow-2xl z-50 p-3">
                <div className="grid grid-cols-6 gap-1.5">
                  {COLORS.map((c) => (
                    <button key={c} onClick={() => { editor.chain().focus().setHighlight({ color: c }).run(); setShowHighlightPicker(false); }}
                      className="w-6 h-6 rounded-md hover:scale-110 transition-transform border border-white/10"
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
                <button onClick={() => { editor.chain().focus().unsetHighlight().run(); setShowHighlightPicker(false); }}
                  className="w-full mt-2 py-1 text-white/40 hover:text-white/70 text-xs hover:bg-white/5 rounded-lg transition-all">
                  حذف هایلایت
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="w-px h-5 bg-white/10 mx-1" />

        {/* Undo / Redo */}
        <ToolbarButton onClick={() => editor.chain().focus().undo().run()} title="Undo">
          <RotateCcw className="w-4 h-4" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().redo().run()} title="Redo">
          <RotateCw className="w-4 h-4" />
        </ToolbarButton>

        {/* Actions */}
        <div className="mr-auto flex items-center gap-2">
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 text-xs transition-all border border-white/10">
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "کپی شد" : "کپی"}
          </motion.button>
          {onSave && (
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleSave}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-500/10 hover:bg-violet-500/20 text-violet-400 text-xs transition-all border border-violet-500/20">
              {saved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
              {saved ? "ذخیره شد" : "ذخیره"}
            </motion.button>
          )}
        </div>
      </div>

      {/* Editor area */}
      <div className="p-6">
        <style jsx global>{`
          .ProseMirror h1 { font-size: 1.75rem; font-weight: 700; margin: 1rem 0 0.5rem; color: #e2e8f0; }
          .ProseMirror h2 { font-size: 1.4rem; font-weight: 600; margin: 1rem 0 0.5rem; color: #e2e8f0; }
          .ProseMirror h3 { font-size: 1.15rem; font-weight: 600; margin: 0.75rem 0 0.5rem; color: #cbd5e1; }
          .ProseMirror p { margin-bottom: 0.75rem; }
          .ProseMirror ul, .ProseMirror ol { padding-right: 1.5rem; margin-bottom: 0.75rem; }
          .ProseMirror li { margin-bottom: 0.25rem; }
          .ProseMirror blockquote { border-right: 3px solid #7c3aed; padding-right: 1rem; color: #94a3b8; margin: 1rem 0; }
          .ProseMirror mark { border-radius: 3px; padding: 0 2px; }
          .ProseMirror p.is-editor-empty:first-child::before { color: #ffffff20; content: attr(data-placeholder); float: right; height: 0; pointer-events: none; }
        `}</style>
        <EditorContent editor={editor} />
      </div>

      {/* Footer stats */}
      <div className="border-t border-white/5 px-6 py-2.5 flex items-center gap-4 text-white/25 text-xs">
        <span>{wordCount} کلمه</span>
        <span>{charCount} کاراکتر</span>
      </div>
    </div>
  );
}
