import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, tenantFilter, ok, unauthorized, notFound, serverError } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { id } = await params;
    const body = await req.json();

    const asset = await prisma.fixedAsset.update({
      where: { id },
      data: {
        name: body.name ?? undefined,
        category: body.category ?? undefined,
        currentValue: body.currentValue ?? body.bookValue ?? undefined,
        depreciationRate: body.depreciationRate ?? undefined,
        location: body.location ?? undefined,
        status: body.status ?? undefined,
        notes: body.notes ?? undefined,
      },
    });

    return ok(asset);
  } catch (e) { return serverError(e); }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    if (payload.role !== "admin" && payload.role !== "finance") return unauthorized();
    const { id } = await params;

    const asset = await prisma.fixedAsset.findFirst({ where: { id, ...(payload.tenantId ? { tenantId: payload.tenantId } : {}) } });
    if (!asset) return notFound("دارایی یافت نشد");

    await prisma.fixedAsset.delete({ where: { id } });
    return ok({ deleted: true });
  } catch (e) { return serverError(e); }
}
