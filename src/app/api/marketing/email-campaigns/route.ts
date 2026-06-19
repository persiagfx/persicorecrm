import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, tenantFilter, ok, created, badRequest, unauthorized, serverError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") ?? undefined;

    const campaigns = await prisma.emailCampaign.findMany({
      where: { ...tenantFilter(payload), ...(status ? { status } : {}) },
      include: {
        createdBy: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return ok(campaigns);
  } catch (e) { return serverError(e); }
}

export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const body = await req.json();
    if (!body.title?.trim() || !body.subject?.trim()) {
      return badRequest("عنوان و موضوع کمپین الزامی است");
    }

    const campaign = await prisma.emailCampaign.create({
      data: {
        title: body.title.trim(),
        subject: body.subject.trim(),
        preheader: body.preheader ?? body.previewText ?? null,
        content: body.content ?? body.htmlContent ?? body.textContent ?? "",
        scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
        status: "draft",
        createdById: payload.userId,
        tenantId: payload.tenantId ?? null,
      },
    });

    return created(campaign);
  } catch (e) { return serverError(e); }
}
