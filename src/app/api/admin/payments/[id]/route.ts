import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, badRequest, unauthorized, forbidden, notFound, serverError } from "@/lib/auth";

const PLAN_LIMITS: Record<string, { maxUsers: number; maxClients: number }> = {
  starter: { maxUsers: 5, maxClients: 50 },
  pro: { maxUsers: 15, maxClients: 200 },
  enterprise: { maxUsers: 999, maxClients: 9999 },
};

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    if (payload.role !== "admin") return forbidden();

    const { id } = await params;
    const body = await req.json();

    const existing = await (prisma as any).tenantPayment.findUnique({ where: { id } });
    if (!existing) return notFound();

    const action = body.action; // "confirm" | "reject" | "refund"
    let updateData: Record<string, unknown> = {};

    if (action === "confirm") {
      updateData = { status: "paid", paidAt: new Date(), note: body.note };
      // Update tenant plan
      const limits = PLAN_LIMITS[existing.plan];
      if (limits) {
        await (prisma as any).tenant.update({
          where: { id: existing.tenantId },
          data: { plan: existing.plan, ...limits },
        });
      }
    } else if (action === "reject") {
      updateData = { status: "failed", note: body.note };
    } else if (action === "refund") {
      updateData = { status: "refunded", note: body.note };
    } else {
      // Generic update
      const allowed = ["status", "note", "ref"];
      for (const k of allowed) if (k in body) updateData[k] = body[k];
    }

    const payment = await (prisma as any).tenantPayment.update({ where: { id }, data: updateData });
    return ok(payment);
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
    await (prisma as any).tenantPayment.delete({ where: { id } });
    return ok({ deleted: true });
  } catch (e) {
    return serverError(e);
  }
}
