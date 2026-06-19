import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, tenantFilter, ok, unauthorized, notFound, serverError } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { id } = await params;

    const entry = await prisma.ledgerEntry.findFirst({ where: { id, ...(payload.tenantId ? { tenantId: payload.tenantId } : {}) },
      include: {
        debitAccount: true,
        creditAccount: true,
        createdBy: { select: { id: true, name: true } },
      },
    });

    if (!entry) return notFound("سند یافت نشد");
    return ok(entry);
  } catch (e) { return serverError(e); }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const isAdmin = payload.role === "admin" || payload.role === "finance";
    if (!isAdmin) return unauthorized();
    const { id } = await params;

    await prisma.ledgerEntry.delete({ where: { id } });
    return ok({ deleted: true });
  } catch (e) { return serverError(e); }
}
