import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requirePortalAuth } from "@/lib/portal-auth";
import { ok, unauthorized, serverError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const payload = requirePortalAuth(req);
    if (!payload) return unauthorized();

    const user = await prisma.portalUser.findUnique({
      where: { id: payload.portalUserId },
      include: { client: { select: { id: true, companyName: true, contactName: true, avatar: true } } },
    });
    if (!user || !user.isActive) return unauthorized();

    return ok({
      id: user.id,
      name: user.name,
      phone: user.phone,
      role: user.role,
      clientId: user.clientId,
      client: user.client,
    });
  } catch (e) {
    return serverError(e);
  }
}
