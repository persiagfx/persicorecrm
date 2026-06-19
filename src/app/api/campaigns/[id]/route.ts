import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, tenantFilter, ok, unauthorized, notFound, serverError } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { id } = await params;
    const campaign = await prisma.campaign.findFirst({ where: { id, ...(payload.tenantId ? { tenantId: payload.tenantId } : {}) },
      include: { contentPieces: { orderBy: { createdAt: "desc" } } },
    });
    if (!campaign) return notFound("کمپین");
    return ok(campaign);
  } catch (e) {
    return serverError(e);
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { id } = await params;
    const body = await req.json();
    const campaign = await prisma.campaign.update({
      where: { id },
      data: {
        title: body.title, channel: body.channel, status: body.status,
        budget: body.budget, endDate: body.endDate ? new Date(body.endDate) : undefined,
        metrics: body.metrics, targetAudience: body.targetAudience,
        description: body.description, progressNotes: body.progressNotes,
      },
    });
    return ok(campaign);
  } catch (e) {
    return serverError(e);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { id } = await params;
    await prisma.campaign.delete({ where: { id } });
    return ok({ message: "کمپین حذف شد" });
  } catch (e) {
    return serverError(e);
  }
}
