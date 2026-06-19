"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronRight, Save, Globe, Lock, ExternalLink, Eye, Plus, Trash2,
  ChevronDown, ChevronUp, Info, Palette, FileText, Target, CheckSquare,
  Clock, DollarSign, Image, Star, Users, HelpCircle, Phone, Settings2,
  MessageSquare, Workflow, BarChart2,
} from "lucide-react";
import Link from "next/link";
import { apiClient } from "@/lib/api/client";
import { toast } from "sonner";
import type { ProposalData, PricingPackage, Phase, Deliverable, PortfolioItem, Advantage, TeamMember, Testimonial, FAQ, ProposalGoal, ProcessStep, StatItem } from "@/components/proposal/ProposalTypes";
import { STATUS_LABEL, STATUS_COLOR, PROJECT_TYPE_LABEL } from "@/components/proposal/ProposalTypes";

const SECTIONS = [
  { id: "basic", label: "اطلاعات پایه", icon: Info },
  { id: "intro", label: "معرفی پروژه", icon: FileText },
  { id: "goals", label: "اهداف", icon: Target },
  { id: "scope", label: "اسکوپ کار", icon: CheckSquare },
  { id: "timeline", label: "مراحل اجرا", icon: Clock },
  { id: "packages", label: "پکیج‌های قیمتی", icon: DollarSign },
  { id: "portfolio", label: "پورتفولیو", icon: Image },
  { id: "advantages", label: "مزایا", icon: Star },
  { id: "team", label: "تیم ما", icon: Users },
  { id: "testimonials", label: "نظر مشتریان", icon: MessageSquare },
  { id: "process", label: "روش کار ما", icon: Workflow },
  { id: "stats", label: "آمار شرکت", icon: BarChart2 },
  { id: "faq", label: "سوالات متداول", icon: HelpCircle },
  { id: "cta", label: "تماس / CTA", icon: Phone },
  { id: "settings", label: "تنظیمات", icon: Settings2 },
];

const cls = "w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white/70 text-sm focus:outline-none focus:border-violet-500/50";
const lbl = "block text-xs font-medium text-white/40 mb-1.5";
const newId = () => Math.random().toString(36).slice(2);

// ── Generic list item wrapper ──────────────────────────────────────────
function ItemCard({ title, sub, expanded, onToggle, onDelete, children }: {
  title: string; sub?: string; expanded: boolean;
  onToggle: () => void; onDelete: () => void; children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-white/5" onClick={onToggle}>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">{title || "—"}</p>
          {sub && <p className="text-xs text-white/40 truncate">{sub}</p>}
        </div>
        <button onClick={e => { e.stopPropagation(); onDelete(); }} className="p-1 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-all">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
        {expanded ? <ChevronUp className="w-4 h-4 text-white/30 shrink-0" /> : <ChevronDown className="w-4 h-4 text-white/30 shrink-0" />}
      </div>
      {expanded && <div className="px-4 pb-4 pt-3 space-y-3 border-t border-white/5">{children}</div>}
    </div>
  );
}

function AddBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-white/20 text-white/40 text-sm hover:border-violet-500/40 hover:text-violet-400 w-full justify-center transition-all">
      <Plus className="w-4 h-4" />{label}
    </button>
  );
}

// ── Section editors ──────────────────────────────────────────────────
function BasicSection({ p, u }: { p: ProposalData; u: (x: Partial<ProposalData>) => void }) {
  return (
    <div className="space-y-5 max-w-xl">
      <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">اطلاعات پایه</h2>
      <div className="grid grid-cols-2 gap-3">
        <div><label className={lbl}>نام مشتری</label><input value={p.clientName} onChange={e => u({ clientName: e.target.value })} className={cls} /></div>
        <div><label className={lbl}>شرکت مشتری</label><input value={p.clientCompany ?? ""} onChange={e => u({ clientCompany: e.target.value })} className={cls} /></div>
        <div><label className={lbl}>ایمیل مشتری</label><input value={p.clientEmail ?? ""} onChange={e => u({ clientEmail: e.target.value })} dir="ltr" className={cls} /></div>
        <div><label className={lbl}>تلفن مشتری</label><input value={p.clientPhone ?? ""} onChange={e => u({ clientPhone: e.target.value })} dir="ltr" className={cls} /></div>
      </div>
      <div>
        <label className={lbl}>نوع پروژه</label>
        <div className="grid grid-cols-3 gap-2">
          {(["website", "app", "ecommerce", "crm", "other"] as const).map(t => (
            <button key={t} type="button" onClick={() => u({ projectType: t })}
              className={`py-2 rounded-xl text-xs border transition-all ${p.projectType === t ? "border-violet-500/50 bg-violet-600/20 text-violet-300" : "border-white/10 text-white/40 hover:border-white/20"}`}>
              {PROJECT_TYPE_LABEL[t]}
            </button>
          ))}
        </div>
      </div>
      <div><label className={lbl}>نام آژانس</label><input value={p.agencyName} onChange={e => u({ agencyName: e.target.value })} className={cls} /></div>
      <div><label className={lbl}>لوگو آژانس (URL)</label><input value={p.agencyLogo ?? ""} onChange={e => u({ agencyLogo: e.target.value })} dir="ltr" placeholder="https://..." className={cls} /></div>
      <div><label className={lbl}>تصویر کاور (URL)</label><input value={p.coverImage ?? ""} onChange={e => u({ coverImage: e.target.value })} dir="ltr" className={cls} /></div>
      <div>
        <label className={lbl}>وضعیت</label>
        <select value={p.status} onChange={e => u({ status: e.target.value as any })} className={cls}>
          {(["draft", "sent", "viewed", "accepted", "rejected"] as const).map(s => (
            <option key={s} value={s}>{STATUS_LABEL[s]}</option>
          ))}
        </select>
      </div>
      <div>
        <label className={lbl}>اعتبار تا</label>
        <input type="date" value={p.validUntil ? p.validUntil.slice(0, 10) : ""} onChange={e => u({ validUntil: e.target.value || null })} dir="ltr" className={cls} />
      </div>
    </div>
  );
}

function IntroSection({ p, u }: { p: ProposalData; u: (x: Partial<ProposalData>) => void }) {
  return (
    <div className="space-y-4 max-w-xl">
      <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">معرفی پروژه</h2>
      <div><label className={lbl}>عنوان پروژه</label><input value={p.projectTitle} onChange={e => u({ projectTitle: e.target.value })} className={cls} /></div>
      <div><label className={lbl}>زیرعنوان</label><input value={p.projectSubtitle ?? ""} onChange={e => u({ projectSubtitle: e.target.value })} className={cls} /></div>
      <div><label className={lbl}>خلاصه اجرایی</label><textarea value={p.projectSummary ?? ""} onChange={e => u({ projectSummary: e.target.value })} rows={4} className={cls + " resize-none"} /></div>
      <div><label className={lbl}>مشکل فعلی مشتری (Problem Statement)</label><textarea value={p.problemStatement ?? ""} onChange={e => u({ problemStatement: e.target.value })} rows={4} className={cls + " resize-none"} /></div>
      <div><label className={lbl}>راه‌حل ما (Our Solution)</label><textarea value={p.ourSolution ?? ""} onChange={e => u({ ourSolution: e.target.value })} rows={4} className={cls + " resize-none"} /></div>
    </div>
  );
}

