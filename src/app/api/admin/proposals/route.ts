import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, requireRole, ok, created, badRequest, unauthorized, serverError } from "@/lib/auth";

function makeSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9؀-ۿ-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const roleErr = requireRole(payload, "admin", "sales_manager");
    if (roleErr) return roleErr;

    const proposals = await prisma.proposal.findMany({
      select: {
        id: true, slug: true, status: true, isPublished: true,
        clientName: true, clientCompany: true,
        projectTitle: true, projectType: true,
        primaryColor: true, secondaryColor: true,
        views: true, viewedAt: true,
        validUntil: true, createdAt: true, updatedAt: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    return ok(proposals);
  } catch (e) {
    return serverError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const roleErr = requireRole(payload, "admin", "sales_manager");
    if (roleErr) return roleErr;

    const body = await req.json();
    if (!body.clientName) return badRequest("نام مشتری الزامی است");
    if (!body.projectTitle) return badRequest("عنوان پروژه الزامی است");

    const baseSlug = makeSlug(body.projectTitle) || makeSlug(body.clientName) || `proposal-${Date.now()}`;
    let slug = baseSlug;
    let i = 1;
    while (await prisma.proposal.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${i++}`;
    }

    const proposal = await prisma.proposal.create({
      data: {
        slug,
        clientName: body.clientName,
        clientCompany: body.clientCompany ?? null,
        clientEmail: body.clientEmail ?? null,
        projectTitle: body.projectTitle,
        projectSubtitle: body.projectSubtitle ?? null,
        projectType: body.projectType ?? "website",
        primaryColor: body.primaryColor ?? "#8B5CF6",
        secondaryColor: body.secondaryColor ?? "#EC4899",
        agencyName: body.agencyName ?? "Persicore",
        status: "draft",
      },
    });

    return created(proposal);
  } catch (e) {
    return serverError(e);
  }
}
