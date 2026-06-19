import { NextRequest } from "next/server";
import prisma from "@/lib/db";

import { requireAuth, ok, created, unauthorized, tenantFilter } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const payload = requireAuth(req);
  if (!payload) return unauthorized();
  const records = await prisma.tradeRecord.findMany({ where: { tenantId: payload.tenantId }, orderBy: { tradeDate: "desc" } });
  return ok(records);
}

export async function POST(req: NextRequest) {
  const payload = requireAuth(req);
  if (!payload) return unauthorized();
  const body = await req.json();
  const record = await prisma.tradeRecord.create({ data: { ...body, tenantId: payload.tenantId } });
  return created(record);
}
