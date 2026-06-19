import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requirePortalAuth } from "@/lib/portal-auth";
import { ok, unauthorized, notFound, badRequest, serverError } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requirePortalAuth(req);
    if (!payload) return unauthorized();
    const { id } = await params;

    const ticket = await prisma.portalTicket.findFirst({
      where: { id, clientId: payload.clientId },
      include: { replies: { orderBy: { createdAt: "asc" } } },
    });
    if (!ticket) return notFound("تیکت");

    // Mark team replies as read
    await prisma.portalTicketReply.updateMany({
      where: { ticketId: id, authorType: "team", isRead: false },
      data: { isRead: true },
    });

    return ok(ticket);
  } catch (e) {
    return serverError(e);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requirePortalAuth(req);
    if (!payload) return unauthorized();
    const { id } = await params;
    const body = await req.json();

    const score = Number(body.satisfactionScore);
    if (!score || score < 1 || score > 5) return badRequest("امتیاز باید بین ۱ تا ۵ باشد");

    const ticket = await prisma.portalTicket.findFirst({ where: { id, clientId: payload.clientId } });
    if (!ticket) return notFound("تیکت");

    const updated = await prisma.portalTicket.update({
      where: { id },
      data: { satisfactionScore: score },
    });

    return ok(updated);
  } catch (e) {
    return serverError(e);
  }
}
