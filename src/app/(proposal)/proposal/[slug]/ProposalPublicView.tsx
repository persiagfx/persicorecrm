"use client";

import { useState, useRef, useEffect } from "react";
import type { ProposalData, FAQ } from "@/components/proposal/ProposalTypes";
import { PROJECT_TYPE_LABEL } from "@/components/proposal/ProposalTypes";
import { Check, ChevronDown, ChevronUp, ExternalLink, Phone, Mail, MapPin, Printer, Star } from "lucide-react";

// ── Scroll animation ──────────────────────────────────────────────────
function useVisible(ref: React.RefObject<Element | null>) {
  const [v, setV] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setV(true); obs.disconnect(); } }, { threshold: 0.08 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [ref]);
  return v;
}

function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const v = useVisible(ref as React.RefObject<Element>);
  return (
    <div ref={ref} className={className}
      style={{ opacity: v ? 1 : 0, transform: v ? "none" : "translateY(28px)", transition: `opacity 0.7s ${delay}s ease-out, transform 0.7s ${delay}s ease-out` }}>
      {children}
    </div>
  );
}

// ── FAQ Accordion ────────────────────────────────────────────────────
function FaqItem({ faq, accent, border, text, sub }: { faq: FAQ; accent: string; border: string; text: string; sub: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: `1px solid ${border}` }}>
      <button onClick={() => setOpen(!open)}
        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 0", cursor: "pointer", background: "none", border: "none", textAlign: "right", gap: 16 }}>
        <span style={{ fontSize: 15, fontWeight: 600, color: text, fontFamily: "'Vazirmatn', system-ui" }}>{faq.question}</span>
        <span style={{ color: accent, flexShrink: 0 }}>
          {open ? <ChevronUp style={{ width: 18, height: 18 }} /> : <ChevronDown style={{ width: 18, height: 18 }} />}
        </span>
      </button>
      {open && <p style={{ fontSize: 14, color: sub, lineHeight: 1.9, paddingBottom: 18, margin: 0 }}>{faq.answer}</p>}
    </div>
  );
}

// ── Section heading ───────────────────────────────────────────────────
function SectionHeading({ title, subtitle, accent, sub, center = false }: { title: string; subtitle?: string; accent: string; sub: string; center?: boolean }) {
  return (
    <FadeIn>
      <div style={{ marginBottom: 40, textAlign: center ? "center" : "right" }}>
        <div style={{ display: "inline-block", fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: accent, padding: "4px 14px", borderRadius: 99, background: `${accent}18`, border: `1px solid ${accent}35`, marginBottom: 12 }}>
          {title}
        </div>
        {subtitle && <p style={{ margin: 0, fontSize: 14, color: sub, lineHeight: 1.7 }}>{subtitle}</p>}
      </div>
    </FadeIn>
  );
}

