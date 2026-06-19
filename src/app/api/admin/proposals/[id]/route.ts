import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, requireRole, ok, badRequest, unauthorized, notFound, serverError } from "@/lib/auth";

const ALLOWED = [
  "slug", "isPublished", "status",
  "clientName", "clientCompany", "clientEmail", "clientPhone",
  "primaryColor", "secondaryColor", "darkMode",
  "agencyName", "agencyLogo", "coverImage",
  "projectTitle", "projectSubtitle", "projectType",
  "projectSummary", "problemStatement", "ourSolution", "goals",
  "deliverables", "phases", "currency", "packages",
  "portfolioItems", "advantages", "team", "testimonials", "faqs",
  "process", "stats",
  "ctaTitle", "ctaText", "ctaButtonText",
  "contactEmail", "contactPhone", "contactAddress",
  "validUntil", "terms", "notes",
  "seoTitle", "seoDesc", "sectionOrder",
];

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();

    const { id } = await params;
    const proposal = await prisma.proposal.findUnique({ where: { id } });
    if (!proposal) return notFound("پروپزال یافت نشد");

    return ok(proposal);
  } catch (e) {
    return serverError(e);
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const roleErr = requireRole(payload, "admin", "sales_manager");
    if (roleErr) return roleErr;

    const { id } = await params;
    const body = await req.json();

    const data: Record<string, unknown> = {};
    for (const key of ALLOWED) {
      if (key in body) data[key] = body[key];
    }

    if (data.validUntil && typeof data.validUntil === "string") {
      data.validUntil = new Date(data.validUntil);
    }

    if (data.isPublished === true && body.status === "draft") {
      data.status = "sent";
    }

    const proposal = await prisma.proposal.update({ where: { id }, data });
    return ok(proposal);
  } catch (e) {
    return serverError(e);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const roleErr = requireRole(payload, "admin");
    if (roleErr) return roleErr;

    const { id } = await params;
    await prisma.proposal.delete({ where: { id } });
    return ok({ deleted: true });
  } catch (e) {
    return serverError(e);
  }
}
