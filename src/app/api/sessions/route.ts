import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, unauthorized, serverError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();

    const sessions = await prisma.userSession.findMany({
      where: {
        userId: payload.userId,
        expiresAt: { gt: new Date() },
      },
      orderBy: { lastActiveAt: "desc" },
      select: {
        id: true,
        deviceInfo: true,
        ipAddress: true,
        userAgent: true,
        lastActiveAt: true,
        createdAt: true,
        expiresAt: true,
        token: true,
      },
    });

    // Mark current session
    const currentToken = req.headers.get("x-session-token") ??
      req.headers.get("authorization")?.replace("Bearer ", "") ??
      req.cookies.get("auth_token")?.value ?? null;

    const result = sessions.map((s) => ({
      ...s,
      token: undefined,
      isCurrent: s.token === currentToken,
    }));

    return ok(result);
  } catch (e) {
    return serverError(e);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();

    const body = await req.json().catch(() => ({}));

    if (body.all) {
      const currentToken = req.headers.get("x-session-token") ??
        req.headers.get("authorization")?.replace("Bearer ", "") ??
        req.cookies.get("auth_token")?.value ?? null;

      await prisma.userSession.deleteMany({
        where: {
          userId: payload.userId,
          ...(currentToken ? { token: { not: currentToken } } : {}),
        },
      });

      return ok({ revoked: true });
    }

    return ok({ revoked: false });
  } catch (e) {
    return serverError(e);
  }
}
