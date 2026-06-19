import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, unauthorized, serverError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();

    const tid = payload.tenantId ?? null;
    const since6m = new Date(Date.now() - 180 * 86400000);

    const [orders, equipment, qualityChecks, wasteRecords, maintenanceRecords] = await Promise.all([
      prisma.productionOrder.findMany({
        where: { tenantId: tid },
        select: { id: true, status: true, quantity: true, completedQty: true, rejectedQty: true, productName: true, startDate: true, dueDate: true, completedAt: true, createdAt: true },
      }),
      prisma.equipment.findMany({
        where: { tenantId: tid },
        select: { id: true, name: true, status: true, category: true },
      }),
      prisma.qualityCheck.findMany({
        where: { tenantId: tid, createdAt: { gte: since6m } },
        select: { status: true, defectCount: true, createdAt: true },
      }),
      prisma.wasteRecord.findMany({
        where: { tenantId: tid, date: { gte: since6m } },
        select: { date: true, productName: true, quantity: true, cost: true, reason: true, stage: true },
      }),
      prisma.maintenanceRecord.findMany({
        where: { tenantId: tid, createdAt: { gte: since6m } },
        select: { cost: true, status: true, type: true },
      }),
    ]);

    // Status counts
    const ordersByStatus = {
      planned: orders.filter(o => o.status === "planned").length,
      in_progress: orders.filter(o => o.status === "in_progress").length,
      completed: orders.filter(o => o.status === "completed").length,
      cancelled: orders.filter(o => o.status === "cancelled").length,
    };

    // OEE approximation: quality rate
    const totalQC = qualityChecks.length;
    const passedQC = qualityChecks.filter(q => q.status === "passed").length;
    const qualityRate = totalQC ? Math.round((passedQC / totalQC) * 100) : 0;

    // Availability: equipment operational ratio
    const totalEq = equipment.length;
    const operationalEq = equipment.filter(e => e.status === "operational").length;
    const availability = totalEq ? Math.round((operationalEq / totalEq) * 100) : 0;

    // Performance: completed qty vs planned qty
    const completedOrders = orders.filter(o => o.status === "completed" || o.completedQty > 0);
    const totalPlanned = completedOrders.reduce((s, o) => s + o.quantity, 0);
    const totalProduced = completedOrders.reduce((s, o) => s + o.completedQty, 0);
    const performance = totalPlanned ? Math.round((totalProduced / totalPlanned) * 100) : 0;

    // OEE = Availability × Performance × Quality / 10000
    const oee = Math.round((availability * performance * qualityRate) / 10000);

    // Monthly production output (last 6 months)
    const monthly: Record<string, { produced: number; rejected: number }> = {};
    for (const o of orders.filter(o => o.createdAt >= since6m)) {
      const key = o.createdAt.toISOString().slice(0, 7);
      if (!monthly[key]) monthly[key] = { produced: 0, rejected: 0 };
      monthly[key].produced += o.completedQty;
      monthly[key].rejected += o.rejectedQty;
    }
    const monthlyOutput = Object.entries(monthly)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, v]) => ({ month, ...v }));

    // Waste by type
    const wasteByType: Record<string, { qty: number; cost: number }> = {};
    for (const w of wasteRecords) {
      const t = w.reason ?? w.stage ?? "نامشخص";
      if (!wasteByType[t]) wasteByType[t] = { qty: 0, cost: 0 };
      wasteByType[t].qty += w.quantity;
      wasteByType[t].cost += w.cost;
    }
    const wasteBreakdown = Object.entries(wasteByType).map(([type, v]) => ({ type, ...v })).sort((a, b) => b.cost - a.cost);

    // Equipment breakdown
    const eqByStatus = {
      operational: equipment.filter(e => e.status === "operational").length,
      maintenance: equipment.filter(e => e.status === "maintenance").length,
      broken: equipment.filter(e => e.status === "broken").length,
      retired: equipment.filter(e => e.status === "retired").length,
    };

    // Maintenance cost
    const maintenanceCost = maintenanceRecords.reduce((s, r) => s + r.cost, 0);

    return ok({
      oee, qualityRate, availability, performance,
      totalOrders: orders.length,
      activeOrders: ordersByStatus.in_progress,
      ordersByStatus,
      monthlyOutput,
      wasteBreakdown,
      totalWasteCost: wasteRecords.reduce((s, w) => s + w.cost, 0),
      eqByStatus,
      totalEquipment: totalEq,
      maintenanceCost,
    });
  } catch (e) { return serverError(e); }
}
