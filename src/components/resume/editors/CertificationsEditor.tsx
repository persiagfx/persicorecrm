"use client";

import { useState } from "react";
import { Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import type { CertificationItem } from "../ResumeTypes";

interface Props {
  items: CertificationItem[];
  onChange: (items: CertificationItem[]) => void;
}

const cls = "w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white/70 text-sm focus:outline-none focus:border-violet-500/50";
const lbl = "block text-xs font-medium text-white/40 mb-1.5";

function blank(): CertificationItem {
  return { id: Math.random().toString(36).slice(2), name: "", issuer: "" };
}

export function CertificationsEditor({ items, onChange }: Props) {
  const [open, setOpen] = useState<string | null>(null);

  const add = () => {
    const item = blank();
    onChange([...items, item]);
    setOpen(item.id);
  };
  const remove = (id: string) => onChange(items.filter(i => i.id !== id));
  const patch = (id: string, p: Partial<CertificationItem>) =>
    onChange(items.map(i => i.id === id ? { ...i, ...p } : i));

  return (
    <div className="space-y-4 max-w-xl">
      <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">گواهینامه‌ها</h2>
      <div className="space-y-2">
        {items.map(item => (
          <div key={item.id} className="rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden">
            <div
              className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/5"
              onClick={() => setOpen(open === item.id ? null : item.id)}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{item.name || "نام گواهینامه"}</p>
                <p className="text-xs text-white/40 truncate">{item.issuer || "صادرکننده"}</p>
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
                  <div><label className={lbl}>صادرکننده (EN)</label><input value={item.issuer} onChange={e => patch(item.id, { issuer: e.target.value })} dir="ltr" className={cls} /></div>
                  <div><label className={lbl}>صادرکننده (FA)</label><input value={item.issuerFa ?? ""} onChange={e => patch(item.id, { issuerFa: e.target.value })} className={cls} /></div>
                  <div><label className={lbl}>تاریخ صدور</label><input value={item.date ?? ""} onChange={e => patch(item.id, { date: e.target.value })} dir="ltr" placeholder="2024-03" className={cls} /></div>
                  <div><label className={lbl}>تاریخ انقضا</label><input value={item.expiryDate ?? ""} onChange={e => patch(item.id, { expiryDate: e.target.value })} dir="ltr" placeholder="2026-03" className={cls} /></div>
                </div>
                <div><label className={lbl}>شناسه (Credential ID)</label><input value={item.credentialId ?? ""} onChange={e => patch(item.id, { credentialId: e.target.value })} dir="ltr" className={cls} /></div>
                <div><label className={lbl}>لینک</label><input value={item.url ?? ""} onChange={e => patch(item.id, { url: e.target.value })} dir="ltr" placeholder="https://..." className={cls} /></div>
              </div>
            )}
          </div>
        ))}
      </div>
      <button onClick={add} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-white/20 text-white/40 text-sm hover:border-violet-500/40 hover:text-violet-400 w-full justify-center transition-all">
        <Plus className="w-4 h-4" />افزودن گواهینامه
      </button>
    </div>
  );
}
