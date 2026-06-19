import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, created, unauthorized } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const payload = requireAuth(req);
  if (!payload) return unauthorized();
  const categories = await prisma.inventoryCategory.findMany({
    where: { tenantId: payload.tenantId },
    include: { _count: { select: { items: true } } },
    orderBy: { name: "asc" },
  });
  return ok(categories);
}

export async function POST(req: NextRequest) {
  const payload = requireAuth(req);
  if (!payload) return unauthorized();
  const body = await req.json();
  const category = await prisma.inventoryCategory.create({ data: { ...body, tenantId: payload.tenantId } });
  return created(category);
}
