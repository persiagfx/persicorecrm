import { NextRequest } from "next/server";
import prisma from "@/lib/db";

import { requireAuth, ok, created, unauthorized, tenantFilter } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const payload = requireAuth(req);
  if (!payload) return unauthorized();
  const policies = await prisma.sLAPolicy.findMany({ where: { tenantId: payload.tenantId }, orderBy: { createdAt: "desc" } });
  return ok(policies);
}

export async function POST(req: NextRequest) {
  const payload = requireAuth(req);
  if (!payload) return unauthorized();
  const body = await req.json();
  const policy = await prisma.sLAPolicy.create({ data: { ...body, tenantId: payload.tenantId } });
  return created(policy);
}
