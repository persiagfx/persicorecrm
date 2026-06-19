import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, tenantFilter, ok, unauthorized, notFound, serverError } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { id } = await params;
    const body = await req.json();

    const milestone = await prisma.milestone.update({
      where: { id },
      data: {
        ...(body.completedAt !== undefined ? { completedAt: body.completedAt ? new Date(body.completedAt) : null } : {}),
        ...(body.title ? { title: body.title } : {}),
        ...(body.description !== undefined ? { description: body.description } : {}),
        ...(body.dueDate ? { dueDate: new Date(body.dueDate) } : {}),
      },
    });
    return ok(milestone);
  } catch (e) {
    return serverError(e);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { id } = await params;
    const m = await prisma.milestone.findFirst({ where: { id, project: { tenantId: payload.tenantId ?? undefined } } });
    if (!m) return notFound("نقطه عطف");
    await prisma.milestone.delete({ where: { id } });
    return ok({ message: "نقطه عطف حذف شد" });
  } catch (e) {
    return serverError(e);
  }
}
