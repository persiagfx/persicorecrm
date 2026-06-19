import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, created, unauthorized } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const payload = requireAuth(req);
  if (!payload) return unauthorized();
  const tables = await prisma.restTable.findMany({
    where: { tenantId: payload.tenantId },
    orderBy: { number: "asc" },
  });
  return ok(tables);
}

export async function POST(req: NextRequest) {
  const payload = requireAuth(req);
  if (!payload) return unauthorized();
  const body = await req.json();
  const table = await prisma.restTable.create({ data: { ...body, tenantId: payload.tenantId } });
  return created(table);
}
