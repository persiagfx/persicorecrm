import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, unauthorized, serverError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true, name: true, email: true, phone: true,
        avatar: true, role: true, color: true,
        walletBalance: true, joinedAt: true, isActive: true,
        tenantId: true,
      },
    });
    if (!user) return unauthorized();

    // Fetch tenant separately — safe, works before and after prisma generate
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let tenant: any = null;
    try {
      if (user.tenantId) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        tenant = await (prisma as any).tenant.findUnique({
          where: { id: user.tenantId },
          select: {
            id: true, name: true, slug: true, plan: true,
            status: true, trialEndsAt: true, maxUsers: true, maxClients: true,
            industryType: true,
          },
        });
      }
    } catch {
      // tenant table not yet accessible
    }

    return ok({ ...user, tenant });
  } catch (e) {
    return serverError(e);
  }
}