function GoalsSection({ p, u }: { p: ProposalData; u: (x: Partial<ProposalData>) => void }) {
  const [open, setOpen] = useState<string | null>(null);
  const add = () => { const item: ProposalGoal = { id: newId(), text: "" }; u({ goals: [...p.goals, item] }); setOpen(item.id); };
  const remove = (id: string) => u({ goals: p.goals.filter(g => g.id !== id) });
  const patch = (id: string, text: string) => u({ goals: p.goals.map(g => g.id === id ? { ...g, text } : g) });

  return (
    <div className="space-y-4 max-w-xl">
      <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">اهداف پروژه</h2>
      <div className="space-y-2">
        {p.goals.map(g => (
          <ItemCard key={g.id} title={g.text || "هدف جدید"} expanded={open === g.id} onToggle={() => setOpen(open === g.id ? null : g.id)} onDelete={() => remove(g.id)}>
            <div><label className={lbl}>متن هدف</label><input value={g.text} onChange={e => patch(g.id, e.target.value)} className={cls} placeholder="افزایش فروش آنلاین ۳ برابری" /></div>
          </ItemCard>
        ))}
      </div>
      <AddBtn label="افزودن هدف" onClick={add} />
    </div>
  );
}

function ScopeSection({ p, u }: { p: ProposalData; u: (x: Partial<ProposalData>) => void }) {
  const [open, setOpen] = useState<string | null>(null);
  const add = () => { const item: Deliverable = { id: newId(), title: "", icon: "✓" }; u({ deliverables: [...p.deliverables, item] }); setOpen(item.id); };
  const remove = (id: string) => u({ deliverables: p.deliverables.filter(d => d.id !== id) });
  const patch = (id: string, x: Partial<Deliverable>) => u({ deliverables: p.deliverables.map(d => d.id === id ? { ...d, ...x } : d) });

  return (
    <div className="space-y-4 max-w-xl">
      <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">اسکوپ کار / Deliverables</h2>
      <div className="space-y-2">
        {p.deliverables.map(d => (
          <ItemCard key={d.id} title={d.title || "آیتم جدید"} sub={d.category} expanded={open === d.id} onToggle={() => setOpen(open === d.id ? null : d.id)} onDelete={() => remove(d.id)}>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2"><label className={lbl}>عنوان</label><input value={d.title} onChange={e => patch(d.id, { title: e.target.value })} className={cls} /></div>
              <div><label className={lbl}>آیکن (emoji)</label><input value={d.icon ?? "✓"} onChange={e => patch(d.id, { icon: e.target.value })} className={cls} /></div>
            </div>
            <div><label className={lbl}>دسته‌بندی</label><input value={d.category ?? ""} onChange={e => patch(d.id, { category: e.target.value })} className={cls} placeholder="طراحی / توسعه / SEO" /></div>
            <div><label className={lbl}>توضیحات</label><textarea value={d.description ?? ""} onChange={e => patch(d.id, { description: e.target.value })} rows={2} className={cls + " resize-none"} /></div>
          </ItemCard>
        ))}
      </div>
      <AddBtn label="افزودن deliverable" onClick={add} />
    </div>
  );
}

function TimelineSection({ p, u }: { p: ProposalData; u: (x: Partial<ProposalData>) => void }) {
  const [open, setOpen] = useState<string | null>(null);
  const add = () => { const item: Phase = { id: newId(), title: "", duration: "", tasks: [] }; u({ phases: [...p.phases, item] }); setOpen(item.id); };
  const remove = (id: string) => u({ phases: p.phases.filter(ph => ph.id !== id) });
  const patch = (id: string, x: Partial<Phase>) => u({ phases: p.phases.map(ph => ph.id === id ? { ...ph, ...x } : ph) });

  return (
    <div className="space-y-4 max-w-xl">
      <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">مراحل اجرا</h2>
      <div className="space-y-2">
        {p.phases.map((ph, i) => (
          <ItemCard key={ph.id} title={`مرحله ${i + 1}: ${ph.title || "—"}`} sub={ph.duration} expanded={open === ph.id} onToggle={() => setOpen(open === ph.id ? null : ph.id)} onDelete={() => remove(ph.id)}>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2"><label className={lbl}>عنوان مرحله</label><input value={ph.title} onChange={e => patch(ph.id, { title: e.target.value })} className={cls} /></div>
              <div><label className={lbl}>مدت زمان</label><input value={ph.duration} onChange={e => patch(ph.id, { duration: e.target.value })} className={cls} placeholder="۱ هفته" /></div>
            </div>
            <div><label className={lbl}>توضیحات</label><textarea value={ph.description ?? ""} onChange={e => patch(ph.id, { description: e.target.value })} rows={2} className={cls + " resize-none"} /></div>
            <div><label className={lbl}>وظایف (هر خط یک وظیفه)</label>
              <textarea value={ph.tasks.join("\n")} onChange={e => patch(ph.id, { tasks: e.target.value.split("\n").filter(Boolean) })} rows={4} className={cls + " resize-none"} placeholder="طراحی وایرفریم&#10;تأیید مشتری&#10;طراحی UI" />
            </div>
          </ItemCard>
        ))}
      </div>
      <AddBtn label="افزودن مرحله" onClick={add} />
    </div>
  );
}

