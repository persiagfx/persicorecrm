"use client";

import { useState } from "react";
import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import type { SkillGroup, SkillItem } from "../ResumeTypes";

interface Props {
  groups: SkillGroup[];
  onChange: (groups: SkillGroup[]) => void;
}

const cls = "w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white/70 text-sm focus:outline-none focus:border-violet-500/50";
const lbl = "block text-xs font-medium text-white/40 mb-1.5";

function blankGroup(): SkillGroup {
  return { id: Math.random().toString(36).slice(2), category: "", items: [] };
}

function blankSkill(): SkillItem {
  return { id: Math.random().toString(36).slice(2), name: "", level: 80, type: "technical" };
}

export function SkillsEditor({ groups, onChange }: Props) {
  const [open, setOpen] = useState<string | null>(null);

  const addGroup = () => {
    const g = blankGroup();
    onChange([...groups, g]);
    setOpen(g.id);
  };
  const removeGroup = (id: string) => onChange(groups.filter(g => g.id !== id));
  const patchGroup = (id: string, p: Partial<SkillGroup>) =>
    onChange(groups.map(g => g.id === id ? { ...g, ...p } : g));

  const addSkill = (gid: string) => {
    const s = blankSkill();
    patchGroup(gid, { items: [...(groups.find(g => g.id === gid)?.items ?? []), s] });
  };
  const removeSkill = (gid: string, sid: string) =>
    patchGroup(gid, { items: groups.find(g => g.id === gid)!.items.filter(s => s.id !== sid) });
  const patchSkill = (gid: string, sid: string, p: Partial<SkillItem>) =>
    patchGroup(gid, {
      items: groups.find(g => g.id === gid)!.items.map(s => s.id === sid ? { ...s, ...p } : s),
    });

  return (
    <div className="space-y-4 max-w-xl">
      <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">مهارت‌ها</h2>
      <div className="space-y-2">
        {groups.map(g => (
          <div key={g.id} className="rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden">
            <div
              className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/5"
              onClick={() => setOpen(open === g.id ? null : g.id)}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{g.category || "دسته‌بندی"}</p>
                <p className="text-xs text-white/40">{g.items.length} مهارت</p>
              </div>
              <button onClick={e => { e.stopPropagation(); removeGroup(g.id); }} className="p-1 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              {open === g.id ? <ChevronUp className="w-4 h-4 text-white/30 shrink-0" /> : <ChevronDown className="w-4 h-4 text-white/30 shrink-0" />}
            </div>

            {open === g.id && (
              <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><label className={lbl}>دسته‌بندی (EN)</label><input value={g.category} onChange={e => patchGroup(g.id, { category: e.target.value })} dir="ltr" className={cls} placeholder="Frontend" /></div>
                  <div><label className={lbl}>دسته‌بندی (FA)</label><input value={g.categoryFa ?? ""} onChange={e => patchGroup(g.id, { categoryFa: e.target.value })} className={cls} placeholder="فرانت‌اند" /></div>
                </div>

                <div className="space-y-2">
                  {g.items.map(s => (
                    <div key={s.id} className="flex items-center gap-2">
                      <input value={s.name} onChange={e => patchSkill(g.id, s.id, { name: e.target.value })} dir="ltr" placeholder="React" className={cls + " flex-1"} />
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-xs text-white/30 w-7 text-center">{s.level ?? 80}%</span>
                        <input type="range" min={0} max={100} value={s.level ?? 80} onChange={e => patchSkill(g.id, s.id, { level: Number(e.target.value) })} className="w-20 accent-violet-500" />
                      </div>
                      <select value={s.type ?? "technical"} onChange={e => patchSkill(g.id, s.id, { type: e.target.value as SkillItem["type"] })} className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-white/60 text-xs focus:outline-none">
                        <option value="technical">Tech</option>
                        <option value="soft">Soft</option>
                        <option value="tool">Tool</option>
                      </select>
                      <button onClick={() => removeSkill(g.id, s.id)} className="p-1 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <button onClick={() => addSkill(g.id)} className="flex items-center gap-1.5 text-xs text-violet-400 hover:text-violet-300 transition-colors">
                  <Plus className="w-3.5 h-3.5" />افزودن مهارت
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
      <button onClick={addGroup} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-white/20 text-white/40 text-sm hover:border-violet-500/40 hover:text-violet-400 w-full justify-center transition-all">
        <Plus className="w-4 h-4" />افزودن دسته‌بندی
      </button>
    </div>
  );
}
