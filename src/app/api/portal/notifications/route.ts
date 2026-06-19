import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requirePortalAuth } from "@/lib/portal-auth";
import { ok, unauthorized, serverError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const payload = requirePortalAuth(req);
    if (!payload) return unauthorized();

    const notifications = await prisma.portalNotification.findMany({
      where: { portalUserId: payload.portalUserId },
      orderBy: { createdAt: "desc" },
      take: 30,
    });

    return ok(notifications);
  } catch (e) {
    return serverError(e);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const payload = requirePortalAuth(req);
    if (!payload) return unauthorized();
    const body = await req.json();

    if (body.markAllRead) {
      await prisma.portalNotification.updateMany({
        where: { portalUserId: payload.portalUserId, isRead: false },
        data: { isRead: true },
      });
    } else if (body.id) {
      await prisma.portalNotification.updateMany({
        where: { id: body.id, portalUserId: payload.portalUserId },
        data: { isRead: true },
      });
    }

    return ok({ updated: true });
  } catch (e) {
    return serverError(e);
  }
}
