import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, tenantFilter, ok, unauthorized, serverError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();

    const items = await prisma.inventoryItem.findMany({
      where: { ...tenantFilter(payload), isActive: true },
      include: { category: { select: { name: true } }, supplier: { select: { name: true } } },
      orderBy: { name: "asc" },
    });

    const rows = items.map(item => ({
      id: item.id,
      name: item.name,
      sku: item.sku,
      category: item.category?.name ?? "—",
      supplier: item.supplier?.name ?? "—",
      currentStock: item.currentStock,
      unit: item.unit,
      costPrice: item.costPrice,
      sellPrice: item.sellPrice,
      totalCostValue: item.currentStock * item.costPrice,
      totalSellValue: item.currentStock * item.sellPrice,
      profitPotential: item.currentStock * (item.sellPrice - item.costPrice),
    }));

    const totalCost = rows.reduce((s, r) => s + r.totalCostValue, 0);
    const totalSell = rows.reduce((s, r) => s + r.totalSellValue, 0);

    return ok({ rows, totalCost, totalSell, totalProfit: totalSell - totalCost, itemCount: rows.length });
  } catch (e) { return serverError(e); }
}
