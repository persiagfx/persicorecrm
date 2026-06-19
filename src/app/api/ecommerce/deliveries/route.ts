import { NextRequest } from "next/server";
import prisma from "@/lib/db";

import { requireAuth, ok, created, unauthorized } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const payload = requireAuth(req);
  if (!payload) return unauthorized();
  const deliveries = await prisma.ecomDelivery.findMany({ where: { tenantId: payload.tenantId }, orderBy: { createdAt: "desc" } });
  return ok(deliveries);
}

export async function POST(req: NextRequest) {
  const payload = requireAuth(req);
  if (!payload) return unauthorized();
  const body = await req.json();
  const delivery = await prisma.ecomDelivery.create({ data: { ...body, tenantId: payload.tenantId } });
  return created(delivery);
}
