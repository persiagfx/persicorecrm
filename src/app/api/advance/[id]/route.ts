import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, tenantFilter, ok, badRequest, unauthorized, notFound, serverError } from "@/lib/auth";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    if (!["admin", "accountant", "hr"].includes(payload.role))
      return Response.json({ error: "دسترسی غیرمجاز" }, { status: 403 });

    const { id } = await params;
    const body = await req.json();
    const { status, reviewNote } = body;

    if (!["approved", "rejected", "paid"].includes(status))
      return badRequest("وضعیت نامعتبر است");

    const advance = await prisma.salaryAdvance.findFirst({ where: { id, ...(payload.tenantId ? { tenantId: payload.tenantId } : {}) } });
    if (!advance) return notFound("مساعده");

    const updated = await prisma.salaryAdvance.update({
      where: { id },
      data: {
        status,
        reviewedById: payload.userId,
        reviewNote: reviewNote ?? null,
        reviewedAt: new Date(),
        ...(status === "paid" ? { paidAt: new Date() } : {}),
      },
    });

    return ok(updated);
  } catch (e) {
    return serverError(e);
  }
}
