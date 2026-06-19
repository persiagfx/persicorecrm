import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, badRequest, unauthorized, notFound, serverError } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.automationRule.findFirst({
      where: { id, ...(payload.tenantId ? { tenantId: payload.tenantId } : {}) },
    });
    if (!existing) return notFound("قانون اتوماسیون");

    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.trigger !== undefined) updateData.trigger = body.trigger;
    if (body.actions !== undefined) updateData.actions = body.actions;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    const rule = await prisma.automationRule.update({
      where: { id },
      data: updateData,
    });

    return ok(rule);
  } catch (e) {
    return serverError(e);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { id } = await params;

    const existing = await prisma.automationRule.findFirst({
      where: { id, ...(payload.tenantId ? { tenantId: payload.tenantId } : {}) },
    });
    if (!existing) return notFound("قانون اتوماسیون");

    await prisma.automationRule.delete({ where: { id } });
    return ok({ message: "قانون اتوماسیون حذف شد" });
  } catch (e) {
    return serverError(e);
  }
}
