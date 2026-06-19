"use client";

import type { ResumeData } from "./ResumeTypes";

interface Props {
  resume: ResumeData;
}

export function ResumePreview({ resume }: Props) {
  const isDark = resume.theme !== "light";
  const accent = resume.accentColor ?? "#8B5CF6";
  const showFa = resume.lang !== "en";
  const showEn = resume.lang !== "fa";

  const bg = isDark ? "#070711" : "#f5f5f8";
  const text = isDark ? "#ffffff" : "#111111";
  const sub = isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)";
  const card = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)";
  const border = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";

  return (
    <div style={{ background: bg, color: text, minHeight: "100vh", fontFamily: "'Vazirmatn', system-ui, sans-serif", direction: resume.lang === "en" ? "ltr" : "rtl" }}>
      {/* Hero */}
      <div style={{ background: `linear-gradient(135deg, ${accent}22 0%, ${isDark ? "#0a0a14" : "#e8e8f0"} 60%)`, padding: "48px 40px 40px", textAlign: "center", borderBottom: `1px solid ${border}` }}>
        {resume.coverImage && (
          <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${resume.coverImage})`, backgroundSize: "cover", backgroundPosition: "center", opacity: 0.15 }} />
        )}
        <div style={{ position: "relative" }}>
          {resume.avatar ? (
            <img src={resume.avatar} alt="" style={{ width: 80, height: 80, borderRadius: "50%", objectFit: "cover", margin: "0 auto 16px", border: `3px solid ${accent}`, display: "block" }} />
          ) : (
            <div style={{ width: 80, height: 80, borderRadius: "50%", background: `linear-gradient(135deg, ${accent}, #ec4899)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 700, color: "#fff", margin: "0 auto 16px" }}>
              {resume.fullName.charAt(0)}
            </div>
          )}
          <h1 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 700, lineHeight: 1.2 }}>
            {showEn && resume.fullName}
            {showFa && showEn && resume.fullNameFa && <span style={{ color: sub, fontSize: 16, display: "block" }}>{resume.fullNameFa}</span>}
            {showFa && !showEn && (resume.fullNameFa || resume.fullName)}
          </h1>
          <p style={{ margin: "0 0 12px", fontSize: 13, color: accent, fontWeight: 600 }}>
            {showEn ? resume.title : (resume.titleFa || resume.title)}
          </p>
          {resume.location && (
            <p style={{ margin: "0 0 12px", fontSize: 11, color: sub }}>
              📍 {showEn ? resume.location : (resume.locationFa || resume.location)}
            </p>
          )}
          <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
            {resume.email && <a href={`mailto:${resume.email}`} style={{ color: sub, fontSize: 10, textDecoration: "none" }}>{resume.email}</a>}
            {resume.website && <a href={resume.website} style={{ color: accent, fontSize: 10 }}>{resume.website.replace(/^https?:\/\//, "")}</a>}
          </div>
        </div>
      </div>

      <div style={{ padding: "32px 40px", maxWidth: 900, margin: "0 auto" }}>
        {/* Bio */}
        {(resume.bio || resume.bioFa) && (
          <p style={{ fontSize: 12, color: sub, lineHeight: 1.7, marginBottom: 32, textAlign: "justify" }}>
            {showEn && resume.bio}
            {showFa && !showEn && (resume.bioFa || resume.bio)}
          </p>
        )}

        {/* Skills */}
        {resume.skills.length > 0 && (
          <Section title="مهارت‌ها / Skills" accent={accent} border={border} card={card} sub={sub}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
              {resume.skills.map(g => (
                <div key={g.id}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: accent, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {showFa ? (g.categoryFa || g.category) : g.category}
                  </p>
                  {g.items.map(s => (
                    <div key={s.id} style={{ marginBottom: 6 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                        <span style={{ fontSize: 11, color: text }}>{s.name}</span>
                        <span style={{ fontSize: 10, color: sub }}>{s.level ?? 80}%</span>
                      </div>
                      <div style={{ height: 3, background: border, borderRadius: 99 }}>
                        <div style={{ width: `${s.level ?? 80}%`, height: "100%", background: accent, borderRadius: 99 }} />
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Experience */}
        {resume.experience.length > 0 && (
          <Section title="تجربه کاری / Experience" accent={accent} border={border} card={card} sub={sub}>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {resume.experience.map(exp => (
                <div key={exp.id} style={{ display: "flex", gap: 12 }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 4 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: accent, flexShrink: 0 }} />
                    <div style={{ width: 1, flex: 1, background: border, marginTop: 4 }} />
                  </div>
                  <div style={{ flex: 1, paddingBottom: 20 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, margin: "0 0 2px" }}>
                      {showEn ? exp.role : (exp.roleFa || exp.role)}
                    </p>
                    <p style={{ fontSize: 11, color: accent, margin: "0 0 4px" }}>
                      {showEn ? exp.company : (exp.companyFa || exp.company)}
                    </p>
                    <p style={{ fontSize: 10, color: sub, margin: "0 0 8px" }}>
                      {exp.startDate} — {exp.current ? "حال" : (exp.endDate ?? "")}
                      {exp.location && ` · ${exp.location}`}
                      {exp.remote && " · Remote"}
                    </p>
                    {(exp.description || exp.descriptionFa) && (
                      <p style={{ fontSize: 11, color: sub, lineHeight: 1.6, margin: "0 0 8px" }}>
                        {showEn ? exp.description : (exp.descriptionFa || exp.description)}
                      </p>
                    )}
                    {exp.tags && exp.tags.length > 0 && (
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        {exp.tags.map(t => (
                          <span key={t} style={{ fontSize: 9, padding: "2px 8px", background: `${accent}20`, color: accent, borderRadius: 99, border: `1px solid ${accent}40` }}>{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Projects */}
        {resume.projects.length > 0 && (
          <Section title="پروژه‌ها / Projects" accent={accent} border={border} card={card} sub={sub}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
              {resume.projects.map(p => (
                <div key={p.id} style={{ padding: 14, borderRadius: 12, background: card, border: `1px solid ${border}` }}>
                  <p style={{ fontSize: 12, fontWeight: 700, margin: "0 0 4px" }}>
                    {showEn ? p.name : (p.nameFa || p.name)}
                    {p.featured && <span style={{ fontSize: 9, color: "#fbbf24", marginRight: 4 }}>★ ویژه</span>}
                  </p>
                  {(p.description || p.descriptionFa) && (
                    <p style={{ fontSize: 10, color: sub, lineHeight: 1.5, margin: "0 0 8px" }}>
                      {showEn ? p.description : (p.descriptionFa || p.description)}
                    </p>
                  )}
                  {p.tags && p.tags.length > 0 && (
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {p.tags.map(t => (
                        <span key={t} style={{ fontSize: 9, padding: "1px 6px", background: `${accent}15`, color: accent, borderRadius: 99 }}>{t}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Education */}
        {resume.education.length > 0 && (
          <Section title="تحصیلات / Education" accent={accent} border={border} card={card} sub={sub}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {resume.education.map(ed => (
                <div key={ed.id} style={{ padding: 14, borderRadius: 12, background: card, border: `1px solid ${border}` }}>
                  <p style={{ fontSize: 12, fontWeight: 700, margin: "0 0 2px" }}>
                    {showEn ? `${ed.degree}${ed.field ? ` — ${ed.field}` : ""}` : `${ed.degreeFa || ed.degree}${ed.fieldFa ? ` — ${ed.fieldFa}` : ""}`}
                  </p>
                  <p style={{ fontSize: 11, color: accent, margin: "0 0 4px" }}>
                    {showEn ? ed.institution : (ed.institutionFa || ed.institution)}
                  </p>
                  <p style={{ fontSize: 10, color: sub }}>
                    {ed.startDate} — {ed.current ? "حال" : (ed.endDate ?? "")}
                    {ed.gpa && ` · GPA: ${ed.gpa}`}
                  </p>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Certifications */}
        {resume.certifications.length > 0 && (
          <Section title="گواهینامه‌ها / Certifications" accent={accent} border={border} card={card} sub={sub}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
              {resume.certifications.map(c => (
                <div key={c.id} style={{ padding: 12, borderRadius: 10, background: card, border: `1px solid ${border}` }}>
                  <p style={{ fontSize: 11, fontWeight: 600, margin: "0 0 2px" }}>
                    {showEn ? c.name : (c.nameFa || c.name)}
                  </p>
                  <p style={{ fontSize: 10, color: accent, margin: "0 0 2px" }}>
                    {showEn ? c.issuer : (c.issuerFa || c.issuer)}
                  </p>
                  {c.date && <p style={{ fontSize: 9, color: sub }}>{c.date}</p>}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Languages */}
        {resume.languages.length > 0 && (
          <Section title="زبان‌ها / Languages" accent={accent} border={border} card={card} sub={sub}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {resume.languages.map(l => (
                <div key={l.id} style={{ padding: "8px 14px", borderRadius: 99, background: card, border: `1px solid ${border}`, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>{showEn ? l.name : (l.nameFa || l.name)}</span>
                  <span style={{ fontSize: 10, color: accent, padding: "1px 8px", background: `${accent}20`, borderRadius: 99 }}>
                    {LEVEL_LABEL[l.level]}
                  </span>
                </div>
              ))}
            </div>
          </Section>
        )}
      </div>
    </div>
  );
}

const LEVEL_LABEL: Record<string, string> = {
  native: "Native", fluent: "Fluent", advanced: "Advanced", intermediate: "Intermediate", basic: "Basic"
};

function Section({ title, accent, border, card, sub, children }: { title: string; accent: string; border: string; card: string; sub: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <span style={{ fontSize: 13, fontWeight: 700 }}>{title}</span>
        <div style={{ flex: 1, height: 1, background: border }} />
      </div>
      {children}
    </div>
  );
}
