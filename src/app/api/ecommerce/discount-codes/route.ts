import { NextRequest } from "next/server";
import prisma from "@/lib/db";

import { requireAuth, ok, created, unauthorized, tenantFilter } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const payload = requireAuth(req);
  if (!payload) return unauthorized();
  const codes = await prisma.ecomDiscountCode.findMany({ where: { tenantId: payload.tenantId }, orderBy: { createdAt: "desc" } });
  return ok(codes);
}

export async function POST(req: NextRequest) {
  const payload = requireAuth(req);
  if (!payload) return unauthorized();
  const body = await req.json();
  const code = await prisma.ecomDiscountCode.create({ data: { ...body, tenantId: payload.tenantId } });
  return created(code);
}
