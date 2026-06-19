import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, created, badRequest, unauthorized, serverError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") ?? undefined;
    const campaignId = searchParams.get("campaignId") ?? undefined;
    const channel = searchParams.get("channel") ?? undefined;
    const archived = searchParams.get("archived") === "true";

    const pieces = await prisma.contentPiece.findMany({
      where: {
        campaign: { tenantId: payload.tenantId ?? undefined },
        ...(status ? { status } : {}),
        ...(campaignId ? { campaignId } : {}),
        ...(channel ? { channel } : {}),
        ...(archived ? { archivedAt: { not: null } } : { archivedAt: null }),
      },
      include: { campaign: { select: { id: true, title: true } } },
      orderBy: { createdAt: "desc" },
    });
    return ok(pieces);
  } catch (e) { return serverError(e); }
}

export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const body = await req.json();
    if (!body.title) return badRequest("عنوان الزامی است");

    const piece = await prisma.contentPiece.create({
      data: {
        title: body.title,
        type: body.type ?? "blog",
        channel: body.channel ?? "other",
        status: body.status ?? "idea",
        scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : undefined,
        assigneeId: body.assigneeId ?? payload.userId,
        campaignId: body.campaignId,
        url: body.url,
        notes: body.notes,
        body: body.body,
      },
    });
    return created(piece);
  } catch (e) { return serverError(e); }
}
