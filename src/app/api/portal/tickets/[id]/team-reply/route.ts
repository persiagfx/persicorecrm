import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, badRequest, unauthorized, notFound, serverError } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();

    const { id: ticketId } = await params;
    const body = await req.json();
    if (!body.content?.trim()) return badRequest("محتوا الزامی است");

    const ticket = await prisma.portalTicket.findUnique({ where: { id: ticketId } });
    if (!ticket) return notFound("تیکت");

    const user = await prisma.user.findUnique({ where: { id: payload.userId }, select: { name: true } });

    const reply = await prisma.portalTicketReply.create({
      data: {
        ticketId,
        authorId: payload.userId,
        authorType: "team",
        authorName: user?.name ?? "تیم پشتیبانی",
        content: body.content.trim(),
      },
    });

    if (ticket.status === "closed") {
      await prisma.portalTicket.update({ where: { id: ticketId }, data: { status: "in_progress" } });
    }

    return ok(reply);
  } catch (e) {
    return serverError(e);
  }
}
