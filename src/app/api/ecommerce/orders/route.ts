import { NextRequest } from "next/server";
import prisma from "@/lib/db";

import { requireAuth, ok, created, unauthorized, tenantFilter } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const payload = requireAuth(req);
  if (!payload) return unauthorized();
  const orders = await prisma.ecomOrder.findMany({
    where: { tenantId: payload.tenantId },
    include: { _count: { select: { items: true } } },
    orderBy: { createdAt: "desc" },
  });
  return ok(orders.map(o => ({ ...o, itemCount: o._count.items })));
}

export async function POST(req: NextRequest) {
  const payload = requireAuth(req);
  if (!payload) return unauthorized();
  const body = await req.json();
  const order = await prisma.ecomOrder.create({ data: { ...body, tenantId: payload.tenantId } });
  return created(order);
}
