"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronRight, Save, Globe, Lock, ExternalLink, Eye,
  User, Briefcase, GraduationCap, Code2, Rocket, Award,
  BookOpen, Languages, Heart, Users, Plus, Sparkles,
} from "lucide-react";
import Link from "next/link";
import { apiClient } from "@/lib/api/client";
import { toast } from "sonner";
import type { ResumeData, ExperienceItem, EducationItem, SkillGroup, ProjectItem, CertificationItem, LanguageItem, AwardItem } from "@/components/resume/ResumeTypes";
import { ResumePreview } from "@/components/resume/ResumePreview";
import { ExperienceEditor } from "@/components/resume/editors/ExperienceEditor";
import { EducationEditor } from "@/components/resume/editors/EducationEditor";
import { SkillsEditor } from "@/components/resume/editors/SkillsEditor";
import { ProjectsEditor } from "@/components/resume/editors/ProjectsEditor";
import { CertificationsEditor } from "@/components/resume/editors/CertificationsEditor";
import { LanguagesEditor } from "@/components/resume/editors/LanguagesEditor";

const SECTIONS = [
  { id: "personal", label: "اطلاعات شخصی", labelEn: "Personal", icon: User },
  { id: "experience", label: "تجربه کاری", labelEn: "Experience", icon: Briefcase },
  { id: "education", label: "تحصیلات", labelEn: "Education", icon: GraduationCap },
  { id: "skills", label: "مهارت‌ها", labelEn: "Skills", icon: Code2 },
  { id: "projects", label: "پروژه‌ها", labelEn: "Projects", icon: Rocket },
  { id: "certifications", label: "گواهینامه‌ها", labelEn: "Certs", icon: Award },
  { id: "languages", label: "زبان‌ها", labelEn: "Languages", icon: Languages },
  { id: "social", label: "شبکه اجتماعی", labelEn: "Social", icon: Users },
  { id: "settings", label: "تنظیمات", labelEn: "Settings", icon: Sparkles },
];

const inputCls = "w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white/70 text-sm focus:outline-none focus:border-violet-500/50";
const labelCls = "block text-xs font-medium text-white/40 mb-1.5";

