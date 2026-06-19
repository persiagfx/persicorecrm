import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ResumePublicView } from "./ResumePublicView";
import type { ResumeData } from "@/components/resume/ResumeTypes";

interface Props {
  params: Promise<{ slug: string }>;
}

async function getResume(slug: string): Promise<ResumeData | null> {
  const { prisma } = await import("@/lib/db");
  const row = await prisma.resume.findUnique({ where: { slug, isPublished: true } });
  if (!row) return null;

  prisma.resume.update({ where: { id: row.id }, data: { views: { increment: 1 } } }).catch((err) => console.error(err));

  return {
    id: row.id,
    slug: row.slug,
    isPublished: row.isPublished,
    theme: row.theme,
    accentColor: row.accentColor,
    lang: row.lang,
    fullName: row.fullName,
    fullNameFa: row.fullNameFa,
    title: row.title,
    titleFa: row.titleFa,
    bio: row.bio,
    bioFa: row.bioFa,
    avatar: row.avatar,
    coverImage: row.coverImage,
    location: row.location,
    locationFa: row.locationFa,
    email: row.email,
    phone: row.phone,
    website: row.website,
    linkedin: row.linkedin,
    github: row.github,
    twitter: row.twitter,
    instagram: row.instagram,
    behance: row.behance,
    dribbble: row.dribbble,
    telegram: row.telegram,
    youtube: row.youtube,
    experience: (row.experience as any) ?? [],
    education: (row.education as any) ?? [],
    skills: (row.skills as any) ?? [],
    projects: (row.projects as any) ?? [],
    certifications: (row.certifications as any) ?? [],
    awards: (row.awards as any) ?? [],
    publications: (row.publications as any) ?? [],
    languages: (row.languages as any) ?? [],
    volunteering: (row.volunteering as any) ?? [],
    references: (row.references as any) ?? [],
    customSections: (row.customSections as any) ?? [],
    sectionOrder: (row.sectionOrder as any) ?? [],
    seoTitle: row.seoTitle,
    seoDesc: row.seoDesc,
    ogImage: row.ogImage,
    views: row.views,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { prisma } = await import("@/lib/db");
  const resume = await prisma.resume.findUnique({
    where: { slug, isPublished: true },
    select: { fullName: true, title: true, seoTitle: true, seoDesc: true, ogImage: true, avatar: true },
  });

  if (!resume) return { title: "Resume Not Found" };

  const title = resume.seoTitle || `${resume.fullName} — ${resume.title}`;
  const description = resume.seoDesc || `رزومه حرفه‌ای ${resume.fullName}`;
  const image = resume.ogImage || resume.avatar;

  return {
    title,
    description,
    openGraph: { title, description, type: "profile", ...(image ? { images: [{ url: image }] } : {}) },
    twitter: { card: "summary_large_image", title, description, ...(image ? { images: [image] } : {}) },
    alternates: { canonical: `https://resume.persicore.ir/${slug}` },
    robots: { index: true, follow: true },
  };
}

export default async function ResumePage({ params }: Props) {
  const { slug } = await params;
  const resume = await getResume(slug);
  if (!resume) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: resume.fullName,
    jobTitle: resume.title,
    ...(resume.email ? { email: resume.email } : {}),
    ...(resume.website ? { url: resume.website } : {}),
    ...(resume.location ? { address: { "@type": "PostalAddress", addressLocality: resume.location } } : {}),
    ...(resume.linkedin ? { sameAs: [resume.linkedin] } : {}),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ResumePublicView resume={resume} />
    </>
  );
}
