import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, tenantFilter, ok, notFound, unauthorized, serverError } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { id } = await params;
    const center = await prisma.costCenter.findFirst({
      where: { id, ...tenantFilter(payload) },
      include: { children: true, budgets: true },
    });
    if (!center) return notFound();
    return ok(center);
  } catch (e) { return serverError(e); }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { id } = await params;
    const body = await req.json();
    const center = await prisma.costCenter.update({
      where: { id },
      data: {
        code: body.code?.trim(),
        name: body.name?.trim(),
        description: body.description ?? null,
        parentId: body.parentId ?? null,
        isActive: body.isActive ?? true,
      },
    });
    return ok(center);
  } catch (e) { return serverError(e); }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { id } = await params;
    await prisma.costCenter.delete({ where: { id } });
    return ok({ deleted: true });
  } catch (e) { return serverError(e); }
}