export default function ResumeBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [resume, setResume] = useState<ResumeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState("personal");
  const [showPreview, setShowPreview] = useState(true);

  useEffect(() => {
    apiClient.get(`/admin/resumes/${id}`)
      .then(r => setResume(r.data.data))
      .catch(() => toast.error("خطا"))
      .finally(() => setLoading(false));
  }, [id]);

  const save = useCallback(async (data?: Partial<ResumeData>) => {
    if (!resume) return;
    setSaving(true);
    try {
      await apiClient.put(`/admin/resumes/${id}`, data ?? resume);
      if (data) setResume(prev => prev ? { ...prev, ...data } : prev);
      toast.success("ذخیره شد ✓");
    } catch { toast.error("خطا در ذخیره"); }
    finally { setSaving(false); }
  }, [id, resume]);

  const update = useCallback((patch: Partial<ResumeData>) => {
    setResume(prev => prev ? { ...prev, ...patch } : prev);
  }, []);

  if (loading || !resume) return (
    <div className="h-screen flex items-center justify-center bg-[#0a0a0f]">
      <div className="w-8 h-8 rounded-xl bg-violet-600/20 animate-pulse" />
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0f]" dir="rtl">
      {/* Top Bar */}
      <div className="flex items-center gap-3 px-5 py-3 bg-[#0f0f14] border-b border-white/10 shrink-0 z-20">
        <Link href="/admin/resumes" className="text-white/30 hover:text-white">
          <ChevronRight className="w-5 h-5 rotate-180" />
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm truncate">{resume.fullName}</p>
          <p className="text-white/40 text-xs">/{resume.slug}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-xs text-white/30"><Eye className="w-3 h-3" />{resume.views}</span>
          <button onClick={() => setShowPreview(!showPreview)}
            className="px-3 py-1.5 rounded-xl text-xs border border-white/10 text-white/50 hover:text-white hover:border-white/20 transition-all">
            {showPreview ? "پنهان Preview" : "نمایش Preview"}
          </button>
          {resume.isPublished && (
            <a href={`/resume/${resume.slug}`} target="_blank" rel="noreferrer"
              className="p-1.5 rounded-xl border border-white/10 text-white/40 hover:text-violet-400 hover:border-violet-500/30">
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
          <button onClick={() => save({ ...resume, isPublished: !resume.isPublished })}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs border transition-all ${resume.isPublished ? "border-red-500/30 text-red-400 hover:bg-red-500/10" : "border-green-500/30 text-green-400 hover:bg-green-500/10"}`}>
            {resume.isPublished ? <><Lock className="w-3 h-3" />پنهان کن</> : <><Globe className="w-3 h-3" />انتشار</>}
          </button>
          <button onClick={() => save()} disabled={saving}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white text-xs font-semibold hover:opacity-90 disabled:opacity-50">
            <Save className="w-3.5 h-3.5" />{saving ? "..." : "ذخیره"}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left: Section nav */}
        <div className="w-48 shrink-0 bg-[#0f0f14] border-l border-white/10 overflow-y-auto">
          <div className="p-2 space-y-0.5">
            {SECTIONS.map(({ id: sid, label, icon: Icon }) => (
              <button key={sid} onClick={() => setActiveSection(sid)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all text-right ${
                  activeSection === sid ? "bg-violet-600/20 text-violet-300" : "text-white/40 hover:text-white hover:bg-white/5"
                }`}>
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span className="text-xs">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Center: Editor */}
        <div className="flex-1 overflow-y-auto p-5 border-l border-white/5">
          {activeSection === "personal" && (
            <PersonalSection resume={resume} update={update} />
          )}
          {activeSection === "experience" && (
            <ExperienceEditor items={resume.experience} onChange={items => update({ experience: items })} />
          )}
          {activeSection === "education" && (
            <EducationEditor items={resume.education} onChange={items => update({ education: items })} />
          )}
          {activeSection === "skills" && (
            <SkillsEditor groups={resume.skills} onChange={groups => update({ skills: groups })} />
          )}
          {activeSection === "projects" && (
            <ProjectsEditor items={resume.projects} onChange={items => update({ projects: items })} />
          )}
          {activeSection === "certifications" && (
            <CertificationsEditor items={resume.certifications} onChange={items => update({ certifications: items })} />
          )}
          {activeSection === "languages" && (
            <LanguagesEditor items={resume.languages} onChange={items => update({ languages: items })} />
          )}
          {activeSection === "social" && (
            <SocialSection resume={resume} update={update} />
          )}
          {activeSection === "settings" && (
            <SettingsSection resume={resume} update={update} />
          )}
        </div>

        {/* Right: Live Preview */}
        {showPreview && (
          <div className="w-[480px] shrink-0 border-r border-white/10 overflow-y-auto bg-[#070711]">
            <div className="p-3 border-b border-white/5 flex items-center justify-between">
              <p className="text-[10px] text-white/30 uppercase tracking-wider">Live Preview</p>
              <a href={`/resume/${resume.slug}`} target="_blank" rel="noreferrer"
                className="text-[10px] text-violet-400 hover:underline">باز کردن ←</a>
            </div>
            <div className="scale-[0.6] origin-top-left w-[800px]">
              <ResumePreview resume={resume} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Personal Section ─────────────────────────────────────────────────
function PersonalSection({ resume, update }: { resume: ResumeData; update: (p: Partial<ResumeData>) => void }) {
  return (
    <div className="space-y-5 max-w-xl">
      <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">اطلاعات شخصی</h2>
      <div className="grid grid-cols-2 gap-3">
        <div><label className={labelCls}>نام (EN)</label><input value={resume.fullName} onChange={e => update({ fullName: e.target.value })} dir="ltr" className={inputCls} /></div>
        <div><label className={labelCls}>نام (FA)</label><input value={resume.fullNameFa ?? ""} onChange={e => update({ fullNameFa: e.target.value })} className={inputCls} /></div>
        <div><label className={labelCls}>عنوان (EN)</label><input value={resume.title} onChange={e => update({ title: e.target.value })} dir="ltr" className={inputCls} /></div>
        <div><label className={labelCls}>عنوان (FA)</label><input value={resume.titleFa ?? ""} onChange={e => update({ titleFa: e.target.value })} className={inputCls} /></div>
      </div>
      <div><label className={labelCls}>بیوگرافی (EN)</label><textarea value={resume.bio ?? ""} onChange={e => update({ bio: e.target.value })} rows={3} dir="ltr" className={inputCls + " resize-none"} /></div>
      <div><label className={labelCls}>بیوگرافی (FA)</label><textarea value={resume.bioFa ?? ""} onChange={e => update({ bioFa: e.target.value })} rows={3} className={inputCls + " resize-none"} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className={labelCls}>آواتار (URL)</label><input value={resume.avatar ?? ""} onChange={e => update({ avatar: e.target.value })} dir="ltr" className={inputCls} placeholder="https://..." /></div>
        <div><label className={labelCls}>تصویر پس‌زمینه (URL)</label><input value={resume.coverImage ?? ""} onChange={e => update({ coverImage: e.target.value })} dir="ltr" className={inputCls} /></div>
        <div><label className={labelCls}>موقعیت (EN)</label><input value={resume.location ?? ""} onChange={e => update({ location: e.target.value })} dir="ltr" className={inputCls} /></div>
        <div><label className={labelCls}>موقعیت (FA)</label><input value={resume.locationFa ?? ""} onChange={e => update({ locationFa: e.target.value })} className={inputCls} /></div>
        <div><label className={labelCls}>ایمیل</label><input type="email" value={resume.email ?? ""} onChange={e => update({ email: e.target.value })} dir="ltr" className={inputCls} /></div>
        <div><label className={labelCls}>تلفن</label><input value={resume.phone ?? ""} onChange={e => update({ phone: e.target.value })} dir="ltr" className={inputCls} /></div>
        <div className="col-span-2"><label className={labelCls}>وبسایت</label><input value={resume.website ?? ""} onChange={e => update({ website: e.target.value })} dir="ltr" className={inputCls} /></div>
      </div>
    </div>
  );
}

// ── Social Section ─────────────────────────────────────────────────
function SocialSection({ resume, update }: { resume: ResumeData; update: (p: Partial<ResumeData>) => void }) {
  const socials = [
    { key: "linkedin", label: "LinkedIn", placeholder: "linkedin.com/in/..." },
    { key: "github", label: "GitHub", placeholder: "github.com/..." },
    { key: "twitter", label: "Twitter / X", placeholder: "@username" },
    { key: "instagram", label: "Instagram", placeholder: "@username" },
    { key: "behance", label: "Behance", placeholder: "behance.net/..." },
    { key: "dribbble", label: "Dribbble", placeholder: "dribbble.com/..." },
    { key: "telegram", label: "Telegram", placeholder: "@username" },
    { key: "youtube", label: "YouTube", placeholder: "youtube.com/..." },
  ] as const;
  return (
    <div className="space-y-4 max-w-xl">
      <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">شبکه‌های اجتماعی</h2>
      <div className="grid grid-cols-2 gap-3">
        {socials.map(({ key, label, placeholder }) => (
          <div key={key}>
            <label className={labelCls}>{label}</label>
            <input value={(resume as any)[key] ?? ""} onChange={e => update({ [key]: e.target.value } as any)}
              dir="ltr" placeholder={placeholder} className={inputCls} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Settings Section ─────────────────────────────────────────────
function SettingsSection({ resume, update }: { resume: ResumeData; update: (p: Partial<ResumeData>) => void }) {
  return (
    <div className="space-y-5 max-w-xl">
      <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider">تنظیمات و SEO</h2>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className={labelCls}>تم</label>
          <select value={resume.theme} onChange={e => update({ theme: e.target.value })} className={inputCls}>
            <option value="dark">Dark</option>
            <option value="light">Light</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>زبان</label>
          <select value={resume.lang} onChange={e => update({ lang: e.target.value })} className={inputCls}>
            <option value="bilingual">دوزبانه</option>
            <option value="fa">فارسی</option>
            <option value="en">English</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>رنگ Accent</label>
          <input type="color" value={resume.accentColor} onChange={e => update({ accentColor: e.target.value })}
            className="w-full h-10 rounded-xl cursor-pointer border-0" />
        </div>
      </div>
      <div>
        <label className={labelCls}>URL رزومه (slug)</label>
        <input value={resume.slug} onChange={e => update({ slug: e.target.value })} dir="ltr" className={inputCls} />
        <p className="text-[10px] text-white/20 mt-1">resume.persicore.ir/{resume.slug}</p>
      </div>
      <div><label className={labelCls}>عنوان SEO</label><input value={resume.seoTitle ?? ""} onChange={e => update({ seoTitle: e.target.value })} className={inputCls} /></div>
      <div><label className={labelCls}>توضیح SEO</label><textarea value={resume.seoDesc ?? ""} onChange={e => update({ seoDesc: e.target.value })} rows={2} className={inputCls + " resize-none"} /></div>
      <div><label className={labelCls}>تصویر OG</label><input value={resume.ogImage ?? ""} onChange={e => update({ ogImage: e.target.value })} dir="ltr" className={inputCls} /></div>
    </div>
  );
}
