import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, unauthorized } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = requireAuth(req);
  if (!payload) return unauthorized();
  const { id } = await params;
  const body = await req.json();
  const item = await prisma.equipment.update({ where: { id }, data: body });
  return ok(item);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = requireAuth(req);
  if (!payload) return unauthorized();
  const { id } = await params;
  await prisma.equipment.delete({ where: { id } });
  return ok({ deleted: true });
}
