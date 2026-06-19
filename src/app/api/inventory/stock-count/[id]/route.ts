import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, notFound, unauthorized, serverError } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { id } = await params;
    const count = await prisma.stockCount.findUnique({ where: { id } });
    if (!count) return notFound();
    return ok(count);
  } catch (e) { return serverError(e); }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { id } = await params;
    const body = await req.json();

    const items = body.items?.map((item: { systemQty: number; countedQty: number | null; [key: string]: unknown }) => ({
      ...item,
      difference: item.countedQty !== null ? item.countedQty - item.systemQty : null,
    }));

    const count = await prisma.stockCount.update({
      where: { id },
      data: {
        items: items ?? undefined,
        status: body.status ?? undefined,
        notes: body.notes ?? undefined,
      },
    });

    if (body.applyAdjustments && body.status === "completed") {
      const toAdjust = (items ?? []).filter((i: { countedQty: number | null; difference: number | null }) => i.countedQty !== null && i.difference !== 0);
      for (const item of toAdjust) {
        await prisma.inventoryItem.update({
          where: { id: item.itemId },
          data: { currentStock: item.countedQty },
        });
        await prisma.inventoryMovement.create({
          data: {
            tenantId: payload.tenantId ?? null,
            itemId: item.itemId,
            type: "adjust",
            quantity: item.difference,
            before: item.systemQty,
            after: item.countedQty,
            reason: `شمارش موجودی: ${count.name}`,
          },
        });
      }
    }

    return ok(count);
  } catch (e) { return serverError(e); }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { id } = await params;
    await prisma.stockCount.delete({ where: { id } });
    return ok({ deleted: true });
  } catch (e) { return serverError(e); }
}
