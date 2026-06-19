import { NextRequest } from "next/server";
import prisma from "@/lib/db";
import { requireAuth, ok, badRequest, unauthorized, notFound, serverError } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.webhook.findFirst({
      where: { id, ...(payload.tenantId ? { tenantId: payload.tenantId } : {}) },
    });
    if (!existing) return notFound("Webhook");

    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.url !== undefined) updateData.url = body.url;
    if (body.events !== undefined) {
      if (!Array.isArray(body.events) || body.events.length === 0) {
        return badRequest("حداقل یک رویداد الزامی است");
      }
      updateData.events = body.events;
    }
    if (body.secret !== undefined) updateData.secret = body.secret;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;

    const webhook = await prisma.webhook.update({ where: { id }, data: updateData });
    return ok(webhook);
  } catch (e) {
    return serverError(e);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req);
    if (!payload) return unauthorized();
    const { id } = await params;

    const existing = await prisma.webhook.findFirst({
      where: { id, ...(payload.tenantId ? { tenantId: payload.tenantId } : {}) },
    });
    if (!existing) return notFound("Webhook");

    await prisma.webhook.delete({ where: { id } });
    return ok({ message: "Webhook حذف شد" });
  } catch (e) {
    return serverError(e);
  }
}
