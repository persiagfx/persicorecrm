import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, unauthorized } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = requireAuth(req);
  if (!payload) return unauthorized();
  const { id } = await params;
  const body = await req.json();
  const student = await prisma.eduStudent.update({ where: { id, tenantId: payload.tenantId }, data: body });
  return ok(student);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = requireAuth(req);
  if (!payload) return unauthorized();
  const { id } = await params;
  await prisma.eduStudent.delete({ where: { id, tenantId: payload.tenantId } });
  return ok({ deleted: true });
}
