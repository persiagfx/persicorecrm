import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

import { requireAuth, ok, created, unauthorized, tenantFilter } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = requireAuth(req);
  if (!payload) return unauthorized();
  const { id } = await params;
  const body = await req.json();
  const shipment = await prisma.shipment.update({ where: { id, tenantId: payload.tenantId }, data: body });
  return ok(shipment);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = requireAuth(req);
  if (!payload) return unauthorized();
  const { id } = await params;
  await prisma.shipment.delete({ where: { id, tenantId: payload.tenantId } });
  return ok({ deleted: true });
}
