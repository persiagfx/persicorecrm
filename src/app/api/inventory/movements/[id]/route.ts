import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, unauthorized } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = requireAuth(req);
  if (!payload) return unauthorized();
  const { id } = await params;
  const movement = await prisma.inventoryMovement.findFirst({
    where: { id, tenantId: payload.tenantId },
    include: { item: { select: { name: true, unit: true } } },
  });
  return ok(movement);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = requireAuth(req);
  if (!payload) return unauthorized();
  const { id } = await params;
  await prisma.inventoryMovement.delete({ where: { id, tenantId: payload.tenantId } });
  return ok({ deleted: true });
}
