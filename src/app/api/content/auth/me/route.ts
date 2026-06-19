import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { ok, unauthorized, serverError, verifyToken, getTokenFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req);
    if (!token) return unauthorized();
    const payload = verifyToken(token);
    if (!payload) return unauthorized();

    // CRM user accessing content
    if (!payload.isContentUser) {
      const crmUser = await prisma.user.findUnique({ where: { id: payload.userId } });
      if (!crmUser) return unauthorized();
      return ok({
        id: crmUser.id,
        name: crmUser.name,
        email: crmUser.email,
        phone: crmUser.phone,
        plan: "UNLIMITED",
        usedThisMonth: 0,
        isCrmUser: true,
      });
    }

    const user = await prisma.contentUser.findUnique({ where: { id: payload.userId } });
    if (!user || !user.isActive) return unauthorized();

    // Reset monthly usage if needed
    const now = new Date();
    const resetAt = new Date(user.monthResetAt);
    let used = user.usedThisMonth;
    if (now.getMonth() !== resetAt.getMonth() || now.getFullYear() !== resetAt.getFullYear()) {
      await prisma.contentUser.update({
        where: { id: user.id },
        data: { usedThisMonth: 0, monthResetAt: now },
      });
      used = 0;
    }

    return ok({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      plan: user.plan,
      usedThisMonth: used,
      isCrmUser: false,
    });
  } catch (e) {
    return serverError(e);
  }
}
