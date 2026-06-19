"use client";

import { useState } from "react";
import { Plus, Trash2, ChevronDown, ChevronUp, Star } from "lucide-react";
import type { ProjectItem } from "../ResumeTypes";

interface Props {
  items: ProjectItem[];
  onChange: (items: ProjectItem[]) => void;
}

const cls = "w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white/70 text-sm focus:outline-none focus:border-violet-500/50";
const lbl = "block text-xs font-medium text-white/40 mb-1.5";

function blank(): ProjectItem {
  return { id: Math.random().toString(36).slice(2), name: "", tags: [] };
}

export function ProjectsEditor({ items, onChange }: Props) {
  const [open, setOpen] = useState<string | null>(null);

  const add = () => {
    const item = blank();
    onChange([...items, item]);
    setOpen(item.id);
  };
  const remove = (id: string) => onChange(items.filter(i => i.id !== id));
  const patch = (id: string, p: Partial<ProjectItem>) =>
    onChange(items.map(i => i.id === id ? { ...i, ...p } : i));

  return (
    <div className="space-y-4 max-w-xl">
      <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">پروژه‌ها</h2>
      <div className="space-y-2">
        {items.map(item => (
          <div key={item.id} className="rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden">
            <div
              className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/5"
              onClick={() => setOpen(open === item.id ? null : item.id)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-medium text-white truncate">{item.name || "نام پروژه"}</p>
                  {item.featured && <Star className="w-3 h-3 text-yellow-400 shrink-0" />}
                </div>
                <p className="text-xs text-white/40 truncate">{(item.tags ?? []).slice(0, 3).join(" · ")}</p>
              </div>
              <button onClick={e => { e.stopPropagation(); remove(item.id); }} className="p-1 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              {open === item.id ? <ChevronUp className="w-4 h-4 text-white/30 shrink-0" /> : <ChevronDown className="w-4 h-4 text-white/30 shrink-0" />}
            </div>

            {open === item.id && (
              <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><label className={lbl}>نام (EN)</label><input value={item.name} onChange={e => patch(item.id, { name: e.target.value })} dir="ltr" className={cls} /></div>
                  <div><label className={lbl}>نام (FA)</label><input value={item.nameFa ?? ""} onChange={e => patch(item.id, { nameFa: e.target.value })} className={cls} /></div>
                </div>
                <div><label className={lbl}>توضیحات (EN)</label><textarea value={item.description ?? ""} onChange={e => patch(item.id, { description: e.target.value })} rows={3} dir="ltr" className={cls + " resize-none"} /></div>
                <div><label className={lbl}>توضیحات (FA)</label><textarea value={item.descriptionFa ?? ""} onChange={e => patch(item.id, { descriptionFa: e.target.value })} rows={3} className={cls + " resize-none"} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className={lbl}>لینک پروژه</label><input value={item.url ?? ""} onChange={e => patch(item.id, { url: e.target.value })} dir="ltr" placeholder="https://..." className={cls} /></div>
                  <div><label className={lbl}>GitHub</label><input value={item.github ?? ""} onChange={e => patch(item.id, { github: e.target.value })} dir="ltr" placeholder="github.com/..." className={cls} /></div>
                  <div><label className={lbl}>تصویر (URL)</label><input value={item.image ?? ""} onChange={e => patch(item.id, { image: e.target.value })} dir="ltr" className={cls} /></div>
                  <div><label className={lbl}>تاریخ</label><input value={item.startDate ?? ""} onChange={e => patch(item.id, { startDate: e.target.value })} dir="ltr" placeholder="2024-01" className={cls} /></div>
                </div>
                <div><label className={lbl}>تگ‌ها (با کاما)</label><input value={(item.tags ?? []).join(", ")} onChange={e => patch(item.id, { tags: e.target.value.split(",").map(t => t.trim()).filter(Boolean) })} dir="ltr" className={cls} /></div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={!!item.featured} onChange={e => patch(item.id, { featured: e.target.checked })} className="accent-violet-500" />
                  <span className="text-xs text-white/50">پروژه ویژه (Featured)</span>
                </label>
              </div>
            )}
          </div>
        ))}
      </div>
      <button onClick={add} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-white/20 text-white/40 text-sm hover:border-violet-500/40 hover:text-violet-400 w-full justify-center transition-all">
        <Plus className="w-4 h-4" />افزودن پروژه
      </button>
    </div>
  );
}