function PackagesSection({ p, u }: { p: ProposalData; u: (x: Partial<ProposalData>) => void }) {
  const [open, setOpen] = useState<string | null>(null);
  const add = () => {
    const item: PricingPackage = { id: newId(), name: "", price: "", features: [], highlighted: false };
    u({ packages: [...p.packages, item] });
    setOpen(item.id);
  };
  const remove = (id: string) => u({ packages: p.packages.filter(pk => pk.id !== id) });
  const patch = (id: string, x: Partial<PricingPackage>) => u({ packages: p.packages.map(pk => pk.id === id ? { ...pk, ...x } : pk) });

  return (
    <div className="space-y-4 max-w-xl">
      <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">پکیج‌های قیمتی</h2>
      <div>
        <label className={lbl}>واحد پول</label>
        <input value={p.currency} onChange={e => u({ currency: e.target.value })} className={cls} style={{ maxWidth: 160 }} placeholder="تومان / ریال / USD" />
      </div>
      <div className="space-y-2">
        {p.packages.map(pk => (
          <ItemCard key={pk.id} title={pk.name || "پکیج جدید"} sub={pk.price ? `${pk.price} ${p.currency}` : ""} expanded={open === pk.id} onToggle={() => setOpen(open === pk.id ? null : pk.id)} onDelete={() => remove(pk.id)}>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={lbl}>نام پکیج</label><input value={pk.name} onChange={e => patch(pk.id, { name: e.target.value })} className={cls} placeholder="برنزی / نقره‌ای / طلایی" /></div>
              <div><label className={lbl}>قیمت</label><input value={pk.price} onChange={e => patch(pk.id, { price: e.target.value })} dir="ltr" className={cls} placeholder="۵,۰۰۰,۰۰۰" /></div>
            </div>
            <div><label className={lbl}>یادداشت قیمت</label><input value={pk.priceNote ?? ""} onChange={e => patch(pk.id, { priceNote: e.target.value })} className={cls} placeholder="+ مالیات ارزش افزوده" /></div>
            <div><label className={lbl}>توضیح پکیج</label><textarea value={pk.description ?? ""} onChange={e => patch(pk.id, { description: e.target.value })} rows={2} className={cls + " resize-none"} /></div>
            <div><label className={lbl}>ویژگی‌ها (هر خط یک ویژگی)</label>
              <textarea value={pk.features.join("\n")} onChange={e => patch(pk.id, { features: e.target.value.split("\n").filter(Boolean) })} rows={6} className={cls + " resize-none"} placeholder="طراحی تا ۵ صفحه&#10;ریسپانسیو&#10;پنل مدیریت&#10;سئوی پایه" />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={pk.highlighted} onChange={e => patch(pk.id, { highlighted: e.target.checked })} className="accent-violet-500" />
              <span className="text-xs text-white/50">پکیج ویژه (هایلایت)</span>
            </label>
          </ItemCard>
        ))}
      </div>
      <AddBtn label="افزودن پکیج" onClick={add} />
    </div>
  );
}

function PortfolioSection({ p, u }: { p: ProposalData; u: (x: Partial<ProposalData>) => void }) {
  const [open, setOpen] = useState<string | null>(null);
  const add = () => { const item: PortfolioItem = { id: newId(), title: "", tags: [] }; u({ portfolioItems: [...p.portfolioItems, item] }); setOpen(item.id); };
  const remove = (id: string) => u({ portfolioItems: p.portfolioItems.filter(i => i.id !== id) });
  const patch = (id: string, x: Partial<PortfolioItem>) => u({ portfolioItems: p.portfolioItems.map(i => i.id === id ? { ...i, ...x } : i) });

  return (
    <div className="space-y-4 max-w-xl">
      <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">پورتفولیو / نمونه‌کارها</h2>
      <div className="space-y-2">
        {p.portfolioItems.map(item => (
          <ItemCard key={item.id} title={item.title || "پروژه جدید"} sub={(item.tags ?? []).join(" · ")} expanded={open === item.id} onToggle={() => setOpen(open === item.id ? null : item.id)} onDelete={() => remove(item.id)}>
            <div><label className={lbl}>عنوان</label><input value={item.title} onChange={e => patch(item.id, { title: e.target.value })} className={cls} /></div>
            <div><label className={lbl}>توضیحات</label><textarea value={item.description ?? ""} onChange={e => patch(item.id, { description: e.target.value })} rows={2} className={cls + " resize-none"} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={lbl}>لینک</label><input value={item.url ?? ""} onChange={e => patch(item.id, { url: e.target.value })} dir="ltr" className={cls} /></div>
              <div><label className={lbl}>تصویر (URL)</label><input value={item.image ?? ""} onChange={e => patch(item.id, { image: e.target.value })} dir="ltr" className={cls} /></div>
            </div>
            <div><label className={lbl}>تگ‌ها (با کاما)</label><input value={(item.tags ?? []).join(", ")} onChange={e => patch(item.id, { tags: e.target.value.split(",").map(t => t.trim()).filter(Boolean) })} dir="ltr" className={cls} /></div>
          </ItemCard>
        ))}
      </div>
      <AddBtn label="افزودن نمونه‌کار" onClick={add} />
    </div>
  );
}

function AdvantagesSection({ p, u }: { p: ProposalData; u: (x: Partial<ProposalData>) => void }) {
  const [open, setOpen] = useState<string | null>(null);
  const add = () => { const item: Advantage = { id: newId(), title: "", description: "" }; u({ advantages: [...p.advantages, item] }); setOpen(item.id); };
  const remove = (id: string) => u({ advantages: p.advantages.filter(a => a.id !== id) });
  const patch = (id: string, x: Partial<Advantage>) => u({ advantages: p.advantages.map(a => a.id === id ? { ...a, ...x } : a) });

  return (
    <div className="space-y-4 max-w-xl">
      <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">چرا ما؟ / مزایا</h2>
      <div className="space-y-2">
        {p.advantages.map(a => (
          <ItemCard key={a.id} title={a.title || "مزیت جدید"} expanded={open === a.id} onToggle={() => setOpen(open === a.id ? null : a.id)} onDelete={() => remove(a.id)}>
            <div className="grid grid-cols-4 gap-3">
              <div><label className={lbl}>آیکن</label><input value={a.icon ?? ""} onChange={e => patch(a.id, { icon: e.target.value })} className={cls} placeholder="🚀" /></div>
              <div className="col-span-3"><label className={lbl}>عنوان</label><input value={a.title} onChange={e => patch(a.id, { title: e.target.value })} className={cls} /></div>
            </div>
            <div><label className={lbl}>توضیحات</label><textarea value={a.description} onChange={e => patch(a.id, { description: e.target.value })} rows={2} className={cls + " resize-none"} /></div>
          </ItemCard>
        ))}
      </div>
      <AddBtn label="افزودن مزیت" onClick={add} />
    </div>
  );
}

function TeamSection({ p, u }: { p: ProposalData; u: (x: Partial<ProposalData>) => void }) {
  const [open, setOpen] = useState<string | null>(null);
  const add = () => { const item: TeamMember = { id: newId(), name: "", role: "" }; u({ team: [...p.team, item] }); setOpen(item.id); };
  const remove = (id: string) => u({ team: p.team.filter(t => t.id !== id) });
  const patch = (id: string, x: Partial<TeamMember>) => u({ team: p.team.map(t => t.id === id ? { ...t, ...x } : t) });

  return (
    <div className="space-y-4 max-w-xl">
      <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">تیم ما</h2>
      <div className="space-y-2">
        {p.team.map(m => (
          <ItemCard key={m.id} title={m.name || "عضو جدید"} sub={m.role} expanded={open === m.id} onToggle={() => setOpen(open === m.id ? null : m.id)} onDelete={() => remove(m.id)}>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={lbl}>نام</label><input value={m.name} onChange={e => patch(m.id, { name: e.target.value })} className={cls} /></div>
              <div><label className={lbl}>نقش</label><input value={m.role} onChange={e => patch(m.id, { role: e.target.value })} className={cls} /></div>
            </div>
            <div><label className={lbl}>آواتار (URL)</label><input value={m.avatar ?? ""} onChange={e => patch(m.id, { avatar: e.target.value })} dir="ltr" className={cls} /></div>
            <div><label className={lbl}>بیو کوتاه</label><textarea value={m.bio ?? ""} onChange={e => patch(m.id, { bio: e.target.value })} rows={2} className={cls + " resize-none"} /></div>
          </ItemCard>
        ))}
      </div>
      <AddBtn label="افزودن عضو تیم" onClick={add} />
    </div>
  );
}

