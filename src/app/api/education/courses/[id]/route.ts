import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, unauthorized } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = requireAuth(req);
  if (!payload) return unauthorized();
  const { id } = await params;
  const course = await prisma.eduCourse.findFirst({
    where: { id, tenantId: payload.tenantId },
    include: {
      lessons: { orderBy: { order: "asc" } },
      enrollments: { include: { student: { select: { name: true, phone: true } } } },
      exams: { orderBy: { createdAt: "desc" } },
    },
  });
  return ok(course);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = requireAuth(req);
  if (!payload) return unauthorized();
  const { id } = await params;
  const body = await req.json();
  const course = await prisma.eduCourse.update({ where: { id, tenantId: payload.tenantId }, data: body });
  return ok(course);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const payload = requireAuth(req);
  if (!payload) return unauthorized();
  const { id } = await params;
  await prisma.eduCourse.delete({ where: { id, tenantId: payload.tenantId } });
  return ok({ deleted: true });
}
