import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, badRequest, unauthorized, forbidden, notFound, serverError } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    if (payload.role !== "admin") return forbidden();

    const { id } = await params;
    const request = await (prisma as any).supportRequest.findUnique({
      where: { id },
      include: { replies: { orderBy: { createdAt: "asc" } } },
    });
    if (!request) return notFound();
    return ok(request);
  } catch (e) {
    return serverError(e);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    if (payload.role !== "admin") return forbidden();

    const { id } = await params;
    const body = await req.json();

    const existing = await (prisma as any).supportRequest.findUnique({ where: { id } });
    if (!existing) return notFound();

    const updateData: Record<string, unknown> = {};
    const allowed = ["status", "priority", "adminNote"];
    for (const k of allowed) if (k in body) updateData[k] = body[k];
    if (body.status === "resolved" && !existing.resolvedAt) updateData.resolvedAt = new Date();

    if (body.reply) {
      await (prisma as any).supportReply.create({
        data: {
          requestId: id,
          authorType: "admin",
          authorName: "تیم پشتیبانی",
          content: body.reply,
        },
      });
    }

    const request = await (prisma as any).supportRequest.update({ where: { id }, data: updateData });
    return ok(request);
  } catch (e) {
    return serverError(e);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    if (payload.role !== "admin") return forbidden();

    const { id } = await params;
    await (prisma as any).supportRequest.delete({ where: { id } });
    return ok({ deleted: true });
  } catch (e) {
    return serverError(e);
  }
}
