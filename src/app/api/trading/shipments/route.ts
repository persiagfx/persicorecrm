import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

import { requireAuth, ok, created, unauthorized, tenantFilter } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const payload = requireAuth(req);
  if (!payload) return unauthorized();
  const shipments = await prisma.shipment.findMany({ where: { tenantId: payload.tenantId }, orderBy: { createdAt: "desc" } });
  return ok(shipments);
}

export async function POST(req: NextRequest) {
  const payload = requireAuth(req);
  if (!payload) return unauthorized();
  const body = await req.json();
  const shipment = await prisma.shipment.create({ data: { ...body, tenantId: payload.tenantId } });
  return created(shipment);
}
