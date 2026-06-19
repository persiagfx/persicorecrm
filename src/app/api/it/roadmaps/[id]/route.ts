import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, unauthorized } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = requireAuth(req);
  if (!payload) return unauthorized();
  const { id } = await params;
  const roadmap = await prisma.productRoadmap.findFirst({
    where: { id, tenantId: payload.tenantId },
    include: { features: { orderBy: { order: "asc" } } },
  });
  return ok(roadmap);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = requireAuth(req);
  if (!payload) return unauthorized();
  const { id } = await params;
  const body = await req.json();
  const roadmap = await prisma.productRoadmap.update({ where: { id }, data: body });
  return ok(roadmap);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = requireAuth(req);
  if (!payload) return unauthorized();
  const { id } = await params;
  await prisma.productRoadmap.delete({ where: { id } });
  return ok({ deleted: true });
}
