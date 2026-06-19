import { NextRequest } from "next/server";
import prisma from "@/lib/db";

import { requireAuth, ok, unauthorized } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const payload = requireAuth(req);
  if (!payload) return unauthorized();
  const tid = payload.tenantId;

  const [totalOrders, pendingOrders, totalProducts, activeDeliveries] = await Promise.all([
    prisma.ecomOrder.count({ where: { tenantId: tid } }),
    prisma.ecomOrder.count({ where: { tenantId: tid, status: "pending" } }),
    prisma.ecomProduct.count({ where: { tenantId: tid } }),
    prisma.ecomDelivery.count({ where: { tenantId: tid, status: { in: ["picked_up", "in_transit", "out_for_delivery"] } } }),
  ]);

  const paidOrders = await prisma.ecomOrder.findMany({ where: { tenantId: tid, paymentStatus: "paid" }, select: { total: true } });
  const totalRevenue = paidOrders.reduce((a, o) => a + o.total, 0);
  const avgOrderValue = paidOrders.length > 0 ? Math.round(totalRevenue / paidOrders.length) : 0;

  const allProducts = await prisma.ecomProduct.findMany({ where: { tenantId: tid }, select: { stock: true, minStock: true } });
  const lowStockProducts = allProducts.filter(p => p.stock <= p.minStock).length;

  const reviews = await prisma.ecomProductReview.findMany({ where: { tenantId: tid }, select: { rating: true } });
  const avgRating = reviews.length > 0 ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length : 0;

  return ok({
    totalOrders, pendingOrders, totalRevenue, avgOrderValue, totalProducts, lowStockProducts,
    avgRating: Math.round(avgRating * 10) / 10, activeDeliveries,
    recentRevenue: [], ordersByStatus: [],
  });
}
