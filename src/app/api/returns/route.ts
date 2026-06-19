import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, created, unauthorized } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const payload = requireAuth(req);
  if (!payload) return unauthorized();
  const returns = await prisma.returnRequest.findMany({
    where: { tenantId: payload.tenantId },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });
  return ok(returns);
}

export async function POST(req: NextRequest) {
  const payload = requireAuth(req);
  if (!payload) return unauthorized();
  const body = await req.json();
  const { items, ...data } = body;
  const ret = await prisma.returnRequest.create({
    data: {
      ...data,
      tenantId: payload.tenantId,
      createdById: payload.userId,
      ...(items?.length ? { items: { create: items } } : {}),
    },
    include: { items: true },
  });
  return created(ret);
}