function FaqSection({ p, u }: { p: ProposalData; u: (x: Partial<ProposalData>) => void }) {
  const [open, setOpen] = useState<string | null>(null);
  const add = () => { const item: FAQ = { id: newId(), question: "", answer: "" }; u({ faqs: [...p.faqs, item] }); setOpen(item.id); };
  const remove = (id: string) => u({ faqs: p.faqs.filter(f => f.id !== id) });
  const patch = (id: string, x: Partial<FAQ>) => u({ faqs: p.faqs.map(f => f.id === id ? { ...f, ...x } : f) });

  return (
    <div className="space-y-4 max-w-xl">
      <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">سوالات متداول</h2>
      <div className="space-y-2">
        {p.faqs.map(f => (
          <ItemCard key={f.id} title={f.question || "سوال جدید"} expanded={open === f.id} onToggle={() => setOpen(open === f.id ? null : f.id)} onDelete={() => remove(f.id)}>
            <div><label className={lbl}>سوال</label><input value={f.question} onChange={e => patch(f.id, { question: e.target.value })} className={cls} /></div>
            <div><label className={lbl}>جواب</label><textarea value={f.answer} onChange={e => patch(f.id, { answer: e.target.value })} rows={3} className={cls + " resize-none"} /></div>
          </ItemCard>
        ))}
      </div>
      <AddBtn label="افزودن سوال" onClick={add} />
    </div>
  );
}

function CtaSection({ p, u }: { p: ProposalData; u: (x: Partial<ProposalData>) => void }) {
  return (
    <div className="space-y-4 max-w-xl">
      <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">CTA / تماس</h2>
      <div><label className={lbl}>عنوان CTA</label><input value={p.ctaTitle ?? ""} onChange={e => u({ ctaTitle: e.target.value })} className={cls} placeholder="آماده همکاری هستید؟" /></div>
      <div><label className={lbl}>متن CTA</label><textarea value={p.ctaText ?? ""} onChange={e => u({ ctaText: e.target.value })} rows={3} className={cls + " resize-none"} /></div>
      <div><label className={lbl}>متن دکمه</label><input value={p.ctaButtonText ?? ""} onChange={e => u({ ctaButtonText: e.target.value })} className={cls} placeholder="همین الان شروع کنیم" /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className={lbl}>ایمیل تماس</label><input value={p.contactEmail ?? ""} onChange={e => u({ contactEmail: e.target.value })} dir="ltr" className={cls} /></div>
        <div><label className={lbl}>تلفن تماس</label><input value={p.contactPhone ?? ""} onChange={e => u({ contactPhone: e.target.value })} dir="ltr" className={cls} /></div>
      </div>
      <div><label className={lbl}>آدرس</label><input value={p.contactAddress ?? ""} onChange={e => u({ contactAddress: e.target.value })} className={cls} /></div>
      <div><label className={lbl}>شرایط و توضیحات</label><textarea value={p.terms ?? ""} onChange={e => u({ terms: e.target.value })} rows={3} className={cls + " resize-none"} /></div>
    </div>
  );
}

function SettingsSection2({ p, u }: { p: ProposalData; u: (x: Partial<ProposalData>) => void }) {
  return (
    <div className="space-y-5 max-w-xl">
      <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">تنظیمات و برندینگ</h2>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={lbl}>رنگ اصلی</label>
          <div className="flex items-center gap-3">
            <input type="color" value={p.primaryColor} onChange={e => u({ primaryColor: e.target.value })} className="w-10 h-10 rounded-lg cursor-pointer border-0" />
            <span className="text-xs text-white/40 font-mono">{p.primaryColor}</span>
          </div>
        </div>
        <div>
          <label className={lbl}>رنگ ثانوی</label>
          <div className="flex items-center gap-3">
            <input type="color" value={p.secondaryColor} onChange={e => u({ secondaryColor: e.target.value })} className="w-10 h-10 rounded-lg cursor-pointer border-0" />
            <span className="text-xs text-white/40 font-mono">{p.secondaryColor}</span>
          </div>
        </div>
      </div>
      <div className="h-8 rounded-xl" style={{ background: `linear-gradient(90deg, ${p.primaryColor}, ${p.secondaryColor})` }} />
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={p.darkMode} onChange={e => u({ darkMode: e.target.checked })} className="accent-violet-500" />
        <span className="text-sm text-white/60">حالت تاریک (Dark Mode)</span>
      </label>
      <div><label className={lbl}>URL رزومه (slug)</label>
        <input value={p.slug} onChange={e => u({ slug: e.target.value })} dir="ltr" className={cls} />
        <p className="text-[10px] text-white/20 mt-1">proposal.persicore.ir/{p.slug}</p>
      </div>
      <div><label className={lbl}>عنوان SEO</label><input value={p.seoTitle ?? ""} onChange={e => u({ seoTitle: e.target.value })} className={cls} /></div>
      <div><label className={lbl}>توضیح SEO</label><textarea value={p.seoDesc ?? ""} onChange={e => u({ seoDesc: e.target.value })} rows={2} className={cls + " resize-none"} /></div>
    </div>
  );
}

