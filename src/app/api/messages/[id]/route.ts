import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, tenantFilter, ok, unauthorized, notFound, serverError } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { id } = await params;

    const conv = await prisma.teamConversation.findFirst({
      where: { id, participantIds: { string_contains: payload.userId } },
    });
    if (!conv) return notFound("مکالمه");

    const messages = await prisma.teamMessage.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: "asc" },
      take: 100,
    });

    return ok({ conversation: conv, messages });
  } catch (e) {
    return serverError(e);
  }
}
