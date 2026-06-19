import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { ok, unauthorized, serverError, verifyToken, getTokenFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req);
    const payload = token ? verifyToken(token) : null;
    if (!payload?.isSuperAdmin) return unauthorized();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const [totalUsers, totalGenerations, todayGenerations, monthGenerations, byPlan, revenue] =
      await Promise.all([
        prisma.contentUser.count(),
        prisma.contentGeneration.count(),
        prisma.contentGeneration.count({ where: { createdAt: { gte: today } } }),
        prisma.contentGeneration.count({ where: { createdAt: { gte: monthStart } } }),
        prisma.contentUser.groupBy({ by: ["plan"], _count: { id: true } }),
        prisma.contentSubscription.aggregate({
          where: { status: "active" },
          _sum: { amount: true },
        }),
      ]);

    return ok({
      totalUsers,
      totalGenerations,
      todayGenerations,
      monthGenerations,
      byPlan,
      totalRevenue: revenue._sum.amount ?? 0,
    });
  } catch (e) {
    return serverError(e);
  }
}
