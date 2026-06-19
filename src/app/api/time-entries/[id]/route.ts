import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, unauthorized, notFound, serverError } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { id } = await params;
    const body = await req.json();

    const now = new Date();
    const entry = await prisma.timeEntry.findFirst({ where: { id, userId: payload.userId } });
    if (!entry) return notFound("تایم‌ انتری");

    const endedAt = body.endedAt ? new Date(body.endedAt) : now;
    const durationSeconds = entry.isRunning
      ? Math.floor((endedAt.getTime() - entry.startedAt.getTime()) / 1000)
      : (body.durationSeconds ?? entry.durationSeconds);

    const updated = await prisma.timeEntry.update({
      where: { id },
      data: {
        isRunning: body.isRunning ?? false,
        endedAt: body.isRunning === false ? endedAt : undefined,
        durationSeconds,
        notes: body.notes,
      },
    });

    if (entry.taskId && !body.isRunning) {
      const total = await prisma.timeEntry.aggregate({
        where: { taskId: entry.taskId },
        _sum: { durationSeconds: true },
      });
      await prisma.task.update({
        where: { id: entry.taskId },
        data: { trackedSeconds: total._sum.durationSeconds ?? 0 },
      });
    }

    return ok(updated);
  } catch (e) {
    return serverError(e);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { id } = await params;
    await prisma.timeEntry.delete({ where: { id } });
    return ok({ message: "حذف شد" });
  } catch (e) {
    return serverError(e);
  }
}
