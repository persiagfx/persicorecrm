import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, created, unauthorized } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const payload = requireAuth(req);
  if (!payload) return unauthorized();
  const { searchParams } = new URL(req.url);
  const equipmentId = searchParams.get("equipmentId");
  const records = await prisma.maintenanceRecord.findMany({
    where: { tenantId: payload.tenantId, ...(equipmentId ? { equipmentId } : {}) },
    include: { equipment: { select: { name: true, code: true } } },
    orderBy: { startedAt: "desc" },
  });
  return ok(records);
}

export async function POST(req: NextRequest) {
  const payload = requireAuth(req);
  if (!payload) return unauthorized();
  const body = await req.json();
  const record = await prisma.maintenanceRecord.create({ data: { ...body, tenantId: payload.tenantId } });
  return created(record);
}
