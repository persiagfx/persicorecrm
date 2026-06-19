"use client";

import { Plus, Trash2 } from "lucide-react";
import type { LanguageItem } from "../ResumeTypes";

interface Props {
  items: LanguageItem[];
  onChange: (items: LanguageItem[]) => void;
}

const cls = "bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white/70 text-sm focus:outline-none focus:border-violet-500/50";
const lbl = "block text-xs font-medium text-white/40 mb-1.5";

const LEVELS: LanguageItem["level"][] = ["native", "fluent", "advanced", "intermediate", "basic"];
const LEVEL_FA: Record<LanguageItem["level"], string> = {
  native: "زبان مادری",
  fluent: "روان",
  advanced: "پیشرفته",
  intermediate: "متوسط",
  basic: "مبتدی",
};

function blank(): LanguageItem {
  return { id: Math.random().toString(36).slice(2), name: "", level: "intermediate" };
}

export function LanguagesEditor({ items, onChange }: Props) {
  const add = () => onChange([...items, blank()]);
  const remove = (id: string) => onChange(items.filter(i => i.id !== id));
  const patch = (id: string, p: Partial<LanguageItem>) =>
    onChange(items.map(i => i.id === id ? { ...i, ...p } : i));

  return (
    <div className="space-y-4 max-w-xl">
      <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">زبان‌ها</h2>
      <div className="space-y-2">
        {items.map(item => (
          <div key={item.id} className="flex items-end gap-3 p-3 rounded-xl border border-white/10 bg-white/[0.03]">
            <div className="flex-1">
              <label className={lbl}>نام زبان (EN)</label>
              <input value={item.name} onChange={e => patch(item.id, { name: e.target.value })} dir="ltr" placeholder="English" className={cls + " w-full"} />
            </div>
            <div className="flex-1">
              <label className={lbl}>نام زبان (FA)</label>
              <input value={item.nameFa ?? ""} onChange={e => patch(item.id, { nameFa: e.target.value })} placeholder="انگلیسی" className={cls + " w-full"} />
            </div>
            <div className="w-36">
              <label className={lbl}>سطح</label>
              <select value={item.level} onChange={e => patch(item.id, { level: e.target.value as LanguageItem["level"] })} className={cls + " w-full"}>
                {LEVELS.map(l => (
                  <option key={l} value={l}>{LEVEL_FA[l]}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className={lbl}>گواهینامه</label>
              <input value={item.certificate ?? ""} onChange={e => patch(item.id, { certificate: e.target.value })} dir="ltr" placeholder="IELTS 7.5" className={cls + " w-full"} />
            </div>
            <button onClick={() => remove(item.id)} className="p-2.5 rounded-xl text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all mb-0.5">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
      <button onClick={add} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-white/20 text-white/40 text-sm hover:border-violet-500/40 hover:text-violet-400 w-full justify-center transition-all">
        <Plus className="w-4 h-4" />افزودن زبان
      </button>
    </div>
  );
}
