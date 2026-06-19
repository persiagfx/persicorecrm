import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, unauthorized } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = requireAuth(req);
  if (!payload) return unauthorized();
  const { id } = await params;
  const bug = await prisma.bugReport.findFirst({
    where: { id, tenantId: payload.tenantId },
    include: { comments: { orderBy: { createdAt: "asc" } } },
  });
  return ok(bug);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = requireAuth(req);
  if (!payload) return unauthorized();
  const { id } = await params;
  const body = await req.json();
  const bug = await prisma.bugReport.update({ where: { id }, data: body });
  return ok(bug);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = requireAuth(req);
  if (!payload) return unauthorized();
  const { id } = await params;
  await prisma.bugReport.delete({ where: { id } });
  return ok({ deleted: true });
}
