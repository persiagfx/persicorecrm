import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, notFound, unauthorized, serverError } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { id } = await params;
    const body = await req.json();
    const shift = await prisma.workShift.update({
      where: { id },
      data: { name: body.name, startTime: body.startTime, endTime: body.endTime, breakMins: body.breakMins, workDays: body.workDays, color: body.color, isActive: body.isActive },
    });
    return ok(shift);
  } catch (e) { return serverError(e); }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { id } = await params;
    await prisma.workShift.delete({ where: { id } });
    return ok({ deleted: true });
  } catch (e) { return serverError(e); }
}
