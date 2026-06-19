import { NextRequest } from "next/server";
import prisma from "@/lib/db";

import { requireAuth, ok, created, unauthorized, tenantFilter } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const payload = requireAuth(req);
  if (!payload) return unauthorized();
  const tiers = await prisma.pricingTier.findMany({ where: { tenantId: payload.tenantId }, orderBy: { createdAt: "desc" } });
  return ok(tiers);
}

export async function POST(req: NextRequest) {
  const payload = requireAuth(req);
  if (!payload) return unauthorized();
  const body = await req.json();
  const tier = await prisma.pricingTier.create({ data: { ...body, tenantId: payload.tenantId } });
  return created(tier);
}
