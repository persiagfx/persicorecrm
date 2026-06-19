import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, created, unauthorized } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const payload = requireAuth(req);
  if (!payload) return unauthorized();
  const { searchParams } = new URL(req.url);
  const categoryId = searchParams.get("categoryId");
  const items = await prisma.restMenuItem.findMany({
    where: { tenantId: payload.tenantId, ...(categoryId ? { categoryId } : {}) },
    include: { category: { select: { name: true } } },
    orderBy: { order: "asc" },
  });
  return ok(items);
}

export async function POST(req: NextRequest) {
  const payload = requireAuth(req);
  if (!payload) return unauthorized();
  const body = await req.json();
  const item = await prisma.restMenuItem.create({ data: { ...body, tenantId: payload.tenantId } });
  return created(item);
}
