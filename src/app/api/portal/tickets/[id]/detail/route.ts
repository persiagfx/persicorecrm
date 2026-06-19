import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requirePortalAuth } from "@/lib/portal-auth";
import { ok, unauthorized, notFound, serverError } from "@/lib/auth";

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

    return ok(ticket);
  } catch (e) {
    return serverError(e);
  }
}
