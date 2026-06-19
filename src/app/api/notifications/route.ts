import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, unauthorized, badRequest, serverError } from "@/lib/auth";
import { sendPushToUser } from "@/lib/push-notify";

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();

    const notifications = await prisma.notification.findMany({
      where: { userId: payload.userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const unreadCount = await prisma.notification.count({
      where: { userId: payload.userId, isRead: false },
    });

    return ok({ notifications, unreadCount });
  } catch (e) {
    return serverError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();

    const body = await req.json();
    const { title, message, url, targetUserId } = body as {
      title?: string;
      message?: string;
      url?: string;
      targetUserId?: string;
    };

    if (!title || !message) return badRequest("title و message الزامی هستند");

    // Notify the target user or the current user if no target given
    const recipientId = targetUserId ?? payload.userId;

    const notification = await prisma.notification.create({
      data: {
        userId: recipientId,
        type: "info",
        title,
        body: message,
        entityId: url ?? null,
        isRead: false,
      },
    });

    // Fire push notification in the background — don't await to keep response fast
    sendPushToUser(recipientId, {
      title,
      body: message,
      url: url ?? "/",
    }).catch((err) =>
      console.error("[notifications POST] push delivery error", err)
    );

    return ok(notification);
  } catch (e) {
    return serverError(e);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const body = await req.json();

    if (body._action === "mark_all_read") {
      await prisma.notification.updateMany({
        where: { userId: payload.userId, isRead: false },
        data: { isRead: true },
      });
      return ok({ message: "همه خوانده شد" });
    }

    if (body.id) {
      await prisma.notification.update({
        where: { id: body.id },
        data: { isRead: true },
      });
      return ok({ message: "خوانده شد" });
    }

    return ok({ message: "ok" });
  } catch (e) {
    return serverError(e);
  }
}
