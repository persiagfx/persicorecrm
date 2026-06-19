import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, created, unauthorized } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const payload = requireAuth(req);
  if (!payload) return unauthorized();
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const categoryId = searchParams.get("categoryId") ?? undefined;
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const perPage = Math.min(100, Number(searchParams.get("perPage") ?? 20));

  const where = {
    tenantId: payload.tenantId,
    ...(categoryId ? { categoryId } : {}),
    ...(search ? {
      OR: [
        { name: { contains: search } },
        { sku: { contains: search } },
      ],
    } : {}),
  };

  const [total, products] = await Promise.all([
    prisma.ecomProduct.count({ where }),
    prisma.ecomProduct.findMany({
      where,
      include: {
        category: { select: { id: true, name: true } },
        _count: { select: { reviews: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
  ]);

  return ok(products.map(p => ({ ...p, reviewCount: p._count.reviews })), { total, page, perPage });
}

export async function POST(req: NextRequest) {
  const payload = requireAuth(req);
  if (!payload) return unauthorized();
  const body = await req.json();
  const product = await prisma.ecomProduct.create({ data: { ...body, tenantId: payload.tenantId } });
  return created(product);
}
