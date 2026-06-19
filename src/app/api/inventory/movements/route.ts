import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, created, unauthorized, badRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const payload = requireAuth(req);
  if (!payload) return unauthorized();
  const { searchParams } = new URL(req.url);
  const itemId = searchParams.get("itemId");
  const movements = await prisma.inventoryMovement.findMany({
    where: {
      tenantId: payload.tenantId,
      ...(itemId ? { itemId } : {}),
    },
    include: { item: { select: { name: true, unit: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return ok(movements);
}

export async function POST(req: NextRequest) {
  const payload = requireAuth(req);
  if (!payload) return unauthorized();
  const body = await req.json();
  const { itemId, type, quantity, reason, reference } = body;
  if (!itemId || !quantity) return badRequest("itemId و quantity الزامی است");

  const item = await prisma.inventoryItem.findFirst({ where: { id: itemId, tenantId: payload.tenantId } });
  if (!item) return badRequest("آیتم یافت نشد");

  const before = item.currentStock;
  let after = before;
  if (type === "in") after = before + quantity;
  else if (type === "out") after = before - quantity;
  else if (type === "adjust") after = quantity;
  else if (type === "transfer") after = before - quantity;

  const [movement] = await prisma.$transaction([
    prisma.inventoryMovement.create({
      data: { itemId, tenantId: payload.tenantId, type: type ?? "in", quantity, before, after, reason, reference, userId: payload.userId },
    }),
    prisma.inventoryItem.update({ where: { id: itemId }, data: { currentStock: after } }),
  ]);

  return created(movement);
}
