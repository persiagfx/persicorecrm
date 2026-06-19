import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, created, unauthorized } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const payload = requireAuth(req);
  if (!payload) return unauthorized();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? undefined;
  const supplierId = searchParams.get("supplierId") ?? undefined;
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const perPage = Math.min(100, Number(searchParams.get("perPage") ?? 20));

  const where = {
    tenantId: payload.tenantId,
    ...(status ? { status } : {}),
    ...(supplierId ? { supplierId } : {}),
  };

  const [total, orders] = await Promise.all([
    prisma.purchaseOrder.count({ where }),
    prisma.purchaseOrder.findMany({
      where,
      include: {
        supplier: { select: { name: true } },
        _count: { select: { items: true } },
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
  const count = await prisma.purchaseOrder.count({ where: { tenantId: payload.tenantId } });
  const number = `PRC-${String(count + 1).padStart(4, "0")}`;
  const order = await prisma.purchaseOrder.create({
    data: {
      ...orderData,
      number,
      tenantId: payload.tenantId,
      ...(items?.length ? { items: { create: items } } : {}),
    },
    include: { items: true },
  });
  return created(order);
}
