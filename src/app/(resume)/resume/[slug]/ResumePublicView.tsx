"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import type { ResumeData, LanguageItem } from "@/components/resume/ResumeTypes";
import {
  MapPin, Mail, Phone, Globe, Github, Linkedin, Twitter,
  Instagram, Sun, Moon, ExternalLink, Star, Calendar,
  Briefcase, GraduationCap, Code2, Rocket, Award, Languages as LangIcon
} from "lucide-react";

const LEVEL_FA: Record<LanguageItem["level"], string> = {
  native: "زبان مادری", fluent: "روان", advanced: "پیشرفته", intermediate: "متوسط", basic: "مبتدی",
};
const LEVEL_PCT: Record<LanguageItem["level"], number> = {
  native: 100, fluent: 90, advanced: 75, intermediate: 55, basic: 30,
};

function useScrollIn(ref: React.RefObject<Element | null>) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [ref]);
  return visible;
}

function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useScrollIn(ref as React.RefObject<Element>);
  return (
    <div ref={ref} className={className} style={{ opacity: visible ? 1 : 0, transform: visible ? "none" : "translateY(24px)", transition: `opacity 0.6s ${delay}s, transform 0.6s ${delay}s` }}>
      {children}
    </div>
  );
}

export function ResumePublicView({ resume }: { resume: ResumeData }) {
  const [theme, setTheme] = useState<"dark" | "light">(resume.theme === "light" ? "light" : "dark");
  const isDark = theme === "dark";
  const accent = resume.accentColor ?? "#8B5CF6";
  const showFa = resume.lang !== "en";
  const showEn = resume.lang !== "fa";
  const isRtl = resume.lang !== "en";

  const t = {
    bg: isDark ? "#070711" : "#f2f2f6",
    surface: isDark ? "rgba(255,255,255,0.04)" : "#ffffff",
    border: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)",
    text: isDark ? "#ffffff" : "#111111",
    sub: isDark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.58)",
    muted: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.38)",
    navBg: isDark ? "rgba(7,7,17,0.85)" : "rgba(242,242,246,0.92)",
  };

  const socials = [
    { icon: Linkedin, href: resume.linkedin, label: "LinkedIn" },
    { icon: Github, href: resume.github, label: "GitHub" },
    { icon: Twitter, href: resume.twitter, label: "Twitter" },
    { icon: Instagram, href: resume.instagram, label: "Instagram" },
    { icon: Globe, href: resume.behance, label: "Behance" },
    { icon: Globe, href: resume.dribbble, label: "Dribbble" },
    { icon: Globe, href: resume.telegram, label: "Telegram" },
    { icon: Globe, href: resume.youtube, label: "YouTube" },
  ].filter(s => !!s.href);

  const displayName = showEn ? resume.fullName : (resume.fullNameFa || resume.fullName);
  const displayNameAlt = showFa && showEn ? resume.fullNameFa : null;
  const displayTitle = showEn ? resume.title : (resume.titleFa || resume.title);
  const displayBio = showFa && !showEn ? (resume.bioFa || resume.bio) : resume.bio;
  const displayBioFa = showFa && showEn ? resume.bioFa : null;
  const displayLocation = isRtl ? (resume.locationFa || resume.location) : resume.location;

  return (
    <div style={{ background: t.bg, color: t.text, minHeight: "100vh", fontFamily: "'Vazirmatn', system-ui, sans-serif" }} dir={isRtl ? "rtl" : "ltr"}>
      {/* Sticky Nav */}
      <nav style={{ position: "sticky", top: 0, zIndex: 50, background: t.navBg, backdropFilter: "blur(16px)", borderBottom: `1px solid ${t.border}`, padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {resume.avatar && <img src={resume.avatar} alt="" style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover", border: `2px solid ${accent}` }} />}
          <span style={{ fontSize: 13, fontWeight: 700 }}>{displayName}</span>
        </div>
        <button
          onClick={() => setTheme(t => t === "dark" ? "light" : "dark")}
          style={{ padding: "6px 10px", borderRadius: 10, background: t.surface, border: `1px solid ${t.border}`, color: t.sub, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}
        >
          {isDark ? <Sun style={{ width: 14, height: 14 }} /> : <Moon style={{ width: 14, height: 14 }} />}
          {isDark ? "روشن" : "تاریک"}
        </button>
      </nav>

      {/* Hero */}
      <div style={{ position: "relative", overflow: "hidden" }}>
        {/* Cover */}
        <div style={{
          height: 220,
          background: resume.coverImage
            ? `url(${resume.coverImage}) center/cover`
            : `linear-gradient(135deg, ${accent}28 0%, ${isDark ? "#0c0c18" : "#e8e8f2"} 50%, ${accent}1a 100%)`,
          position: "relative",
        }}>
          <div style={{ position: "absolute", inset: 0, background: isDark ? "rgba(7,7,17,0.4)" : "rgba(242,242,246,0.15)" }} />
          {/* Decorative circles */}
          <div style={{ position: "absolute", top: -60, right: -60, width: 240, height: 240, borderRadius: "50%", background: `${accent}15`, filter: "blur(40px)" }} />
          <div style={{ position: "absolute", bottom: -40, left: 100, width: 160, height: 160, borderRadius: "50%", background: `${accent}10`, filter: "blur(30px)" }} />
        </div>

        {/* Avatar + info */}
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 24px" }}>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 20, marginTop: -48, paddingBottom: 32, position: "relative" }}>
            {resume.avatar ? (
              <img src={resume.avatar} alt={displayName} style={{ width: 96, height: 96, borderRadius: "50%", objectFit: "cover", border: `4px solid ${t.bg}`, outline: `3px solid ${accent}`, flexShrink: 0, boxShadow: `0 0 30px ${accent}40` }} />
            ) : (
              <div style={{ width: 96, height: 96, borderRadius: "50%", background: `linear-gradient(135deg, ${accent}, #ec4899)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, fontWeight: 800, color: "#fff", border: `4px solid ${t.bg}`, flexShrink: 0, boxShadow: `0 0 30px ${accent}40` }}>
                {resume.fullName.charAt(0)}
              </div>
            )}
            <div style={{ flex: 1, paddingBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, lineHeight: 1.2 }}>{displayName}</h1>
                {resume.isPublished && (
                  <span style={{ fontSize: 10, padding: "3px 10px", borderRadius: 99, background: `${accent}20`, color: accent, border: `1px solid ${accent}40`, fontWeight: 600 }}>
                    ✓ پروفایل رسمی
                  </span>
                )}
              </div>
              {displayNameAlt && <p style={{ margin: "2px 0 0", fontSize: 14, color: t.sub }}>{displayNameAlt}</p>}
              <p style={{ margin: "6px 0 0", fontSize: 15, color: accent, fontWeight: 600 }}>{displayTitle}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 24px 80px" }}>

        {/* Bio + contact row */}
        <FadeIn>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 32, marginBottom: 40, alignItems: "start" }}>
            <div>
              {displayBio && <p style={{ margin: "0 0 8px", fontSize: 14, color: t.sub, lineHeight: 1.8 }}>{displayBio}</p>}
              {displayBioFa && <p style={{ margin: 0, fontSize: 14, color: t.muted, lineHeight: 1.8 }}>{displayBioFa}</p>}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, flexShrink: 0, minWidth: 200 }}>
              {displayLocation && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: t.sub }}>
                  <MapPin style={{ width: 13, height: 13, color: accent, flexShrink: 0 }} />
                  {displayLocation}
                </div>
              )}
              {resume.email && (
                <a href={`mailto:${resume.email}`} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: t.sub, textDecoration: "none" }}>
                  <Mail style={{ width: 13, height: 13, color: accent, flexShrink: 0 }} />
                  {resume.email}
                </a>
              )}
              {resume.phone && (
                <a href={`tel:${resume.phone}`} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: t.sub, textDecoration: "none" }} dir="ltr">
                  <Phone style={{ width: 13, height: 13, color: accent, flexShrink: 0 }} />
                  {resume.phone}
                </a>
              )}
              {resume.website && (
                <a href={resume.website} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: accent, textDecoration: "none" }}>
                  <Globe style={{ width: 13, height: 13, flexShrink: 0 }} />
                  {resume.website.replace(/^https?:\/\//, "")}
                </a>
              )}
              {socials.length > 0 && (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
                  {socials.map(({ icon: Icon, href, label }) => (
                    <a key={label} href={href!} target="_blank" rel="noreferrer"
                      style={{ padding: "5px 10px", borderRadius: 8, background: t.surface, border: `1px solid ${t.border}`, color: t.sub, textDecoration: "none", fontSize: 10, display: "flex", alignItems: "center", gap: 4 }}>
                      <Icon style={{ width: 11, height: 11 }} />{label}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </FadeIn>

        {/* Skills */}
        {resume.skills.length > 0 && (
          <Section icon={<Code2 />} title={showFa ? "مهارت‌ها" : "Skills"} titleEn={showFa && showEn ? "Skills" : undefined} t={t} accent={accent}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 20 }}>
              {resume.skills.map((g, gi) => (
                <FadeIn key={g.id} delay={gi * 0.05}>
                  <div style={{ padding: 16, borderRadius: 14, background: t.surface, border: `1px solid ${t.border}` }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: accent, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      {showFa && !showEn ? (g.categoryFa || g.category) : g.category}
                      {showFa && showEn && g.categoryFa && <span style={{ color: t.muted, fontWeight: 400, marginRight: 6 }}>/ {g.categoryFa}</span>}
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {g.items.map(s => (
                        <div key={s.id}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                            <span style={{ fontSize: 12, fontWeight: 500 }}>{s.name}</span>
                            <span style={{ fontSize: 10, color: t.muted }}>{s.level ?? 80}%</span>
                          </div>
                          <div style={{ height: 4, background: t.border, borderRadius: 99, overflow: "hidden" }}>
                            <ProgressBar pct={s.level ?? 80} color={accent} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </Section>
        )}

        {/* Experience */}
        {resume.experience.length > 0 && (
          <Section icon={<Briefcase />} title={showFa ? "تجربه کاری" : "Experience"} titleEn={showFa && showEn ? "Experience" : undefined} t={t} accent={accent}>
            <div style={{ display: "flex", flexDirection: "column", gap: 0, position: "relative" }}>
              {resume.experience.map((exp, i) => (
                <FadeIn key={exp.id} delay={i * 0.07}>
                  <div style={{ display: "flex", gap: 16, paddingBottom: 28 }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, width: 20 }}>
                      <div style={{ width: 10, height: 10, borderRadius: "50%", background: accent, boxShadow: `0 0 10px ${accent}60`, flexShrink: 0 }} />
                      {i < resume.experience.length - 1 && <div style={{ width: 1, flex: 1, background: t.border, marginTop: 6 }} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                        <div>
                          <p style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>
                            {showFa && !showEn ? (exp.roleFa || exp.role) : exp.role}
                          </p>
                          {showFa && showEn && exp.roleFa && <p style={{ margin: "1px 0 0", fontSize: 12, color: t.sub }}>{exp.roleFa}</p>}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: t.muted, flexShrink: 0 }}>
                          <Calendar style={{ width: 11, height: 11 }} />
                          {exp.startDate} — {exp.current ? "اکنون" : (exp.endDate ?? "")}
                        </div>
                      </div>
                      <p style={{ margin: "0 0 8px", fontSize: 13, color: accent, fontWeight: 600 }}>
                        {showFa && !showEn ? (exp.companyFa || exp.company) : exp.company}
                        {exp.location && <span style={{ color: t.muted, fontWeight: 400, marginRight: 8, fontSize: 11 }}>· {exp.location}{exp.remote ? " · Remote" : ""}</span>}
                      </p>
                      {(exp.description || exp.descriptionFa) && (
                        <p style={{ margin: "0 0 10px", fontSize: 13, color: t.sub, lineHeight: 1.75 }}>
                          {showFa && !showEn ? (exp.descriptionFa || exp.description) : exp.description}
                        </p>
                      )}
                      {showFa && showEn && exp.descriptionFa && (
                        <p style={{ margin: "0 0 10px", fontSize: 12, color: t.muted, lineHeight: 1.7 }}>{exp.descriptionFa}</p>
                      )}
                      {exp.achievements && exp.achievements.length > 0 && (
                        <ul style={{ margin: "0 0 10px", padding: "0 16px", display: "flex", flexDirection: "column", gap: 4 }}>
                          {exp.achievements.map((a, ai) => (
                            <li key={ai} style={{ fontSize: 12, color: t.sub, lineHeight: 1.6 }}>{a}</li>
                          ))}
                        </ul>
                      )}
                      {exp.tags && exp.tags.length > 0 && (
                        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                          {exp.tags.map(tag => (
                            <span key={tag} style={{ fontSize: 10, padding: "3px 10px", borderRadius: 99, background: `${accent}18`, color: accent, border: `1px solid ${accent}35` }}>{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </Section>
        )}

        {/* Projects */}
        {resume.projects.length > 0 && (
          <Section icon={<Rocket />} title={showFa ? "پروژه‌ها" : "Projects"} titleEn={showFa && showEn ? "Projects" : undefined} t={t} accent={accent}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 14 }}>
              {resume.projects.map((p, pi) => (
                <FadeIn key={p.id} delay={pi * 0.06}>
                  <div style={{ borderRadius: 16, background: t.surface, border: `1px solid ${p.featured ? accent + "50" : t.border}`, overflow: "hidden", height: "100%", display: "flex", flexDirection: "column" }}>
                    {p.image && <img src={p.image} alt={p.name} style={{ width: "100%", height: 120, objectFit: "cover" }} />}
                    <div style={{ padding: 16, flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 700, flex: 1 }}>
                          {showFa && !showEn ? (p.nameFa || p.name) : p.name}
                        </p>
                        {p.featured && <Star style={{ width: 13, height: 13, color: "#fbbf24", flexShrink: 0, fill: "#fbbf24" }} />}
                      </div>
                      {showFa && showEn && p.nameFa && <p style={{ margin: 0, fontSize: 11, color: t.muted }}>{p.nameFa}</p>}
                      {(p.description || p.descriptionFa) && (
                        <p style={{ margin: 0, fontSize: 12, color: t.sub, lineHeight: 1.6, flex: 1 }}>
                          {showFa && !showEn ? (p.descriptionFa || p.description) : p.description}
                        </p>
                      )}
                      {p.tags && p.tags.length > 0 && (
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                          {p.tags.map(tag => (
                            <span key={tag} style={{ fontSize: 9, padding: "2px 8px", borderRadius: 99, background: `${accent}15`, color: accent }}>{tag}</span>
                          ))}
                        </div>
                      )}
                      {(p.url || p.github) && (
                        <div style={{ display: "flex", gap: 8, marginTop: "auto", paddingTop: 4 }}>
                          {p.url && <a href={p.url} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: accent, textDecoration: "none" }}><ExternalLink style={{ width: 10, height: 10 }} />مشاهده</a>}
                          {p.github && <a href={p.github} target="_blank" rel="noreferrer" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: t.sub, textDecoration: "none" }}><Github style={{ width: 10, height: 10 }} />GitHub</a>}
                        </div>
                      )}
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </Section>
        )}

        {/* Education */}
        {resume.education.length > 0 && (
          <Section icon={<GraduationCap />} title={showFa ? "تحصیلات" : "Education"} titleEn={showFa && showEn ? "Education" : undefined} t={t} accent={accent}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {resume.education.map((ed, ei) => (
                <FadeIn key={ed.id} delay={ei * 0.05}>
                  <div style={{ padding: 16, borderRadius: 14, background: t.surface, border: `1px solid ${t.border}`, display: "flex", gap: 16, alignItems: "flex-start" }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: `${accent}20`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <GraduationCap style={{ width: 18, height: 18, color: accent }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: "0 0 2px", fontSize: 14, fontWeight: 700 }}>
                        {showFa && !showEn ? (ed.degreeFa || ed.degree) : ed.degree}
                        {ed.field && <span style={{ color: accent, fontWeight: 400, marginRight: 6 }}>— {showFa && !showEn ? (ed.fieldFa || ed.field) : ed.field}</span>}
                      </p>
                      <p style={{ margin: "0 0 4px", fontSize: 13, color: accent, fontWeight: 600 }}>
                        {showFa && !showEn ? (ed.institutionFa || ed.institution) : ed.institution}
                      </p>
                      <p style={{ margin: 0, fontSize: 11, color: t.muted }}>
                        {ed.startDate} — {ed.current ? "اکنون" : (ed.endDate ?? "")}
                        {ed.gpa && <span style={{ marginRight: 10 }}>· GPA: {ed.gpa}</span>}
                      </p>
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </Section>
        )}

        {/* Certifications */}
        {resume.certifications.length > 0 && (
          <Section icon={<Award />} title={showFa ? "گواهینامه‌ها" : "Certifications"} titleEn={showFa && showEn ? "Certifications" : undefined} t={t} accent={accent}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
              {resume.certifications.map((c, ci) => (
                <FadeIn key={c.id} delay={ci * 0.05}>
                  <div style={{ padding: 14, borderRadius: 12, background: t.surface, border: `1px solid ${t.border}` }}>
                    <p style={{ margin: "0 0 4px", fontSize: 12, fontWeight: 700 }}>
                      {showFa && !showEn ? (c.nameFa || c.name) : c.name}
                    </p>
                    <p style={{ margin: "0 0 6px", fontSize: 11, color: accent }}>
                      {showFa && !showEn ? (c.issuerFa || c.issuer) : c.issuer}
                    </p>
                    {c.date && <p style={{ margin: 0, fontSize: 10, color: t.muted }}>{c.date}</p>}
                    {c.url && (
                      <a href={c.url} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 3, marginTop: 6, fontSize: 10, color: accent, textDecoration: "none" }}>
                        <ExternalLink style={{ width: 10, height: 10 }} />مشاهده گواهی
                      </a>
                    )}
                  </div>
                </FadeIn>
              ))}
            </div>
          </Section>
        )}

        {/* Languages */}
        {resume.languages.length > 0 && (
          <Section icon={<LangIcon />} title={showFa ? "زبان‌ها" : "Languages"} titleEn={showFa && showEn ? "Languages" : undefined} t={t} accent={accent}>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {resume.languages.map((l, li) => (
                <FadeIn key={l.id} delay={li * 0.05}>
                  <div style={{ padding: "12px 18px", borderRadius: 14, background: t.surface, border: `1px solid ${t.border}`, minWidth: 120 }}>
                    <p style={{ margin: "0 0 6px", fontSize: 14, fontWeight: 700 }}>
                      {showFa && !showEn ? (l.nameFa || l.name) : l.name}
                    </p>
                    <div style={{ height: 3, background: t.border, borderRadius: 99, marginBottom: 6, overflow: "hidden" }}>
                      <ProgressBar pct={LEVEL_PCT[l.level]} color={accent} />
                    </div>
                    <p style={{ margin: 0, fontSize: 10, color: accent }}>{LEVEL_FA[l.level]}</p>
                    {l.certificate && <p style={{ margin: "2px 0 0", fontSize: 10, color: t.muted }}>{l.certificate}</p>}
                  </div>
                </FadeIn>
              ))}
            </div>
          </Section>
        )}
      </div>

      {/* Footer */}
      <div style={{ borderTop: `1px solid ${t.border}`, padding: "20px 24px", textAlign: "center" }}>
        <p style={{ margin: 0, fontSize: 11, color: t.muted }}>
          ساخته‌شده با{" "}
          <a href="https://persicore.ir" style={{ color: accent, textDecoration: "none", fontWeight: 600 }}>Persicore</a>
        </p>
      </div>
    </div>
  );
}

function ProgressBar({ pct, color }: { pct: number; color: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const visible = useScrollIn(ref as React.RefObject<Element>);
  return (
    <div ref={ref} style={{ width: visible ? `${pct}%` : "0%", height: "100%", background: color, borderRadius: 99, transition: "width 1s cubic-bezier(0.4,0,0.2,1)" }} />
  );
}

function Section({ icon, title, titleEn, t, accent, children }: {
  icon: React.ReactNode; title: string; titleEn?: string;
  t: { surface: string; border: string; text: string; sub: string };
  accent: string; children: React.ReactNode;
}) {
  return (
    <FadeIn>
      <div style={{ marginBottom: 48 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: `${accent}20`, display: "flex", alignItems: "center", justifyContent: "center", color: accent, flexShrink: 0 }}>
            {icon}
          </div>
          <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>{title}</h2>
          {titleEn && <span style={{ fontSize: 13, color: t.sub, fontWeight: 400 }}>{titleEn}</span>}
          <div style={{ flex: 1, height: 1, background: t.border }} />
        </div>
        {children}
      </div>
    </FadeIn>
  );
}
