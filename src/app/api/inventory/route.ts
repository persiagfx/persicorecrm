import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, created, unauthorized } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const payload = requireAuth(req);
  if (!payload) return unauthorized();
  const { searchParams } = new URL(req.url);
  const categoryId = searchParams.get("categoryId") ?? undefined;
  const search = searchParams.get("search") ?? "";
  const lowStock = searchParams.get("lowStock") === "true";
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const perPage = Math.min(200, Number(searchParams.get("perPage") ?? 50));

  const where = {
    tenantId: payload.tenantId,
    ...(categoryId ? { categoryId } : {}),
    ...(search ? { name: { contains: search } } : {}),
  };

  const [total, items] = await Promise.all([
    prisma.inventoryItem.count({ where }),
    prisma.inventoryItem.findMany({
      where,
      include: {
        category: { select: { name: true, color: true } },
        supplier: { select: { name: true } },
      },
      orderBy: { name: "asc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
  ]);

  const mapped = items.map(i => ({ ...i, isLowStock: i.currentStock <= i.minStock }));
  const result = lowStock ? mapped.filter(i => i.isLowStock) : mapped;

  return ok(result, { total, page, perPage });
}

export async function POST(req: NextRequest) {
  const payload = requireAuth(req);
  if (!payload) return unauthorized();
  const body = await req.json();
  const item = await prisma.inventoryItem.create({ data: { ...body, tenantId: payload.tenantId } });
  return created(item);
}
