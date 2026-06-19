import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, unauthorized, serverError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();

    const tid = payload.tenantId ?? null;
    const since6m = new Date(Date.now() - 180 * 86400000);

    const [shipments, tradeRecords, pricingTiers] = await Promise.all([
      prisma.shipment.findMany({
        where: { tenantId: tid },
        select: { id: true, status: true, cost: true, type: true, weight: true, shippedAt: true, deliveredAt: true, createdAt: true },
      }),
      prisma.tradeRecord.findMany({
        where: { tenantId: tid },
        select: { id: true, type: true, totalValue: true, duties: true, currency: true, clearanceDate: true, status: true, createdAt: true, country: true },
      }),
      prisma.pricingTier.findMany({ where: { tenantId: tid }, select: { id: true, isActive: true } }),
    ]);

    // Shipment stats
    const shipByStatus = {
      preparing: shipments.filter(s => s.status === "preparing").length,
      in_transit: shipments.filter(s => s.status === "in_transit").length,
      delivered: shipments.filter(s => s.status === "delivered").length,
      customs: shipments.filter(s => s.status === "customs").length,
      returned: shipments.filter(s => s.status === "returned").length,
    };
    const totalShipCost = shipments.reduce((sum, s) => sum + s.cost, 0);

    // Trade record stats
    const imports = tradeRecords.filter(r => r.type === "import");
    const exports = tradeRecords.filter(r => r.type === "export");
    const totalImportValue = imports.reduce((s, r) => s + r.totalValue, 0);
    const totalExportValue = exports.reduce((s, r) => s + r.totalValue, 0);
    const totalDuties = tradeRecords.reduce((s, r) => s + r.duties, 0);

    // Top countries by trade volume
    const countrySums: Record<string, number> = {};
    for (const r of tradeRecords) {
      countrySums[r.country] = (countrySums[r.country] ?? 0) + r.totalValue;
    }
    const topCountries = Object.entries(countrySums)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([country, value]) => ({ country, value }));

    // Monthly shipment trend
    const monthly: Record<string, { sent: number; delivered: number }> = {};
    for (const s of shipments.filter(s => s.createdAt >= since6m)) {
      const key = s.createdAt.toISOString().slice(0, 7);
      if (!monthly[key]) monthly[key] = { sent: 0, delivered: 0 };
      monthly[key].sent++;
      if (s.status === "delivered") monthly[key].delivered++;
    }
    const monthlyTrend = Object.entries(monthly).sort(([a], [b]) => a.localeCompare(b)).map(([month, v]) => ({ month, ...v }));

    return ok({
      totalShipments: shipments.length,
      activeShipments: shipByStatus.in_transit + shipByStatus.preparing,
      shipByStatus,
      totalShipCost,
      totalImports: imports.length,
      totalExports: exports.length,
      totalImportValue,
      totalExportValue,
      totalDuties,
      tradeBalance: totalExportValue - totalImportValue,
      topCountries,
      monthlyTrend,
      activePricingTiers: pricingTiers.filter(p => p.isActive).length,
    });
  } catch (e) { return serverError(e); }
}
