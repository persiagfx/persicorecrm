import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, tenantFilter, ok, created, badRequest, unauthorized, serverError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();

    const links = await prisma.uTMLink.findMany({
      where: {
        ...tenantFilter(payload),
      },
      include: {
        createdBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return ok(links);
  } catch (e) { return serverError(e); }
}

export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const body = await req.json();

    if (!body.title?.trim() || !body.baseUrl?.trim() || !body.source?.trim() || !body.medium?.trim()) {
      return badRequest("عنوان، URL پایه، source و medium الزامی است");
    }

    const link = await prisma.uTMLink.create({
      data: {
        title: body.title.trim(),
        baseUrl: body.baseUrl.trim(),
        source: body.source.trim(),
        medium: body.medium.trim(),
        campaignName: body.campaign ?? body.campaignName ?? "",
        content: body.content ?? null,
        term: body.term ?? null,
        campaignId: body.campaignId ?? null,
        tenantId: payload.tenantId ?? null,
        createdById: payload.userId,
      },
    });

    return created(link);
  } catch (e) { return serverError(e); }
}
