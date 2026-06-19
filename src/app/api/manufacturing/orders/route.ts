import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, created, unauthorized } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const payload = requireAuth(req);
  if (!payload) return unauthorized();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? undefined;
  const search = searchParams.get("search") ?? "";
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const perPage = Math.min(100, Number(searchParams.get("perPage") ?? 20));

  const where = {
    tenantId: payload.tenantId,
    ...(status ? { status } : {}),
    ...(search ? { OR: [{ number: { contains: search } }, { productName: { contains: search } }] } : {}),
  };

  const [total, orders] = await Promise.all([
    prisma.productionOrder.count({ where }),
    prisma.productionOrder.findMany({
      where,
      include: { line: { select: { name: true } }, _count: { select: { qcChecks: true } } },
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
  const count = await prisma.productionOrder.count({ where: { tenantId: payload.tenantId } });
  const number = `PO-${String(count + 1).padStart(4, "0")}`;
  const order = await prisma.productionOrder.create({ data: { ...body, number, tenantId: payload.tenantId } });
  return created(order);
}
