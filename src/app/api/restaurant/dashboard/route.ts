import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, unauthorized, serverError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();

    const tid = payload.tenantId ?? null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [todayOrders, allTables, pendingReservations, topItems] = await Promise.all([
      prisma.restOrder.findMany({
        where: { tenantId: tid, createdAt: { gte: today, lt: tomorrow } },
        select: { id: true, total: true, status: true, type: true, createdAt: true },
      }),
      prisma.restTable.findMany({
        where: { tenantId: tid },
        select: { id: true, status: true, capacity: true },
      }),
      prisma.restReservation.findMany({
        where: { tenantId: tid, date: { gte: today, lt: tomorrow }, status: "confirmed" },
        select: { id: true, guestName: true, guestCount: true, date: true },
        orderBy: { date: "asc" },
        take: 10,
      }),
      prisma.restOrderItem.groupBy({
        by: ["name"],
        where: { order: { tenantId: tid, createdAt: { gte: new Date(Date.now() - 30 * 86400000) } } },
        _sum: { quantity: true, totalPrice: true },
        orderBy: { _sum: { totalPrice: "desc" } },
        take: 5,
      }),
    ]);

    const todayRevenue = todayOrders.filter(o => o.status === "paid").reduce((s, o) => s + o.total, 0);
    const pendingOrders = todayOrders.filter(o => ["new", "preparing"].includes(o.status)).length;
    const occupiedTables = allTables.filter(t => t.status === "occupied").length;

    return ok({
      todayRevenue,
      todayOrderCount: todayOrders.length,
      pendingOrders,
      totalTables: allTables.length,
      occupiedTables,
      todayReservations: pendingReservations.length,
      pendingReservations,
      topItems: topItems.map(i => ({ name: i.name, qty: i._sum.quantity ?? 0, revenue: i._sum.totalPrice ?? 0 })),
      ordersByStatus: [
        { label: "جدید", count: todayOrders.filter(o => o.status === "new").length, color: "blue" },
        { label: "در حال آماده‌سازی", count: todayOrders.filter(o => o.status === "preparing").length, color: "amber" },
        { label: "آماده", count: todayOrders.filter(o => o.status === "ready").length, color: "emerald" },
        { label: "پرداخت‌شده", count: todayOrders.filter(o => o.status === "paid").length, color: "violet" },
      ],
    });
  } catch (e) { return serverError(e); }
}
