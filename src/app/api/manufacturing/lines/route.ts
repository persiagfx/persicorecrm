import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, created, unauthorized } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const payload = requireAuth(req);
  if (!payload) return unauthorized();
  const lines = await prisma.productionLine.findMany({
    where: { tenantId: payload.tenantId },
    include: { _count: { select: { orders: true } } },
    orderBy: { createdAt: "asc" },
  });
  return ok(lines);
}

export async function POST(req: NextRequest) {
  const payload = requireAuth(req);
  if (!payload) return unauthorized();
  const body = await req.json();
  const line = await prisma.productionLine.create({ data: { ...body, tenantId: payload.tenantId } });
  return created(line);
}
