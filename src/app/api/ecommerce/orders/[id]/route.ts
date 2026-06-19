import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, unauthorized } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = requireAuth(req);
  if (!payload) return unauthorized();
  const { id } = await params;
  const order = await prisma.ecomOrder.findFirst({
    where: { id, tenantId: payload.tenantId },
    include: {
      items: { include: { product: { select: { name: true, images: true } } } },
      delivery: true,
    },
  });
  return ok(order);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = requireAuth(req);
  if (!payload) return unauthorized();
  const { id } = await params;
  const body = await req.json();
  const { items: _items, ...orderData } = body;
  const order = await prisma.ecomOrder.update({ where: { id, tenantId: payload.tenantId }, data: orderData });
  return ok(order);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = requireAuth(req);
  if (!payload) return unauthorized();
  const { id } = await params;
  await prisma.ecomOrder.delete({ where: { id, tenantId: payload.tenantId } });
  return ok({ deleted: true });
}
