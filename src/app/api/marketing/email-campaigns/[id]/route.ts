import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, tenantFilter, ok, unauthorized, notFound, serverError } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { id } = await params;

    const campaign = await prisma.emailCampaign.findFirst({ where: { id, ...(payload.tenantId ? { tenantId: payload.tenantId } : {}) },
      include: { createdBy: { select: { id: true, name: true } } },
    });

    if (!campaign) return notFound("کمپین یافت نشد");
    return ok(campaign);
  } catch (e) { return serverError(e); }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { id } = await params;
    const body = await req.json();

    const updateData: Record<string, unknown> = {
      title: body.title ?? undefined,
      subject: body.subject ?? undefined,
      preheader: body.preheader ?? body.previewText ?? undefined,
      content: body.content ?? body.htmlContent ?? undefined,
      scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : undefined,
      status: body.status ?? undefined,
      recipients: body.recipients ?? undefined,
      stats: body.stats ?? undefined,
    };

    if (body.status === "sent") {
      updateData.sentAt = new Date();
    }

    const campaign = await prisma.emailCampaign.update({ where: { id }, data: updateData });
    return ok(campaign);
  } catch (e) { return serverError(e); }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { id } = await params;

    await prisma.emailCampaign.delete({ where: { id } });
    return ok({ deleted: true });
  } catch (e) { return serverError(e); }
}
