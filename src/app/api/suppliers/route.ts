import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, created, unauthorized } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const payload = requireAuth(req);
  if (!payload) return unauthorized();
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const perPage = Math.min(100, Number(searchParams.get("perPage") ?? 20));

  const where = {
    tenantId: payload.tenantId,
    ...(search ? { OR: [{ name: { contains: search } }, { phone: { contains: search } }] } : {}),
  };

  const [total, suppliers] = await Promise.all([
    prisma.supplier.count({ where }),
    prisma.supplier.findMany({
      where,
      include: { _count: { select: { purchaseOrders: true, inventoryItems: true } } },
      orderBy: { name: "asc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
  ]);

  return ok(suppliers, { total, page, perPage });
}

export async function POST(req: NextRequest) {
  const payload = requireAuth(req);
  if (!payload) return unauthorized();
  const body = await req.json();
  const supplier = await prisma.supplier.create({ data: { ...body, tenantId: payload.tenantId } });
  return created(supplier);
}
