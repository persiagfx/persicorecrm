import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, created, unauthorized } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const payload = requireAuth(req);
  if (!payload) return unauthorized();
  const items = await prisma.bOMItem.findMany({
    where: { tenantId: payload.tenantId },
    orderBy: { productName: "asc" },
  });
  return ok(items);
}

export async function POST(req: NextRequest) {
  const payload = requireAuth(req);
  if (!payload) return unauthorized();
  const body = await req.json();
  const item = await prisma.bOMItem.create({ data: { ...body, tenantId: payload.tenantId } });
  return created(item);
}
