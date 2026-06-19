import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, unauthorized } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = requireAuth(req);
  if (!payload) return unauthorized();
  const { id } = await params;
  const ret = await prisma.returnRequest.findFirst({
    where: { id, tenantId: payload.tenantId },
    include: { items: true },
  });
  return ok(ret);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = requireAuth(req);
  if (!payload) return unauthorized();
  const { id } = await params;
  const { items: _items, ...data } = await req.json();
  const ret = await prisma.returnRequest.update({ where: { id, tenantId: payload.tenantId }, data });
  return ok(ret);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = requireAuth(req);
  if (!payload) return unauthorized();
  const { id } = await params;
  await prisma.returnRequest.delete({ where: { id, tenantId: payload.tenantId } });
  return ok({ deleted: true });
}