// ── Main view ─────────────────────────────────────────────────────────
export function ProposalPublicView({ proposal: p }: { proposal: ProposalData }) {
  const [scrollPct, setScrollPct] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement;
      setScrollPct((el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isDark = p.darkMode !== false;
  const c1 = p.primaryColor ?? "#8B5CF6";
  const c2 = p.secondaryColor ?? "#EC4899";

  const T = {
    bg:      isDark ? "#060610" : "#f2f2f6",
    surface: isDark ? "rgba(255,255,255,0.04)" : "#ffffff",
    surfaceHover: isDark ? "rgba(255,255,255,0.07)" : "#f7f7fb",
    border:  isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)",
    text:    isDark ? "#f0f0ff" : "#111122",
    sub:     isDark ? "rgba(240,240,255,0.6)" : "rgba(11,11,34,0.58)",
    muted:   isDark ? "rgba(240,240,255,0.35)" : "rgba(11,11,34,0.38)",
    navBg:   isDark ? "rgba(6,6,16,0.88)" : "rgba(242,242,246,0.92)",
  };

  const W = { maxWidth: 920, margin: "0 auto", padding: "0 28px" };
  const font = "'Vazirmatn', system-ui, sans-serif";

  const handlePrint = () => window.print();

  return (
    <div style={{ background: T.bg, color: T.text, fontFamily: font, direction: "rtl", minHeight: "100vh" }}>

      {/* ── Progress bar ─── */}
      <div style={{ position: "fixed", top: 0, right: 0, left: 0, height: 3, zIndex: 100, background: T.border }}>
        <div style={{ width: `${scrollPct}%`, height: "100%", background: `linear-gradient(90deg, ${c1}, ${c2})`, transition: "width 0.1s" }} />
      </div>

      {/* ── Sticky nav ─── */}
      <nav style={{ position: "sticky", top: 0, zIndex: 50, background: T.navBg, backdropFilter: "blur(20px)", borderBottom: `1px solid ${T.border}`, padding: "14px 28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {p.agencyLogo
            ? <img src={p.agencyLogo} alt={p.agencyName} style={{ height: 28, objectFit: "contain" }} />
            : <span style={{ fontSize: 14, fontWeight: 800, background: `linear-gradient(135deg, ${c1}, ${c2})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{p.agencyName}</span>
          }
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ display: "inline-block", fontSize: 11, padding: "4px 12px", borderRadius: 99, background: `${c1}25`, color: c1, border: `1px solid ${c1}40` }}>
            {PROJECT_TYPE_LABEL[p.projectType]}
          </div>
          <button onClick={handlePrint}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 10, background: T.surface, border: `1px solid ${T.border}`, color: T.sub, cursor: "pointer", fontSize: 12, fontFamily: font }}>
            <Printer style={{ width: 14, height: 14 }} />PDF
          </button>
        </div>
      </nav>

      {/* ════ HERO ════════════════════════════════════════════════════ */}
      <section style={{ position: "relative", overflow: "hidden", minHeight: "90vh", display: "flex", alignItems: "center" }}>
        {/* Background */}
        {p.coverImage
          ? <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${p.coverImage})`, backgroundSize: "cover", backgroundPosition: "center" }}>
              <div style={{ position: "absolute", inset: 0, background: isDark ? "rgba(6,6,16,0.7)" : "rgba(244,244,248,0.7)" }} />
            </div>
          : <>
              <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse 80% 60% at 50% 0%, ${c1}22 0%, transparent 65%)` }} />
              <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse 60% 50% at 100% 100%, ${c2}15 0%, transparent 60%)` }} />
              <div style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse 50% 40% at 0% 50%, ${c1}10 0%, transparent 60%)` }} />
            </>
        }
        {/* Animated grid */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: `linear-gradient(${T.border} 1px, transparent 1px), linear-gradient(90deg, ${T.border} 1px, transparent 1px)`, backgroundSize: "60px 60px", opacity: 0.4 }} />

        <div style={{ ...W, position: "relative", textAlign: "center", padding: "120px 28px" }}>
          {/* Badge */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 20px", borderRadius: 99, background: `${c1}20`, border: `1px solid ${c1}40`, color: c1, fontSize: 12, fontWeight: 700, marginBottom: 28, backdropFilter: "blur(10px)" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: c1, display: "inline-block", boxShadow: `0 0 8px ${c1}` }} />
            پروپزال رسمی طراحی و توسعه
          </div>

          {/* Title */}
          <h1 style={{ margin: "0 0 16px", fontSize: "clamp(28px, 5vw, 52px)", fontWeight: 900, lineHeight: 1.2, letterSpacing: "-0.02em" }}>
            {p.projectTitle}
          </h1>
          {p.projectSubtitle && (
            <p style={{ margin: "0 0 32px", fontSize: 18, color: T.sub, lineHeight: 1.7 }}>{p.projectSubtitle}</p>
          )}

          {/* Client info */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 16, padding: "16px 28px", borderRadius: 16, background: T.surface, border: `1px solid ${T.border}`, backdropFilter: "blur(12px)", flexWrap: "wrap", justifyContent: "center" }}>
            <div style={{ textAlign: "center" }}>
              <p style={{ margin: 0, fontSize: 10, color: T.muted, marginBottom: 2 }}>ارائه شده به</p>
              <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: T.text }}>{p.clientName}</p>
              {p.clientCompany && <p style={{ margin: 0, fontSize: 12, color: c1 }}>{p.clientCompany}</p>}
            </div>
            {p.validUntil && (
              <>
                <div style={{ width: 1, height: 36, background: T.border }} />
                <div style={{ textAlign: "center" }}>
                  <p style={{ margin: 0, fontSize: 10, color: T.muted, marginBottom: 2 }}>اعتبار تا</p>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>
                    {new Date(p.validUntil).toLocaleDateString("fa-IR", { year: "numeric", month: "long", day: "numeric" })}
                  </p>
                </div>
              </>
            )}
            <div style={{ width: 1, height: 36, background: T.border }} />
            <div style={{ textAlign: "center" }}>
              <p style={{ margin: 0, fontSize: 10, color: T.muted, marginBottom: 2 }}>توسط</p>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, background: `linear-gradient(135deg, ${c1}, ${c2})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{p.agencyName}</p>
            </div>
          </div>

          {/* Scroll hint */}
          <div style={{ marginTop: 60, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, color: T.muted, fontSize: 11 }}>
            <span>اسکرول کنید</span>
            <div style={{ width: 20, height: 32, border: `1px solid ${T.border}`, borderRadius: 10, display: "flex", justifyContent: "center", paddingTop: 6 }}>
              <div style={{ width: 3, height: 8, borderRadius: 99, background: c1, animation: "scrollDot 1.5s infinite" }} />
            </div>
          </div>
        </div>
      </section>

      {/* ════ EXECUTIVE SUMMARY ══════════════════════════════════════ */}
      {(p.projectSummary || p.problemStatement || p.ourSolution) && (
        <section style={{ padding: "80px 0", borderTop: `1px solid ${T.border}` }}>
          <div style={W}>
            <SectionHeading title="خلاصه اجرایی" accent={c1} sub={T.sub} />
            {p.projectSummary && (
              <FadeIn>
                <p style={{ fontSize: 16, color: T.sub, lineHeight: 2, marginBottom: 48, maxWidth: 720 }}>{p.projectSummary}</p>
              </FadeIn>
            )}
            {(p.problemStatement || p.ourSolution) && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
                {p.problemStatement && (
                  <FadeIn delay={0.1}>
                    <div style={{ padding: 28, borderRadius: 20, background: `rgba(239,68,68,0.06)`, border: `1px solid rgba(239,68,68,0.15)` }}>
                      <p style={{ margin: "0 0 12px", fontSize: 12, fontWeight: 700, color: "#ef4444", textTransform: "uppercase", letterSpacing: "0.1em" }}>⚡ چالش فعلی</p>
                      <p style={{ margin: 0, fontSize: 14, color: T.sub, lineHeight: 1.9 }}>{p.problemStatement}</p>
                    </div>
                  </FadeIn>
                )}
                {p.ourSolution && (
                  <FadeIn delay={0.2}>
                    <div style={{ padding: 28, borderRadius: 20, background: `${c1}0a`, border: `1px solid ${c1}25` }}>
                      <p style={{ margin: "0 0 12px", fontSize: 12, fontWeight: 700, color: c1, textTransform: "uppercase", letterSpacing: "0.1em" }}>✦ راه‌حل ما</p>
                      <p style={{ margin: 0, fontSize: 14, color: T.sub, lineHeight: 1.9 }}>{p.ourSolution}</p>
                    </div>
                  </FadeIn>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ════ GOALS ════════════════════════════════════════════════ */}
      {p.goals.length > 0 && (
        <section style={{ padding: "80px 0", background: T.surface, borderTop: `1px solid ${T.border}` }}>
          <div style={W}>
            <SectionHeading title="اهداف پروژه" accent={c1} sub={T.sub} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
              {p.goals.map((g, i) => (
                <FadeIn key={g.id} delay={i * 0.07}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: 20, borderRadius: 16, background: T.bg, border: `1px solid ${T.border}` }}>
                    <div style={{ width: 32, height: 32, borderRadius: 10, background: `${c1}20`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: 13, color: c1, fontWeight: 700 }}>{i + 1}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: 14, color: T.sub, lineHeight: 1.7 }}>{g.text}</p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ════ SCOPE / DELIVERABLES ═══════════════════════════════════ */}
      {p.deliverables.length > 0 && (
        <section style={{ padding: "80px 0", borderTop: `1px solid ${T.border}` }}>
          <div style={W}>
            <SectionHeading title="اسکوپ کار" subtitle="تمام مواردی که در این پروژه تحویل خواهیم داد" accent={c1} sub={T.sub} />
            {/* Group by category */}
            {(() => {
              const cats = [...new Set(p.deliverables.map(d => d.category || "عمومی"))];
              return (
                <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
                  {cats.map(cat => {
                    const items = p.deliverables.filter(d => (d.category || "عمومی") === cat);
                    return (
                      <FadeIn key={cat}>
                        <div>
                          <p style={{ fontSize: 11, fontWeight: 700, color: c1, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>{cat}</p>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
                            {items.map((d, di) => (
                              <div key={d.id} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "14px 16px", borderRadius: 14, background: T.surface, border: `1px solid ${T.border}`, transition: "border-color 0.2s" }}>
                                <div style={{ width: 28, height: 28, borderRadius: 8, background: `${c1}20`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 14 }}>
                                  {d.icon || "✓"}
                                </div>
                                <div>
                                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: T.text }}>{d.title}</p>
                                  {d.description && <p style={{ margin: "3px 0 0", fontSize: 11, color: T.muted, lineHeight: 1.6 }}>{d.description}</p>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </FadeIn>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </section>
      )}

      {/* ════ PROCESS ════════════════════════════════════════════════ */}
      {(p.process ?? []).length > 0 && (
        <section style={{ padding: "80px 0", borderTop: `1px solid ${T.border}` }}>
          <div style={W}>
            <SectionHeading title="روش کار ما" subtitle="فرآیند اجرایی ما برای تحویل بهترین نتیجه" accent={c1} sub={T.sub} center />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 20 }}>
              {(p.process ?? []).map((step, i) => (
                <FadeIn key={step.id} delay={i * 0.07}>
                  <div style={{ padding: 24, borderRadius: 18, background: T.surface, border: `1px solid ${T.border}`, position: "relative" }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: `linear-gradient(135deg, ${c1}, ${c2})`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16, boxShadow: `0 4px 16px ${c1}40` }}>
                      {step.icon ? <span style={{ fontSize: 18 }}>{step.icon}</span> : <span style={{ fontSize: 15, fontWeight: 800, color: "#fff" }}>{i + 1}</span>}
                    </div>
                    <h4 style={{ margin: "0 0 8px", fontSize: 15, fontWeight: 700 }}>{step.title}</h4>
                    <p style={{ margin: 0, fontSize: 13, color: T.sub, lineHeight: 1.8 }}>{step.description}</p>
                    {step.duration && <p style={{ margin: "10px 0 0", fontSize: 11, color: c1, fontWeight: 600 }}>{step.duration}</p>}
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ════ TIMELINE ═══════════════════════════════════════════════ */}
      {p.phases.length > 0 && (
        <section style={{ padding: "80px 0", background: T.surface, borderTop: `1px solid ${T.border}` }}>
          <div style={W}>
            <SectionHeading title="مراحل اجرا" subtitle="برنامه زمانی دقیق پروژه" accent={c1} sub={T.sub} />
            <div style={{ position: "relative" }}>
              {/* Vertical line */}
              <div style={{ position: "absolute", right: 19, top: 0, bottom: 0, width: 2, background: `linear-gradient(180deg, ${c1}, ${c2})`, opacity: 0.3 }} />
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {p.phases.map((ph, i) => (
                  <FadeIn key={ph.id} delay={i * 0.08}>
                    <div style={{ display: "flex", gap: 24, paddingBottom: 36, position: "relative" }}>
                      {/* Dot */}
                      <div style={{ flexShrink: 0, width: 40, display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <div style={{ width: 40, height: 40, borderRadius: "50%", background: `linear-gradient(135deg, ${c1}, ${c2})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "#fff", boxShadow: `0 4px 20px ${c1}50`, zIndex: 1 }}>
                          {i + 1}
                        </div>
                      </div>
                      {/* Content */}
                      <div style={{ flex: 1, paddingBottom: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8, flexWrap: "wrap" }}>
                          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>{ph.title}</h3>
                          <span style={{ fontSize: 11, padding: "3px 12px", borderRadius: 99, background: `${c1}20`, color: c1, border: `1px solid ${c1}40`, fontWeight: 600 }}>
                            {ph.duration}
                          </span>
                        </div>
                        {ph.description && <p style={{ margin: "0 0 12px", fontSize: 14, color: T.sub, lineHeight: 1.8 }}>{ph.description}</p>}
                        {ph.tasks.length > 0 && (
                          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            {ph.tasks.map((task, ti) => (
                              <div key={ti} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <Check style={{ width: 13, height: 13, color: c1, flexShrink: 0 }} />
                                <span style={{ fontSize: 13, color: T.sub }}>{task}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </FadeIn>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ════ PACKAGES ═══════════════════════════════════════════════ */}
      {p.packages.length > 0 && (
        <section style={{ padding: "100px 0", borderTop: `1px solid ${T.border}` }}>
          <div style={W}>
            <SectionHeading title="پکیج‌های قیمتی" subtitle="پیشنهادهای متنوع برای هر نیاز" accent={c1} sub={T.sub} center />
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(p.packages.length, 3)}, 1fr)`, gap: 20, maxWidth: 860, margin: "0 auto" }}>
              {p.packages.map((pk, pi) => (
                <FadeIn key={pk.id} delay={pi * 0.08}>
                  <div style={{ position: "relative", borderRadius: 24, background: pk.highlighted ? `linear-gradient(135deg, ${c1}12, ${c2}08)` : T.surface, border: pk.highlighted ? `1.5px solid ${c1}60` : `1px solid ${T.border}`, padding: 32, display: "flex", flexDirection: "column", gap: 20, height: "100%" }}>
                    {pk.highlighted && (
                      <div style={{ position: "absolute", top: -12, right: "50%", transform: "translateX(50%)", fontSize: 10, fontWeight: 700, padding: "4px 16px", borderRadius: 99, background: `linear-gradient(135deg, ${c1}, ${c2})`, color: "#fff", whiteSpace: "nowrap" }}>
                        ⭐ پیشنهاد ویژه
                      </div>
                    )}
                    <div>
                      <p style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 700, color: T.text }}>{pk.name}</p>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                        <span style={{ fontSize: 28, fontWeight: 900, background: `linear-gradient(135deg, ${c1}, ${c2})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{pk.price}</span>
                        <span style={{ fontSize: 12, color: T.muted }}>{p.currency}</span>
                      </div>
                      {pk.priceNote && <p style={{ margin: "4px 0 0", fontSize: 11, color: T.muted }}>{pk.priceNote}</p>}
                    </div>
                    {pk.description && <p style={{ margin: 0, fontSize: 13, color: T.sub, lineHeight: 1.7, borderBottom: `1px solid ${T.border}`, paddingBottom: 16 }}>{pk.description}</p>}
                    <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
                      {pk.features.map((f, fi) => (
                        <div key={fi} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 18, height: 18, borderRadius: "50%", background: `${c1}25`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <Check style={{ width: 10, height: 10, color: c1 }} />
                          </div>
                          <span style={{ fontSize: 13, color: T.sub }}>{f}</span>
                        </div>
                      ))}
                    </div>
                    {p.contactEmail && (
                      <a href={`mailto:${p.contactEmail}?subject=پروپزال ${p.projectTitle} - ${pk.name}`}
                        style={{ display: "block", textAlign: "center", padding: "12px", borderRadius: 14, background: pk.highlighted ? `linear-gradient(135deg, ${c1}, ${c2})` : `${c1}20`, color: pk.highlighted ? "#fff" : c1, fontSize: 13, fontWeight: 700, textDecoration: "none", fontFamily: font }}>
                        انتخاب این پکیج
                      </a>
                    )}
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ════ PORTFOLIO ══════════════════════════════════════════════ */}
      {p.portfolioItems.length > 0 && (
        <section style={{ padding: "80px 0", background: T.surface, borderTop: `1px solid ${T.border}` }}>
          <div style={W}>
            <SectionHeading title="نمونه‌کارها" subtitle="پروژه‌های مشابه که پیش‌تر اجرا کرده‌ایم" accent={c1} sub={T.sub} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 20 }}>
              {p.portfolioItems.map((item, ii) => (
                <FadeIn key={item.id} delay={ii * 0.06}>
                  <div style={{ borderRadius: 20, overflow: "hidden", background: T.bg, border: `1px solid ${T.border}`, display: "flex", flexDirection: "column" }}>
                    {item.image
                      ? <img src={item.image} alt={item.title} style={{ width: "100%", height: 160, objectFit: "cover" }} />
                      : <div style={{ height: 120, background: `linear-gradient(135deg, ${c1}20, ${c2}10)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>🖼</div>
                    }
                    <div style={{ padding: 20, flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
                      <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>{item.title}</h4>
                      {item.description && <p style={{ margin: 0, fontSize: 13, color: T.sub, lineHeight: 1.7, flex: 1 }}>{item.description}</p>}
                      {item.tags.length > 0 && (
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          {item.tags.map(tag => <span key={tag} style={{ fontSize: 10, padding: "3px 10px", borderRadius: 99, background: `${c1}18`, color: c1 }}>{tag}</span>)}
                        </div>
                      )}
                      {item.url && (
                        <a href={item.url} target="_blank" rel="noreferrer"
                          style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: c1, textDecoration: "none" }}>
                          <ExternalLink style={{ width: 12, height: 12 }} />مشاهده پروژه
                        </a>
                      )}
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ════ STATS ══════════════════════════════════════════════════ */}
      {(p.stats ?? []).length > 0 && (
        <section style={{ padding: "60px 0", background: `linear-gradient(135deg, ${c1}08, ${c2}05)`, borderTop: `1px solid ${T.border}` }}>
          <div style={W}>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min((p.stats ?? []).length, 4)}, 1fr)`, gap: 20 }}>
              {(p.stats ?? []).map((stat, i) => (
                <FadeIn key={stat.id} delay={i * 0.06}>
                  <div style={{ textAlign: "center", padding: "24px 16px" }}>
                    {stat.icon && <div style={{ fontSize: 28, marginBottom: 10 }}>{stat.icon}</div>}
                    <p style={{ margin: "0 0 6px", fontSize: 40, fontWeight: 900, lineHeight: 1, background: `linear-gradient(135deg, ${c1}, ${c2})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{stat.value}</p>
                    <p style={{ margin: 0, fontSize: 13, color: T.sub }}>{stat.label}</p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ════ ADVANTAGES ════════════════════════════════════════════ */}
      {p.advantages.length > 0 && (
        <section style={{ padding: "80px 0", borderTop: `1px solid ${T.border}` }}>
          <div style={W}>
            <SectionHeading title="چرا ما؟" accent={c1} sub={T.sub} center />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 20 }}>
              {p.advantages.map((a, ai) => (
                <FadeIn key={a.id} delay={ai * 0.07}>
                  <div style={{ padding: 24, borderRadius: 18, background: T.surface, border: `1px solid ${T.border}`, textAlign: "center" }}>
                    {a.icon && <div style={{ fontSize: 32, marginBottom: 14 }}>{a.icon}</div>}
                    <h4 style={{ margin: "0 0 8px", fontSize: 15, fontWeight: 700 }}>{a.title}</h4>
                    <p style={{ margin: 0, fontSize: 13, color: T.sub, lineHeight: 1.8 }}>{a.description}</p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ════ TEAM ══════════════════════════════════════════════════ */}
      {p.team.length > 0 && (
        <section style={{ padding: "80px 0", background: T.surface, borderTop: `1px solid ${T.border}` }}>
          <div style={W}>
            <SectionHeading title="تیم ما" accent={c1} sub={T.sub} center />
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap", justifyContent: "center" }}>
              {p.team.map((m, mi) => (
                <FadeIn key={m.id} delay={mi * 0.08}>
                  <div style={{ width: 180, textAlign: "center", padding: 24, borderRadius: 20, background: T.bg, border: `1px solid ${T.border}` }}>
                    {m.avatar
                      ? <img src={m.avatar} alt={m.name} style={{ width: 72, height: 72, borderRadius: "50%", objectFit: "cover", margin: "0 auto 14px", display: "block", border: `3px solid ${c1}50` }} />
                      : <div style={{ width: 72, height: 72, borderRadius: "50%", background: `linear-gradient(135deg, ${c1}, ${c2})`, margin: "0 auto 14px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, color: "#fff", fontWeight: 700 }}>{m.name.charAt(0)}</div>
                    }
                    <p style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700 }}>{m.name}</p>
                    <p style={{ margin: 0, fontSize: 12, color: c1 }}>{m.role}</p>
                    {m.bio && <p style={{ margin: "10px 0 0", fontSize: 11, color: T.sub, lineHeight: 1.7 }}>{m.bio}</p>}
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ════ TESTIMONIALS ══════════════════════════════════════════ */}
      {p.testimonials.length > 0 && (
        <section style={{ padding: "80px 0", borderTop: `1px solid ${T.border}` }}>
          <div style={W}>
            <SectionHeading title="نظر مشتریان" accent={c1} sub={T.sub} center />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
              {p.testimonials.map((t, ti) => (
                <FadeIn key={t.id} delay={ti * 0.06}>
                  <div style={{ padding: 28, borderRadius: 20, background: T.surface, border: `1px solid ${T.border}` }}>
                    {t.rating && (
                      <div style={{ display: "flex", gap: 3, marginBottom: 14 }}>
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} style={{ width: 14, height: 14, color: i < t.rating! ? "#fbbf24" : T.border, fill: i < t.rating! ? "#fbbf24" : "none" }} />
                        ))}
                      </div>
                    )}
                    <p style={{ margin: "0 0 20px", fontSize: 14, color: T.sub, lineHeight: 1.9, fontStyle: "italic" }}>«{t.text}»</p>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      {t.avatar
                        ? <img src={t.avatar} alt={t.name} style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover" }} />
                        : <div style={{ width: 40, height: 40, borderRadius: "50%", background: `linear-gradient(135deg, ${c1}60, ${c2}60)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: "#fff", fontWeight: 700 }}>{t.name.charAt(0)}</div>
                      }
                      <div>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 700 }}>{t.name}</p>
                        {(t.role || t.company) && <p style={{ margin: 0, fontSize: 11, color: c1 }}>{t.role}{t.company ? ` — ${t.company}` : ""}</p>}
                      </div>
                    </div>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ════ FAQ ════════════════════════════════════════════════════ */}
      {p.faqs.length > 0 && (
        <section style={{ padding: "80px 0", background: T.surface, borderTop: `1px solid ${T.border}` }}>
          <div style={{ ...W, maxWidth: 700 }}>
            <SectionHeading title="سوالات متداول" accent={c1} sub={T.sub} center />
            <div>
              {p.faqs.map(faq => (
                <FaqItem key={faq.id} faq={faq} accent={c1} border={T.border} text={T.text} sub={T.sub} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ════ CTA ════════════════════════════════════════════════════ */}
      <section style={{ padding: "100px 0", borderTop: `1px solid ${T.border}` }}>
        <div style={{ ...W, textAlign: "center" }}>
          <FadeIn>
            <div style={{ padding: "56px 40px", borderRadius: 28, background: `linear-gradient(135deg, ${c1}12, ${c2}08)`, border: `1px solid ${c1}30`, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: -80, right: -80, width: 250, height: 250, borderRadius: "50%", background: `${c1}10`, filter: "blur(60px)" }} />
              <div style={{ position: "absolute", bottom: -80, left: -80, width: 200, height: 200, borderRadius: "50%", background: `${c2}10`, filter: "blur(50px)" }} />
              <div style={{ position: "relative" }}>
                <h2 style={{ margin: "0 0 16px", fontSize: 28, fontWeight: 800 }}>{p.ctaTitle || "آماده همکاری هستید؟"}</h2>
                {p.ctaText && <p style={{ margin: "0 0 32px", fontSize: 15, color: T.sub, lineHeight: 1.8, maxWidth: 540, marginRight: "auto", marginLeft: "auto" }}>{p.ctaText}</p>}
                <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
                  {p.contactEmail && (
                    <a href={`mailto:${p.contactEmail}?subject=پروپزال ${p.projectTitle}`}
                      style={{ display: "flex", alignItems: "center", gap: 8, padding: "14px 28px", borderRadius: 14, background: `linear-gradient(135deg, ${c1}, ${c2})`, color: "#fff", fontSize: 14, fontWeight: 700, textDecoration: "none", fontFamily: font, boxShadow: `0 8px 30px ${c1}40` }}>
                      <Mail style={{ width: 16, height: 16 }} />
                      {p.ctaButtonText || "ارتباط با ما"}
                    </a>
                  )}
                  {p.contactPhone && (
                    <a href={`tel:${p.contactPhone}`}
                      style={{ display: "flex", alignItems: "center", gap: 8, padding: "14px 28px", borderRadius: 14, background: T.surface, border: `1px solid ${T.border}`, color: T.text, fontSize: 14, fontWeight: 700, textDecoration: "none", fontFamily: font }}>
                      <Phone style={{ width: 16, height: 16 }} />{p.contactPhone}
                    </a>
                  )}
                </div>
                {p.contactAddress && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "center", marginTop: 24, fontSize: 13, color: T.muted }}>
                    <MapPin style={{ width: 13, height: 13 }} />{p.contactAddress}
                  </div>
                )}
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ════ TERMS / FOOTER ════════════════════════════════════════ */}
      <footer style={{ borderTop: `1px solid ${T.border}`, padding: "28px", textAlign: "center" }}>
        <div style={{ ...W, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <p style={{ margin: 0, fontSize: 12, color: T.muted }}>
            {p.agencyName} © {new Date().getFullYear()}
          </p>
          {p.validUntil && (
            <p style={{ margin: 0, fontSize: 11, color: T.muted }}>
              این پروپزال تا {new Date(p.validUntil).toLocaleDateString("fa-IR")} معتبر است
            </p>
          )}
          {p.terms && <p style={{ margin: 0, fontSize: 11, color: T.muted, flex: "0 0 100%", textAlign: "center", marginTop: 8 }}>{p.terms}</p>}
        </div>
      </footer>

      {/* ── Print styles ── */}
      <style>{`
        @keyframes scrollDot { 0%, 100% { transform: translateY(0); opacity: 1; } 50% { transform: translateY(8px); opacity: 0.4; } }
        @media print {
          nav, button, a[href^="mailto"], a[href^="tel"] { display: none !important; }
          section { page-break-inside: avoid; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>
    </div>
  );
}
