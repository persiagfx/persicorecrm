import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, tenantFilter, ok, created, badRequest, unauthorized, serverError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") ?? undefined;
    const channel = searchParams.get("channel") ?? undefined;

    const campaigns = await prisma.campaign.findMany({
      where: {
        ...tenantFilter(payload),
        ...(status ? { status } : {}),
        ...(channel ? { channel } : {}),
      },
      include: { contentPieces: { orderBy: { createdAt: "desc" }, take: 5 } },
      orderBy: { createdAt: "desc" },
    });

    return ok(campaigns);
  } catch (e) {
    return serverError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const body = await req.json();
    if (!body.title || !body.startDate) return badRequest("عنوان و تاریخ شروع الزامی است");

    const campaign = await prisma.campaign.create({
      data: {
        title: body.title,
        channel: body.channel ?? "other",
        status: "draft",
        budget: body.budget ?? 0,
        startDate: new Date(body.startDate),
        endDate: body.endDate ? new Date(body.endDate) : undefined,
        targetAudience: body.targetAudience,
        description: body.description,
        targetROI: body.targetROI,
        targetConversions: body.targetConversions,
        createdById: payload.userId,
        tenantId: payload.tenantId ?? null,
      },
    });

    return created(campaign);
  } catch (e) {
    return serverError(e);
  }
}
