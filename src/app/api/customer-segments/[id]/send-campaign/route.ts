import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, badRequest, unauthorized, notFound, serverError } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();

    const { id } = await params;
    const body = await req.json();

    const { campaignId, message, subject } = body;
    if (!campaignId || !message?.trim()) {
      return badRequest("campaignId و message الزامی هستند");
    }

    // Validate segment belongs to tenant
    const segment = await prisma.customerSegment.findFirst({
      where: {
        id,
        ...(payload.tenantId ? { tenantId: payload.tenantId } : {}),
      },
    });
    if (!segment) return notFound("سگمنت");

    // Validate campaign belongs to tenant
    const campaign = await prisma.campaign.findFirst({
      where: {
        id: campaignId,
        ...(payload.tenantId ? { tenantId: payload.tenantId } : {}),
      },
    });
    if (!campaign) return notFound("کمپین");

    const clientIds = Array.isArray(segment.clientIds) ? segment.clientIds as string[] : [];
    const count = clientIds.length;

    // Process each client
    for (const clientId of clientIds) {
      if (campaign.channel === "email") {
        // Queue email — log for now, wire up real provider later
        console.log(`[EMAIL] To clientId=${clientId} | Subject: ${subject ?? campaign.title} | Body: ${message}`);
      } else if (campaign.channel === "sms") {
        // Queue SMS — log for now, wire up real provider later
        console.log(`[SMS] To clientId=${clientId} | Message: ${message}`);
      } else {
        console.log(`[CAMPAIGN:${campaign.channel}] To clientId=${clientId} | Message: ${message}`);
      }
    }

    // Update campaign metrics: increment clicks by number of reached clients
    const currentMetrics = (campaign.metrics ?? {}) as Record<string, number>;
    await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        metrics: {
          ...currentMetrics,
          clicks: (currentMetrics.clicks ?? 0) + count,
        },
      },
    });

    return ok({
      sent: count,
      segmentName: segment.name,
      campaignTitle: campaign.title,
    });
  } catch (e) {
    return serverError(e);
  }
}