function TestimonialsSection({ p, u }: { p: ProposalData; u: (x: Partial<ProposalData>) => void }) {
  const [open, setOpen] = useState<string | null>(null);
  const add = () => { const item: Testimonial = { id: newId(), name: "", text: "" }; u({ testimonials: [...p.testimonials, item] }); setOpen(item.id); };
  const remove = (id: string) => u({ testimonials: p.testimonials.filter(t => t.id !== id) });
  const patch = (id: string, x: Partial<Testimonial>) => u({ testimonials: p.testimonials.map(t => t.id === id ? { ...t, ...x } : t) });

  return (
    <div className="space-y-4 max-w-xl">
      <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">نظر مشتریان</h2>
      <div className="space-y-2">
        {p.testimonials.map(t => (
          <ItemCard key={t.id} title={t.name || "مشتری جدید"} sub={t.company ?? undefined} expanded={open === t.id} onToggle={() => setOpen(open === t.id ? null : t.id)} onDelete={() => remove(t.id)}>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={lbl}>نام</label><input value={t.name} onChange={e => patch(t.id, { name: e.target.value })} className={cls} /></div>
              <div><label className={lbl}>شرکت</label><input value={t.company ?? ""} onChange={e => patch(t.id, { company: e.target.value })} className={cls} /></div>
            </div>
            <div><label className={lbl}>سمت</label><input value={t.role ?? ""} onChange={e => patch(t.id, { role: e.target.value })} className={cls} placeholder="مدیرعامل / توسعه‌دهنده" /></div>
            <div><label className={lbl}>متن نظر</label><textarea value={t.text} onChange={e => patch(t.id, { text: e.target.value })} rows={3} className={cls + " resize-none"} placeholder="تجربه همکاری با این تیم بسیار عالی بود..." /></div>
            <div><label className={lbl}>آواتار (URL)</label><input value={t.avatar ?? ""} onChange={e => patch(t.id, { avatar: e.target.value })} dir="ltr" className={cls} /></div>
            <div>
              <label className={lbl}>امتیاز (۱-۵)</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(n => (
                  <button key={n} type="button" onClick={() => patch(t.id, { rating: n })}
                    className={`w-9 h-9 rounded-xl text-xs border transition-all ${(t.rating ?? 0) >= n ? "border-yellow-500/50 bg-yellow-500/20 text-yellow-300" : "border-white/10 text-white/30 hover:border-white/20"}`}>
                    ★{n}
                  </button>
                ))}
              </div>
            </div>
          </ItemCard>
        ))}
      </div>
      <AddBtn label="افزودن نظر مشتری" onClick={add} />
    </div>
  );
}

function ProcessSection({ p, u }: { p: ProposalData; u: (x: Partial<ProposalData>) => void }) {
  const [open, setOpen] = useState<string | null>(null);
  const process = p.process ?? [];
  const add = () => {
    const item: ProcessStep = { id: newId(), step: process.length + 1, title: "", description: "", icon: "" };
    u({ process: [...process, item] });
    setOpen(item.id);
  };
  const remove = (id: string) => u({ process: process.filter(s => s.id !== id) });
  const patch = (id: string, x: Partial<ProcessStep>) => u({ process: process.map(s => s.id === id ? { ...s, ...x } : s) });

  return (
    <div className="space-y-4 max-w-xl">
      <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">روش کار ما</h2>
      <p className="text-xs text-white/30">مراحل کاری آژانس را توضیح دهید (جلسه کشف نیاز → طراحی → توسعه → تحویل)</p>
      <div className="space-y-2">
        {process.map((s, i) => (
          <ItemCard key={s.id} title={`${i + 1}. ${s.title || "مرحله جدید"}`} expanded={open === s.id} onToggle={() => setOpen(open === s.id ? null : s.id)} onDelete={() => remove(s.id)}>
            <div className="grid grid-cols-4 gap-3">
              <div><label className={lbl}>آیکن</label><input value={s.icon ?? ""} onChange={e => patch(s.id, { icon: e.target.value })} className={cls} placeholder="🎯" /></div>
              <div className="col-span-3"><label className={lbl}>عنوان مرحله</label><input value={s.title} onChange={e => patch(s.id, { title: e.target.value })} className={cls} placeholder="کشف نیاز و تحلیل" /></div>
            </div>
            <div><label className={lbl}>توضیحات</label><textarea value={s.description} onChange={e => patch(s.id, { description: e.target.value })} rows={2} className={cls + " resize-none"} /></div>
            <div><label className={lbl}>مدت زمان (اختیاری)</label><input value={s.duration ?? ""} onChange={e => patch(s.id, { duration: e.target.value })} className={cls} placeholder="۱ هفته" /></div>
          </ItemCard>
        ))}
      </div>
      <AddBtn label="افزودن مرحله" onClick={add} />
    </div>
  );
}

function StatsSection({ p, u }: { p: ProposalData; u: (x: Partial<ProposalData>) => void }) {
  const [open, setOpen] = useState<string | null>(null);
  const stats = p.stats ?? [];
  const add = () => {
    const item: StatItem = { id: newId(), value: "", label: "", icon: "" };
    u({ stats: [...stats, item] });
    setOpen(item.id);
  };
  const remove = (id: string) => u({ stats: stats.filter(s => s.id !== id) });
  const patch = (id: string, x: Partial<StatItem>) => u({ stats: stats.map(s => s.id === id ? { ...s, ...x } : s) });

  return (
    <div className="space-y-4 max-w-xl">
      <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">آمار و دستاوردها</h2>
      <p className="text-xs text-white/30">اعداد کلیدی که اعتبار آژانس را نشان می‌دهند (مثال: ۲۰۰+ پروژه، ۵ سال تجربه، ۹۵٪ رضایت)</p>
      <div className="space-y-2">
        {stats.map(s => (
          <ItemCard key={s.id} title={s.value ? `${s.value} — ${s.label || "برچسب"}` : "آمار جدید"} expanded={open === s.id} onToggle={() => setOpen(open === s.id ? null : s.id)} onDelete={() => remove(s.id)}>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={lbl}>عدد / مقدار</label><input value={s.value} onChange={e => patch(s.id, { value: e.target.value })} className={cls} placeholder="۲۰۰+" /></div>
              <div><label className={lbl}>برچسب</label><input value={s.label} onChange={e => patch(s.id, { label: e.target.value })} className={cls} placeholder="پروژه موفق" /></div>
            </div>
            <div><label className={lbl}>آیکن (emoji)</label><input value={s.icon ?? ""} onChange={e => patch(s.id, { icon: e.target.value })} className={cls} placeholder="🚀" /></div>
          </ItemCard>
        ))}
      </div>
      <AddBtn label="افزودن آمار" onClick={add} />
    </div>
  );
}

// ── Mini preview ──────────────────────────────────────────────────────
function SL({ label, c }: { label: string; c: string }) {
  return <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: c, margin: "0 0 10px", paddingBottom: 4, borderBottom: `1px solid ${c}30` }}>{label}</p>;
}

