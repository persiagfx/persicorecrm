import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, created, unauthorized } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const payload = requireAuth(req);
  if (!payload) return unauthorized();
  const equipment = await prisma.equipment.findMany({
    where: { tenantId: payload.tenantId },
    include: { _count: { select: { maintenanceRecords: true } } },
    orderBy: { createdAt: "desc" },
  });
  return ok(equipment);
}

export async function POST(req: NextRequest) {
  const payload = requireAuth(req);
  if (!payload) return unauthorized();
  const body = await req.json();
  const item = await prisma.equipment.create({ data: { ...body, tenantId: payload.tenantId } });
  return created(item);
}
