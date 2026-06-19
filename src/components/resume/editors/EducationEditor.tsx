"use client";

import { useState } from "react";
import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import type { EducationItem } from "../ResumeTypes";

interface Props {
  items: EducationItem[];
  onChange: (items: EducationItem[]) => void;
}

const cls = "w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white/70 text-sm focus:outline-none focus:border-violet-500/50";
const lbl = "block text-xs font-medium text-white/40 mb-1.5";

function blank(): EducationItem {
  return { id: Math.random().toString(36).slice(2), institution: "", degree: "", startDate: "" };
}

export function EducationEditor({ items, onChange }: Props) {
  const [open, setOpen] = useState<string | null>(null);

  const add = () => {
    const item = blank();
    onChange([...items, item]);
    setOpen(item.id);
  };
  const remove = (id: string) => onChange(items.filter(i => i.id !== id));
  const patch = (id: string, p: Partial<EducationItem>) =>
    onChange(items.map(i => i.id === id ? { ...i, ...p } : i));

  return (
    <div className="space-y-4 max-w-xl">
      <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">تحصیلات</h2>
      <div className="space-y-2">
        {items.map(item => (
          <div key={item.id} className="rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden">
            <div
              className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/5"
              onClick={() => setOpen(open === item.id ? null : item.id)}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{item.degree || "مقطع"}</p>
                <p className="text-xs text-white/40 truncate">{item.institution || "دانشگاه"}</p>
              </div>
              <button onClick={e => { e.stopPropagation(); remove(item.id); }} className="p-1 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              {open === item.id ? <ChevronUp className="w-4 h-4 text-white/30 shrink-0" /> : <ChevronDown className="w-4 h-4 text-white/30 shrink-0" />}
            </div>

            {open === item.id && (
              <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><label className={lbl}>دانشگاه (EN)</label><input value={item.institution} onChange={e => patch(item.id, { institution: e.target.value })} dir="ltr" className={cls} /></div>
                  <div><label className={lbl}>دانشگاه (FA)</label><input value={item.institutionFa ?? ""} onChange={e => patch(item.id, { institutionFa: e.target.value })} className={cls} /></div>
                  <div><label className={lbl}>مقطع (EN)</label><input value={item.degree} onChange={e => patch(item.id, { degree: e.target.value })} dir="ltr" className={cls} placeholder="B.Sc." /></div>
                  <div><label className={lbl}>مقطع (FA)</label><input value={item.degreeFa ?? ""} onChange={e => patch(item.id, { degreeFa: e.target.value })} className={cls} placeholder="کارشناسی" /></div>
                  <div><label className={lbl}>رشته (EN)</label><input value={item.field ?? ""} onChange={e => patch(item.id, { field: e.target.value })} dir="ltr" className={cls} /></div>
                  <div><label className={lbl}>رشته (FA)</label><input value={item.fieldFa ?? ""} onChange={e => patch(item.id, { fieldFa: e.target.value })} className={cls} /></div>
                  <div><label className={lbl}>شروع</label><input value={item.startDate} onChange={e => patch(item.id, { startDate: e.target.value })} dir="ltr" placeholder="2018-09" className={cls} /></div>
                  <div><label className={lbl}>پایان</label><input value={item.endDate ?? ""} onChange={e => patch(item.id, { endDate: e.target.value })} dir="ltr" placeholder="2022-06" disabled={!!item.current} className={cls + (item.current ? " opacity-40" : "")} /></div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={!!item.current} onChange={e => patch(item.id, { current: e.target.checked })} className="accent-violet-500" />
                  <span className="text-xs text-white/50">در حال تحصیل</span>
                </label>
                <div><label className={lbl}>معدل</label><input value={item.gpa ?? ""} onChange={e => patch(item.id, { gpa: e.target.value })} dir="ltr" placeholder="18.5 / 20" className={cls} /></div>
                <div><label className={lbl}>توضیحات</label><textarea value={item.description ?? ""} onChange={e => patch(item.id, { description: e.target.value })} rows={2} dir="ltr" className={cls + " resize-none"} /></div>
              </div>
            )}
          </div>
        ))}
      </div>
      <button onClick={add} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-white/20 text-white/40 text-sm hover:border-violet-500/40 hover:text-violet-400 w-full justify-center transition-all">
        <Plus className="w-4 h-4" />افزودن تحصیلات
      </button>
    </div>
  );
}
