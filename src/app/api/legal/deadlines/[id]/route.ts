import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, tenantFilter, ok, unauthorized, serverError } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { id } = await params;
    const body = await req.json();

    const deadline = await prisma.legalDeadline.update({
      where: { id },
      data: {
        title: body.title ?? undefined,
        dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
        notes: body.description ?? body.notes ?? undefined,
        isCompleted: body.isDone ?? body.isCompleted ?? undefined,
        completedAt: (body.isDone || body.isCompleted) ? new Date() : undefined,
      },
    });

    return ok(deadline);
  } catch (e) { return serverError(e); }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { id } = await params;

    await prisma.legalDeadline.delete({ where: { id } });
    return ok({ deleted: true });
  } catch (e) { return serverError(e); }
}
