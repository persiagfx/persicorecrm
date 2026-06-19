import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, created, unauthorized } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const payload = requireAuth(req);
  if (!payload) return unauthorized();
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const checks = await prisma.qualityCheck.findMany({
    where: { tenantId: payload.tenantId, ...(status ? { status } : {}) },
    include: { productionOrder: { select: { number: true, productName: true } } },
    orderBy: { createdAt: "desc" },
  });
  return ok(checks);
}

export async function POST(req: NextRequest) {
  const payload = requireAuth(req);
  if (!payload) return unauthorized();
  const body = await req.json();
  const check = await prisma.qualityCheck.create({ data: { ...body, tenantId: payload.tenantId } });
  return created(check);
}
