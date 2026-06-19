import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import {
  requireAuth,
  ok,
  unauthorized,
  badRequest,
  serverError,
} from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();

    const body = await req.json();
    const { endpoint, p256dh, auth } = body as {
      endpoint?: string;
      p256dh?: string;
      auth?: string;
    };

    if (!endpoint || !p256dh || !auth) {
      return badRequest("endpoint، p256dh و auth الزامی هستند");
    }

    // findFirst + create/update because endpoint is @db.Text (no unique index)
    const existing = await prisma.pushSubscription.findFirst({
      where: { endpoint },
    });

    const subscription = existing
      ? await prisma.pushSubscription.update({
          where: { id: existing.id },
          data: { p256dh, auth, userId: payload.userId },
        })
      : await prisma.pushSubscription.create({
          data: { userId: payload.userId, endpoint, p256dh, auth },
        });

    return ok(subscription);
  } catch (e) {
    return serverError(e);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();

    const body = await req.json();
    const { endpoint } = body as { endpoint?: string };

    if (!endpoint) return badRequest("endpoint الزامی است");

    await prisma.pushSubscription.deleteMany({
      where: { endpoint, userId: payload.userId },
    });

    return ok({ message: "اشتراک حذف شد" });
  } catch (e) {
    return serverError(e);
  }
}
