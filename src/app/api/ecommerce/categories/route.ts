import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, created, unauthorized } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const payload = requireAuth(req);
  if (!payload) return unauthorized();
  const categories = await prisma.ecomProductCategory.findMany({
    where: { tenantId: payload.tenantId },
    include: { _count: { select: { products: true } } },
    orderBy: { order: "asc" },
  });
  return ok(categories);
}

export async function POST(req: NextRequest) {
  const payload = requireAuth(req);
  if (!payload) return unauthorized();
  const body = await req.json();
  const category = await prisma.ecomProductCategory.create({ data: { ...body, tenantId: payload.tenantId } });
  return created(category);
}
