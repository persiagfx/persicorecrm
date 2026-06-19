import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, tenantFilter, ok, badRequest, unauthorized, notFound, serverError } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { id } = await params;
    const body = await req.json();
    if (!body.name?.trim()) return badRequest("نام الزامی است");

    const segment = await prisma.customerSegment.update({
      where: { id },
      data: {
        name: body.name.trim(),
        description: body.description ?? null,
        color: body.color,
        filters: body.filters ?? {},
        clientIds: body.clientIds ?? [],
        autoUpdate: body.autoUpdate ?? false,
      },
    });

    return ok(segment);
  } catch (e) { return serverError(e); }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { id } = await params;
    const seg = await prisma.customerSegment.findFirst({ where: { id, ...(payload.tenantId ? { tenantId: payload.tenantId } : {}) } });
    if (!seg) return notFound("سگمنت");
    await prisma.customerSegment.delete({ where: { id } });
    return ok({ deleted: true });
  } catch (e) { return serverError(e); }
}
