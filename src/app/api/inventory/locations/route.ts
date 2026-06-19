import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, created, unauthorized } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const payload = requireAuth(req);
  if (!payload) return unauthorized();
  const locations = await prisma.inventoryLocation.findMany({
    where: { tenantId: payload.tenantId },
    include: { _count: { select: { items: true } } },
    orderBy: { name: "asc" },
  });
  return ok(locations.map(l => ({ ...l, itemCount: l._count.items })));
}

export async function POST(req: NextRequest) {
  const payload = requireAuth(req);
  if (!payload) return unauthorized();
  const body = await req.json();
  const location = await prisma.inventoryLocation.create({ data: { ...body, tenantId: payload.tenantId } });
  return created(location);
}
