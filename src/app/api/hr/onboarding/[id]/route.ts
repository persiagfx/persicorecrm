import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, notFound, unauthorized, serverError } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { id } = await params;
    const record = await prisma.employeeOnboarding.findUnique({
      where: { id },
      include: { user: { select: { id: true, name: true, avatar: true } } },
    });
    if (!record) return notFound();
    return ok(record);
  } catch (e) { return serverError(e); }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { id } = await params;
    const body = await req.json();
    const allDone = body.tasks ? body.tasks.every((t: { done: boolean }) => t.done) : undefined;
    const autoStatus = body.tasks
      ? (allDone ? "completed" : body.tasks.some((t: { done: boolean }) => t.done) ? "in_progress" : "pending")
      : undefined;
    const record = await prisma.employeeOnboarding.update({
      where: { id },
      data: {
        tasks: body.tasks ?? undefined,
        status: body.status ?? autoStatus,
        notes: body.notes ?? undefined,
      },
    });
    return ok(record);
  } catch (e) { return serverError(e); }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { id } = await params;
    await prisma.employeeOnboarding.delete({ where: { id } });
    return ok({ deleted: true });
  } catch (e) { return serverError(e); }
}
