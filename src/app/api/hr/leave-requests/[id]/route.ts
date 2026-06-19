import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, unauthorized, notFound, serverError } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { id } = await params;
    const body = await req.json();

    const isAdmin = payload.role === "admin" || payload.role === "hr";
    const updateData: Record<string, unknown> = {};

    if (isAdmin && body._action === "review") {
      updateData.status = body.status;
      updateData.reviewedById = payload.userId;
      updateData.reviewedAt = new Date();
      updateData.reviewNote = body.reviewNote ?? null;
    } else {
      if (body.reason !== undefined) updateData.reason = body.reason;
    }

    const req2 = await prisma.leaveRequest.update({ where: { id }, data: updateData });
    return ok(req2);
  } catch (e) { return serverError(e); }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { id } = await params;
    const r = await prisma.leaveRequest.findFirst({ where: { id, userId: payload.userId } });
    if (!r) return notFound("درخواست");
    if (r.status !== "pending") return Response.json({ error: "فقط درخواست‌های در انتظار قابل حذف است" }, { status: 400 });
    await prisma.leaveRequest.delete({ where: { id } });
    return ok({ deleted: true });
  } catch (e) { return serverError(e); }
}
