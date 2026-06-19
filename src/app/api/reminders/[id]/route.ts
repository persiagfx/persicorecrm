import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, unauthorized, serverError } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { id } = await params;
    const body = await req.json();
    const owned = await prisma.reminder.findFirst({ where: { id, userId: payload.userId } });
    if (!owned) return unauthorized();
    const reminder = await prisma.reminder.update({
      where: { id },
      data: {
        title: body.title, notes: body.notes,
        dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
        isCompleted: body.isCompleted,
      },
    });
    return ok(reminder);
  } catch (e) {
    return serverError(e);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { id } = await params;
    const owned = await prisma.reminder.findFirst({ where: { id, userId: payload.userId } });
    if (!owned) return unauthorized();
    await prisma.reminder.delete({ where: { id } });
    return ok({ message: "یادآور حذف شد" });
  } catch (e) {
    return serverError(e);
  }
}
