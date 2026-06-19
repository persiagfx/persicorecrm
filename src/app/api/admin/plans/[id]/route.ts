import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, badRequest, unauthorized, forbidden, notFound, serverError } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    if (payload.role !== "admin") return forbidden();

    const { id } = await params;
    const body = await req.json();

    const existing = await (prisma as any).planConfig.findUnique({ where: { id } });
    if (!existing) return notFound();

    const allowed = ["name", "nameFa", "monthlyPrice", "yearlyPrice", "maxUsers", "maxClients", "maxStorageGb", "features", "isActive", "color", "badge", "order"];
    const data: Record<string, unknown> = {};
    for (const k of allowed) if (k in body) data[k] = body[k];

    const plan = await (prisma as any).planConfig.update({ where: { id }, data });
    return ok(plan);
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
    await (prisma as any).planConfig.delete({ where: { id } });
    return ok({ deleted: true });
  } catch (e) {
    return serverError(e);
  }
}
