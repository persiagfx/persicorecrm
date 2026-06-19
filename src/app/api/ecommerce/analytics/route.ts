import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, unauthorized, serverError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();

    const tid = payload.tenantId ?? null;
    const since30 = new Date(Date.now() - 30 * 86400000);
    const since12m = new Date(Date.now() - 365 * 86400000);

    const [topProducts, recentOrders, allOrders, reviews] = await Promise.all([
      prisma.ecomOrderItem.groupBy({
        by: ["productId", "name"],
        where: { order: { tenantId: tid } },
        _sum: { quantity: true, totalPrice: true },
        orderBy: { _sum: { totalPrice: "desc" } },
        take: 10,
      }),
      prisma.ecomOrder.findMany({
        where: { tenantId: tid, createdAt: { gte: since12m }, status: { not: "cancelled" } },
        select: { id: true, total: true, status: true, createdAt: true },
      }),
      prisma.ecomOrder.aggregate({
        where: { tenantId: tid, status: { not: "cancelled" } },
        _sum: { total: true },
        _count: { id: true },
        _avg: { total: true },
      }),
      prisma.ecomProductReview.aggregate({
        where: { tenantId: tid },
        _avg: { rating: true },
        _count: { id: true },
      }),
    ]);

    // Monthly revenue for last 12 months
    const monthly: Record<string, number> = {};
    for (const o of recentOrders) {
      const key = o.createdAt.toISOString().slice(0, 7);
      monthly[key] = (monthly[key] ?? 0) + o.total;
    }
    const monthlyRevenue = Object.entries(monthly)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, revenue]) => ({ month, revenue }));

    // Orders last 30 days for conversion breakdown
    const ordersLast30 = recentOrders.filter(o => o.createdAt >= since30);
    const delivered = ordersLast30.filter(o => o.status === "delivered").length;
    const conversionRate = ordersLast30.length ? Math.round((delivered / ordersLast30.length) * 100) : 0;

    return ok({
      totalRevenue: allOrders._sum.total ?? 0,
      totalOrders: allOrders._count.id,
      avgOrderValue: Math.round(allOrders._avg.total ?? 0),
      avgRating: reviews._avg.rating ?? 0,
      totalReviews: reviews._count.id,
      conversionRate,
      ordersLast30: ordersLast30.length,
      monthlyRevenue,
      topProducts: topProducts.map(p => ({
        id: p.productId,
        name: p.name,
        unitsSold: p._sum?.quantity ?? 0,
        revenue: p._sum?.totalPrice ?? 0,
      })),
    });
  } catch (e) { return serverError(e); }
}
