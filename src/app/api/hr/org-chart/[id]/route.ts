import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, tenantFilter, ok, notFound, unauthorized, serverError } from "@/lib/auth";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const payload = requireAuth(req);
    if (!payload) return unauthorized();

    await prisma.orgNode.delete({ where: { id } });
    return ok({ deleted: true });
  } catch (e: any) {
    if (e?.code === "P2025") return notFound();
    return serverError(e);
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const payload = requireAuth(req);
    if (!payload) return unauthorized();

    const body = await req.json();
    const node = await prisma.orgNode.update({
      where: { id },
      data: {
        parentId: body.parentId ?? null,
        position: body.position ?? null,
        department: body.department ?? null,
      },
      include: { user: { select: { id: true, name: true, role: true } } },
    });
    return ok(node);
  } catch (e: any) {
    if (e?.code === "P2025") return notFound();
    return serverError(e);
  }
}
