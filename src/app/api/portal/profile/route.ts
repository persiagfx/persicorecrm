import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/db";
import { requirePortalAuth } from "@/lib/portal-auth";
import { ok, badRequest, unauthorized, serverError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const payload = requirePortalAuth(req);
    if (!payload) return unauthorized();

    const user = await prisma.portalUser.findUnique({
      where: { id: payload.portalUserId },
      select: { id: true, name: true, email: true, role: true, clientId: true, createdAt: true },
    });
    if (!user) return unauthorized();

    return ok(user);
  } catch (e) {
    return serverError(e);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const payload = requirePortalAuth(req);
    if (!payload) return unauthorized();
    const body = await req.json();

    const updates: Record<string, unknown> = {};
    if (body.name) updates.name = body.name;
    if (body.password) {
      if (!body.currentPassword) return badRequest("رمز عبور فعلی الزامی است");
      const user = await prisma.portalUser.findUnique({ where: { id: payload.portalUserId } });
      const valid = user?.passwordHash ? await bcrypt.compare(body.currentPassword, user.passwordHash) : false;
      if (!valid) return badRequest("رمز عبور فعلی اشتباه است");
      updates.passwordHash = await bcrypt.hash(body.password, 12);
    }

    const updated = await prisma.portalUser.update({
      where: { id: payload.portalUserId },
      data: updates,
      select: { id: true, name: true, email: true, role: true },
    });

    return ok(updated);
  } catch (e) {
    return serverError(e);
  }
}