function MiniPreview({ p }: { p: ProposalData }) {
  const dk = p.darkMode;
  const bg   = dk ? "#060610" : "#f8f9fc";
  const bg2  = dk ? "#0d0d1a" : "#ffffff";
  const txt  = dk ? "#f0f0ff" : "#111122";
  const sub  = dk ? "rgba(240,240,255,0.55)" : "rgba(11,11,34,0.58)";
  const brd  = dk ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.1)";
  const sfc  = dk ? "rgba(255,255,255,0.05)" : "#ffffff";
  const c1   = p.primaryColor;
  const c2   = p.secondaryColor;
  const font = "'Vazirmatn',system-ui,sans-serif";

  const blk = (children: React.ReactNode, alt = false) => (
    <div style={{ padding: "18px 22px", background: alt ? bg2 : bg, borderBottom: `1px solid ${brd}` }}>{children}</div>
  );

  return (
    <div style={{ background: bg, color: txt, fontFamily: font, direction: "rtl", minHeight: "100vh" }}>

      {/* ── Hero */}
      <div style={{ background: `linear-gradient(135deg, ${c1}${dk ? "25" : "18"}, ${dk ? "#0a0a14" : "#eef0ff"} 60%, ${c2}${dk ? "18" : "12"})`, padding: "40px 24px", textAlign: "center", borderBottom: `1px solid ${brd}` }}>
        {p.agencyLogo && <img src={p.agencyLogo} alt="" style={{ height: 22, margin: "0 auto 14px", display: "block" }} />}
        <div style={{ display: "inline-block", fontSize: 8, padding: "2px 10px", borderRadius: 99, background: `${c1}22`, color: c1, border: `1px solid ${c1}45`, marginBottom: 10 }}>پروپزال رسمی</div>
        <h1 style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 900, lineHeight: 1.3, color: txt }}>{p.projectTitle || "عنوان پروژه"}</h1>
        {p.projectSubtitle && <p style={{ margin: "0 0 10px", fontSize: 11, color: sub }}>{p.projectSubtitle}</p>}
        <div style={{ display: "inline-flex", gap: 14, padding: "10px 18px", borderRadius: 12, background: dk ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)", border: `1px solid ${brd}`, marginTop: 6, flexWrap: "wrap", justifyContent: "center" }}>
          <div style={{ textAlign: "center" }}>
            <p style={{ margin: "0 0 1px", fontSize: 7, color: sub }}>برای</p>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: txt }}>{p.clientName || "—"}</p>
            {p.clientCompany && <p style={{ margin: 0, fontSize: 9, color: c1 }}>{p.clientCompany}</p>}
          </div>
          <div style={{ width: 1, background: brd }} />
          <div style={{ textAlign: "center" }}>
            <p style={{ margin: "0 0 1px", fontSize: 7, color: sub }}>توسط</p>
            <p style={{ margin: 0, fontSize: 12, fontWeight: 700, background: `linear-gradient(135deg,${c1},${c2})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{p.agencyName}</p>
          </div>
        </div>
      </div>

      {/* ── Summary */}
      {(p.projectSummary || p.problemStatement || p.ourSolution) && blk(
        <>
          <SL label="خلاصه اجرایی" c={c1} />
          {p.projectSummary && <p style={{ fontSize: 11, color: sub, lineHeight: 1.8, marginBottom: (p.problemStatement || p.ourSolution) ? 10 : 0 }}>{p.projectSummary.slice(0, 200)}{p.projectSummary.length > 200 ? "..." : ""}</p>}
          {(p.problemStatement || p.ourSolution) && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {p.problemStatement && <div style={{ padding: "8px 10px", borderRadius: 8, background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.18)" }}><p style={{ margin: "0 0 3px", fontSize: 7, fontWeight: 700, color: "#ef4444" }}>⚡ چالش</p><p style={{ margin: 0, fontSize: 9, color: sub, lineHeight: 1.6 }}>{p.problemStatement.slice(0, 90)}</p></div>}
              {p.ourSolution && <div style={{ padding: "8px 10px", borderRadius: 8, background: `${c1}0b`, border: `1px solid ${c1}28` }}><p style={{ margin: "0 0 3px", fontSize: 7, fontWeight: 700, color: c1 }}>✦ راه‌حل</p><p style={{ margin: 0, fontSize: 9, color: sub, lineHeight: 1.6 }}>{p.ourSolution.slice(0, 90)}</p></div>}
            </div>
          )}
        </>, true
      )}

      {/* ── Goals */}
      {p.goals.length > 0 && blk(
        <><SL label="اهداف پروژه" c={c1} /><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>{p.goals.slice(0, 6).map((g, i) => <div key={g.id} style={{ display: "flex", gap: 7, padding: "7px 9px", borderRadius: 7, background: sfc, border: `1px solid ${brd}` }}><span style={{ width: 15, height: 15, borderRadius: 5, background: `${c1}22`, color: c1, fontSize: 7, fontWeight: 800, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>{i + 1}</span><span style={{ fontSize: 10, color: sub, lineHeight: 1.5 }}>{g.text}</span></div>)}</div></>
      )}

      {/* ── Deliverables */}
      {p.deliverables.length > 0 && blk(
        <><SL label="اسکوپ کار" c={c1} /><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>{p.deliverables.slice(0, 8).map(d => <div key={d.id} style={{ display: "flex", gap: 7, padding: "7px 9px", borderRadius: 7, background: `${c1}0e`, border: `1px solid ${c1}22`, alignItems: "flex-start" }}><span style={{ fontSize: 11, flexShrink: 0 }}>{d.icon ?? "✓"}</span><div><p style={{ margin: 0, fontSize: 10, fontWeight: 600, color: txt }}>{d.title}</p>{d.description && <p style={{ margin: 0, fontSize: 8, color: sub }}>{d.description.slice(0, 40)}</p>}</div></div>)}</div></>, true
      )}

      {/* ── Process */}
      {(p.process ?? []).length > 0 && blk(
        <><SL label="روش کار ما" c={c1} /><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>{(p.process ?? []).map((s, i) => <div key={s.id} style={{ padding: "9px 11px", borderRadius: 9, background: sfc, border: `1px solid ${brd}` }}><div style={{ display: "flex", gap: 7, alignItems: "center", marginBottom: 4 }}><div style={{ width: 20, height: 20, borderRadius: 6, background: `linear-gradient(135deg,${c1},${c2})`, color: "#fff", fontSize: 8, fontWeight: 800, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>{s.icon || i + 1}</div><span style={{ fontSize: 10, fontWeight: 700, color: txt }}>{s.title}</span></div><p style={{ margin: 0, fontSize: 9, color: sub, lineHeight: 1.5 }}>{s.description.slice(0, 60)}</p>{s.duration && <p style={{ margin: "3px 0 0", fontSize: 8, color: c1, fontWeight: 600 }}>{s.duration}</p>}</div>)}</div></>
      )}

      {/* ── Timeline */}
      {p.phases.length > 0 && blk(
        <><SL label="مراحل اجرا" c={c1} /><div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{p.phases.map((ph, i) => <div key={ph.id} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}><div style={{ width: 26, height: 26, borderRadius: "50%", background: `linear-gradient(135deg,${c1},${c2})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800, color: "#fff", flexShrink: 0 }}>{i + 1}</div><div><div style={{ display: "flex", alignItems: "center", gap: 7 }}><p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: txt }}>{ph.title}</p><span style={{ fontSize: 8, padding: "1px 7px", borderRadius: 99, background: `${c1}18`, color: c1, border: `1px solid ${c1}30` }}>{ph.duration}</span></div>{ph.description && <p style={{ margin: "2px 0 0", fontSize: 9, color: sub }}>{ph.description.slice(0, 70)}</p>}</div></div>)}</div></>, true
      )}

      {/* ── Stats */}
      {(p.stats ?? []).length > 0 && blk(
        <><SL label="آمار شرکت" c={c1} /><div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min((p.stats ?? []).length, 4)}, 1fr)`, gap: 8 }}>{(p.stats ?? []).map(s => <div key={s.id} style={{ textAlign: "center", padding: "10px 6px" }}>{s.icon && <div style={{ fontSize: 14, marginBottom: 4 }}>{s.icon}</div>}<p style={{ margin: "0 0 2px", fontSize: 18, fontWeight: 900, background: `linear-gradient(135deg,${c1},${c2})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{s.value}</p><p style={{ margin: 0, fontSize: 8, color: sub }}>{s.label}</p></div>)}</div></>
      )}

      {/* ── Packages */}
      {p.packages.length > 0 && blk(
        <><SL label="پکیج‌های قیمتی" c={c1} /><div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(p.packages.length, 3)}, 1fr)`, gap: 8 }}>{p.packages.map(pk => <div key={pk.id} style={{ padding: 12, borderRadius: 10, background: pk.highlighted ? `${c1}18` : sfc, border: `1px solid ${pk.highlighted ? c1 + "55" : brd}`, textAlign: "center" }}>{pk.highlighted && <div style={{ fontSize: 7, marginBottom: 4, color: c1, fontWeight: 700 }}>⭐ پیشنهاد ویژه</div>}<p style={{ fontSize: 10, fontWeight: 700, margin: "0 0 5px", color: txt }}>{pk.name}</p><p style={{ fontSize: 15, fontWeight: 900, margin: "0 0 2px", background: `linear-gradient(135deg,${c1},${c2})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{pk.price}</p><p style={{ fontSize: 8, color: sub, margin: "0 0 7px" }}>{p.currency}</p><div style={{ display: "flex", flexDirection: "column", gap: 2, textAlign: "right" }}>{pk.features.slice(0, 4).map((f, fi) => <p key={fi} style={{ margin: 0, fontSize: 8, color: sub }}>• {f}</p>)}</div></div>)}</div></>, true
      )}

      {/* ── Portfolio */}
      {p.portfolioItems.length > 0 && blk(
        <><SL label="نمونه‌کارها" c={c1} /><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>{p.portfolioItems.slice(0, 4).map(item => <div key={item.id} style={{ borderRadius: 10, overflow: "hidden", background: bg2, border: `1px solid ${brd}` }}>{item.image ? <img src={item.image} alt="" style={{ width: "100%", height: 60, objectFit: "cover" }} /> : <div style={{ height: 44, background: `linear-gradient(135deg,${c1}20,${c2}10)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🖼</div>}<div style={{ padding: "7px 8px" }}><p style={{ margin: "0 0 3px", fontSize: 10, fontWeight: 700, color: txt }}>{item.title}</p><div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>{item.tags.slice(0, 3).map(t => <span key={t} style={{ fontSize: 7, padding: "1px 5px", borderRadius: 99, background: `${c1}15`, color: c1 }}>{t}</span>)}</div></div></div>)}</div></>
      )}

      {/* ── Advantages */}
      {p.advantages.length > 0 && blk(
        <><SL label="چرا ما؟" c={c1} /><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>{p.advantages.map(a => <div key={a.id} style={{ padding: "9px 11px", borderRadius: 9, background: sfc, border: `1px solid ${brd}`, textAlign: "center" }}>{a.icon && <div style={{ fontSize: 16, marginBottom: 4 }}>{a.icon}</div>}<p style={{ margin: "0 0 3px", fontSize: 10, fontWeight: 700, color: txt }}>{a.title}</p><p style={{ margin: 0, fontSize: 8, color: sub, lineHeight: 1.5 }}>{a.description.slice(0, 55)}</p></div>)}</div></>, true
      )}

      {/* ── Team */}
      {p.team.length > 0 && blk(
        <><SL label="تیم ما" c={c1} /><div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{p.team.map(m => <div key={m.id} style={{ textAlign: "center", padding: "8px 12px", borderRadius: 10, background: bg2, border: `1px solid ${brd}` }}>{m.avatar ? <img src={m.avatar} alt="" style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover", margin: "0 auto 5px", display: "block", border: `2px solid ${c1}50` }} /> : <div style={{ width: 32, height: 32, borderRadius: "50%", background: `linear-gradient(135deg,${c1},${c2})`, margin: "0 auto 5px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#fff", fontWeight: 700 }}>{m.name.charAt(0)}</div>}<p style={{ margin: "0 0 1px", fontSize: 9, fontWeight: 700, color: txt }}>{m.name}</p><p style={{ margin: 0, fontSize: 8, color: c1 }}>{m.role}</p></div>)}</div></>
      )}

      {/* ── Testimonials */}
      {p.testimonials.length > 0 && blk(
        <><SL label="نظر مشتریان" c={c1} /><div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>{p.testimonials.slice(0, 4).map(t => <div key={t.id} style={{ padding: "10px 12px", borderRadius: 10, background: sfc, border: `1px solid ${brd}` }}>{t.rating && <div style={{ display: "flex", gap: 2, marginBottom: 5 }}>{[...Array(t.rating)].map((_, i) => <span key={i} style={{ color: "#fbbf24", fontSize: 8 }}>★</span>)}</div>}<p style={{ margin: "0 0 7px", fontSize: 9, color: sub, lineHeight: 1.6, fontStyle: "italic" }}>«{t.text.slice(0, 80)}»</p><p style={{ margin: "0 0 1px", fontSize: 9, fontWeight: 700, color: txt }}>{t.name}</p>{t.company && <p style={{ margin: 0, fontSize: 8, color: c1 }}>{t.company}</p>}</div>)}</div></>, true
      )}

      {/* ── FAQ */}
      {p.faqs.length > 0 && blk(
        <><SL label="سوالات متداول" c={c1} /><div style={{ display: "flex", flexDirection: "column", gap: 6 }}>{p.faqs.slice(0, 4).map(f => <div key={f.id} style={{ padding: "8px 10px", borderRadius: 8, background: sfc, border: `1px solid ${brd}` }}><p style={{ margin: "0 0 3px", fontSize: 10, fontWeight: 700, color: txt }}>{f.question}</p><p style={{ margin: 0, fontSize: 9, color: sub, lineHeight: 1.5 }}>{f.answer.slice(0, 90)}</p></div>)}</div></>
      )}

      {/* ── CTA */}
      <div style={{ padding: "24px 22px", background: `linear-gradient(135deg,${c1}14,${c2}09)`, textAlign: "center" }}>
        <h2 style={{ margin: "0 0 8px", fontSize: 15, fontWeight: 800, color: txt }}>{p.ctaTitle || "آماده همکاری هستید؟"}</h2>
        {p.ctaText && <p style={{ margin: "0 0 12px", fontSize: 9, color: sub, lineHeight: 1.7, maxWidth: 480, marginLeft: "auto", marginRight: "auto" }}>{p.ctaText}</p>}
        <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
          {p.contactEmail && <div style={{ padding: "8px 18px", borderRadius: 9, background: `linear-gradient(135deg,${c1},${c2})`, color: "#fff", fontSize: 10, fontWeight: 700 }}>{p.ctaButtonText || "ارتباط با ما"}</div>}
          {p.contactPhone && <div style={{ padding: "8px 18px", borderRadius: 9, background: sfc, color: txt, fontSize: 10, fontWeight: 700, border: `1px solid ${brd}` }}>{p.contactPhone}</div>}
        </div>
        {p.contactAddress && <p style={{ margin: "10px 0 0", fontSize: 9, color: sub }}>{p.contactAddress}</p>}
        {p.terms && <p style={{ margin: "8px 0 0", fontSize: 8, color: sub, borderTop: `1px solid ${brd}`, paddingTop: 8 }}>{p.terms}</p>}
      </div>
    </div>
  );
}

// ── Main builder ──────────────────────────────────────────────────────
export default function ProposalBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const [proposal, setProposal] = useState<ProposalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [active, setActive] = useState("basic");
  const [showPreview, setShowPreview] = useState(true);

  useEffect(() => {
    apiClient.get(`/admin/proposals/${id}`)
      .then(r => setProposal(r.data.data))
      .catch(() => toast.error("خطا"))
      .finally(() => setLoading(false));
  }, [id]);

  const save = useCallback(async (data?: Partial<ProposalData>) => {
    if (!proposal) return;
    setSaving(true);
    try {
      await apiClient.put(`/admin/proposals/${id}`, data ?? proposal);
      if (data) setProposal(prev => prev ? { ...prev, ...data } : prev);
      toast.success("ذخیره شد ✓");
    } catch { toast.error("خطا در ذخیره"); }
    finally { setSaving(false); }
  }, [id, proposal]);

  const update = useCallback((patch: Partial<ProposalData>) => {
    setProposal(prev => prev ? { ...prev, ...patch } : prev);
  }, []);

  if (loading || !proposal) return (
    <div className="h-screen flex items-center justify-center bg-[#0a0a0f]">
      <div className="w-8 h-8 rounded-xl bg-violet-600/20 animate-pulse" />
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0f]" dir="rtl">
      {/* Top Bar */}
      <div className="flex items-center gap-3 px-5 py-3 bg-[#0f0f14] border-b border-white/10 shrink-0 z-20">
        <Link href="/admin/proposals" className="text-white/30 hover:text-white">
          <ChevronRight className="w-5 h-5 rotate-180" />
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm truncate">{proposal.projectTitle}</p>
          <p className="text-white/40 text-xs">{proposal.clientName} · /{proposal.slug}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border ${STATUS_COLOR[proposal.status]}`}>
            {STATUS_LABEL[proposal.status]}
          </span>
          <span className="flex items-center gap-1 text-xs text-white/30"><Eye className="w-3 h-3" />{proposal.views}</span>
          <button onClick={() => setShowPreview(!showPreview)}
            className="px-3 py-1.5 rounded-xl text-xs border border-white/10 text-white/50 hover:text-white hover:border-white/20 transition-all">
            {showPreview ? "پنهان Preview" : "نمایش Preview"}
          </button>
          {proposal.isPublished && (
            <a href={`/proposal/${proposal.slug}`} target="_blank" rel="noreferrer"
              className="p-1.5 rounded-xl border border-white/10 text-white/40 hover:text-violet-400 hover:border-violet-500/30">
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
          <button onClick={() => save({ ...proposal, isPublished: !proposal.isPublished })}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs border transition-all ${proposal.isPublished ? "border-red-500/30 text-red-400 hover:bg-red-500/10" : "border-green-500/30 text-green-400 hover:bg-green-500/10"}`}>
            {proposal.isPublished ? <><Lock className="w-3 h-3" />پنهان</> : <><Globe className="w-3 h-3" />انتشار</>}
          </button>
          <button onClick={() => save()} disabled={saving}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-xs font-semibold hover:opacity-90 disabled:opacity-50">
            <Save className="w-3.5 h-3.5" />{saving ? "..." : "ذخیره"}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Section Nav */}
        <div className="w-48 shrink-0 bg-[#0f0f14] border-l border-white/10 overflow-y-auto">
          <div className="p-2 space-y-0.5">
            {SECTIONS.map(({ id: sid, label, icon: Icon }) => (
              <button key={sid} onClick={() => setActive(sid)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all text-right ${active === sid ? "bg-violet-600/20 text-violet-300" : "text-white/40 hover:text-white hover:bg-white/5"}`}>
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="text-xs">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 overflow-y-auto p-5 border-l border-white/5">
          {active === "basic" && <BasicSection p={proposal} u={update} />}
          {active === "intro" && <IntroSection p={proposal} u={update} />}
          {active === "goals" && <GoalsSection p={proposal} u={update} />}
          {active === "scope" && <ScopeSection p={proposal} u={update} />}
          {active === "timeline" && <TimelineSection p={proposal} u={update} />}
          {active === "packages" && <PackagesSection p={proposal} u={update} />}
          {active === "portfolio" && <PortfolioSection p={proposal} u={update} />}
          {active === "advantages" && <AdvantagesSection p={proposal} u={update} />}
          {active === "team" && <TeamSection p={proposal} u={update} />}
          {active === "testimonials" && <TestimonialsSection p={proposal} u={update} />}
          {active === "process" && <ProcessSection p={proposal} u={update} />}
          {active === "stats" && <StatsSection p={proposal} u={update} />}
          {active === "faq" && <FaqSection p={proposal} u={update} />}
          {active === "cta" && <CtaSection p={proposal} u={update} />}
          {active === "settings" && <SettingsSection2 p={proposal} u={update} />}
        </div>

        {/* Preview */}
        {showPreview && (
          <div className="w-[460px] shrink-0 border-r border-white/10 overflow-y-auto bg-[#070711]">
            <div className="p-3 border-b border-white/5 flex items-center justify-between">
              <p className="text-[10px] text-white/30 uppercase tracking-wider">Live Preview</p>
              {proposal.isPublished && (
                <a href={`/proposal/${proposal.slug}`} target="_blank" rel="noreferrer" className="text-[10px] text-violet-400 hover:underline">مشاهده کامل ←</a>
              )}
            </div>
            <div className="scale-[0.575] origin-top-left w-[800px]">
              <MiniPreview p={proposal} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
