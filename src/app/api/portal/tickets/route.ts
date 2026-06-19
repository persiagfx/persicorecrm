import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requirePortalAuth } from "@/lib/portal-auth";
import { ok, created, badRequest, unauthorized, serverError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const payload = requirePortalAuth(req);
    if (!payload) return unauthorized();

    const tickets = await prisma.portalTicket.findMany({
      where: { clientId: payload.clientId },
      include: { replies: { orderBy: { createdAt: "desc" }, take: 1 } },
      orderBy: { createdAt: "desc" },
    });

    return ok(tickets);
  } catch (e) {
    return serverError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = requirePortalAuth(req);
    if (!payload) return unauthorized();

    const body = await req.json();
    if (!body.title || !body.description) return badRequest("عنوان و توضیحات الزامی است");

    const ticket = await prisma.portalTicket.create({
      data: {
        clientId: payload.clientId,
        portalUserId: payload.portalUserId,
        title: body.title,
        description: body.description,
        priority: body.priority ?? "medium",
        category: body.category ?? "general",
      },
    });

    return created(ticket);
  } catch (e) {
    return serverError(e);
  }
}
