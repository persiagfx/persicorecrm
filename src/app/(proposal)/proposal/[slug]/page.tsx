import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { ProposalData } from "@/components/proposal/ProposalTypes";
import { ProposalPublicView } from "./ProposalPublicView";

interface Props {
  params: Promise<{ slug: string }>;
}

async function getData(slug: string): Promise<ProposalData | null> {
  const { prisma } = await import("@/lib/db");
  const row = await prisma.proposal.findUnique({ where: { slug, isPublished: true } });
  if (!row) return null;

  prisma.proposal.update({
    where: { id: row.id },
    data: { views: { increment: 1 }, viewedAt: new Date(), status: row.status === "sent" ? "viewed" : row.status },
  }).catch((err) => console.error(err));

  return {
    ...row,
    clientCompany: row.clientCompany ?? null,
    clientEmail: row.clientEmail ?? null,
    clientPhone: row.clientPhone ?? null,
    agencyLogo: row.agencyLogo ?? null,
    coverImage: row.coverImage ?? null,
    projectSubtitle: row.projectSubtitle ?? null,
    projectSummary: row.projectSummary ?? null,
    problemStatement: row.problemStatement ?? null,
    ourSolution: row.ourSolution ?? null,
    ctaTitle: row.ctaTitle ?? null,
    ctaText: row.ctaText ?? null,
    ctaButtonText: row.ctaButtonText ?? null,
    contactEmail: row.contactEmail ?? null,
    contactPhone: row.contactPhone ?? null,
    contactAddress: row.contactAddress ?? null,
    validUntil: row.validUntil?.toISOString() ?? null,
    terms: row.terms ?? null,
    notes: row.notes ?? null,
    seoTitle: row.seoTitle ?? null,
    seoDesc: row.seoDesc ?? null,
    status: row.status as ProposalData["status"],
    projectType: row.projectType as ProposalData["projectType"],
    goals: (row.goals as any) ?? [],
    deliverables: (row.deliverables as any) ?? [],
    phases: (row.phases as any) ?? [],
    packages: (row.packages as any) ?? [],
    portfolioItems: (row.portfolioItems as any) ?? [],
    advantages: (row.advantages as any) ?? [],
    team: (row.team as any) ?? [],
    testimonials: (row.testimonials as any) ?? [],
    faqs: (row.faqs as any) ?? [],
    process: (row.process as any) ?? [],
    stats: (row.stats as any) ?? [],
    sectionOrder: (row.sectionOrder as any) ?? [],
    viewedAt: row.viewedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  } as ProposalData;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  if (slug === "demo") {
    return { title: "پروپزال نمونه | Persicore", description: "نمونه پروپزال طراحی سایت", robots: { index: false, follow: false } };
  }
  const { prisma } = await import("@/lib/db");
  const row = await prisma.proposal.findUnique({ where: { slug, isPublished: true }, select: { projectTitle: true, clientName: true, seoTitle: true, seoDesc: true } });
  if (!row) return { title: "پروپزال یافت نشد" };

  const title = row.seoTitle || `پروپزال ${row.projectTitle} — ${row.clientName}`;
  return {
    title,
    description: row.seoDesc || title,
    robots: { index: false, follow: false },
  };
}

export default async function ProposalPage({ params }: Props) {
  const { slug } = await params;
  const data = await getData(slug);
  if (!data) notFound();

  return <ProposalPublicView proposal={data} />;
}
