"use client";

import { useState } from "react";
import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import type { ExperienceItem } from "../ResumeTypes";

interface Props {
  items: ExperienceItem[];
  onChange: (items: ExperienceItem[]) => void;
}

const cls = "w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white/70 text-sm focus:outline-none focus:border-violet-500/50";
const lbl = "block text-xs font-medium text-white/40 mb-1.5";

function blank(): ExperienceItem {
  return { id: Math.random().toString(36).slice(2), company: "", role: "", startDate: "", tags: [], achievements: [] };
}

export function ExperienceEditor({ items, onChange }: Props) {
  const [open, setOpen] = useState<string | null>(null);

  const add = () => {
    const item = blank();
    onChange([...items, item]);
    setOpen(item.id);
  };
  const remove = (id: string) => onChange(items.filter(i => i.id !== id));
  const patch = (id: string, p: Partial<ExperienceItem>) =>
    onChange(items.map(i => i.id === id ? { ...i, ...p } : i));

  return (
    <div className="space-y-4 max-w-xl">
      <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">تجربه کاری</h2>
      <div className="space-y-2">
        {items.map(item => (
          <div key={item.id} className="rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden">
            <div
              className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/5"
              onClick={() => setOpen(open === item.id ? null : item.id)}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{item.role || "عنوان شغلی"}</p>
                <p className="text-xs text-white/40 truncate">{item.company || "نام شرکت"}</p>
              </div>
              <button
                onClick={e => { e.stopPropagation(); remove(item.id); }}
                className="p-1 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              {open === item.id ? <ChevronUp className="w-4 h-4 text-white/30 shrink-0" /> : <ChevronDown className="w-4 h-4 text-white/30 shrink-0" />}
            </div>

            {open === item.id && (
              <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><label className={lbl}>شرکت (EN)</label><input value={item.company} onChange={e => patch(item.id, { company: e.target.value })} dir="ltr" className={cls} /></div>
                  <div><label className={lbl}>شرکت (FA)</label><input value={item.companyFa ?? ""} onChange={e => patch(item.id, { companyFa: e.target.value })} className={cls} /></div>
                  <div><label className={lbl}>عنوان (EN)</label><input value={item.role} onChange={e => patch(item.id, { role: e.target.value })} dir="ltr" className={cls} /></div>
                  <div><label className={lbl}>عنوان (FA)</label><input value={item.roleFa ?? ""} onChange={e => patch(item.id, { roleFa: e.target.value })} className={cls} /></div>
                  <div><label className={lbl}>شروع</label><input value={item.startDate} onChange={e => patch(item.id, { startDate: e.target.value })} dir="ltr" placeholder="2022-01" className={cls} /></div>
                  <div>
                    <label className={lbl}>پایان</label>
                    <input value={item.endDate ?? ""} onChange={e => patch(item.id, { endDate: e.target.value })} dir="ltr" placeholder="2024-06" disabled={!!item.current} className={cls + (item.current ? " opacity-40" : "")} />
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={!!item.current} onChange={e => patch(item.id, { current: e.target.checked, endDate: e.target.checked ? undefined : item.endDate })} className="accent-violet-500" />
                  <span className="text-xs text-white/50">شغل فعلی</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className={lbl}>موقعیت</label><input value={item.location ?? ""} onChange={e => patch(item.id, { location: e.target.value })} dir="ltr" className={cls} /></div>
                  <label className="flex items-center gap-2 cursor-pointer mt-5">
                    <input type="checkbox" checked={!!item.remote} onChange={e => patch(item.id, { remote: e.target.checked })} className="accent-violet-500" />
                    <span className="text-xs text-white/50">ریموت</span>
                  </label>
                </div>
                <div><label className={lbl}>توضیحات (EN)</label><textarea value={item.description ?? ""} onChange={e => patch(item.id, { description: e.target.value })} rows={3} dir="ltr" className={cls + " resize-none"} /></div>
                <div><label className={lbl}>توضیحات (FA)</label><textarea value={item.descriptionFa ?? ""} onChange={e => patch(item.id, { descriptionFa: e.target.value })} rows={3} className={cls + " resize-none"} /></div>
                <div><label className={lbl}>تگ‌ها (با کاما)</label><input value={(item.tags ?? []).join(", ")} onChange={e => patch(item.id, { tags: e.target.value.split(",").map(t => t.trim()).filter(Boolean) })} dir="ltr" placeholder="React, Node.js" className={cls} /></div>
                <div><label className={lbl}>دستاوردها EN (هر خط یک مورد)</label><textarea value={(item.achievements ?? []).join("\n")} onChange={e => patch(item.id, { achievements: e.target.value.split("\n").filter(Boolean) })} rows={3} dir="ltr" className={cls + " resize-none"} /></div>
                <div><label className={lbl}>دستاوردها FA (هر خط یک مورد)</label><textarea value={(item.achievementsFa ?? []).join("\n")} onChange={e => patch(item.id, { achievementsFa: e.target.value.split("\n").filter(Boolean) })} rows={3} className={cls + " resize-none"} /></div>
              </div>
            )}
          </div>
        ))}
      </div>
      <button onClick={add} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-white/20 text-white/40 text-sm hover:border-violet-500/40 hover:text-violet-400 w-full justify-center transition-all">
        <Plus className="w-4 h-4" />افزودن تجربه
      </button>
    </div>
  );
}
