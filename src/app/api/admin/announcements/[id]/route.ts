import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, unauthorized, forbidden, notFound, serverError } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    if (payload.role !== "admin") return forbidden();

    const { id } = await params;
    const body = await req.json();

    const allowed = ["title", "message", "type", "targetPlans", "isActive", "expiresAt"];
    const data: Record<string, unknown> = {};
    for (const k of allowed) if (k in body) data[k] = k === "expiresAt" && body[k] ? new Date(body[k]) : body[k];

    const ann = await (prisma as any).systemAnnouncement.update({ where: { id }, data });
    return ok(ann);
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
    await (prisma as any).systemAnnouncement.delete({ where: { id } });
    return ok({ deleted: true });
  } catch (e) {
    return serverError(e);
  }
}
