import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requirePortalAuth } from "@/lib/portal-auth";
import { ok, created, badRequest, unauthorized, serverError } from "@/lib/auth";
import { sendEventToClientConversation } from "@/app/api/portal/stream/route";
import { sendEventToAll } from "@/lib/sse";

export async function GET(req: NextRequest) {
  try {
    const payload = requirePortalAuth(req);
    if (!payload) return unauthorized();

    const messages = await prisma.portalMessage.findMany({
      where: { clientId: payload.clientId },
      orderBy: { createdAt: "asc" },
      take: 100,
    });

    // Mark team messages as read
    await prisma.portalMessage.updateMany({
      where: { clientId: payload.clientId, authorType: "team", isRead: false },
      data: { isRead: true },
    });

    return ok(messages);
  } catch (e) {
    return serverError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = requirePortalAuth(req);
    if (!payload) return unauthorized();
    const body = await req.json();
    if (!body.content) return badRequest("محتوا الزامی است");

    const user = await prisma.portalUser.findUnique({ where: { id: payload.portalUserId } });

    const message = await prisma.portalMessage.create({
      data: {
        clientId: payload.clientId,
        portalUserId: payload.portalUserId,
        authorType: "client",
        authorName: user?.name ?? "مشتری",
        content: body.content,
      },
    });

    // Notify portal users in same client conversation (other tabs / devices)
    sendEventToClientConversation(payload.clientId, { type: "portal.message.new", data: message });
    // Notify CRM team so they see it in real-time
    sendEventToAll({ type: "portal.message.new", data: { clientId: payload.clientId, message } });

    return created(message);
  } catch (e) {
    return serverError(e);
  }
}
