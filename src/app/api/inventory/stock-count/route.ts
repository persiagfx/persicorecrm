import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, tenantFilter, ok, created, badRequest, unauthorized, serverError } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const counts = await prisma.stockCount.findMany({
      where: tenantFilter(payload),
      orderBy: { date: "desc" },
    });
    return ok(counts);
  } catch (e) { return serverError(e); }
}

export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const body = await req.json();
    if (!body.name?.trim()) return badRequest("نام شمارش الزامی است");

    const inventoryItems = await prisma.inventoryItem.findMany({
      where: { ...tenantFilter(payload), isActive: true },
      select: { id: true, name: true, sku: true, unit: true, currentStock: true, costPrice: true },
    });

    const items = inventoryItems.map(item => ({
      itemId: item.id,
      name: item.name,
      sku: item.sku ?? "",
      unit: item.unit,
      systemQty: item.currentStock,
      countedQty: null as number | null,
      costPrice: item.costPrice,
      difference: null as number | null,
    }));

    const count = await prisma.stockCount.create({
      data: {
        tenantId: payload.tenantId ?? null,
        name: body.name.trim(),
        date: body.date ? new Date(body.date) : new Date(),
        status: "draft",
        items,
        notes: body.notes ?? null,
        conductedBy: body.conductedBy ?? null,
      },
    });
    return created(count);
  } catch (e) { return serverError(e); }
}
