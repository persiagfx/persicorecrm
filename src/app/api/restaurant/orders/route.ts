import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, created, unauthorized } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const payload = requireAuth(req);
  if (!payload) return unauthorized();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? undefined;
  const tableId = searchParams.get("tableId") ?? undefined;
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const perPage = Math.min(200, Number(searchParams.get("perPage") ?? 50));

  const where = {
    tenantId: payload.tenantId,
    ...(status ? { status } : {}),
    ...(tableId ? { tableId } : {}),
  };

  const [total, orders] = await Promise.all([
    prisma.restOrder.count({ where }),
    prisma.restOrder.findMany({
      where,
      include: {
        table: { select: { number: true, name: true } },
        items: { include: { menuItem: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
  ]);

  return ok(orders, { total, page, perPage });
}

export async function POST(req: NextRequest) {
  const payload = requireAuth(req);
  if (!payload) return unauthorized();
  const body = await req.json();
  const { items, ...orderData } = body;
  const count = await prisma.restOrder.count({ where: { tenantId: payload.tenantId } });
  const orderNumber = `ORD-${String(count + 1).padStart(4, "0")}`;
  const order = await prisma.restOrder.create({
    data: {
      ...orderData,
      orderNumber,
      tenantId: payload.tenantId,
      ...(items?.length ? { items: { create: items } } : {}),
    },
    include: { items: true },
  });
  return created(order);
}
