import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requirePortalAuth } from "@/lib/portal-auth";
import { ok, created, badRequest, unauthorized, notFound, serverError } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requirePortalAuth(req);
    if (!payload) return unauthorized();
    const { id: ticketId } = await params;
    const body = await req.json();
    if (!body.content) return badRequest("محتوا الزامی است");

    const ticket = await prisma.portalTicket.findFirst({ where: { id: ticketId, clientId: payload.clientId } });
    if (!ticket) return notFound("تیکت");

    const user = await prisma.portalUser.findUnique({ where: { id: payload.portalUserId } });

    const reply = await prisma.portalTicketReply.create({
      data: {
        ticketId,
        authorId: payload.portalUserId,
        authorType: "client",
        authorName: user?.name ?? "مشتری",
        content: body.content,
      },
    });

    if (ticket.status === "closed") {
      await prisma.portalTicket.update({ where: { id: ticketId }, data: { status: "open" } });
    }

    return created(reply);
  } catch (e) {
    return serverError(e);
  }
}
