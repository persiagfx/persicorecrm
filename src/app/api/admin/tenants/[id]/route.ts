import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, requireRole, ok, unauthorized, notFound, serverError } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const roleErr = requireRole(payload, "admin");
    if (roleErr) return roleErr;

    const { id } = await params;
    const body = await req.json();

    const tenant = await prisma.tenant.findUnique({ where: { id } });
    if (!tenant) return notFound("کسب‌وکار");

    const updated = await prisma.tenant.update({
      where: { id },
      data: {
        status: body.status ?? undefined,
        plan: body.plan ?? undefined,
        maxUsers: body.maxUsers ?? undefined,
        maxClients: body.maxClients ?? undefined,
        trialEndsAt: body.trialEndsAt ? new Date(body.trialEndsAt) : undefined,
      },
    });

    return ok(updated);
  } catch (e) {
    return serverError(e);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const roleErr = requireRole(payload, "admin");
    if (roleErr) return roleErr;

    const { id } = await params;
    await prisma.tenant.update({ where: { id }, data: { status: "cancelled" } });
    return ok({ cancelled: true });
  } catch (e) {
    return serverError(e);
  }
}
